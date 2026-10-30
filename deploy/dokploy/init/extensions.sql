-- DLSAuto — расширения PostgreSQL, необходимые приложению.
-- Выполняется автоматически при ПЕРВОЙ инициализации пустого тома данных
-- (docker-entrypoint-initdb.d). Идемпотентно благодаря IF NOT EXISTS.
--
-- pg_trgm  — триграммный поиск (LIKE/ILIKE по товарам в Payload).
-- unaccent — поиск без учёта диакритики.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;
