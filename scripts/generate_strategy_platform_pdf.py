#!/usr/bin/env python3

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


REPO_ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = REPO_ROOT / "output" / "pdf"
OUTPUT_PATH = OUTPUT_DIR / "AviaFrame_Strategic_Platform_Audit_v2_2026-08-24.pdf"

BLUE = HexColor("#2563EB")
DARK = HexColor("#1E293B")
SLATE = HexColor("#475569")
LIGHT = HexColor("#F8FAFC")
BORDER = HexColor("#D7E3F4")
SOFT_BLUE = HexColor("#EEF4FF")
CYAN = HexColor("#0EA5E9")
GREEN = HexColor("#16A34A")
AMBER = HexColor("#D97706")
RED = HexColor("#DC2626")
PURPLE = HexColor("#7C3AED")
FONT_REGULAR = "AviaArial"
FONT_BOLD = "AviaArialBold"
FONT_ITALIC = "AviaArialItalic"


def register_fonts():
    pdfmetrics.registerFont(TTFont(FONT_REGULAR, "/System/Library/Fonts/Supplemental/Arial.ttf"))
    pdfmetrics.registerFont(TTFont(FONT_BOLD, "/System/Library/Fonts/Supplemental/Arial Bold.ttf"))
    pdfmetrics.registerFont(TTFont(FONT_ITALIC, "/System/Library/Fonts/Supplemental/Arial Italic.ttf"))


def build_styles():
    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            name="Body",
            parent=styles["BodyText"],
            fontName=FONT_REGULAR,
            fontSize=10,
            leading=14,
            textColor=DARK,
            spaceAfter=6,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Small",
            parent=styles["BodyText"],
            fontName=FONT_REGULAR,
            fontSize=8.5,
            leading=11,
            textColor=SLATE,
            spaceAfter=4,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Section",
            parent=styles["Heading1"],
            fontName=FONT_BOLD,
            fontSize=17,
            leading=22,
            textColor=DARK,
            spaceBefore=14,
            spaceAfter=8,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Subsection",
            parent=styles["Heading2"],
            fontName=FONT_BOLD,
            fontSize=12,
            leading=16,
            textColor=BLUE,
            spaceBefore=6,
            spaceAfter=6,
        )
    )
    styles.add(
        ParagraphStyle(
            name="CoverTitle",
            parent=styles["Title"],
            fontName=FONT_BOLD,
            fontSize=26,
            leading=31,
            textColor=DARK,
            alignment=TA_LEFT,
            spaceAfter=10,
        )
    )
    styles.add(
        ParagraphStyle(
            name="CoverSub",
            parent=styles["BodyText"],
            fontName=FONT_REGULAR,
            fontSize=12.5,
            leading=18,
            textColor=SLATE,
            alignment=TA_LEFT,
            spaceAfter=8,
        )
    )
    styles.add(
        ParagraphStyle(
            name="MetricBig",
            parent=styles["BodyText"],
            fontName=FONT_BOLD,
            fontSize=20,
            leading=23,
            textColor=BLUE,
            alignment=TA_LEFT,
            spaceAfter=2,
        )
    )
    styles.add(
        ParagraphStyle(
            name="MetricLabel",
            parent=styles["BodyText"],
            fontName=FONT_REGULAR,
            fontSize=8.5,
            leading=11,
            textColor=SLATE,
            alignment=TA_LEFT,
        )
    )
    styles.add(
        ParagraphStyle(
            name="CalloutTitle",
            parent=styles["BodyText"],
            fontName=FONT_BOLD,
            fontSize=10.5,
            leading=13,
            textColor=DARK,
            spaceAfter=2,
        )
    )
    styles.add(
        ParagraphStyle(
            name="CalloutBody",
            parent=styles["BodyText"],
            fontName=FONT_REGULAR,
            fontSize=9.2,
            leading=13,
            textColor=DARK,
            spaceAfter=0,
        )
    )
    styles.add(
        ParagraphStyle(
            name="CenteredNote",
            parent=styles["BodyText"],
            fontName=FONT_ITALIC,
            fontSize=8.5,
            leading=11,
            textColor=SLATE,
            alignment=TA_CENTER,
            spaceAfter=8,
        )
    )
    return styles


def brand_logo(canvas, x, y):
    canvas.saveState()
    canvas.setFillColor(BLUE)
    path = canvas.beginPath()
    path.moveTo(x, y)
    path.lineTo(x + 14, y + 9)
    path.lineTo(x + 17, y + 7)
    path.lineTo(x + 11, y + 3)
    path.lineTo(x + 18, y + 3)
    path.lineTo(x + 25, y + 10)
    path.lineTo(x + 28, y + 8)
    path.lineTo(x + 21, y)
    path.lineTo(x + 27, y)
    path.lineTo(x + 24, y - 4)
    path.lineTo(x + 17, y - 2)
    path.lineTo(x + 12, y - 7)
    path.lineTo(x + 10, y - 5)
    path.lineTo(x + 14, y)
    path.lineTo(x + 7, y)
    path.close()
    canvas.drawPath(path, fill=1, stroke=0)
    canvas.setFillColor(DARK)
    canvas.setFont(FONT_BOLD, 16)
    canvas.drawString(x + 34, y - 2, "Avia")
    canvas.setFillColor(BLUE)
    canvas.setFont(FONT_REGULAR, 16)
    canvas.drawString(x + 71, y - 2, "Frame")
    canvas.restoreState()


def body_header_footer(canvas, doc):
    canvas.saveState()
    if doc.page > 1:
      brand_logo(canvas, doc.leftMargin, doc.height + doc.topMargin + 18)
      canvas.setStrokeColor(BORDER)
      canvas.setLineWidth(0.6)
      canvas.line(doc.leftMargin, doc.bottomMargin - 12, doc.pagesize[0] - doc.rightMargin, doc.bottomMargin - 12)
      canvas.setFillColor(SLATE)
      canvas.setFont(FONT_REGULAR, 8.5)
      canvas.drawRightString(doc.pagesize[0] - doc.rightMargin, doc.bottomMargin - 24, f"Page {doc.page}")
      canvas.drawString(doc.leftMargin, doc.bottomMargin - 24, "AviaFrame Strategic Platform Audit v2 · August 24, 2026")
    canvas.restoreState()


def cover_background(canvas, doc):
    canvas.saveState()
    width, height = doc.pagesize
    canvas.setFillColor(LIGHT)
    canvas.rect(0, 0, width, height, fill=1, stroke=0)
    canvas.setFillColor(SOFT_BLUE)
    canvas.roundRect(doc.leftMargin, height - 185, width - doc.leftMargin - doc.rightMargin, 120, 20, fill=1, stroke=0)
    canvas.setFillColor(BLUE)
    canvas.roundRect(doc.leftMargin, height - 205, 165, 10, 5, fill=1, stroke=0)
    canvas.setFillColor(CYAN)
    canvas.circle(width - 90, height - 95, 42, fill=1, stroke=0)
    canvas.setFillColor(HexColor("#DBEAFE"))
    canvas.circle(width - 55, height - 130, 28, fill=1, stroke=0)
    brand_logo(canvas, doc.leftMargin, height - 46)
    canvas.restoreState()


def metric_card(title, label, styles):
    return Table(
        [[Paragraph(title, styles["MetricBig"])], [Paragraph(label, styles["MetricLabel"])]],
        colWidths=[1.65 * inch],
        style=TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.white),
                ("BOX", (0, 0), (-1, -1), 0.75, BORDER),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]
        ),
    )


def callout(title, body, styles, color=SOFT_BLUE, title_color=DARK):
    table = Table(
        [[Paragraph(f"<font color='{title_color.hexval()}'>{title}</font>", styles["CalloutTitle"])],
         [Paragraph(body, styles["CalloutBody"])]],
        colWidths=[6.0 * inch],
    )
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), color),
                ("BOX", (0, 0), (-1, -1), 0.75, BORDER),
                ("LEFTPADDING", (0, 0), (-1, -1), 12),
                ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
            ]
        )
    )
    return table


def make_table(data, widths, header_bg=HexColor("#EAF1FB"), header_color=DARK, body_size=9):
    header_style = ParagraphStyle(
        "TableHeader",
        fontName=FONT_BOLD,
        fontSize=body_size,
        leading=body_size + 3,
        textColor=header_color,
    )
    body_style = ParagraphStyle(
        "TableBody",
        fontName=FONT_REGULAR,
        fontSize=body_size,
        leading=body_size + 3,
        textColor=DARK,
    )
    wrapped = []
    for row_index, row in enumerate(data):
        style = header_style if row_index == 0 else body_style
        wrapped.append([
            cell if isinstance(cell, Paragraph) else Paragraph(str(cell), style)
            for cell in row
        ])
    table = Table(wrapped, colWidths=widths, repeatRows=1)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), header_bg),
                ("TEXTCOLOR", (0, 0), (-1, 0), header_color),
                ("FONTSIZE", (0, 0), (-1, 0), body_size),
                ("FONTSIZE", (0, 1), (-1, -1), body_size),
                ("LEADING", (0, 0), (-1, -1), body_size + 3),
                ("BOX", (0, 0), (-1, -1), 0.7, BORDER),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, BORDER),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )
    return table


def bullet_paragraph(text, styles):
    return Paragraph(f"• {text}", styles["Body"])


def build_story():
    styles = build_styles()
    story = []

    story.append(Spacer(1, 1.0 * inch))
    story.append(Paragraph("Strategic Platform Audit · 2026", styles["Small"]))
    story.append(Paragraph("AviaFrame 2.0: от white-label booking к dual-engine travel commerce platform", styles["CoverTitle"]))
    story.append(
        Paragraph(
            "Обновлённая стратегия учитывает два параллельных направления роста: "
            "<b>AviaFrame Direct</b> как собственный B2C travel marketplace для путешественников "
            "и <b>AviaFrame OS</b> как B2B white-label / commerce infrastructure для агентств.",
            styles["CoverSub"],
        )
    )
    story.append(
        Paragraph(
            "Документ сфокусирован на монетизации, product packaging, платформенной архитектуре, "
            "phase-by-phase roadmap и практических рычагах роста ARPU, GMV и lifetime value.",
            styles["CoverSub"],
        )
    )
    story.append(Spacer(1, 0.22 * inch))
    metrics = Table(
        [[
            metric_card("€400", "Текущий базовый B2B ARPU", styles),
            metric_card("€1.6k–2.2k", "Целевой blended B2B ARPU", styles),
            metric_card("2 engines", "B2C demand + B2B platform", styles),
            metric_card("6–8", "Приоритетных revenue streams", styles),
        ]],
        colWidths=[1.72 * inch] * 4,
        style=TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]),
    )
    story.append(metrics)
    story.append(Spacer(1, 0.28 * inch))
    story.append(
        callout(
            "Executive recommendation",
            "AviaFrame не должен выбирать между B2C marketplace и B2B SaaS. "
            "Правильная стратегия — строить <b>shared commerce core</b>, который генерирует спрос через собственный consumer-facing канал "
            "и одновременно продаётся агентствам как white-label platform, CRM, automation и finance stack. "
            "B2C даёт traffic, data, retention loops и supplier leverage. B2B даёт предсказуемый recurring revenue, высокий switching cost и лучший unit economics.",
            styles,
        )
    )
    story.append(Spacer(1, 0.5 * inch))
    story.append(Paragraph("Prepared from Senior Solution Architect perspective · 24 August 2026", styles["Small"]))
    story.append(PageBreak())

    story.append(Paragraph("1. Executive Summary", styles["Section"]))
    story.append(
        Paragraph(
            "Исходный тезис остаётся верным: booking engine сам по себе быстро становится commodity. "
            "Долгосрочная ценность AviaFrame живёт в данных о поисках, бронированиях, платежах, клиентских профилях, "
            "CRM-сегментах, automation flows и embedded monetization. Однако версия 2 стратегии должна учитывать не только B2B платформу для агентств, "
            "но и развитие собственного consumer brand, который напрямую продаёт travel products и использует тот же core.",
            styles["Body"],
        )
    )
    story.extend([
        bullet_paragraph("B2C-ветка: AviaFrame Direct как travel aggregator с продажей авиабилетов, гостиниц, автобусов, страховок, трансферов, eSIM, lounge, визовых сервисов и финансовых продуктов.", styles),
        bullet_paragraph("B2B-ветка: AviaFrame OS как white-label / embedded commerce layer для агентств с пакетами Core, Growth, Commerce OS и Enterprise.", styles),
        bullet_paragraph("Shared data model: один и тот же booking / customer / payment graph обслуживает и прямой consumer channel, и агентские storefronts.", styles),
        bullet_paragraph("Главный ростовой актив: не один билет, а накопительный профиль спроса, поведенческие данные, repeat booking patterns и attach-rate ancillary products.", styles),
    ])
    story.append(Spacer(1, 0.08 * inch))
    story.append(
        callout(
            "What changes in Version 2",
            "Стратегия смещается с модели “SaaS-only” к модели <b>dual-engine monetization</b>. "
            "Это означает два параллельных P&L-слоя: recurring SaaS revenue от агентств и transaction / affiliate / service revenue от B2C трафика. "
            "Такой подход повышает стратегическую ценность платформы, но требует более жёсткой приоритизации, event architecture и единых product guardrails.",
            styles,
            color=HexColor("#F5F3FF"),
            title_color=PURPLE,
        )
    )

    story.append(Paragraph("2. Target Operating Model: Two Engines, One Core", styles["Section"]))
    dual_engine_data = [
        ["Component", "AviaFrame Direct (B2C)", "AviaFrame OS (B2B)"],
        ["Primary goal", "Traffic, GMV, direct monetization, brand growth", "Recurring revenue, agency retention, high switching cost"],
        ["Primary users", "Travelers / families / SME travelers", "Travel agencies, consolidators, later corporate accounts"],
        ["Core surfaces", "Marketplace site, app, AI assistant, CRM journeys", "White-label widget, booking site, admin portal, reporting API"],
        ["Revenue model", "Service fee, commission, affiliate, ads, financial products", "Subscription, setup fee, add-ons, support, custom integrations"],
        ["Strategic advantage", "Consumer data + demand generation + ancillary attach rate", "Distribution + embedded infra + operational lock-in"],
    ]
    story.append(make_table(dual_engine_data, [1.35 * inch, 2.45 * inch, 2.7 * inch]))
    story.append(Spacer(1, 0.08 * inch))
    story.append(
        Paragraph(
            "Оба направления должны использовать один и тот же deterministic booking core: search, pricing, payment, order creation, ticket issuance, refund logic и audit trail. "
            "Маркетинг, communication, reporting, recommendation и support orchestration строятся поверх event layer. "
            "AI используется только как assistive слой, а не как единственный decision-maker в финансовых транзакциях.",
            styles["Body"],
        )
    )

    story.append(Paragraph("3. Monetization Architecture", styles["Section"]))
    story.append(Paragraph("3.1. B2C monetization map", styles["Subsection"]))
    b2c_data = [
        ["Revenue stream", "Mechanics", "Monetization potential", "Confidence"],
        ["Flights", "Service fee, mark-up, preferred supply economics", "High: base GMV driver; monetization per booking usually modest but scalable", "High"],
        ["Hotels", "Affiliate / API commission, packaged bundles", "Very high: better margin profile than air, strong cross-sell after booking", "High"],
        ["Bus / rail", "Commission per segment, domestic short-haul demand", "Medium: useful for traffic capture and regional breadth", "Medium"],
        ["Insurance", "Attach during checkout / post-booking", "High: strong margin, low operational burden", "High"],
        ["Transfers / lounge / eSIM", "Ancillary upsell after air booking", "Medium-high: lifts revenue per booking without touching core flight economics", "High"],
        ["Visa services / concierge", "Lead-gen or managed service fee", "Medium: valuable in MENA/CIS corridors and premium segments", "Medium"],
        ["Financial products", "Travel cards, FX cards, installments, BNPL, banking leads", "High upside if distribution partnerships are secured", "Medium"],
        ["Advertising / featured placement", "Sponsored destinations, preferred partners", "Medium: only worthwhile after meaningful traffic scale", "Low-medium"],
        ["Membership", "Prime fares, benefits, perks", "Strategic upside, but not phase-1 priority", "Low"],
    ]
    story.append(make_table(b2c_data, [1.4 * inch, 2.1 * inch, 2.2 * inch, 0.8 * inch], body_size=8.4))
    story.append(Paragraph("3.2. B2B monetization map", styles["Subsection"]))
    b2b_data = [
        ["Revenue stream", "Mechanics", "Recommended pricing logic", "Confidence"],
        ["Core platform", "White-label booking + agency portal", "€400 base subscription", "High"],
        ["Growth / Engage", "WhatsApp, email recovery, reminders, price alerts", "€200–300 / month add-on", "High"],
        ["CRM", "Profiles, segments, campaigns, saved searches", "€250–400 / month add-on", "Medium-high"],
        ["Finance", "Reconciliation, invoice automation, export", "€300–500 / month add-on", "Medium"],
        ["AI Assistant", "NL search, traveler assistant, recommendation layer", "€300–500 / month add-on", "Medium"],
        ["Support AI", "Booking / payment status bot + escalation", "€250–450 / month add-on", "Medium"],
        ["Enterprise / Corporate", "Policy, approvals, company accounts, cost centers", "€800–2,000+ / month", "Medium"],
        ["Setup / onboarding", "Initial configuration, branding, payment alignment, launch", "€500–2,000 one-off", "High"],
        ["Custom integrations", "CRM, ERP, PSP, reporting API, accounting", "Project-based or €25–50 / hour", "High"],
        ["Managed operations", "Campaign ops, reporting ops, support desk", "Retainer add-on", "Medium"],
    ]
    story.append(make_table(b2b_data, [1.25 * inch, 2.25 * inch, 1.95 * inch, 0.85 * inch], body_size=8.4))
    story.append(Paragraph("3.3. Combined revenue logic", styles["Subsection"]))
    story.append(
        Paragraph(
            "Version 2 should explicitly model three monetization layers at once: "
            "<b>recurring</b> (subscriptions and retainers), <b>transactional</b> (service fees / commissions / affiliate earnings), "
            "and <b>services</b> (setup, custom work, enterprise enablement). "
            "This creates a more resilient revenue mix than a pure SaaS model and lets AviaFrame compound value as traffic and data grow.",
            styles["Body"],
        )
    )

    story.append(PageBreak())
    story.append(Paragraph("4. Product Stack and Platform Boundaries", styles["Section"]))
    stack_data = [
        ["Layer", "Scope", "Hard rule"],
        ["Core commerce engine", "Search, pricing, payment, order creation, ticket issuance, refunds", "Always deterministic backend logic"],
        ["Event / webhook layer", "notification_events, retries, dispatch, idempotency", "All automation subscribes through events, not direct side effects"],
        ["Automation layer", "n8n, cron workflows, messaging, CRM sync, reporting", "Async only; must not own booking truth"],
        ["AI services layer", "Assistant, support, OCR, explanation, anomaly hints", "AI recommends and summarizes; backend commits transactions"],
        ["External monetization layer", "Hotels, insurance, banking, cards, eSIM, ads", "Partners consume platform events and approved APIs only"],
    ]
    story.append(make_table(stack_data, [1.45 * inch, 2.6 * inch, 2.45 * inch]))
    story.append(Spacer(1, 0.06 * inch))
    story.append(
        callout(
            "Critical guardrail",
            "The fastest way to break trust is to let AI or external workflow tools become the source of truth for booking, payment, refund or ticket issuance. "
            "Every revenue expansion idea must pass one rule: if money moves or inventory is committed, the final state transition stays inside the core backend with auditability and idempotency.",
            styles,
            color=HexColor("#FEF2F2"),
            title_color=RED,
        )
    )
    story.append(Paragraph("5. Strategic Product Portfolio", styles["Section"]))
    product_data = [
        ["Product", "Who buys it", "Value proposition", "Monetization outlook"],
        ["AviaFrame Direct", "Traveler", "Single consumer destination for flights + hotels + ancillaries + finance offers", "High long-term upside; demand engine"],
        ["AviaFrame Core", "Agency", "White-label booking stack with payment and ticketing", "Stable recurring base"],
        ["AviaFrame Growth", "Agency", "Recovery flows, reminders, WhatsApp, campaign triggers", "Fastest ROI add-on"],
        ["AviaFrame CRM", "Agency", "Customer profiles, segments, saved searches, repeat traveler logic", "High switching-cost driver"],
        ["AviaFrame Finance", "Agency", "Reconciliation, invoice automation, accounting export", "Strong B2B retention lever"],
        ["AviaFrame AI", "Agency / Traveler", "Search assistant, offer comparison, support automation", "Differentiation + premium pricing"],
        ["AviaFrame Enterprise", "Corporate / large agency", "Policy, approval workflow, billing, reporting, support controls", "Largest contract value, slowest sales cycle"],
    ]
    story.append(make_table(product_data, [1.2 * inch, 1.1 * inch, 2.6 * inch, 1.6 * inch], body_size=8.6))

    story.append(Paragraph("6. Monetization Scenarios and Revenue Potential", styles["Section"]))
    story.append(
        Paragraph(
            "Ниже не forecast commitments, а modelling assumptions для принятия решений. Их задача — показать, какие рычаги действительно способны изменить economics бизнеса.",
            styles["Small"],
        )
    )
    revenue_scenario = [
        ["Scenario", "B2B assumptions", "B2C assumptions", "Indicative monthly revenue potential"],
        ["Conservative", "20 active agencies × €700 blended ARPU", "500 consumer bookings + modest ancillary attach", "€18k–25k / month"],
        ["Base", "35 active agencies × €1,100 blended ARPU", "1,500 consumer bookings + hotels/insurance attach", "€55k–80k / month"],
        ["Expansion", "60 active agencies × €1,700 blended ARPU", "4,000 consumer bookings + broader marketplace + finance offers", "€140k–220k / month"],
    ]
    story.append(make_table(revenue_scenario, [1.0 * inch, 2.1 * inch, 2.15 * inch, 1.25 * inch], body_size=8.4))
    story.append(Spacer(1, 0.06 * inch))
    story.append(
        Paragraph(
            "Key observation: B2B recurring revenue gives predictability, but B2C ancillary revenue can significantly outperform air-only monetization once travel bundles, hotels, insurance and financial partnerships are added. "
            "Therefore the platform strategy should not optimize only for ARPU. It should optimize for <b>combined LTV of traveler + agency relationship</b>.",
            styles["Body"],
        )
    )
    story.append(
        callout(
            "Where the biggest monetization upside really sits",
            "The largest near-term monetization upside is not in exotic AI. It is in <b>attach-rate layers</b>: hotels, insurance, reminders/recovery, CRM repeat booking and payment failure recovery. "
            "AI becomes most valuable after those data and workflow foundations exist.",
            styles,
            color=HexColor("#ECFDF5"),
            title_color=GREEN,
        )
    )

    story.append(PageBreak())
    story.append(Paragraph("7. Recommended Packaging", styles["Section"]))
    packaging_data = [
        ["Package", "Contents", "Indicative price", "Strategic role"],
        ["Core", "Booking engine, agency site, widget, payments, ticketing, basic notifications", "€400 / month", "Entry layer"],
        ["Growth", "Core + reminders + abandoned/payment recovery + WhatsApp + saved search alerts", "€750–950 / month", "Fast ROI / best-seller"],
        ["Commerce OS", "Growth + CRM + Finance + reporting API + premium support", "€1,300–1,800 / month", "Primary target for mature agencies"],
        ["Enterprise", "Commerce OS + Corporate workflows + approvals + dedicated integrations + SLA", "€2,500–4,000+ / month", "High-value accounts"],
    ]
    story.append(make_table(packaging_data, [1.1 * inch, 3.0 * inch, 1.15 * inch, 1.25 * inch], body_size=8.6))
    story.append(Spacer(1, 0.08 * inch))
    story.append(
        Paragraph(
            "Для B2C логика должна быть другой: traveler-facing продукт не нужно дробить на пакеты. Вместо этого стоит продавать convenience, trust, recommendation quality и bundled savings. "
            "Consumer monetization строится вокруг checkout, post-booking journeys и high-intent partner moments.",
            styles["Body"],
        )
    )

    story.append(Paragraph("8. 12-Month Roadmap", styles["Section"]))
    roadmap_data = [
        ["Phase", "Timeline", "Main objective", "Priority outcomes"],
        ["Phase 0", "0–4 weeks", "Shared foundation", "notification_events, saved_searches, customer profile model, reporting hygiene, packaging readiness"],
        ["Phase 1", "Month 1–2", "Quick wins with direct ROI", "autofill, failed payment recovery, abandoned booking recovery, reminders, invoice automation, daily reporting"],
        ["Phase 2", "Month 2–4", "Engage + CRM + first B2C ancillaries", "WhatsApp, segments, saved search alerts, hotels/insurance upsell, repeat campaigns"],
        ["Phase 3", "Month 4–6", "AI and support layer", "AI assistant, support copilot, management insights, finance anomaly assist"],
        ["Phase 4", "Month 6–12", "Marketplace + enterprise expansion", "corporate workflows, multi-PSP, buses/hotels expansion, finance offers, dynamic markup rules"],
    ]
    story.append(make_table(roadmap_data, [0.9 * inch, 1.0 * inch, 1.7 * inch, 2.9 * inch], body_size=8.4))
    story.append(Paragraph("Recommended 90-day focus", styles["Subsection"]))
    story.extend([
        bullet_paragraph("Stabilize event architecture and customer profile model so every monetization feature hangs off the same source of truth.", styles),
        bullet_paragraph("Launch the Growth package first: payment recovery, abandoned booking recovery, reminders, invoice automation, saved search alerts.", styles),
        bullet_paragraph("Expose a cleaner reporting layer and agency API package so larger clients immediately see operational value.", styles),
        bullet_paragraph("Launch B2C demand tests with air + hotels + insurance before trying to expand to every ancillary vertical at once.", styles),
        bullet_paragraph("Treat WhatsApp and CRM segmentation as the first retention moat, not the AI assistant.", styles),
    ])

    story.append(Paragraph("9. B2C Expansion Priorities", styles["Section"]))
    b2c_priority_data = [
        ["Priority", "Why it matters", "Monetization logic", "Recommended sequence"],
        ["Flights + hotel bundles", "Highest relevance after air booking", "Bundle margin + affiliate commission", "Immediate"],
        ["Insurance", "Simple attach, high margin, low ops complexity", "Commission per policy", "Immediate"],
        ["Transfers / eSIM / lounge", "Natural post-booking cross-sell", "Affiliate or resale margin", "Immediate"],
        ["Bus / rail", "Increases use cases and domestic relevance", "Segment commission", "After core ancillary wins"],
        ["Travel cards / FX / installments", "Raises checkout conversion and monetization depth", "Lead fee / rev share", "After payment partnerships"],
        ["Visa / concierge", "Premium corridor monetization", "Service fee / referral", "Selective"],
    ]
    story.append(make_table(b2c_priority_data, [1.25 * inch, 2.05 * inch, 1.75 * inch, 1.45 * inch], body_size=8.3))

    story.append(PageBreak())
    story.append(Paragraph("10. Risks, Assumptions, and Guardrails", styles["Section"]))
    risk_data = [
        ["Risk / assumption", "Why it matters", "Mitigation"],
        ["Overestimating ARPU adoption", "Agencies may not buy many add-ons immediately", "Sell bundled tiers, not too many standalone modules"],
        ["B2C traffic acquisition cost", "Consumer brand can burn cash if launched too broadly", "Start with narrow corridors, SEO/content, retargeting, partner distribution"],
        ["Data privacy / outreach consent", "Recovery and CRM flows require compliant outreach", "Consent model by channel, event logs, suppression lists"],
        ["Operational load from new channels", "WhatsApp, support and reconciliation can raise support cost", "Clear SLA model, productized support boundaries, automation first"],
        ["AI overreach", "Hallucinations in payment/support can damage trust", "Tool-scoped AI only, human escalation, no financial state transitions by AI"],
        ["Partner dependency", "Hotels/cards/insurance economics depend on partner quality", "Keep integration layer modular and non-exclusive where possible"],
    ]
    story.append(make_table(risk_data, [1.8 * inch, 2.1 * inch, 2.1 * inch], body_size=8.5))
    story.append(Paragraph("11. KPI Framework", styles["Section"]))
    kpi_data = [
        ["Dimension", "Metrics to track"],
        ["B2C demand", "traffic, search-to-offer CTR, checkout start rate, paid booking conversion, CAC, repeat traveler rate"],
        ["B2C monetization", "service fee per booking, hotel attach rate, insurance attach rate, ancillary revenue per booking, financial lead conversion"],
        ["B2B SaaS", "active agencies, blended ARPU, package mix, onboarding time, gross retention, net revenue retention"],
        ["Operations", "payment success rate, issue success rate, failed payment recovery rate, support first response time, reconciliation exceptions"],
        ["AI / automation", "deflection rate, response quality, assisted conversions, automation-trigger revenue, anomaly catch rate"],
    ]
    story.append(make_table(kpi_data, [1.4 * inch, 4.95 * inch], body_size=8.6))

    story.append(Paragraph("12. Final Strategic Position", styles["Section"]))
    story.append(
        callout(
            "Bottom line",
            "AviaFrame should evolve into a <b>travel commerce operating system</b> with two monetization engines: "
            "<b>Direct demand capture</b> and <b>white-label distribution</b>. "
            "The platform wins when it owns the booking truth, the customer graph, the recovery and retention workflows, and the monetizable partner surfaces around every trip. "
            "The strongest next step is not to build everything at once, but to sequence the roadmap so that <b>events → CRM → recovery → ancillaries → AI</b> compounds into durable economics.",
            styles,
            color=SOFT_BLUE,
            title_color=BLUE,
        )
    )
    story.append(Spacer(1, 0.1 * inch))
    story.append(
        Paragraph(
            "Recommended board-level decision for the next quarter: approve a dual-track plan where B2B packaging and B2C ancillary monetization are developed on top of the same commerce core, "
            "with Phase 1 focused on measurable recovery, retention and attach-rate wins rather than broad AI expansion.",
            styles["Body"],
        )
    )
    story.append(Spacer(1, 0.15 * inch))
    story.append(Paragraph("All monetization figures in this document are scenario assumptions for strategic planning, not committed forecasts.", styles["CenteredNote"]))

    return story


def build_pdf():
    register_fonts()
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(
        str(OUTPUT_PATH),
        pagesize=letter,
        leftMargin=0.75 * inch,
        rightMargin=0.75 * inch,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch,
        title="AviaFrame Strategic Platform Audit v2",
        author="OpenAI Codex",
        subject="Dual-engine B2C and B2B growth strategy for AviaFrame",
    )

    def on_first_page(canvas, document):
        cover_background(canvas, document)

    def on_later_pages(canvas, document):
        body_header_footer(canvas, document)

    doc.build(build_story(), onFirstPage=on_first_page, onLaterPages=on_later_pages)


if __name__ == "__main__":
    build_pdf()
