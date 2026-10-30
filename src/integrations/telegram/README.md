# telegram integration

Telegram bot — order and lead notifications to the group chat, UTM in one line plus a link to the admin. Implemented in stage 6.

Contract (DEV_CONTEXT §6): typed client, retries, logging, idempotent sync, mock-based tests.
No direct fetch from components or pages — everything goes through this module.
