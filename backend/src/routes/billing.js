'use strict';

const express = require('express');
const supabase = require('../lib/supabase');
const { generateInvoiceNumber, toIsoDateStart, toIsoDateEnd } = require('../lib/utils');
const { uploadPdfToStorage, saveDocumentMetadata, createSignedDocumentUrl, toSha256 } = require('../lib/documentStorage');
const { resolveAuthContext } = require('../middleware/auth');
const { ensureAdmin } = require('../middleware/requireRole');
const { buildInvoicePdf } = require('../services/pdfService');
const { loadTemplate, renderBlock } = require('../services/emailService');
const { Resend } = require('resend');

const router = express.Router();
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || 'no-reply@aviaframe.com';
const SUBSCRIPTION_AMOUNT = 300;
const SUBSCRIPTION_CURRENCY = 'SAR';

// ─── AUTH CHECK FOR CRON TOKEN ────────────────────────────────────────────────
// Billing endpoints accept either:
// 1. A super_admin JWT (from portal "Run Now" button)
// 2. A BILLING_CRON_TOKEN bearer (from n8n cron workflow)

function isCronToken(req) {
  const token = process.env.BILLING_CRON_TOKEN;
  if (!token) return false;
  const header = req.headers['authorization'] || '';
  return header === `Bearer ${token}`;
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/**
 * Build human-readable billing period string, e.g. "March 2026"
 */
function fmtPeriod(from, to) {
  const d = new Date(from);
  return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

/**
 * Create an invoice record directly in Supabase (without going through HTTP).
 * Returns { invoice, error }.
 */
async function createInvoiceRecord({ agencyId, periodFrom, periodTo, type, manualTotal, currency, orders = [], notes = null, bankDetails = {} }) {
  const subtotal = manualTotal != null ? Number(manualTotal) : orders.reduce((s, o) => s + Number(o.total_price || 0), 0);
  const markupTotal = manualTotal != null ? 0 : orders.reduce((s, o) => s + Number(o.agency_markup || 0), 0);
  const total = manualTotal != null ? Number(manualTotal) : subtotal;

  const record = {
    invoice_number: generateInvoiceNumber(),
    agency_id: agencyId,
    period_from: periodFrom,
    period_to: periodTo,
    currency: String(currency).toUpperCase(),
    subtotal: Number(subtotal.toFixed(2)),
    markup_total: Number(markupTotal.toFixed(2)),
    total: Number(total.toFixed(2)),
    status: 'issued',
    type,
    notes,
    bank_details: bankDetails,
    metadata: {
      source_order_ids: orders.map((o) => o.id),
      type,
      manual_total: manualTotal != null ? Number(manualTotal) : null,
    },
  };

  const { data, error } = await supabase
    .from('invoices')
    .insert(record)
    .select('id,invoice_number,agency_id,period_from,period_to,currency,subtotal,markup_total,total,status,type,bank_details,notes,created_at')
    .single();

  return { invoice: data, error };
}

/**
 * Generate PDF for an invoice and return pdfBuffer.
 */
async function generatePdfBuffer({ invoice, agency, orders = [] }) {
  return buildInvoicePdf({ invoice, agency, orders });
}

/**
 * Upload PDF to storage and return signed URL.
 */
async function storePdf({ invoice, pdfBuffer }) {
  const documentsBucket = process.env.DOCUMENTS_BUCKET || 'documents';
  const fileName = `${invoice.invoice_number}.pdf`;
  const folder = `invoices/${invoice.id}`;
  const timestamp = Date.now();
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `${documentsBucket}/${folder}/${timestamp}-${safeName}`;

  await uploadPdfToStorage(supabase, pdfBuffer, storagePath);

  await saveDocumentMetadata(supabase, {
    docType: 'invoice_pdf',
    entityType: 'invoice',
    entityId: invoice.id,
    agencyId: invoice.agency_id,
    invoiceId: invoice.id,
    fileName,
    storagePath: storagePath.slice(documentsBucket.length + 1),
    storageBucket: documentsBucket,
    sizeBytes: pdfBuffer.length,
    checksum: toSha256(pdfBuffer),
    metadata: { invoice_number: invoice.invoice_number, agency_name: null },
  });

  const signedUrl = await createSignedDocumentUrl(supabase, storagePath, 3600 * 24 * 7); // 7 days
  return { storagePath, signedUrl };
}

/**
 * Send invoice email with PDF attachment.
 * eventType: 'subscription_invoice' | 'commission_statement'
 */
async function sendInvoiceEmail({ to, agencyName, invoice, pdfBuffer, eventType }) {
  const period = fmtPeriod(invoice.period_from, invoice.period_to);
  const tmpl = await loadTemplate(eventType, null);

  const vars = {
    agency_name: agencyName,
    invoice_number: invoice.invoice_number,
    period,
    currency: invoice.currency,
    total: Number(invoice.total).toLocaleString('en-US', { minimumFractionDigits: 2 }),
  };

  const subject = tmpl?.subject
    ? renderBlock(tmpl.subject, vars)
    : eventType === 'subscription_invoice'
      ? `Platform Subscription Invoice ${invoice.invoice_number} — ${SUBSCRIPTION_CURRENCY} ${SUBSCRIPTION_AMOUNT}`
      : `Commission Statement ${period} — ${agencyName}`;

  const blocks = tmpl?.blocks || {};
  const body = [
    blocks.greeting ? `<p>${renderBlock(blocks.greeting, vars)}</p>` : `<p>Dear ${agencyName},</p>`,
    blocks.intro    ? `<p>${renderBlock(blocks.intro, vars)}</p>`    : '',
    blocks.details  ? `<p>${renderBlock(blocks.details, vars)}</p>`  : '',
    blocks.payment_note ? `<p>${renderBlock(blocks.payment_note, vars)}</p>` : '',
    blocks.closing  ? `<p style="color:#6b7280;font-size:13px;">${renderBlock(blocks.closing, vars)}</p>` : '',
  ].filter(Boolean).join('\n');

  const html = `<!DOCTYPE html><html><body style="font-family:Arial,Helvetica,sans-serif;color:#1a1a2e;padding:32px;max-width:600px;">${body}</body></html>`;

  const attachments = pdfBuffer
    ? [{ filename: `${invoice.invoice_number}.pdf`, content: pdfBuffer.toString('base64') }]
    : [];

  const { data, error } = await resend.emails.send({ from: FROM, to, subject, html, attachments });
  if (error) {
    console.error(`[billing] sendInvoiceEmail (${eventType}) error:`, error);
    return { sent: false, error: error.message };
  }
  return { sent: true, messageId: data?.id };
}

/**
 * Log a billing event. Swallows errors to not break the billing run.
 */
async function logBillingEvent({ agencyId, type, amount, currency = SUBSCRIPTION_CURRENCY, invoiceId, status, errorMessage, periodFrom, periodTo, idempotencyKey }) {
  try {
    await supabase.from('billing_events').insert({
      agency_id: agencyId,
      type,
      amount,
      currency,
      invoice_id: invoiceId || null,
      status,
      error_message: errorMessage || null,
      billing_period_from: periodFrom,
      billing_period_to: periodTo,
      idempotency_key: idempotencyKey || null,
    });
  } catch (err) {
    console.error('[billing] logBillingEvent failed (non-fatal):', err.message);
  }
}

// ─── POST /api/admin/billing/run-monthly ─────────────────────────────────────

router.post('/run-monthly', async (req, res) => {
  // Auth: super_admin JWT or BILLING_CRON_TOKEN
  let authed = false;
  if (isCronToken(req)) {
    authed = true;
  } else {
    const auth = await resolveAuthContext(req);
    if (!auth.error && auth.profile?.role === 'super_admin') authed = true;
  }
  if (!authed) {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Super admin or cron token required' } });
  }

  const results = { processed: 0, skipped: 0, errors: [] };

  try {
    // Find agencies due for billing
    const now = new Date();
    const { data: agencies, error: agenciesError } = await supabase
      .from('agencies')
      .select('id,name,contact_email,commission_rate,settings,subscription_status,next_billing_date,billing_method')
      .eq('subscription_status', 'active')
      .lte('next_billing_date', now.toISOString())
      .not('contact_email', 'is', null)
      .limit(100);

    if (agenciesError) {
      return res.status(500).json({ error: { code: 'AGENCIES_FETCH_FAILED', message: agenciesError.message } });
    }

    for (const agency of (agencies || [])) {
      const billingDate = new Date(agency.next_billing_date);
      const yyyyMM = `${billingDate.getUTCFullYear()}${String(billingDate.getUTCMonth() + 1).padStart(2, '0')}`;
      const idempotencyKey = `sub-${agency.id}-${yyyyMM}`;

      // Idempotency check
      const { data: existing } = await supabase
        .from('billing_events')
        .select('id')
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle();

      if (existing) {
        results.skipped += 1;
        continue;
      }

      // Period = previous month
      const periodTo = new Date(billingDate);
      periodTo.setUTCDate(periodTo.getUTCDate() - 1);
      const periodFrom = new Date(periodTo);
      periodFrom.setUTCMonth(periodFrom.getUTCMonth() - 1);
      periodFrom.setUTCDate(periodFrom.getUTCDate() + 1);
      const periodFromStr = periodFrom.toISOString().slice(0, 10);
      const periodToStr   = periodTo.toISOString().slice(0, 10);

      let agencyError = null;

      try {
        // ── 1. Subscription Invoice (SAR 300) ─────────────────────────────────
        const { invoice: subInvoice, error: subError } = await createInvoiceRecord({
          agencyId: agency.id,
          periodFrom: periodFromStr,
          periodTo: periodToStr,
          type: 'subscription',
          manualTotal: SUBSCRIPTION_AMOUNT,
          currency: SUBSCRIPTION_CURRENCY,
          bankDetails: {},
        });

        if (subError || !subInvoice) throw new Error(`Subscription invoice create failed: ${subError?.message}`);

        const subPdfBuffer = await generatePdfBuffer({ invoice: subInvoice, agency, orders: [] });
        await storePdf({ invoice: subInvoice, pdfBuffer: subPdfBuffer });

        const subEmailResult = await sendInvoiceEmail({
          to: agency.contact_email,
          agencyName: agency.name,
          invoice: subInvoice,
          pdfBuffer: subPdfBuffer,
          eventType: 'subscription_invoice',
        });

        await logBillingEvent({
          agencyId: agency.id,
          type: 'subscription_invoice_sent',
          amount: SUBSCRIPTION_AMOUNT,
          currency: SUBSCRIPTION_CURRENCY,
          invoiceId: subInvoice.id,
          status: subEmailResult.sent ? 'success' : 'failed',
          errorMessage: subEmailResult.error || null,
          periodFrom: periodFromStr,
          periodTo: periodToStr,
          idempotencyKey,
        });

        // ── 2. Commission Statement (if agency has markup configured) ─────────
        const markupType  = agency.settings?.markup_type;
        const markupValue = Number(agency.settings?.markup_value || 0);
        const commissionRate = Number(agency.commission_rate || 0);
        const hasMarkup = (markupValue > 0 && markupType && markupType !== 'none') || commissionRate > 0;

        if (hasMarkup) {
          // Fetch completed orders for this period
          const { data: orders } = await supabase
            .from('orders')
            .select('id,order_number,origin,destination,total_price,agency_markup,currency,status')
            .eq('agency_id', agency.id)
            .in('status', ['ticketed', 'confirmed'])
            .gte('created_at', toIsoDateStart(periodFromStr))
            .lte('created_at', toIsoDateEnd(periodToStr));

          const commOrders = (orders || []).filter((o) => Number(o.agency_markup || 0) > 0);

          if (commOrders.length > 0) {
            const commTotal = commOrders.reduce((s, o) => s + Number(o.agency_markup || 0), 0);

            const { invoice: commInvoice, error: commError } = await createInvoiceRecord({
              agencyId: agency.id,
              periodFrom: periodFromStr,
              periodTo: periodToStr,
              type: 'commission',
              manualTotal: null,
              currency: commOrders[0].currency || 'SAR',
              orders: commOrders,
              notes: `Commission statement for ${fmtPeriod(periodFromStr, periodToStr)}`,
            });

            if (commError || !commInvoice) throw new Error(`Commission invoice create failed: ${commError?.message}`);

            const commPdfBuffer = await generatePdfBuffer({ invoice: commInvoice, agency, orders: commOrders });
            await storePdf({ invoice: commInvoice, pdfBuffer: commPdfBuffer });

            const commEmailResult = await sendInvoiceEmail({
              to: agency.contact_email,
              agencyName: agency.name,
              invoice: commInvoice,
              pdfBuffer: commPdfBuffer,
              eventType: 'commission_statement',
            });

            await logBillingEvent({
              agencyId: agency.id,
              type: 'commission_statement_sent',
              amount: Number(commTotal.toFixed(2)),
              currency: commInvoice.currency,
              invoiceId: commInvoice.id,
              status: commEmailResult.sent ? 'success' : 'failed',
              errorMessage: commEmailResult.error || null,
              periodFrom: periodFromStr,
              periodTo: periodToStr,
            });
          }
        }

        // ── 3. Advance next_billing_date by 1 month ───────────────────────────
        const nextDate = new Date(billingDate);
        nextDate.setUTCMonth(nextDate.getUTCMonth() + 1);
        await supabase
          .from('agencies')
          .update({ next_billing_date: nextDate.toISOString() })
          .eq('id', agency.id);

        results.processed += 1;
      } catch (err) {
        console.error(`[billing] agency ${agency.id} error:`, err.message);
        await logBillingEvent({
          agencyId: agency.id,
          type: 'subscription_invoice_sent',
          status: 'failed',
          errorMessage: err.message,
          periodFrom: periodFromStr,
          periodTo: periodToStr,
          idempotencyKey,
        });
        results.errors.push({ agency_id: agency.id, agency_name: agency.name, error: err.message });
      }
    }

    return res.json({ ...results, total: (agencies || []).length });
  } catch (err) {
    console.error('[billing] run-monthly error:', err);
    return res.status(500).json({ error: { code: 'BILLING_RUN_FAILED', message: err.message } });
  }
});

// ─── POST /api/admin/billing/send-reminders ───────────────────────────────────

router.post('/send-reminders', async (req, res) => {
  let authed = false;
  if (isCronToken(req)) {
    authed = true;
  } else {
    const auth = await resolveAuthContext(req);
    if (!auth.error && auth.profile?.role === 'super_admin') authed = true;
  }
  if (!authed) {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Super admin or cron token required' } });
  }

  const results = { sent: 0, errors: [] };

  try {
    const now = new Date();

    // D+7 and D+14 reminders for unpaid subscription invoices
    for (const daysAgo of [7, 14]) {
      const cutoff = new Date(now);
      cutoff.setUTCDate(cutoff.getUTCDate() - daysAgo);
      const cutoffStart = new Date(cutoff);
      cutoffStart.setUTCDate(cutoffStart.getUTCDate() - 1); // ±1 day window

      const { data: invoices } = await supabase
        .from('invoices')
        .select('id,invoice_number,agency_id,total,currency,created_at')
        .eq('type', 'subscription')
        .eq('status', 'issued')
        .gte('created_at', cutoffStart.toISOString())
        .lte('created_at', cutoff.toISOString());

      for (const invoice of (invoices || [])) {
        const reminderKey = `reminder-${invoice.id}-d${daysAgo}`;

        // Skip if reminder already sent
        const { data: existing } = await supabase
          .from('billing_events')
          .select('id')
          .eq('idempotency_key', reminderKey)
          .maybeSingle();
        if (existing) continue;

        try {
          // Get agency
          const { data: agency } = await supabase
            .from('agencies')
            .select('id,name,contact_email')
            .eq('id', invoice.agency_id)
            .single();
          if (!agency?.contact_email) continue;

          const tmpl = await loadTemplate('invoice_reminder', null);
          const vars = {
            agency_name: agency.name,
            invoice_number: invoice.invoice_number,
            issued_date: new Date(invoice.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            total: Number(invoice.total).toLocaleString('en-US', { minimumFractionDigits: 2 }),
          };

          const subject = tmpl?.subject
            ? renderBlock(tmpl.subject, vars)
            : `Reminder: Invoice ${invoice.invoice_number} is overdue — SAR ${invoice.total}`;

          const blocks = tmpl?.blocks || {};
          const body = [
            blocks.greeting ? `<p>${renderBlock(blocks.greeting, vars)}</p>` : `<p>Dear ${agency.name},</p>`,
            blocks.intro    ? `<p>${renderBlock(blocks.intro, vars)}</p>`    : `<p>Invoice ${invoice.invoice_number} for SAR ${invoice.total} remains unpaid.</p>`,
            blocks.details  ? `<p>${renderBlock(blocks.details, vars)}</p>`  : '',
            blocks.closing  ? `<p style="color:#6b7280;font-size:13px;">${renderBlock(blocks.closing, vars)}</p>` : '',
          ].filter(Boolean).join('\n');

          const html = `<!DOCTYPE html><html><body style="font-family:Arial,Helvetica,sans-serif;color:#1a1a2e;padding:32px;max-width:600px;">${body}</body></html>`;

          const { data, error } = await resend.emails.send({ from: FROM, to: agency.contact_email, subject, html });

          await logBillingEvent({
            agencyId: agency.id,
            type: 'reminder_sent',
            amount: Number(invoice.total),
            currency: invoice.currency,
            invoiceId: invoice.id,
            status: error ? 'failed' : 'success',
            errorMessage: error?.message || null,
            idempotencyKey: reminderKey,
          });

          if (!error) results.sent += 1;
          else results.errors.push({ invoice_id: invoice.id, error: error.message });
        } catch (err) {
          results.errors.push({ invoice_id: invoice.id, error: err.message });
        }
      }
    }

    return res.json(results);
  } catch (err) {
    console.error('[billing] send-reminders error:', err);
    return res.status(500).json({ error: { code: 'REMINDERS_FAILED', message: err.message } });
  }
});

// ─── GET /api/admin/billing/events ───────────────────────────────────────────

router.get('/events', async (req, res) => {
  let authed = false;
  if (isCronToken(req)) {
    authed = true;
  } else {
    const auth = await resolveAuthContext(req);
    if (!auth.error && auth.profile?.role === 'super_admin') authed = true;
  }
  if (!authed) {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Super admin required' } });
  }

  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const offset = Number(req.query.offset) || 0;

  const { data, error } = await supabase
    .from('billing_events')
    .select('id,agency_id,type,amount,currency,invoice_id,status,error_message,billing_period_from,billing_period_to,idempotency_key,created_at,agencies(name)')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return res.status(500).json({ error: { code: 'FETCH_FAILED', message: error.message } });
  return res.json({ events: data || [] });
});

module.exports = router;
