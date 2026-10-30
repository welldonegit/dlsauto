# prom integration

Prom.ua — sales channel that feeds KeyCRM. Worker polls new orders every 60s and marks parts sold immediately. Implemented in stage 6.

Contract (DEV_CONTEXT §6): typed client, retries, logging, idempotent sync, mock-based tests.
No direct fetch from components or pages — everything goes through this module.
