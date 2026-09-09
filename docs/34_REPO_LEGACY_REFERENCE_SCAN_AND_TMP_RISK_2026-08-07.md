# AviaFrame — Repo Legacy Reference Scan and TMP Risk

Дата: 2026-08-07

## Что было проверено

Добавлен scan command:

```bash
npm run scan:legacy-drct-references
```

Он проходит по репозиторию и группирует оставшиеся упоминания legacy mutating proxy по классам:

- docs
- scripts
- tests
- runtime-or-source
- tmp-snapshot

## Главный вывод

Наиболее неприятный остаточный риск сейчас не в основном runtime, а в `tmp` snapshots.

Подтверждено, что в репозитории есть старые копии, где legacy mutating paths все еще выглядят как живой рабочий путь, например:

- `tmp/railway-deploy-sandbox-host-20260720/widget/demo/booking.html`
- `tmp/railway-deploy-sandbox-host-20260720/backend/N8N_SETUP_GUIDE.md`
- `tmp/railway-deploy-sandbox-host-20260720/backend/N8N_INTEGRATION.md`
- `tmp/railway-deploy-sandbox-host-20260720/backend/n8n_workflows/README.md`

## Почему это важно

Такие `tmp` артефакты не участвуют в production runtime напрямую, но создают operational risk:

- из них могут копировать старые snippets;
- их можно ошибочно принять за актуальный source of truth;
- они мешают audit clarity;
- они повышают шанс случайного возврата к legacy path во время срочных правок.

## Как интерпретировать remaining references

### Допустимо сейчас

Нормальны и ожидаемы:

- docs с явной `DEPRECATED` маркировкой;
- тесты, которые проверяют guard/block behavior;
- inventory/check scripts, которые специально ищут legacy paths.

### Требует cleanup после cutover

Потребуют отдельной cleanup wave:

- `backend/src/services/n8nClient.js`
- `backend/src/services/drctService.js`
- `portal/client/scripts/write-redirects.js`
- `backend/scripts/test_n8n.js`
- связанные service tests/examples

### Требует отдельного решения

`tmp/railway-deploy-sandbox-host-20260720/**`

Это не тот случай, который надо "просто игнорировать".

Нужно явно решить одно из двух:

1. удалить snapshot целиком, если он больше не нужен;
2. переместить его в явный архив/forensics контур с понятной маркировкой `historical / do not use`.

### Требует manual follow-up, но не автоматическое редактирование

Подтверждены также references в:

- `portal/client/.env`
- `.claude/settings.json`

Я не правлю их автоматически, потому что это user-owned/local-operational surface.

Что уже можно и нужно править в репо:

- `portal/client/.env.example` как source-of-truth example

Что нужно проверить вручную:

- не используют ли локальные dev scripts старые `VITE_N8N_ORDER_*` переменные;
- не осталось ли в локальных agent/tool settings команд, которые дергают legacy mutating proxy напрямую.

## Рекомендация

После завершения текущей Sprint 0 волны:

1. подтвердить владельца `tmp/railway-deploy-sandbox-host-20260720`
2. решить, нужен ли snapshot вообще
3. если нужен:
   - переместить в архивный контур
   - добавить warning marker
4. если не нужен:
   - удалить в отдельном cleanup PR

## Почему я не удаляю это прямо сейчас

Потому что это уже может быть user-owned artifact, а не просто случайный мусор.

Без подтверждения ownership безопаснее сначала зафиксировать риск и вынести в controlled cleanup decision.
