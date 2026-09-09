# AviaFrame — Audit Checklist для customer booking path

Версия: 1.0  
Дата: 2026-06-30  
Язык: RU  
Назначение: рабочий checklist для полного product + UX аудита пути пользователя от первого входа до получения билета

## 1. Цель

Этот аудит нужен, чтобы не "улучшать интерфейс на глаз", а точно понять:

- где в booking path у пользователя возникает friction;
- где падает trust;
- где путь нелогичен или перегружен;
- где есть продуктовые противоречия;
- какие проблемы реально мешают конверсии в покупку.

---

## 2. Что должно получиться на выходе

После прохождения checklist у нас должны быть:

1. Полная карта customer journey по шагам.
2. Findings по каждому экрану и переходу.
3. Severity для каждого finding:
   - `Critical`
   - `High`
   - `Medium`
   - `Low`
4. Список `quick wins`.
5. Список `structural redesign items`.
6. Готовый backlog для следующего sprint.

---

## 3. Как проводить аудит

Для каждого шага нужно фиксировать:

- `Screen / step`
- `User goal`
- `What user sees`
- `What user must do`
- `Where confusion appears`
- `Where trust drops`
- `Where user can abandon the flow`
- `What should be improved`
- `Severity`

Рекомендуемый формат фиксации:

```md
## Step
Screen:
User goal:
Observed issue:
Why it matters:
Recommendation:
Severity:
```

---

## 4. Общие вопросы, которые проверяем на каждом шаге

На каждом экране задаём одни и те же вопросы:

1. Понятно ли, где пользователь находится?
2. Понятно ли, что нужно сделать дальше?
3. Есть ли лишняя информация или перегрузка?
4. Хватает ли информации, чтобы принять решение?
5. Нет ли противоречий между обещанием продукта и реальным поведением?
6. Выглядит ли экран достаточно доверительно для travel booking?
7. Понимает ли пользователь, что произойдёт после нажатия CTA?
8. Есть ли риск ошибки, который продукт не объясняет заранее?
9. Есть ли визуальные или продуктовые элементы, которые снижают trust?
10. Есть ли явная точка возможного drop-off?

---

## 5. Полный audit path

## Этап A. Первый вход и первый контекст

### A1. Входная точка

Проверяем:

- с какой страницы пользователь стартует:
  - main landing
  - widget demo
  - hosted booking page
  - partner-branded page
- понятно ли, что это за продукт;
- понятно ли, для кого он;
- есть ли mismatch между ожиданием и увиденным.

Ключевые вопросы:

- Пользователь понимает, что он сейчас будет делать?
- Он воспринимает это как реальный booking flow или как техно-демо?
- Видно ли, что это branded agency experience, а не сырой тестовый инструмент?

Ищем:

- слабый first impression;
- неясный контекст;
- лишнюю техническую терминологию;
- слишком "внутреннюю" подачу.

### A2. Above-the-fold trust

Проверяем:

- есть ли понятный заголовок;
- есть ли объяснение ценности;
- есть ли signals of legitimacy;
- есть ли brand consistency;
- нет ли элементов, которые выглядят "дешево" или случайно.

Ищем:

- слабую визуальную иерархию;
- недостаток доверительных сигналов;
- неясный value proposition;
- визуальный шум.

---

## Этап B. Search form

### B1. Структура формы поиска

Проверяем:

- понятен ли порядок полей;
- логично ли расположены `From / To / Date / Passengers / Cabin`;
- хорошо ли видны значения по умолчанию;
- не перегружена ли форма;
- понятно ли, какие поля обязательны.

Ключевые вопросы:

- Может ли новый пользователь быстро начать поиск?
- Есть ли сомнение, что именно нужно вводить?
- Не выглядит ли форма как внутренняя админка?

### B2. Trip type, dates, passengers

Проверяем:

- one-way / return / multi-city сценарии;
- понятность date selection;
- управление passenger mix;
- согласованность поиска и дальнейшего booking flow.

Ищем:

- ограничения, не объяснённые пользователю;
- несогласованность между search intent и downstream forms;
- непонятные default values.

### B3. CTA search

Проверяем:

- достаточно ли заметна кнопка;
- ясно ли, что произойдёт после нажатия;
- есть ли loading state;
- есть ли защита от repeated clicks;
- есть ли сообщения об ошибках при невалидном вводе.

---

## Этап C. Airport autocomplete

### C1. Поиск аэропортов и городов

Проверяем:

- корректность выдачи по city names;
- корректность выдачи по airport codes;
- ranking релевантности;
- city vs airport grouping;
- nearby airports / multi-airport cities.

Ключевые вопросы:

- Первый результат действительно тот, который ожидает пользователь?
- Понимает ли пользователь, выбирает он город или конкретный аэропорт?
- Не теряется ли confidence из-за странной выдачи?

### C2. UX выбора

Проверяем:

- видимость dropdown;
- удобство keyboard navigation;
- mobile interaction;
- label clarity;
- country / city / airport naming consistency.

Ищем:

- неочевидные результаты;
- неконсистентные подписи;
- слабые empty states;
- отсутствие помощи при typo / ambiguity.

---

## Этап D. Search results

### D1. Первый взгляд на результаты

Проверяем:

- понятна ли структура страницы;
- ясно ли, сколько найдено вариантов;
- видно ли cheapest / fastest / best value;
- хорошо ли работают filters и sort;
- не перегружена ли страница.

Ключевые вопросы:

- Может ли пользователь быстро понять, что ему предлагают?
- Есть ли у него опора для выбора?
- Не выглядит ли список как "сырой список данных" без продуктовой логики?

### D2. Карточка рейса

Проверяем:

- читаемость airline, segments, duration, stops;
- понятность baggage info;
- fare rules visibility;
- visibility total price;
- clarity currency;
- наличие скрытых сюрпризов.

Ищем:

- price ambiguity;
- слабую иерархию внутри карточки;
- недостаток информации для принятия решения;
- слишком сложный comparison between options.

### D3. Filters / sorting / merchandising

Проверяем:

- работают ли фильтры так, как ожидает пользователь;
- помогает ли сортировка принимать решение;
- есть ли "best value" или похожие helpful anchors;
- не ведёт ли UI пользователя к cognitive overload.

---

## Этап E. Offer selection

### E1. Момент выбора рейса

Проверяем:

- понятно ли, что сейчас будет выбрано;
- есть ли before/after state при выборе;
- не возникает ли страха, что цена изменится;
- объяснено ли, что будет дальше.

Ключевые вопросы:

- Есть ли уверенность, что пользователь выбирает именно тот offer?
- Понятен ли следующий шаг после selection?

### E2. Price refresh / repricing

Проверяем:

- что происходит, если fare stale;
- как объясняется repricing;
- понятен ли price difference;
- есть ли ощущение "меня обманывают" из-за смены цены.

Ищем:

- неясные repricing states;
- слабые сообщения о смене цены;
- отсутствие safety messaging.

---

## Этап F. Passenger form

### F1. Общая логика формы

Проверяем:

- сколько пассажиров реально поддерживается;
- соответствует ли форма passenger mix из search;
- есть ли step-by-step progression;
- понятен ли прогресс заполнения.

Ключевые вопросы:

- Поддерживает ли форма реальные travel scenarios?
- Не создаёт ли она ощущение, что продукт unfinished?

### F2. Поля пассажира

Проверяем:

- first name / last name logic;
- date of birth;
- nationality;
- document fields;
- contact fields;
- validation messages;
- форматирование данных.

Ищем:

- отсутствие продуктовой логики для children/infants;
- избыточные или непонятные поля;
- неясные ошибки;
- неочевидные форматные требования.

### F3. Completion and confidence

Проверяем:

- понятно ли, что форма заполнена корректно;
- есть ли summary before payment;
- видит ли пользователь, что дальше всё готово к оплате.

---

## Этап G. Payment selection

### G1. Выбор метода оплаты

Проверяем:

- ясно ли, какие payment methods доступны;
- понятно ли различие между ними;
- нет ли визуальных багов или слабых trust markers;
- видит ли пользователь total charge.

### G2. Trust at payment step

Проверяем:

- есть ли сильный itinerary summary;
- видно ли, что покупается;
- есть ли понятный total;
- ясно ли, в какой валюте спишутся деньги;
- есть ли support reassurance;
- есть ли post-payment explanation.

Ключевые вопросы:

- Чувствует ли пользователь себя достаточно уверенно, чтобы платить?
- Выглядит ли это как mature payment experience?

---

## Этап H. Card payment form

### H1. Структура и визуальный trust

Проверяем:

- качество visual hierarchy;
- card form readability;
- icon quality;
- spacing;
- consistency with rest of product;
- professional feel.

### H2. Error handling

Проверяем:

- что происходит при decline;
- что происходит при invalid card;
- что происходит при network issue;
- что происходит при retry;
- насколько сообщение понятно;
- говорит ли UI, что делать дальше.

Ищем:

- generic errors без actionable next step;
- слишком "технические" сообщения;
- отсутствие calming language;
- drop-off risk после ошибки.

### H3. Payment completion confidence

Проверяем:

- понятно ли, когда платёж отправлен;
- есть ли processing state;
- защищён ли пользователь от double submit;
- ясно ли, когда ждать подтверждение.

---

## Этап I. Confirmation screen

### I1. Момент после оплаты

Проверяем:

- подтверждает ли экран успешность действия;
- понятно ли, создан ли booking или уже issued ticket;
- видит ли пользователь next steps;
- есть ли ощущение завершённости.

### I2. Что пользователь получает

Проверяем:

- e-ticket / booking reference / itinerary summary;
- email expectation;
- support path;
- cancellation / change hints;
- ясность статуса заказа.

Ищем:

- ambiguity between booked / confirmed / issued;
- слабую post-purchase reassurance;
- отсутствие дальнейших действий.

---

## Этап J. Post-booking and email

### J1. Email delivery expectation

Проверяем:

- ясно ли, что письмо будет отправлено;
- сказано ли, когда его ждать;
- понятно ли, что делать, если письмо не пришло.

### J2. Post-booking confidence loop

Проверяем:

- закрывается ли тревожность после покупки;
- понимает ли пользователь, что travel document у него действительно будет;
- знает ли он, куда обращаться в случае проблемы.

---

## 6. Специальные продуктовые проверки

Отдельно проверяем поперёк всего пути:

### 6.1. Currency clarity

- одна ли валюта используется последовательно;
- нет ли mixed-currency perception;
- не меняется ли mental model пользователя по цене;
- нет ли сюрприза между search / results / payment.

### 6.2. Status clarity

- различаются ли чётко:
  - searching
  - selected
  - booking created
  - payment processing
  - paid
  - issued
  - failed

### 6.3. Mobile usability

На каждом экране проверяем:

- не ломается ли layout;
- не обрезаются ли CTA;
- удобно ли вводить даты и пассажиров;
- не слишком ли тяжёлый scroll path.

### 6.4. Arabic / localization

Проверяем:

- перевод;
- RTL layout;
- наличие тех же действий и CTA;
- отсутствие сломанных блоков;
- consistency labels and states.

### 6.5. Agency branding quality

Проверяем:

- выглядит ли это реально branded solution;
- не проскакивает ли слишком много AviaFrame/internal flavor;
- не ломается ли UI на разных branded setups.

---

## 7. Severity model

### Critical

Ломает путь к покупке или сильно подрывает доверие.

Примеры:

- невозможно завершить booking;
- multi-passenger mismatch;
- неясный payment outcome;
- сильный currency confusion.

### High

Не блокирует покупку напрямую, но сильно снижает conversion или trust.

Примеры:

- слабая results readability;
- confusing errors;
- слабый onboarding into booking.

### Medium

Ухудшает опыт, но не является главным барьером.

Примеры:

- визуальная неконсистентность;
- второстепенные copy issues;
- слабые empty states.

### Low

Полировка и улучшение perception.

---

## 8. Что считаем quick wins

Quick wins - это улучшения, которые:

- не требуют тяжёлой архитектурной переделки;
- заметно улучшают trust или clarity;
- могут быстро повлиять на demo quality и conversion.

Примеры:

- улучшить labels и helper text;
- усилить payment reassurance copy;
- улучшить error messages;
- улучшить card hierarchy;
- добавить stronger summary blocks.

---

## 9. Что считаем structural changes

Structural changes - это улучшения, которые:

- меняют логику продукта;
- меняют flow;
- требуют согласования frontend + backend + product.

Примеры:

- новый passenger flow;
- новый onboarding wizard;
- переработка search/results logic;
- новый status model в UI.

---

## 10. Итоговый deliverable после аудита

После завершения Track 1 должен появиться документ следующего вида:

1. `Journey map`
2. `Screens inventory`
3. `Findings by step`
4. `Severity table`
5. `Quick wins`
6. `Structural redesign backlog`
7. `Sprint recommendation`

---

## 11. Практический следующий шаг

После этого checklist мы делаем не абстрактный разговор про UX, а:

1. Проходим весь live booking path.
2. Фиксируем findings экран за экраном.
3. Раскладываем всё по severity.
4. Собираем `P0 / P1 / P2 backlog`.
5. Отдельно формируем `Sprint 1 execution list`.

То есть Track 1 - это не "посмотреть", а создать рабочую основу для всей следующей product/UX переработки.
