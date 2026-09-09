# AviaFrame — продуктовый roadmap для стратегического роста

Версия: 1.0  
Дата: 2026-06-29  
Формат: founder / stakeholder pitch

## 1. Зачем этот документ

Этот документ нужен, чтобы коротко и убедительно объяснить:

- где AviaFrame находится сейчас;
- какие продуктовые ограничения мешают росту;
- почему мы выбираем именно такой путь развития;
- какой roadmap даст наибольший стратегический эффект;
- чего мы достигнем в результате.

## 2. Где мы сейчас

AviaFrame уже имеет сильную технологическую основу:

- multi-tenant backend для flight search, pricing, booking и issuing;
- embeddable widget для сайтов агентств;
- admin/portal для управления агентствами и заказами;
- white-label направление;
- интеграционную модель, где supplier secrets и payment secrets не попадают на фронтенд партнёра.

Сильная сторона продукта уже сегодня:

> мы умеем дать агентству быстрый запуск branded online flight sales без собственной сложной supplier-интеграции.

Но на уровне продукта и UX сейчас есть несколько ограничений, которые сдерживают масштабирование.

## 3. Основные ограничения роста

### 3.1. Позиционирование пока размыто

Сейчас продукт воспринимается как один общий booking/widget solution, хотя по факту в нём уже заложены как минимум три разных продуктовых сценария:

- hosted white-label;
- embeddable widget;
- enterprise/API модель.

Из-за этого разным типам клиентов сложнее понять, какой именно продукт для них.

### 3.2. Onboarding слишком операционный

Обещание продукта — быстрый запуск.  
Но текущий onboarding и admin flow пока ощущаются как internal operations console, а не как понятный B2B SaaS setup journey.

Это увеличивает:

- зависимость от ручного сопровождения;
- время запуска нового агентства;
- риск ошибок на конфигурации;
- нагрузку на founders / ops / support.

### 3.3. Core booking UX ещё недожат

Критичные места, которые влияют на конверсию и доверие:

- passenger flow;
- payment trust;
- search/results readability;
- error states;
- общая уверенность пользователя на пути к покупке.

### 3.4. Admin не разделён по jobs-to-be-done

Сейчас в продукте ещё слишком много логики смешано в одном admin surface.

Это усложняет:

- onboarding команды агентства;
- повседневную работу;
- масштабирование ролей;
- восприятие зрелости продукта.

## 4. Почему мы выбираем именно такой путь

Мы не должны расти как "ещё один flight widget".

Наиболее сильная стратегическая позиция AviaFrame звучит так:

> AviaFrame — это самый быстрый способ для travel agency запустить собственный branded online flight sales channel без построения supplier infrastructure с нуля.

Это выгодный путь, потому что он:

- быстрее объясняется рынку;
- лучше конвертирует B2B-партнёров;
- снижает зависимость от кастомной разработки;
- даёт пространство для tiered monetization;
- открывает upsell в hosted, embed и enterprise сценарии.

## 5. Целевая модель продукта

Мы рекомендуем упаковать AviaFrame как 3 deployment modes на едином backend foundation.

### 5.1. Hosted White-Label

Для агентств без dev-команды.

Что получает клиент:

- готовый branded booking site;
- custom domain или branded subdomain;
- подключённую операционную модель;
- быстрый запуск.

### 5.2. Embedded Widget

Для агентств, у которых уже есть сайт.

Что получает клиент:

- public widget key;
- готовый snippet;
- allowlist доменов;
- branded widget experience;
- быстрый embed в существующий сайт.

### 5.3. Enterprise / API

Для крупных агентств, OTA и platform partners.

Что получает клиент:

- больше контроля;
- более глубокую интеграцию;
- кастомные процессы;
- enterprise SLA и коммерческую модель.

## 6. Что нужно улучшить в продукте

### 6.1. Улучшить публичную упаковку

Нужно:

- чётко разделить Hosted / Embed / Enterprise;
- объяснить, какой сценарий для какого клиента;
- показать путь запуска;
- усилить доверие и зрелость подачи.

### 6.2. Пересобрать onboarding

Нужно заменить набор форм на wizard:

1. создать агентство;
2. выбрать deployment mode;
3. загрузить branding;
4. настроить domain / hosted URL;
5. выбрать payment mode;
6. проверить preview;
7. пройти go-live checklist;
8. получить snippet или live URL.

### 6.3. Дожать customer booking path

Нужно улучшить:

- multi-passenger сценарии;
- payment UX;
- price / currency transparency;
- trust markers;
- качество error states и recovery paths.

### 6.4. Разделить admin по рабочим задачам

Нужны отдельные зоны:

- Onboarding;
- Agencies;
- Widget / Hosted setup;
- Orders;
- Finance;
- Support;
- Analytics;
- Settings.

## 7. Roadmap

## Этап 1. Foundation for credibility and conversion

Срок: 0-30 дней

Цель:

закрыть то, что больше всего мешает доверию к продукту и конверсии в demo / pilot / onboarding.

Фокус:

- исправить критичные gaps в booking flow;
- улучшить payment trust UX;
- улучшить search/results readability;
- стабилизировать agency creation и admin базовые сценарии;
- перепаковать публичную product story.

Что это даст:

- меньше friction на демо;
- выше доверие со стороны партнёров;
- меньше ручных объяснений;
- сильнее first impression продукта.

## Этап 2. Self-serve onboarding and activation

Срок: 30-60 дней

Цель:

сделать запуск агентства предсказуемым и более self-serve.

Фокус:

- onboarding wizard;
- snippet / widget key / hosted setup output;
- readiness checklist;
- preview и go-live states;
- разделение setup и daily operations.

Что это даст:

- более быстрый запуск;
- меньше нагрузки на founders и ops;
- более повторяемый onboarding;
- выше conversion from agency created to agency live.

## Этап 3. Scalable product packaging and expansion

Срок: 60-90 дней

Цель:

сделать AviaFrame не только working platform, но и хорошо масштабируемым коммерческим продуктом.

Фокус:

- tiered pricing and packaging;
- аналитика для агентств;
- модульный admin;
- upsell paths;
- enterprise narrative.

Что это даст:

- более сильную monetization story;
- рост LTV;
- лучший enterprise positioning;
- больше пространства для expansion.

## 8. Какой результат мы получим

Если идти этим путём, мы переводим AviaFrame из состояния:

> технически сильный, но местами недожатый booking platform

в состояние:

> зрелая B2B launch platform для travel agencies, которая быстро запускает branded online flight sales и масштабируется по нескольким коммерческим моделям.

Ожидаемые результаты:

- быстрее time-to-live для агентств;
- выше demo-to-onboarding conversion;
- выше agency activation rate;
- выше доверие к booking flow;
- ниже потребность в ручном сопровождении;
- сильнее позиция для продаж, партнёров и инвесторов.

## 9. Почему это правильный приоритет именно сейчас

Если сначала делать только косметический дизайн, это не создаст стратегического роста.

Если же сначала:

- усилить core booking trust;
- пересобрать onboarding;
- чётко упаковать продукт;
- разделить admin по ключевым задачам,

то мы одновременно улучшим:

- конверсию;
- удержание;
- масштабируемость onboarding;
- коммерческую модель;
- восприятие зрелости платформы.

## 10. Итоговая рекомендация

Следующий этап развития AviaFrame должен быть не просто про новые features.

Он должен быть про переход к более зрелой продуктовой модели:

- понятнее рынку;
- проще в запуске;
- убедительнее в UX;
- масштабируемее как SaaS и platform business.

Ключевой целевой результат:

> сделать AviaFrame стандартным быстрым путём для агентств, которые хотят продавать авиабилеты под своим брендом без сложной собственной интеграции.
