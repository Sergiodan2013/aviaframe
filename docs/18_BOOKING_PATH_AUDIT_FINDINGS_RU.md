# AviaFrame — Findings по Track 1 аудиту customer booking path

Версия: 1.0  
Дата: 2026-06-30  
Язык: RU  
Scope: текущий customer flow `search -> results -> passenger -> payment -> success -> my bookings`

## 1. Executive summary

Текущий booking path уже выглядит как рабочий product flow, но внутри него есть несколько системных разрывов между тем, что интерфейс обещает пользователю, и тем, что backend / downstream booking path реально способен обработать.

Главный вывод:

- продукт уже можно воспринимать как полноценный booking experience;
- но сейчас он ещё не достаточно согласован как коммерческий self-serve flow;
- основные риски лежат не в "красоте", а в несогласованности логики, trust и product contract между шагами.

Наиболее важные выводы:

1. Поиск обещает multi-passenger / child / infant сценарии, но booking flow по факту собирает только одного взрослого пассажира.
2. Статусы `pending / paid / confirmed / issued / ticketed` интерпретируются по-разному на разных шагах.
3. Платёжный экран пока выглядит как техническая форма, а не как mature travel checkout.
4. В flow есть сильный geo-bias под Saudi Arabia, который ухудшает международный UX.
5. Валюта в интерфейсе местами fallback-ится в `UAH`, что может ломать trust.
6. Нет явной продуктовой аналитики funnel-level, поэтому масштабировать конверсию будет сложно даже после UI-улучшений.

---

## 2. Текущая карта пути

Текущий путь выглядит так:

1. Пользователь открывает search page.
2. Вводит `origin / destination / dates / passengers / cabin`.
3. Получает выдачу результатов.
4. Выбирает конкретный offer.
5. Переходит на экран passenger details.
6. Создаётся order через n8n / DRCT path.
7. Пользователь попадает на payment.
8. После успешной оплаты видит success state.
9. Позже может открыть `My Bookings`.

Проблема не в самом количестве шагов. Проблема в том, что contract между шагами пока не полностью согласован.

---

## 3. Findings

## F-01 — Search поддерживает детей и младенцев, а booking path по факту нет

Severity: `Critical`

Evidence:

- `SearchForm` принимает `adults`, `children`, `infants`: `portal/client/src/components/SearchForm.jsx:11-13`, `:25-27`, `:123-155`
- `PassengerForm` реализован как одна форма для одного пассажира: `portal/client/src/components/PassengerForm.jsx:7-26`
- валидация режет возраст младше 18 лет: `portal/client/src/components/PassengerForm.jsx:84-97`
- при создании order в payload уходит только один пассажир: `portal/client/src/App.jsx:519-526`
- в fallback order cache `passenger_count` захардкожен в `1`: `portal/client/src/App.jsx:618-625`

Что это значит:

- search layer обещает family / child / infant booking;
- следующий шаг не умеет собрать эти данные;
- пользователь может честно выбрать `2 adults + 1 child`, но downstream form этого не поддержит корректно;
- это уже не просто UX-gap, это product contract mismatch.

Почему это важно:

- создаёт ложное ожидание;
- повышает abandonment на самом дорогом шаге;
- делает продукт непредсказуемым для агентств;
- создаёт риск ошибок в реальной выписке.

Что нужно делать:

- либо быстро ограничить search contract до того, что реально поддерживается;
- либо приоритетно переделать passenger step под multi-passenger schema;
- до исправления не оставлять в продукте обещание поддержки детей / младенцев без реальной реализации.

---

## F-02 — Lifecycle статусов несогласован между шагами

Severity: `Critical`

Evidence:

- после создания order booking получает `status: 'pending_payment'`: `portal/client/src/App.jsx:601-609`
- после оплаты App ставит `status: 'paid'`: `portal/client/src/App.jsx:688-693`
- success screen при `paid` пишет: `Your flight is booked and ticket is being issued.`: `portal/client/src/App.jsx:1408-1415`
- `MyBookings` нормализует `paid -> confirmed`: `portal/client/src/pages/MyBookings.jsx:37-46`
- `MyBookings` нормализует `issued -> ticketed`: `portal/client/src/pages/MyBookings.jsx:41-43`
- UI-конфиг статусов показывает уже отдельные состояния `pending / confirmed / ticketed / cancelled`: `portal/client/src/pages/MyBookings.jsx:193-229`

Что это значит:

- на одном шаге `paid` трактуется как почти готовая выписка;
- на другом шаге `paid` становится `confirmed`;
- отдельно есть `issued / ticketed`;
- для пользователя и support это может означать разную стадию одной и той же заявки.

Почему это важно:

- travel checkout очень сильно завязан на trust;
- пользователь должен точно понимать: деньги списаны, бронь создана, билет выписан, email отправлен;
- нечёткая state model резко увеличивает support load.

Что нужно делать:

- зафиксировать canonical lifecycle для customer-facing flow:
  - `searching`
  - `selected`
  - `booking_created`
  - `payment_pending`
  - `payment_paid`
  - `ticket_issuing`
  - `ticket_issued`
  - `failed / cancelled`
- одинаково использовать эти смыслы в App, My Bookings, emails и admin.

---

## F-03 — Passenger step жёстко смещён под Saudi-first сценарий

Severity: `High`

Evidence:

- phone default `+966`: `portal/client/src/components/PassengerForm.jsx:10-12`
- nationality default `SA`: `portal/client/src/components/PassengerForm.jsx:20-23`
- `PhoneInput` использует `defaultCountry=\"SA\"`: `portal/client/src/components/PassengerForm.jsx:242-247`
- order payload ставит `issuing_country: data.nationality || 'SA'`: `portal/client/src/App.jsx:520-525`

Что это значит:

- для KSA-партнёров это допустимо;
- для международного whitelabel продукта это выглядит как hidden bias;
- пользователь извне KSA сразу чувствует, что flow “не совсем для него”.

Почему это важно:

- AviaFrame позиционируется как B2B platform для агентств, а не как локальный single-market checkout;
- такой bias ухудшает trust у международных агентств и их клиентов;
- создаёт ненужные ошибки на контактных и паспортных данных.

Что нужно делать:

- перейти на neutral defaults;
- определять страну из tenant config / locale / origin, а не hardcode;
- показывать Saudi-specific defaults только для agency/tenant, где это реально ожидаемо.

---

## F-04 — Payment screen пока похож на техническую форму, а не на mature checkout

Severity: `High`

Evidence:

- card number принимается только как `16 digits`: `portal/client/src/components/PaymentScreen.jsx:47-53`
- CVV только `3 digits`: `portal/client/src/components/PaymentScreen.jsx:73-78`
- при отсутствии `orderId` показывается `alert(...)`: `portal/client/src/components/PaymentScreen.jsx:91-93`
- любые платёжные ошибки тоже показываются через `alert(...)`: `portal/client/src/components/PaymentScreen.jsx:133-135`
- форма не показывает нормальный inline recovery path после ошибок

Что это значит:

- validation слишком наивная для real-world cards;
- интерфейс не выглядит как production-grade checkout;
- error handling скорее developer-centric, чем customer-centric.

Почему это важно:

- payment step — самый чувствительный к trust и friction;
- любая “сырость” здесь напрямую режет conversion;
- агентства будут оценивать продукт именно по этому шагу.

Что нужно делать:

- заменить `alert(...)` на встроенные inline states;
- расширить card validation под реальные сети и форматы;
- добавить clearer trust blocks:
  - secure payment
  - support contact
  - refund/cancellation hint
  - what happens after payment

---

## F-05 — Валютный contract в UI несогласован и местами fallback-ится в UAH

Severity: `High`

Evidence:

- `FlightCard` fallback currency = `UAH`: `portal/client/src/components/FlightCard.jsx:67-68`
- `PassengerForm` fallback currency = `UAH`: `portal/client/src/components/PassengerForm.jsx:144`
- `PaymentScreen` fallback currency = `UAH`: `portal/client/src/components/PaymentScreen.jsx:155`
- payloads при order creation тоже fallback-ятся в `UAH`: `portal/client/src/App.jsx:553`, `:570`, `:608`, `:634`
- quick filter summary на results page пишет `from ... UAH`: `portal/client/src/App.jsx:1280-1283`

Что это значит:

- даже если upstream вернёт корректную валюту не везде, UI способен показать пользователю несогласованную валюту;
- часть интерфейса может говорить `SAR`, а часть — `UAH`;
- это критично для trust, особенно в travel commerce.

Почему это важно:

- цена — главный decision input;
- mixed currency в одном flow выглядит как broken or unsafe checkout;
- для агентств это почти instantly disqualifying issue.

Что нужно делать:

- вынести валюту в единый normalized source of truth;
- убрать hardcoded `UAH` из customer-facing fallback;
- если валюта неизвестна, лучше скрыть часть price context, чем показывать неверную валюту.

---

## F-06 — Airport autocomplete теряет контекст после выбора

Severity: `High`

Evidence:

- при выборе airport input заменяется только на `airport.code`: `portal/client/src/components/AirportAutocomplete.jsx:43-45`
- поиск сам по себе показывает city + airport name + country, но после выбора UI схлопывает это до IATA code

Что это значит:

- пользователь во время выбора видит богатый контекст;
- после выбора видит только 3-letter code;
- confidence падает, особенно у нечасто летающих пользователей.

Почему это важно:

- airport ambiguity — одна из самых частых ошибок в flight booking;
- продукт должен снижать риск ошибочного выбора, а не увеличивать его;
- для city systems вроде London / Milan / New York это особенно чувствительно.

Что нужно делать:

- после выбора отображать human-readable label:
  - `London (LHR)`
  - `Milan (MXP)`
- хранить IATA code в state отдельно от display label.

---

## F-07 — Search form функциональна, но пока слишком “операционная”

Severity: `Medium`

Evidence:

- форма построена как базовый набор полей без явного product framing: `portal/client/src/components/SearchForm.jsx:49-195`
- return trip реализован просто как optional return date, без явной модели trip type: `portal/client/src/components/SearchForm.jsx:89-103`
- нет видимой защиты от логически проблемных конфигураций `children/infants` относительно взрослых

Что это значит:

- flow работает;
- но как B2B-facing demo или partner-facing experience он пока выглядит больше как внутренний tool;
- UX недостаточно помогает пользователю “правильно начать”.

Почему это важно:

- first search experience задаёт качество восприятия всего продукта;
- если форма выглядит утилитарно, продукт воспринимается как менее mature.

Что нужно делать:

- выделить trip type как первый decision;
- добавить smarter passenger guardrails;
- усилить copy вокруг what happens next;
- привести search step к более productized travel UX.

---

## F-08 — Results page помогает отфильтровать, но слабо помогает принять решение

Severity: `Medium`

Evidence:

- есть quick filters и sort controls: `portal/client/src/App.jsx:1257-1308`
- есть chips по stop/baggage и базовая карточка offer: `portal/client/src/components/FlightCard.jsx:95-205`
- но в current layer нет customer-facing signals вроде:
  - fare conditions
  - refund/change hints
  - “best value” framing
  - urgency / confidence / recommendation

Что это значит:

- results page даёт data;
- но пока слабо помогает принимать решение, особенно на дорогих маршрутах;
- пользователю приходится самостоятельно интерпретировать выдачу.

Почему это важно:

- real growth обычно приходит не только от большего количества results, а от лучшего decision support;
- особенно для agency customers важен trust-rich compare layer.

Что нужно делать:

- добавить stronger decision scaffolding;
- показать fare conditions и risk notes;
- выделить recommended / best price / shortest / baggage included clearer.

---

## F-09 — Success step сообщает optimistic message раньше, чем lifecycle полностью прозрачен

Severity: `Medium`

Evidence:

- success title при `paid`: `Payment confirmed!`: `portal/client/src/App.jsx:1408-1410`
- subtitle: `Your flight is booked and ticket is being issued.`: `portal/client/src/App.jsx:1411-1414`
- отдельного customer-facing шага с подтверждением `ticket issued + email sent` в текущем flow нет

Что это значит:

- пользователю говорят, что всё почти завершено;
- но UI не показывает явное окончание issuance lifecycle;
- это особенно чувствительно, когда билет может выписываться не мгновенно.

Почему это важно:

- если email задержится или issuance подвиснет, support получит “я оплатил, где билет?”;
- ожидания надо ставить точнее.

Что нужно делать:

- разделить `payment received` и `ticket issued`;
- показывать SLA / next step;
- если ticket ещё не выписан, прямо говорить это без optimistic overstatement.

---

## F-10 — My Bookings может опираться на local cache и показывать stale truth

Severity: `Medium`

Evidence:

- при ошибке загрузки orders UI падает в local cache: `portal/client/src/pages/MyBookings.jsx:156-163`, `:177-185`
- если backend вернул пусто, UI тоже использует local cache: `portal/client/src/pages/MyBookings.jsx:171-176`

Что это значит:

- как resilience tactic это полезно;
- но для customer truth source это рискованно;
- пользователь может видеть неактуальный статус брони или оплаты.

Почему это важно:

- bookings area должна быть reliable source of truth;
- stale cache допустим как fallback, но должен быть clearly marked.

Что нужно делать:

- сохранить fallback, но сделать её прозрачной;
- явно помечать cached state;
- не смешивать cached truth и authoritative truth без явного статуса синхронизации.

---

## F-11 — В customer path не видно явной funnel analytics instrumentation

Severity: `Medium`

Evidence:

- в `portal/client/src` не найдено признаков product analytics instrumentation (`posthog`, `mixpanel`, `amplitude`, `gtag`, явных capture/track event hooks)

Что это значит:

- продукт можно улучшать только вручную или по support signals;
- нет нормальной базы для измерения drop-off:
  - search submitted
  - results shown
  - offer selected
  - passenger started
  - order created
  - payment initiated
  - payment success
  - ticket issued

Почему это важно:

- без funnel telemetry будет сложно понять, какой redesign реально улучшил conversion;
- strategic growth без наблюдаемости почти всегда замедляется.

Что нужно делать:

- внедрить minimal product analytics schema;
- начать хотя бы с ключевых funnel events и tenant/agency attribution.

---

## 4. Приоритеты на следующий этап

### Sprint 1 — must fix before serious scale / partner rollout

- Закрыть mismatch `search passengers` vs `booking passengers`
- Зафиксировать единую status/state model
- Убрать currency fallbacks, которые могут показывать неверную валюту
- Переделать payment error states без `alert(...)`

### Sprint 2 — trust and conversion layer

- Нейтрализовать Saudi-only defaults
- Улучшить airport selection display model
- Усилить results decision support
- Уточнить success / issuance communication

### Sprint 3 — growth instrumentation

- Внедрить funnel analytics
- Замерить conversion by step
- На основе этого redesign-ить search/results/payment уже data-driven

---

## 5. Что это значит продуктово

Если коротко:

- AviaFrame уже имеет ядро работающего booking продукта;
- но следующая стадия роста упирается не в добавление ещё одной функции, а в выравнивание contract, trust и product clarity;
- если сначала закрыть эти разрывы, дальше уже есть смысл масштабировать:
  - embed distribution,
  - hosted agency pages,
  - partner onboarding,
  - conversion optimization.

Track 1 audit показывает, что сейчас главная задача не “нарисовать красивее”, а сделать путь логически честным, trust-rich и масштабируемым для агентств.
