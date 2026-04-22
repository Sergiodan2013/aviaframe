# Moistar + Saudi MoC Compliance — Tech Tasks for Claude Code

## Контекст
Сайт: https://aviaframe.com (задеплоен на Netlify)
Цель: пройти активацию аккаунта Moistar и соответствовать 13 стандартам Saudi MoC e-commerce.

---

## БЛОК 1 — Критические баги (блокируют отправку в Moistar)

### TASK-01: Починить legal страницы — они редиректят на homepage

**Проблема:** Все три URL открывают главную страницу вместо документа:
- https://aviaframe.com/legal/terms-and-conditions.html
- https://aviaframe.com/legal/refund-and-cancellation-policy.html
- https://aviaframe.com/legal/privacy-policy.html

**Реализация:**
- Проверить, существуют ли файлы в Netlify deploy (`/legal/*.html`)
- Если файлов нет — создать их как самостоятельные HTML-страницы с реальным содержимым
- Если есть — исправить Netlify redirects (`_redirects` или `netlify.toml`), убрать catch-all редирект на `/`
- Каждая страница должна иметь header с навигацией и footer как на основном сайте

**Содержимое документов:**

`terms-and-conditions.html` — включить:
- Стороны договора: Consolidator Aviatech Limited и агентство
- Предмет: SaaS платформа для бронирования авиабилетов
- Условия оплаты SAR 300/месяц
- Ответственность сторон
- Порядок отмены подписки
- Применимое право: KSA

`refund-and-cancellation-policy.html` — включить:
- Политика возврата по авиабилетам (зависит от тарифа авиакомпании)
- Сроки рассмотрения запроса на возврат: X рабочих дней
- Подписка: условия отмены и возврата
- Контакт для возврата: support@aviaframe.com

`privacy-policy.html` — включить:
- Какие данные собираются (имя, email, паспортные данные пассажиров)
- Как используются
- Передача третьим лицам (авиакомпании, платёжные системы)
- Право на удаление данных (PDPL compliance)
- Контакт DPO или ответственного лица

---

## БЛОК 2 — Saudi MoC: 13 стандартов надёжности

### TASK-02: Добавить Live Chat (стандарты #3, #10, #11)

**Требование MoC:** чат на сайте, чат поддерживает арабский язык.

**Реализация:**
- Добавить WhatsApp Chat Button на сайт (самый простой вариант для KSA)
- HTML код для вставки перед `</body>`:
```html
<!-- WhatsApp Chat Button -->
<a href="https://wa.me/966505632561" 
   target="_blank"
   style="position:fixed; bottom:24px; right:24px; z-index:9999;
          background:#25D366; color:white; border-radius:50px;
          padding:12px 20px; font-size:15px; text-decoration:none;
          box-shadow:0 4px 12px rgba(0,0,0,0.2); display:flex; align-items:center; gap:8px;">
  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">...</svg>
  <span>Chat / تواصل</span>
</a>
```
- Альтернатива: подключить Tidio или Crisp (бесплатный тариф), настроить виджет

---

### TASK-03: Добавить сроки ответа на жалобы (стандарты #7, #8)

**Требование MoC:** явно указать сроки ответа и обработки жалобы.

**Реализация:**
- Добавить секцию в `terms-and-conditions.html` и на contact-страницу:
  - "We respond to complaints within 1 business day / نرد على الشكاوى خلال يوم عمل واحد"
  - "Complaints are resolved within 5 business days / تُعالج الشكاوى خلال 5 أيام عمل"
- Добавить форму жалобы на сайт или указать email для жалоб: support@aviaframe.com
- Добавить ссылку на жалобу в футер

---

### TASK-04: Добавить срок доставки e-ticket в booking flow (стандарт #9)

**Требование MoC:** сообщить время доставки ДО завершения покупки и указать в инвойсе.

**Реализация:**
- В widget-demo и в реальном booking flow — добавить текст на странице подтверждения заказа:
  - EN: "Your e-ticket will be delivered to your email within 30 minutes after payment confirmation."
  - AR: "سيتم إرسال التذكرة الإلكترونية إلى بريدك خلال 30 دقيقة من تأكيد الدفع."
- В PDF e-ticket — добавить строку с датой/временем выпуска тикета

---

### TASK-05: Арабский язык (стандарты #10, #11, #12)

**Требование MoC:** сайт/продукты отображаются на арабском, жалобы принимаются на арабском.

**Реализация (минимум для compliance):**
- Добавить переключатель языка EN / AR в header сайта
- Перевести на арабский:
  - Главная страница (ключевые секции: hero, pricing, features, contact form)
  - Все legal страницы
  - Форму жалобы / контакты
- Для widget: добавить `lang` параметр, переключающий язык интерфейса
- Использовать `dir="rtl"` для Arabic layout

**Техническое решение:**
- Добавить `data-en` / `data-ar` атрибуты на текстовые элементы
- JavaScript переключатель меняет `document.documentElement.lang` и `dir`
- Хранить выбор в `localStorage`

---

### TASK-06: Социальные сети (стандарт #6)

**Требование MoC:** возможность подать жалобу через соцсети.

**Реализация:**
- Создать аккаунты (если нет): Twitter/X + Instagram для @aviaframe
- Добавить иконки соцсетей в footer сайта рядом с контактами
- В форме жалобы / на contact-странице указать: "You can also reach us on Twitter: @aviaframe"

---

## БЛОК 3 — Moistar: демо и документация

### TASK-07: Подготовить demo link и видео

**Требование Moistar:** ссылка на демо или видео работы приложения.

**Реализация:**
- Demo link уже есть: https://aviaframe.com/widget-demo — убедиться что он работает и sandbox mode активен
- Записать Loom видео (3-5 минут):
  1. Показать главную страницу aviaframe.com
  2. Перейти в widget-demo
  3. Выполнить поиск рейса
  4. Выбрать рейс, заполнить данные пассажира
  5. Оплатить тестовой картой `4111 1111 1111 1111`
  6. Показать email с e-ticket
  7. Показать admin.aviaframe.com с появившимся заказом
- Ссылку на Loom вставить в email Moistar

---

### TASK-08: Составить email для Moistar

**Реализация:** подготовить email со следующей структурой:

```
Subject: AviaFrame — Account Activation Request

Website: https://aviaframe.com
Demo: https://aviaframe.com/widget-demo
Demo video: [Loom link]
Admin portal: https://admin.aviaframe.com

Products & Pricing:
- Agency Platform: SAR 300/month
  Includes: flight search, booking widget, order management portal,
  e-ticket delivery, email notifications, agency markup

Legal:
- Terms & Conditions: https://aviaframe.com/legal/terms-and-conditions.html
- Privacy Policy: https://aviaframe.com/legal/privacy-policy.html  
- Refund Policy: https://aviaframe.com/legal/refund-and-cancellation-policy.html
- Contact Information: https://aviaframe.com/legal/contact-information.html

Contact:
- sales@aviaframe.com
- support@aviaframe.com
- WhatsApp: +966 50 563 2561
```

---

## БЛОК 4 — Дополнительно (не блокирует, но желательно)

### TASK-09: Business Registration Certificate (CR)

**Требование MoC:** регистрационный сертификат для e-commerce (e.mc.gov.sa).

**Реализация:**
- Это не техническая задача — нужно подать заявку на e.mc.gov.sa от имени компании
- После получения номера CR — добавить его в footer сайта рядом с названием компании:
  "© 2026 Consolidator Aviatech Limited | CR: XXXXXXXXX"

---

## Приоритет выполнения

| # | Task | Приоритет | Сложность |
|---|------|-----------|-----------|
| TASK-01 | Починить legal страницы | 🔴 Критично | Низкая |
| TASK-07 | Записать demo видео | 🔴 Критично | Низкая |
| TASK-08 | Email Moistar | 🔴 Критично | Низкая |
| TASK-02 | Live chat (WhatsApp button) | 🟠 Высокий | Низкая |
| TASK-03 | Сроки жалоб | 🟠 Высокий | Низкая |
| TASK-04 | Срок доставки тикета | 🟠 Высокий | Средняя |
| TASK-05 | Арабский язык | 🟡 Средний | Высокая |
| TASK-06 | Соцсети | 🟡 Средний | Низкая |
| TASK-09 | CR registration | 🟡 Средний | Нетехническая |
