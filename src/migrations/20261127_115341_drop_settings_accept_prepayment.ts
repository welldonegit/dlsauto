import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "settings_locales" DROP COLUMN "prepayment_conditions";
  ALTER TABLE "settings_locales" DROP COLUMN "accept_block";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "settings_locales" ADD COLUMN "prepayment_conditions" varchar;
  ALTER TABLE "settings_locales" ADD COLUMN "accept_block" varchar;`)
}
