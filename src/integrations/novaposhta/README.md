# novaposhta integration

Nova Poshta API — cities & warehouses autocomplete; dictionaries cached in the DB and refreshed nightly. Implemented in stage 5.

Contract (DEV_CONTEXT §6): typed client, retries, logging, idempotent sync, mock-based tests.
No direct fetch from components or pages — everything goes through this module.
