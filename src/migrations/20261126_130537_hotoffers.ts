import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "pages_blocks_hot_offers_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"link" varchar
  );
  
  CREATE TABLE "pages_blocks_hot_offers_items_locales" (
  	"title" varchar,
  	"subtitle" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_hot_offers" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_hot_offers_locales" (
  	"heading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  ALTER TABLE "pages_blocks_hot_offers_items" ADD CONSTRAINT "pages_blocks_hot_offers_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_hot_offers_items" ADD CONSTRAINT "pages_blocks_hot_offers_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_hot_offers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_hot_offers_items_locales" ADD CONSTRAINT "pages_blocks_hot_offers_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_hot_offers_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_hot_offers" ADD CONSTRAINT "pages_blocks_hot_offers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_hot_offers_locales" ADD CONSTRAINT "pages_blocks_hot_offers_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_hot_offers"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_hot_offers_items_order_idx" ON "pages_blocks_hot_offers_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_hot_offers_items_parent_id_idx" ON "pages_blocks_hot_offers_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_hot_offers_items_image_idx" ON "pages_blocks_hot_offers_items" USING btree ("image_id");
  CREATE UNIQUE INDEX "pages_blocks_hot_offers_items_locales_locale_parent_id_uniqu" ON "pages_blocks_hot_offers_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_hot_offers_items_locales_parent_id_idx" ON "pages_blocks_hot_offers_items_locales" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_hot_offers_order_idx" ON "pages_blocks_hot_offers" USING btree ("_order");
  CREATE INDEX "pages_blocks_hot_offers_parent_id_idx" ON "pages_blocks_hot_offers" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_hot_offers_path_idx" ON "pages_blocks_hot_offers" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_hot_offers_locales_locale_parent_id_unique" ON "pages_blocks_hot_offers_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_hot_offers_locales_parent_id_idx" ON "pages_blocks_hot_offers_locales" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_hot_offers_items" CASCADE;
  DROP TABLE "pages_blocks_hot_offers_items_locales" CASCADE;
  DROP TABLE "pages_blocks_hot_offers" CASCADE;
  DROP TABLE "pages_blocks_hot_offers_locales" CASCADE;`)
}
