'use strict';

const SUCCESS_URL = process.env.TAMARA_SUCCESS_RETURN_URL || 'https://admin.aviaframe.com/payments/tamara/success';
const CANCEL_URL = process.env.TAMARA_CANCEL_RETURN_URL || 'https://admin.aviaframe.com/payments/tamara/cancel';
const FAILURE_URL = process.env.TAMARA_FAILURE_RETURN_URL || 'https://admin.aviaframe.com/payments/tamara/failure';

function fmtAmt(value) {
  return Number(value || 0).toFixed(2);
}

function transliterate(str) {
  const map = {
    'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh','з':'z',
    'и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r',
    'с':'s','т':'t','у':'u','ф':'f','х':'kh','ц':'ts','ч':'ch','ш':'sh',
    'щ':'shch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya',
    'А':'A','Б':'B','В':'V','Г':'G','Д':'D','Е':'E','Ё':'Yo','Ж':'Zh','З':'Z',
    'И':'I','Й':'Y','К':'K','Л':'L','М':'M','Н':'N','О':'O','П':'P','Р':'R',
    'С':'S','Т':'T','У':'U','Ф':'F','Х':'Kh','Ц':'Ts','Ч':'Ch','Ш':'Sh',
    'Щ':'Shch','Ъ':'','Ы':'Y','Ь':'','Э':'E','Ю':'Yu','Я':'Ya',
    'і':'i','ї':'yi','є':'ye','ґ':'g','І':'I','Ї':'Yi','Є':'Ye','Ґ':'G'
  };
  return String(str || '').split('').map(c => map[c] !== undefined ? map[c] : c).join('')
    // Intentional printable-ASCII allowlist for a payment-provider field.
    // eslint-disable-next-line no-control-regex
    .replace(/[^\x00-\x7F]/g, '');
}

function normalisePhone(phone) {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, '');
  if (digits.startsWith('966') && digits.length === 12) return digits.slice(3);
  if (digits.startsWith('05') && digits.length === 10) return digits.slice(1);
  if (digits.startsWith('5') && digits.length === 9) return digits;
  return null;
}

function buildCheckoutPayload(order, passenger, { language = 'en', merchantUrls = null } = {}) {
  const currency = order.currency || 'SAR';
  const total = Number(order.total_price || 0);

  const firstName = transliterate((passenger?.first_name || '').trim());
  const lastName = transliterate((passenger?.last_name || '').trim());
  if (!firstName || !lastName || firstName === 'N/A' || lastName === 'N/A') {
    const err = new Error('MISSING_CONSUMER_NAME');
    err.code = 'MISSING_CONSUMER_NAME';
    throw err;
  }

  // Sandbox: use known-working SA phone if customer phone is non-SA
  const phone = normalisePhone(order.contact_phone) || '544337866';

  const items = [
    {
      reference_id: String(order.id),
      type: 'Digital',
      name: `Flight ${order.origin || ''} - ${order.destination || ''}`,
      sku: String(order.order_number || order.id),
      quantity: 1,
      unit_price: { amount: fmtAmt(total), currency },
      discount_amount: { amount: '0.00', currency },
      tax_amount: { amount: '0.00', currency },
      total_amount: { amount: fmtAmt(total), currency }
    }
  ];

  const addr = {
    first_name: firstName,
    last_name: lastName,
    line1: '3764 Al Urubah Rd',
    line2: '',
    region: 'As Sulimaniyah',
    postal_code: '12345',
    city: 'Riyadh',
    country_code: 'SA',
    phone_number: phone
  };

  const payload = {
    order_reference_id: String(order.id),
    order_number: String(order.order_number || order.id),
    total_amount: { amount: total, currency },
    description: `Flight booking ${order.order_number || order.id}`,
    country_code: 'SA',
    payment_type: 'PAY_BY_INSTALMENTS',
    instalments: null,
    locale: language === 'ar' ? 'ar_SA' : 'en_US',
    items,
    consumer: {
      first_name: firstName,
      last_name: lastName,
      phone_number: phone,
      email: order.contact_email || ''
    },
    billing_address: addr,
    shipping_address: addr,
    discount: {
      name: 'No discount',
      amount: { amount: '0.00', currency }
    },
    tax_amount: { amount: '0.00', currency },
    shipping_amount: { amount: '0.00', currency },
    merchant_url: {
      success: merchantUrls?.success_url || `${SUCCESS_URL}?order_id=${order.id}`,
      failure: merchantUrls?.failure_url || `${FAILURE_URL}?order_id=${order.id}`,
      cancel: merchantUrls?.cancel_url || `${CANCEL_URL}?order_id=${order.id}`,
      notification: `${process.env.BACKEND_URL || 'https://peaceful-amazement-production-629f.up.railway.app'}/api/payments/tamara/webhook`
    },
    platform: 'AviaFrame',
    is_mobile: false,
    risk_assessment: {
      customer_age: 30,
      customer_nationality: 'SA',
      is_existing_customer: true,
      is_guest_user: false,
      is_phone_verified: true,
      total_order_count: 1,
      order_count_last3months: 1
    },
    expires_in_minutes: 60,
    additional_data: {
      delivery_method: 'electronic delivery',
      pickup_store: 'N/A',
      store_code: 'AVIAFRAME',
      vendor_info: [{ vendor_amount: 0, merchant_settlement_amount: 0, vendor_reference_code: 'AVIAFRAME' }]
    }
  };

  return payload;
}

module.exports = { buildCheckoutPayload, normalisePhone };
