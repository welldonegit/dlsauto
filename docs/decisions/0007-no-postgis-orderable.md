# ADR 007 — Без PostGIS; порядок через Payload `orderable`

- **Статус:** прийнято (етап 2).
- **Контекст:** БД — `postgres:16-alpine` з розширеннями `pg_trgm` + `unaccent` (DEV_CONTEXT §2). Тип поля Payload `point` мапиться на PostGIS `geometry`, якого в образі немає (міграція падала `type "geometry" does not exist`). Окремо: §4 згадує `sortOrder`, а §2 — drag-and-drop через Payload `orderable`.
- **Рішення:** координати пункту видачі (`mapCoords`) зберігаємо групою `{ lat, lng }` (number), без PostGIS — важкий образ не потрібен. Порядок (brands, models, categories, products, pickup-points, banners) реалізуємо через `orderable: true` (drag-and-drop, внутрішнє поле Payload), а не окремим числовим `sortOrder` — одне джерело порядку, без дрейфу.
- **Відкинуто:** образ `postgis/postgis` заради одного поля; ручний `sortOrder` паралельно з `orderable`.
