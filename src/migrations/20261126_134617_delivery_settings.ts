import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "settings_locales" ADD COLUMN "delivery_nova_poshta_note" varchar;
  ALTER TABLE "settings_locales" ADD COLUMN "delivery_delivery_note" varchar;
  ALTER TABLE "settings_locales" ADD COLUMN "delivery_tariff_note" varchar;
  ALTER TABLE "settings_locales" ADD COLUMN "delivery_pickup_note" varchar;
  ALTER TABLE "settings_locales" ADD COLUMN "delivery_payment_note" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "settings_locales" DROP COLUMN "delivery_nova_poshta_note";
  ALTER TABLE "settings_locales" DROP COLUMN "delivery_delivery_note";
  ALTER TABLE "settings_locales" DROP COLUMN "delivery_tariff_note";
  ALTER TABLE "settings_locales" DROP COLUMN "delivery_pickup_note";
  ALTER TABLE "settings_locales" DROP COLUMN "delivery_payment_note";`)
}
