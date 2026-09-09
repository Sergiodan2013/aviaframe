# AviaFrame — Manual Local Surfaces Follow-Up

Дата: 2026-08-07

## Зачем нужен этот документ

После автоматического cleanup и repo-wide scan остались зоны, которые нельзя безопасно править без явного owner decision.

Это не production runtime code, но это operationally sensitive local surface.

## Остаточные manual surfaces

| Surface | Почему не правлю автоматически | Что нужно сделать | Suggested owner |
|---|---|---|---|
| `portal/client/.env` | Это локальная рабочая конфигурация; автоматическая правка может сломать чей-то текущий dev flow | Удалить legacy `VITE_N8N_ORDER_*` usage и убедиться, что локальная работа идет через `VITE_USE_BACKEND_ORDERS=true` | Repo owner / active frontend dev |
| `.claude/settings.json` | Файл user-owned и содержит локальные tool/ops команды | Найти и убрать команды, которые обращаются к legacy mutating proxy напрямую | Repo owner / whoever uses local Claude/Codex workflows |
| `tmp/railway-deploy-sandbox-host-20260720/**` | Неясен ownership; может быть historical artifact, а может нужный snapshot | Решить: удалить или переместить в архив с явной маркировкой `historical / do not use` | Repo owner |

## Minimum acceptance criteria

### `portal/client/.env`

- нет reliance на `VITE_N8N_ORDER_CREATE_URL`
- нет reliance на `VITE_N8N_ORDER_ISSUE_URL`
- локальный portal create/issue/cancel идет через backend-first flow

### `.claude/settings.json`

- нет прямых примеров `curl ... /webhook/drct/order/create`
- нет operational shortcuts, которые учат legacy mutating path как нормальный

### `tmp/railway-deploy-sandbox-host-20260720/**`

- ownership подтвержден
- выбран один из двух вариантов:
  - archive with warning
  - delete

## Связанные automation/docs

- `npm run scan:legacy-drct-references`
- [34_REPO_LEGACY_REFERENCE_SCAN_AND_TMP_RISK_2026-08-07.md](34_REPO_LEGACY_REFERENCE_SCAN_AND_TMP_RISK_2026-08-07.md)
- [32_POST_FLIP_LEGACY_PROXY_CLEANUP_WAVE_2026-08-07.md](32_POST_FLIP_LEGACY_PROXY_CLEANUP_WAVE_2026-08-07.md)
