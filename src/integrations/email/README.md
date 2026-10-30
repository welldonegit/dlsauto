# email integration

Transactional email to the buyer — order confirmation and status changes. Provider (Resend or SMTP) decided in stage 5.

Contract (DEV_CONTEXT §6): typed client, retries, logging, idempotent sync, mock-based tests.
No direct fetch from components or pages — everything goes through this module.
