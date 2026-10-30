# scripts/

Maintenance scripts, run with `tsx` (see `package.json`).

| Script                                  | Command        | Status                                |
| --------------------------------------- | -------------- | ------------------------------------- |
| `seed.ts`                               | `pnpm db:seed` | empty (stage 0); real data in stage 2 |
| Prom import (YML/XLSX → Payload drafts) | —              | stage 2                               |
| Stock reconciliation (KeyCRM ↔ site)    | —              | stage 6                               |

Database backup/restore for the server lives in `deploy/backup.sh`, not here.
