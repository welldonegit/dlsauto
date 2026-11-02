import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "settings_locales" ADD COLUMN "channel_notes_telegram" varchar;
  ALTER TABLE "settings_locales" ADD COLUMN "channel_notes_viber" varchar;
  ALTER TABLE "settings_locales" ADD COLUMN "channel_notes_phone" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "settings_locales" DROP COLUMN "channel_notes_telegram";
  ALTER TABLE "settings_locales" DROP COLUMN "channel_notes_viber";
  ALTER TABLE "settings_locales" DROP COLUMN "channel_notes_phone";`)
}
