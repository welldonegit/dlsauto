# keycrm integration

KeyCRM — master for stock & orders. Typed client with retries, logging and mock tests; webhooks (stock/order) and nightly reconciliation. Implemented in stage 6.

Contract (DEV_CONTEXT §6): typed client, retries, logging, idempotent sync, mock-based tests.
No direct fetch from components or pages — everything goes through this module.
