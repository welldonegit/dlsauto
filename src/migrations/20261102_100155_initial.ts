import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_models_body_type" AS ENUM('pickup', 'suv', 'passenger');
  CREATE TYPE "public"."enum_products_status" AS ENUM('in_stock', 'sold', 'hidden');
  CREATE TYPE "public"."enum_pickup_points_schedule_day_from" AS ENUM('1', '2', '3', '4', '5', '6', '7');
  CREATE TYPE "public"."enum_pickup_points_schedule_day_to" AS ENUM('1', '2', '3', '4', '5', '6', '7');
  CREATE TYPE "public"."enum_pages_blocks_hero_variant" AS ENUM('a', 'b');
  CREATE TYPE "public"."enum_pages_blocks_categories_block_variant" AS ENUM('a', 'b');
  CREATE TYPE "public"."enum_banners_variant" AS ENUM('dark', 'light', 'primary-tint');
  CREATE TYPE "public"."enum_banners_season" AS ENUM('any', 'halloween', 'new_year', 'easter');
  CREATE TYPE "public"."enum_orders_sync_status" AS ENUM('pending', 'synced', 'failed');
  CREATE TYPE "public"."enum_orders_delivery_type" AS ENUM('np', 'delivery', 'pickup');
  CREATE TYPE "public"."enum_leads_type" AS ENUM('callback', 'ask-about-part', 'sto');
  CREATE TYPE "public"."enum_settings_season_current" AS ENUM('none', 'halloween', 'new_year', 'easter');
  CREATE TABLE "brands" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"_order" varchar,
  	"name" varchar NOT NULL,
  	"slug" varchar,
  	"logo_mono_id" integer,
  	"logo_color_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "models" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"_order" varchar,
  	"brand_id" integer NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar,
  	"generation" varchar,
  	"year_from" numeric,
  	"year_to" numeric,
  	"body_type" "enum_models_body_type",
  	"twin_name" varchar,
  	"donor_photo_id" integer,
  	"published" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"_order" varchar,
  	"slug" varchar,
  	"photo_id" integer,
  	"published" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "categories_locales" (
  	"name" varchar NOT NULL,
  	"description" varchar,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "products_oem" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"number" varchar NOT NULL
  );
  
  CREATE TABLE "products" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"_order" varchar,
  	"sku" varchar NOT NULL,
  	"prom_id" varchar,
  	"slug" varchar,
  	"category_id" integer NOT NULL,
  	"model_id" integer,
  	"price" numeric NOT NULL,
  	"discount_percent" numeric,
  	"status" "enum_products_status" DEFAULT 'in_stock' NOT NULL,
  	"pickup_point_id" integer,
  	"sold_at" timestamp(3) with time zone,
  	"featured" boolean DEFAULT false,
  	"pinned_new" boolean DEFAULT false,
  	"seasonal_decor" boolean DEFAULT false,
  	"needs_translation" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "products_locales" (
  	"name" varchar NOT NULL,
  	"description" jsonb,
  	"condition_text" varchar,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "products_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "products_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer,
  	"models_id" integer,
  	"products_id" integer
  );
  
  CREATE TABLE "pickup_points" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"_order" varchar,
  	"phone" varchar,
  	"schedule_day_from" "enum_pickup_points_schedule_day_from" DEFAULT '1',
  	"schedule_day_to" "enum_pickup_points_schedule_day_to" DEFAULT '6',
  	"schedule_open_hour" numeric DEFAULT 9,
  	"schedule_close_hour" numeric DEFAULT 18,
  	"map_coords_lat" numeric,
  	"map_coords_lng" numeric,
  	"is_default" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "pickup_points_locales" (
  	"name" varchar NOT NULL,
  	"address" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumb_url" varchar,
  	"sizes_thumb_width" numeric,
  	"sizes_thumb_height" numeric,
  	"sizes_thumb_mime_type" varchar,
  	"sizes_thumb_filesize" numeric,
  	"sizes_thumb_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_gallery_url" varchar,
  	"sizes_gallery_width" numeric,
  	"sizes_gallery_height" numeric,
  	"sizes_gallery_mime_type" varchar,
  	"sizes_gallery_filesize" numeric,
  	"sizes_gallery_filename" varchar
  );
  
  CREATE TABLE "media_locales" (
  	"alt" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "pages_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"variant" "enum_pages_blocks_hero_variant" DEFAULT 'a',
  	"background_id" integer,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_hero_locales" (
  	"eyebrow" varchar,
  	"heading" varchar,
  	"subheading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_stats_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"accent" boolean DEFAULT false
  );
  
  CREATE TABLE "pages_blocks_stats_items_locales" (
  	"eyebrow" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_stats_locales" (
  	"heading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_categories_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"variant" "enum_pages_blocks_categories_block_variant" DEFAULT 'a',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_categories_block_locales" (
  	"heading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_models_picker" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"default_brand_id" integer,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_models_picker_locales" (
  	"heading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_new_arrivals" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"limit" numeric DEFAULT 15,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_new_arrivals_locales" (
  	"heading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_services_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"link" varchar
  );
  
  CREATE TABLE "pages_blocks_services_items_locales" (
  	"title" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_services" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_services_locales" (
  	"heading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_pickups_parts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"limit" numeric DEFAULT 15,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_pickups_parts_locales" (
  	"heading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_suvs_parts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"limit" numeric DEFAULT 15,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_suvs_parts_locales" (
  	"heading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_video_check" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"video_id" integer,
  	"poster_id" integer,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_video_check_locales" (
  	"heading" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_faq_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pages_blocks_faq_items_locales" (
  	"question" varchar,
  	"answer" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_faq_locales" (
  	"heading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_reviews_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"limit" numeric DEFAULT 8,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_reviews_block_locales" (
  	"heading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_benefits_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar
  );
  
  CREATE TABLE "pages_blocks_benefits_items_locales" (
  	"title" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_benefits" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_what_else_we_do_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer
  );
  
  CREATE TABLE "pages_blocks_what_else_we_do_cards_locales" (
  	"title" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_what_else_we_do" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"video_id" integer,
  	"video_poster_id" integer,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_what_else_we_do_locales" (
  	"heading" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_about_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_about_hero_locales" (
  	"eyebrow" varchar,
  	"heading" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_why_disassembly_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"step" varchar
  );
  
  CREATE TABLE "pages_blocks_why_disassembly_items_locales" (
  	"title" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_why_disassembly" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_why_disassembly_locales" (
  	"heading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_part_path_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer
  );
  
  CREATE TABLE "pages_blocks_part_path_steps_locales" (
  	"title" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_part_path" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_part_path_locales" (
  	"heading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_team" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_team_locales" (
  	"heading" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_cta_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"button_link" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_cta_text_locales" (
  	"heading" varchar,
  	"text" varchar,
  	"button_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_rich_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_rich_text_locales" (
  	"content" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_contacts_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"show_form" boolean DEFAULT true,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_contacts_block_locales" (
  	"heading" varchar,
  	"intro" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar,
  	"published" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "pages_locales" (
  	"title" varchar NOT NULL,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "pages_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"categories_id" integer,
  	"products_id" integer,
  	"media_id" integer
  );
  
  CREATE TABLE "banners" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"_order" varchar,
  	"link" varchar,
  	"variant" "enum_banners_variant" DEFAULT 'dark' NOT NULL,
  	"season" "enum_banners_season" DEFAULT 'any',
  	"date_from" timestamp(3) with time zone,
  	"date_to" timestamp(3) with time zone,
  	"dismissible" boolean DEFAULT true,
  	"published" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "banners_locales" (
  	"text" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "reviews" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"author" varchar NOT NULL,
  	"rating" numeric NOT NULL,
  	"text" varchar NOT NULL,
  	"product_id" integer,
  	"published" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "orders_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"product_id" integer,
  	"price" numeric
  );
  
  CREATE TABLE "orders" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"number" varchar NOT NULL,
  	"keycrm_id" varchar,
  	"status" varchar,
  	"sync_status" "enum_orders_sync_status" DEFAULT 'pending',
  	"customer_name" varchar,
  	"customer_phone" varchar,
  	"customer_email" varchar,
  	"delivery_type" "enum_orders_delivery_type",
  	"delivery_warehouse" varchar,
  	"delivery_point_id" integer,
  	"delivery_address" varchar,
  	"payment_type" varchar,
  	"payment_prepayment_amount" numeric,
  	"payment_monopay_invoice_id" varchar,
  	"payment_paid" boolean DEFAULT false,
  	"totals_subtotal" numeric,
  	"totals_total" numeric,
  	"utm_source" varchar,
  	"utm_medium" varchar,
  	"utm_campaign" varchar,
  	"utm_content" varchar,
  	"utm_term" varchar,
  	"comment" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "leads" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"type" "enum_leads_type" NOT NULL,
  	"name" varchar,
  	"phone" varchar NOT NULL,
  	"message" varchar,
  	"photo_id" integer,
  	"product_id" integer,
  	"utm_source" varchar,
  	"utm_medium" varchar,
  	"utm_campaign" varchar,
  	"utm_content" varchar,
  	"utm_term" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "settings_phones" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"number" varchar NOT NULL
  );
  
  CREATE TABLE "settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"email" varchar,
  	"messengers_telegram" varchar,
  	"messengers_viber" varchar,
  	"socials_telegram" varchar,
  	"socials_viber" varchar,
  	"socials_tiktok" varchar,
  	"socials_instagram" varchar,
  	"socials_facebook" varchar,
  	"prom_rating" numeric,
  	"prom_reviews_count" numeric,
  	"marketplaces_prom" varchar,
  	"marketplaces_avtopro" varchar,
  	"marketplaces_olx" varchar,
  	"min_order" numeric DEFAULT 500,
  	"dispatch_cutoff_hour" numeric DEFAULT 15,
  	"keycrm_base_url" varchar,
  	"fop_name" varchar,
  	"fop_edrpou" varchar,
  	"fop_address" varchar,
  	"season_current" "enum_settings_season_current" DEFAULT 'none',
  	"season_manual_override" boolean DEFAULT false,
  	"season_date_from" timestamp(3) with time zone,
  	"season_date_to" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "settings_locales" (
  	"prepayment_conditions" varchar,
  	"accept_block" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "brands_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "models_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "categories_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "products_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "pickup_points_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "media_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "pages_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "banners_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "reviews_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "orders_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "leads_id" integer;
  ALTER TABLE "brands" ADD CONSTRAINT "brands_logo_mono_id_media_id_fk" FOREIGN KEY ("logo_mono_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "brands" ADD CONSTRAINT "brands_logo_color_id_media_id_fk" FOREIGN KEY ("logo_color_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "models" ADD CONSTRAINT "models_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "models" ADD CONSTRAINT "models_donor_photo_id_media_id_fk" FOREIGN KEY ("donor_photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "categories" ADD CONSTRAINT "categories_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "categories_locales" ADD CONSTRAINT "categories_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_oem" ADD CONSTRAINT "products_oem_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products" ADD CONSTRAINT "products_model_id_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products" ADD CONSTRAINT "products_pickup_point_id_pickup_points_id_fk" FOREIGN KEY ("pickup_point_id") REFERENCES "public"."pickup_points"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products_locales" ADD CONSTRAINT "products_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_texts" ADD CONSTRAINT "products_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_models_fk" FOREIGN KEY ("models_id") REFERENCES "public"."models"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pickup_points_locales" ADD CONSTRAINT "pickup_points_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pickup_points"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "media_locales" ADD CONSTRAINT "media_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero" ADD CONSTRAINT "pages_blocks_hero_background_id_media_id_fk" FOREIGN KEY ("background_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero" ADD CONSTRAINT "pages_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero_locales" ADD CONSTRAINT "pages_blocks_hero_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_stats_items" ADD CONSTRAINT "pages_blocks_stats_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_stats"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_stats_items_locales" ADD CONSTRAINT "pages_blocks_stats_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_stats_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_stats" ADD CONSTRAINT "pages_blocks_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_stats_locales" ADD CONSTRAINT "pages_blocks_stats_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_stats"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_categories_block" ADD CONSTRAINT "pages_blocks_categories_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_categories_block_locales" ADD CONSTRAINT "pages_blocks_categories_block_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_categories_block"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_models_picker" ADD CONSTRAINT "pages_blocks_models_picker_default_brand_id_brands_id_fk" FOREIGN KEY ("default_brand_id") REFERENCES "public"."brands"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_models_picker" ADD CONSTRAINT "pages_blocks_models_picker_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_models_picker_locales" ADD CONSTRAINT "pages_blocks_models_picker_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_models_picker"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_new_arrivals" ADD CONSTRAINT "pages_blocks_new_arrivals_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_new_arrivals_locales" ADD CONSTRAINT "pages_blocks_new_arrivals_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_new_arrivals"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_services_items" ADD CONSTRAINT "pages_blocks_services_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_services_items" ADD CONSTRAINT "pages_blocks_services_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_services_items_locales" ADD CONSTRAINT "pages_blocks_services_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_services_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_services" ADD CONSTRAINT "pages_blocks_services_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_services_locales" ADD CONSTRAINT "pages_blocks_services_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_pickups_parts" ADD CONSTRAINT "pages_blocks_pickups_parts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_pickups_parts_locales" ADD CONSTRAINT "pages_blocks_pickups_parts_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_pickups_parts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_suvs_parts" ADD CONSTRAINT "pages_blocks_suvs_parts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_suvs_parts_locales" ADD CONSTRAINT "pages_blocks_suvs_parts_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_suvs_parts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_video_check" ADD CONSTRAINT "pages_blocks_video_check_video_id_media_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_video_check" ADD CONSTRAINT "pages_blocks_video_check_poster_id_media_id_fk" FOREIGN KEY ("poster_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_video_check" ADD CONSTRAINT "pages_blocks_video_check_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_video_check_locales" ADD CONSTRAINT "pages_blocks_video_check_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_video_check"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_faq_items" ADD CONSTRAINT "pages_blocks_faq_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_faq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_faq_items_locales" ADD CONSTRAINT "pages_blocks_faq_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_faq_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_faq" ADD CONSTRAINT "pages_blocks_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_faq_locales" ADD CONSTRAINT "pages_blocks_faq_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_faq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_reviews_block" ADD CONSTRAINT "pages_blocks_reviews_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_reviews_block_locales" ADD CONSTRAINT "pages_blocks_reviews_block_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_reviews_block"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_benefits_items" ADD CONSTRAINT "pages_blocks_benefits_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_benefits"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_benefits_items_locales" ADD CONSTRAINT "pages_blocks_benefits_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_benefits_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_benefits" ADD CONSTRAINT "pages_blocks_benefits_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_what_else_we_do_cards" ADD CONSTRAINT "pages_blocks_what_else_we_do_cards_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_what_else_we_do_cards" ADD CONSTRAINT "pages_blocks_what_else_we_do_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_what_else_we_do"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_what_else_we_do_cards_locales" ADD CONSTRAINT "pages_blocks_what_else_we_do_cards_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_what_else_we_do_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_what_else_we_do" ADD CONSTRAINT "pages_blocks_what_else_we_do_video_id_media_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_what_else_we_do" ADD CONSTRAINT "pages_blocks_what_else_we_do_video_poster_id_media_id_fk" FOREIGN KEY ("video_poster_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_what_else_we_do" ADD CONSTRAINT "pages_blocks_what_else_we_do_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_what_else_we_do_locales" ADD CONSTRAINT "pages_blocks_what_else_we_do_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_what_else_we_do"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_about_hero" ADD CONSTRAINT "pages_blocks_about_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_about_hero_locales" ADD CONSTRAINT "pages_blocks_about_hero_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_about_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_why_disassembly_items" ADD CONSTRAINT "pages_blocks_why_disassembly_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_why_disassembly"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_why_disassembly_items_locales" ADD CONSTRAINT "pages_blocks_why_disassembly_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_why_disassembly_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_why_disassembly" ADD CONSTRAINT "pages_blocks_why_disassembly_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_why_disassembly_locales" ADD CONSTRAINT "pages_blocks_why_disassembly_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_why_disassembly"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_part_path_steps" ADD CONSTRAINT "pages_blocks_part_path_steps_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_part_path_steps" ADD CONSTRAINT "pages_blocks_part_path_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_part_path"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_part_path_steps_locales" ADD CONSTRAINT "pages_blocks_part_path_steps_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_part_path_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_part_path" ADD CONSTRAINT "pages_blocks_part_path_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_part_path_locales" ADD CONSTRAINT "pages_blocks_part_path_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_part_path"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_team" ADD CONSTRAINT "pages_blocks_team_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_team_locales" ADD CONSTRAINT "pages_blocks_team_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_team"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_cta_text" ADD CONSTRAINT "pages_blocks_cta_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_cta_text_locales" ADD CONSTRAINT "pages_blocks_cta_text_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_cta_text"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_rich_text" ADD CONSTRAINT "pages_blocks_rich_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_rich_text_locales" ADD CONSTRAINT "pages_blocks_rich_text_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_rich_text"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_contacts_block" ADD CONSTRAINT "pages_blocks_contacts_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_contacts_block_locales" ADD CONSTRAINT "pages_blocks_contacts_block_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_contacts_block"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_locales" ADD CONSTRAINT "pages_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "banners_locales" ADD CONSTRAINT "banners_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."banners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "orders_items" ADD CONSTRAINT "orders_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "orders_items" ADD CONSTRAINT "orders_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "orders" ADD CONSTRAINT "orders_delivery_point_id_pickup_points_id_fk" FOREIGN KEY ("delivery_point_id") REFERENCES "public"."pickup_points"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "leads" ADD CONSTRAINT "leads_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "leads" ADD CONSTRAINT "leads_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "settings_phones" ADD CONSTRAINT "settings_phones_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "settings_locales" ADD CONSTRAINT "settings_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "brands__order_idx" ON "brands" USING btree ("_order");
  CREATE UNIQUE INDEX "brands_slug_idx" ON "brands" USING btree ("slug");
  CREATE INDEX "brands_logo_mono_idx" ON "brands" USING btree ("logo_mono_id");
  CREATE INDEX "brands_logo_color_idx" ON "brands" USING btree ("logo_color_id");
  CREATE INDEX "brands_updated_at_idx" ON "brands" USING btree ("updated_at");
  CREATE INDEX "brands_created_at_idx" ON "brands" USING btree ("created_at");
  CREATE INDEX "models__order_idx" ON "models" USING btree ("_order");
  CREATE INDEX "models_brand_idx" ON "models" USING btree ("brand_id");
  CREATE UNIQUE INDEX "models_slug_idx" ON "models" USING btree ("slug");
  CREATE INDEX "models_donor_photo_idx" ON "models" USING btree ("donor_photo_id");
  CREATE INDEX "models_updated_at_idx" ON "models" USING btree ("updated_at");
  CREATE INDEX "models_created_at_idx" ON "models" USING btree ("created_at");
  CREATE INDEX "categories__order_idx" ON "categories" USING btree ("_order");
  CREATE UNIQUE INDEX "categories_slug_idx" ON "categories" USING btree ("slug");
  CREATE INDEX "categories_photo_idx" ON "categories" USING btree ("photo_id");
  CREATE INDEX "categories_updated_at_idx" ON "categories" USING btree ("updated_at");
  CREATE INDEX "categories_created_at_idx" ON "categories" USING btree ("created_at");
  CREATE UNIQUE INDEX "categories_locales_locale_parent_id_unique" ON "categories_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "categories_locales_parent_id_idx" ON "categories_locales" USING btree ("_parent_id");
  CREATE INDEX "products_oem_order_idx" ON "products_oem" USING btree ("_order");
  CREATE INDEX "products_oem_parent_id_idx" ON "products_oem" USING btree ("_parent_id");
  CREATE INDEX "products__order_idx" ON "products" USING btree ("_order");
  CREATE UNIQUE INDEX "products_sku_idx" ON "products" USING btree ("sku");
  CREATE UNIQUE INDEX "products_slug_idx" ON "products" USING btree ("slug");
  CREATE INDEX "products_category_idx" ON "products" USING btree ("category_id");
  CREATE INDEX "products_model_idx" ON "products" USING btree ("model_id");
  CREATE INDEX "products_pickup_point_idx" ON "products" USING btree ("pickup_point_id");
  CREATE INDEX "products_updated_at_idx" ON "products" USING btree ("updated_at");
  CREATE INDEX "products_created_at_idx" ON "products" USING btree ("created_at");
  CREATE UNIQUE INDEX "products_locales_locale_parent_id_unique" ON "products_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "products_locales_parent_id_idx" ON "products_locales" USING btree ("_parent_id");
  CREATE INDEX "products_texts_order_parent" ON "products_texts" USING btree ("order","parent_id");
  CREATE INDEX "products_texts_text_idx" ON "products_texts" USING btree ("text");
  CREATE INDEX "products_rels_order_idx" ON "products_rels" USING btree ("order");
  CREATE INDEX "products_rels_parent_idx" ON "products_rels" USING btree ("parent_id");
  CREATE INDEX "products_rels_path_idx" ON "products_rels" USING btree ("path");
  CREATE INDEX "products_rels_media_id_idx" ON "products_rels" USING btree ("media_id");
  CREATE INDEX "products_rels_models_id_idx" ON "products_rels" USING btree ("models_id");
  CREATE INDEX "products_rels_products_id_idx" ON "products_rels" USING btree ("products_id");
  CREATE INDEX "pickup_points__order_idx" ON "pickup_points" USING btree ("_order");
  CREATE INDEX "pickup_points_updated_at_idx" ON "pickup_points" USING btree ("updated_at");
  CREATE INDEX "pickup_points_created_at_idx" ON "pickup_points" USING btree ("created_at");
  CREATE UNIQUE INDEX "pickup_points_locales_locale_parent_id_unique" ON "pickup_points_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pickup_points_locales_parent_id_idx" ON "pickup_points_locales" USING btree ("_parent_id");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumb_sizes_thumb_filename_idx" ON "media" USING btree ("sizes_thumb_filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_gallery_sizes_gallery_filename_idx" ON "media" USING btree ("sizes_gallery_filename");
  CREATE UNIQUE INDEX "media_locales_locale_parent_id_unique" ON "media_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "media_locales_parent_id_idx" ON "media_locales" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_hero_order_idx" ON "pages_blocks_hero" USING btree ("_order");
  CREATE INDEX "pages_blocks_hero_parent_id_idx" ON "pages_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_hero_path_idx" ON "pages_blocks_hero" USING btree ("_path");
  CREATE INDEX "pages_blocks_hero_background_idx" ON "pages_blocks_hero" USING btree ("background_id");
  CREATE UNIQUE INDEX "pages_blocks_hero_locales_locale_parent_id_unique" ON "pages_blocks_hero_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_hero_locales_parent_id_idx" ON "pages_blocks_hero_locales" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_stats_items_order_idx" ON "pages_blocks_stats_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_stats_items_parent_id_idx" ON "pages_blocks_stats_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "pages_blocks_stats_items_locales_locale_parent_id_unique" ON "pages_blocks_stats_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_stats_items_locales_parent_id_idx" ON "pages_blocks_stats_items_locales" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_stats_order_idx" ON "pages_blocks_stats" USING btree ("_order");
  CREATE INDEX "pages_blocks_stats_parent_id_idx" ON "pages_blocks_stats" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_stats_path_idx" ON "pages_blocks_stats" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_stats_locales_locale_parent_id_unique" ON "pages_blocks_stats_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_stats_locales_parent_id_idx" ON "pages_blocks_stats_locales" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_categories_block_order_idx" ON "pages_blocks_categories_block" USING btree ("_order");
  CREATE INDEX "pages_blocks_categories_block_parent_id_idx" ON "pages_blocks_categories_block" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_categories_block_path_idx" ON "pages_blocks_categories_block" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_categories_block_locales_locale_parent_id_uniqu" ON "pages_blocks_categories_block_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_categories_block_locales_parent_id_idx" ON "pages_blocks_categories_block_locales" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_models_picker_order_idx" ON "pages_blocks_models_picker" USING btree ("_order");
  CREATE INDEX "pages_blocks_models_picker_parent_id_idx" ON "pages_blocks_models_picker" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_models_picker_path_idx" ON "pages_blocks_models_picker" USING btree ("_path");
  CREATE INDEX "pages_blocks_models_picker_default_brand_idx" ON "pages_blocks_models_picker" USING btree ("default_brand_id");
  CREATE UNIQUE INDEX "pages_blocks_models_picker_locales_locale_parent_id_unique" ON "pages_blocks_models_picker_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_models_picker_locales_parent_id_idx" ON "pages_blocks_models_picker_locales" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_new_arrivals_order_idx" ON "pages_blocks_new_arrivals" USING btree ("_order");
  CREATE INDEX "pages_blocks_new_arrivals_parent_id_idx" ON "pages_blocks_new_arrivals" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_new_arrivals_path_idx" ON "pages_blocks_new_arrivals" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_new_arrivals_locales_locale_parent_id_unique" ON "pages_blocks_new_arrivals_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_new_arrivals_locales_parent_id_idx" ON "pages_blocks_new_arrivals_locales" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_services_items_order_idx" ON "pages_blocks_services_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_services_items_parent_id_idx" ON "pages_blocks_services_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_services_items_image_idx" ON "pages_blocks_services_items" USING btree ("image_id");
  CREATE UNIQUE INDEX "pages_blocks_services_items_locales_locale_parent_id_unique" ON "pages_blocks_services_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_services_items_locales_parent_id_idx" ON "pages_blocks_services_items_locales" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_services_order_idx" ON "pages_blocks_services" USING btree ("_order");
  CREATE INDEX "pages_blocks_services_parent_id_idx" ON "pages_blocks_services" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_services_path_idx" ON "pages_blocks_services" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_services_locales_locale_parent_id_unique" ON "pages_blocks_services_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_services_locales_parent_id_idx" ON "pages_blocks_services_locales" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_pickups_parts_order_idx" ON "pages_blocks_pickups_parts" USING btree ("_order");
  CREATE INDEX "pages_blocks_pickups_parts_parent_id_idx" ON "pages_blocks_pickups_parts" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_pickups_parts_path_idx" ON "pages_blocks_pickups_parts" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_pickups_parts_locales_locale_parent_id_unique" ON "pages_blocks_pickups_parts_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_pickups_parts_locales_parent_id_idx" ON "pages_blocks_pickups_parts_locales" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_suvs_parts_order_idx" ON "pages_blocks_suvs_parts" USING btree ("_order");
  CREATE INDEX "pages_blocks_suvs_parts_parent_id_idx" ON "pages_blocks_suvs_parts" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_suvs_parts_path_idx" ON "pages_blocks_suvs_parts" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_suvs_parts_locales_locale_parent_id_unique" ON "pages_blocks_suvs_parts_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_suvs_parts_locales_parent_id_idx" ON "pages_blocks_suvs_parts_locales" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_video_check_order_idx" ON "pages_blocks_video_check" USING btree ("_order");
  CREATE INDEX "pages_blocks_video_check_parent_id_idx" ON "pages_blocks_video_check" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_video_check_path_idx" ON "pages_blocks_video_check" USING btree ("_path");
  CREATE INDEX "pages_blocks_video_check_video_idx" ON "pages_blocks_video_check" USING btree ("video_id");
  CREATE INDEX "pages_blocks_video_check_poster_idx" ON "pages_blocks_video_check" USING btree ("poster_id");
  CREATE UNIQUE INDEX "pages_blocks_video_check_locales_locale_parent_id_unique" ON "pages_blocks_video_check_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_video_check_locales_parent_id_idx" ON "pages_blocks_video_check_locales" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_faq_items_order_idx" ON "pages_blocks_faq_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_faq_items_parent_id_idx" ON "pages_blocks_faq_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "pages_blocks_faq_items_locales_locale_parent_id_unique" ON "pages_blocks_faq_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_faq_items_locales_parent_id_idx" ON "pages_blocks_faq_items_locales" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_faq_order_idx" ON "pages_blocks_faq" USING btree ("_order");
  CREATE INDEX "pages_blocks_faq_parent_id_idx" ON "pages_blocks_faq" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_faq_path_idx" ON "pages_blocks_faq" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_faq_locales_locale_parent_id_unique" ON "pages_blocks_faq_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_faq_locales_parent_id_idx" ON "pages_blocks_faq_locales" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_reviews_block_order_idx" ON "pages_blocks_reviews_block" USING btree ("_order");
  CREATE INDEX "pages_blocks_reviews_block_parent_id_idx" ON "pages_blocks_reviews_block" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_reviews_block_path_idx" ON "pages_blocks_reviews_block" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_reviews_block_locales_locale_parent_id_unique" ON "pages_blocks_reviews_block_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_reviews_block_locales_parent_id_idx" ON "pages_blocks_reviews_block_locales" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_benefits_items_order_idx" ON "pages_blocks_benefits_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_benefits_items_parent_id_idx" ON "pages_blocks_benefits_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "pages_blocks_benefits_items_locales_locale_parent_id_unique" ON "pages_blocks_benefits_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_benefits_items_locales_parent_id_idx" ON "pages_blocks_benefits_items_locales" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_benefits_order_idx" ON "pages_blocks_benefits" USING btree ("_order");
  CREATE INDEX "pages_blocks_benefits_parent_id_idx" ON "pages_blocks_benefits" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_benefits_path_idx" ON "pages_blocks_benefits" USING btree ("_path");
  CREATE INDEX "pages_blocks_what_else_we_do_cards_order_idx" ON "pages_blocks_what_else_we_do_cards" USING btree ("_order");
  CREATE INDEX "pages_blocks_what_else_we_do_cards_parent_id_idx" ON "pages_blocks_what_else_we_do_cards" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_what_else_we_do_cards_image_idx" ON "pages_blocks_what_else_we_do_cards" USING btree ("image_id");
  CREATE UNIQUE INDEX "pages_blocks_what_else_we_do_cards_locales_locale_parent_id_" ON "pages_blocks_what_else_we_do_cards_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_what_else_we_do_cards_locales_parent_id_idx" ON "pages_blocks_what_else_we_do_cards_locales" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_what_else_we_do_order_idx" ON "pages_blocks_what_else_we_do" USING btree ("_order");
  CREATE INDEX "pages_blocks_what_else_we_do_parent_id_idx" ON "pages_blocks_what_else_we_do" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_what_else_we_do_path_idx" ON "pages_blocks_what_else_we_do" USING btree ("_path");
  CREATE INDEX "pages_blocks_what_else_we_do_video_idx" ON "pages_blocks_what_else_we_do" USING btree ("video_id");
  CREATE INDEX "pages_blocks_what_else_we_do_video_poster_idx" ON "pages_blocks_what_else_we_do" USING btree ("video_poster_id");
  CREATE UNIQUE INDEX "pages_blocks_what_else_we_do_locales_locale_parent_id_unique" ON "pages_blocks_what_else_we_do_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_what_else_we_do_locales_parent_id_idx" ON "pages_blocks_what_else_we_do_locales" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_about_hero_order_idx" ON "pages_blocks_about_hero" USING btree ("_order");
  CREATE INDEX "pages_blocks_about_hero_parent_id_idx" ON "pages_blocks_about_hero" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_about_hero_path_idx" ON "pages_blocks_about_hero" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_about_hero_locales_locale_parent_id_unique" ON "pages_blocks_about_hero_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_about_hero_locales_parent_id_idx" ON "pages_blocks_about_hero_locales" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_why_disassembly_items_order_idx" ON "pages_blocks_why_disassembly_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_why_disassembly_items_parent_id_idx" ON "pages_blocks_why_disassembly_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "pages_blocks_why_disassembly_items_locales_locale_parent_id_" ON "pages_blocks_why_disassembly_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_why_disassembly_items_locales_parent_id_idx" ON "pages_blocks_why_disassembly_items_locales" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_why_disassembly_order_idx" ON "pages_blocks_why_disassembly" USING btree ("_order");
  CREATE INDEX "pages_blocks_why_disassembly_parent_id_idx" ON "pages_blocks_why_disassembly" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_why_disassembly_path_idx" ON "pages_blocks_why_disassembly" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_why_disassembly_locales_locale_parent_id_unique" ON "pages_blocks_why_disassembly_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_why_disassembly_locales_parent_id_idx" ON "pages_blocks_why_disassembly_locales" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_part_path_steps_order_idx" ON "pages_blocks_part_path_steps" USING btree ("_order");
  CREATE INDEX "pages_blocks_part_path_steps_parent_id_idx" ON "pages_blocks_part_path_steps" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_part_path_steps_image_idx" ON "pages_blocks_part_path_steps" USING btree ("image_id");
  CREATE UNIQUE INDEX "pages_blocks_part_path_steps_locales_locale_parent_id_unique" ON "pages_blocks_part_path_steps_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_part_path_steps_locales_parent_id_idx" ON "pages_blocks_part_path_steps_locales" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_part_path_order_idx" ON "pages_blocks_part_path" USING btree ("_order");
  CREATE INDEX "pages_blocks_part_path_parent_id_idx" ON "pages_blocks_part_path" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_part_path_path_idx" ON "pages_blocks_part_path" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_part_path_locales_locale_parent_id_unique" ON "pages_blocks_part_path_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_part_path_locales_parent_id_idx" ON "pages_blocks_part_path_locales" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_team_order_idx" ON "pages_blocks_team" USING btree ("_order");
  CREATE INDEX "pages_blocks_team_parent_id_idx" ON "pages_blocks_team" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_team_path_idx" ON "pages_blocks_team" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_team_locales_locale_parent_id_unique" ON "pages_blocks_team_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_team_locales_parent_id_idx" ON "pages_blocks_team_locales" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_cta_text_order_idx" ON "pages_blocks_cta_text" USING btree ("_order");
  CREATE INDEX "pages_blocks_cta_text_parent_id_idx" ON "pages_blocks_cta_text" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_cta_text_path_idx" ON "pages_blocks_cta_text" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_cta_text_locales_locale_parent_id_unique" ON "pages_blocks_cta_text_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_cta_text_locales_parent_id_idx" ON "pages_blocks_cta_text_locales" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_rich_text_order_idx" ON "pages_blocks_rich_text" USING btree ("_order");
  CREATE INDEX "pages_blocks_rich_text_parent_id_idx" ON "pages_blocks_rich_text" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_rich_text_path_idx" ON "pages_blocks_rich_text" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_rich_text_locales_locale_parent_id_unique" ON "pages_blocks_rich_text_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_rich_text_locales_parent_id_idx" ON "pages_blocks_rich_text_locales" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_contacts_block_order_idx" ON "pages_blocks_contacts_block" USING btree ("_order");
  CREATE INDEX "pages_blocks_contacts_block_parent_id_idx" ON "pages_blocks_contacts_block" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_contacts_block_path_idx" ON "pages_blocks_contacts_block" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_contacts_block_locales_locale_parent_id_unique" ON "pages_blocks_contacts_block_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_contacts_block_locales_parent_id_idx" ON "pages_blocks_contacts_block_locales" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "pages_slug_idx" ON "pages" USING btree ("slug");
  CREATE INDEX "pages_updated_at_idx" ON "pages" USING btree ("updated_at");
  CREATE INDEX "pages_created_at_idx" ON "pages" USING btree ("created_at");
  CREATE UNIQUE INDEX "pages_locales_locale_parent_id_unique" ON "pages_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_locales_parent_id_idx" ON "pages_locales" USING btree ("_parent_id");
  CREATE INDEX "pages_rels_order_idx" ON "pages_rels" USING btree ("order");
  CREATE INDEX "pages_rels_parent_idx" ON "pages_rels" USING btree ("parent_id");
  CREATE INDEX "pages_rels_path_idx" ON "pages_rels" USING btree ("path");
  CREATE INDEX "pages_rels_categories_id_idx" ON "pages_rels" USING btree ("categories_id");
  CREATE INDEX "pages_rels_products_id_idx" ON "pages_rels" USING btree ("products_id");
  CREATE INDEX "pages_rels_media_id_idx" ON "pages_rels" USING btree ("media_id");
  CREATE INDEX "banners__order_idx" ON "banners" USING btree ("_order");
  CREATE INDEX "banners_updated_at_idx" ON "banners" USING btree ("updated_at");
  CREATE INDEX "banners_created_at_idx" ON "banners" USING btree ("created_at");
  CREATE UNIQUE INDEX "banners_locales_locale_parent_id_unique" ON "banners_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "banners_locales_parent_id_idx" ON "banners_locales" USING btree ("_parent_id");
  CREATE INDEX "reviews_product_idx" ON "reviews" USING btree ("product_id");
  CREATE INDEX "reviews_updated_at_idx" ON "reviews" USING btree ("updated_at");
  CREATE INDEX "reviews_created_at_idx" ON "reviews" USING btree ("created_at");
  CREATE INDEX "orders_items_order_idx" ON "orders_items" USING btree ("_order");
  CREATE INDEX "orders_items_parent_id_idx" ON "orders_items" USING btree ("_parent_id");
  CREATE INDEX "orders_items_product_idx" ON "orders_items" USING btree ("product_id");
  CREATE INDEX "orders_delivery_delivery_point_idx" ON "orders" USING btree ("delivery_point_id");
  CREATE INDEX "orders_updated_at_idx" ON "orders" USING btree ("updated_at");
  CREATE INDEX "orders_created_at_idx" ON "orders" USING btree ("created_at");
  CREATE INDEX "leads_photo_idx" ON "leads" USING btree ("photo_id");
  CREATE INDEX "leads_product_idx" ON "leads" USING btree ("product_id");
  CREATE INDEX "leads_updated_at_idx" ON "leads" USING btree ("updated_at");
  CREATE INDEX "leads_created_at_idx" ON "leads" USING btree ("created_at");
  CREATE INDEX "settings_phones_order_idx" ON "settings_phones" USING btree ("_order");
  CREATE INDEX "settings_phones_parent_id_idx" ON "settings_phones" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "settings_locales_locale_parent_id_unique" ON "settings_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "settings_locales_parent_id_idx" ON "settings_locales" USING btree ("_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_brands_fk" FOREIGN KEY ("brands_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_models_fk" FOREIGN KEY ("models_id") REFERENCES "public"."models"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pickup_points_fk" FOREIGN KEY ("pickup_points_id") REFERENCES "public"."pickup_points"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_banners_fk" FOREIGN KEY ("banners_id") REFERENCES "public"."banners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_reviews_fk" FOREIGN KEY ("reviews_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_orders_fk" FOREIGN KEY ("orders_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_leads_fk" FOREIGN KEY ("leads_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_brands_id_idx" ON "payload_locked_documents_rels" USING btree ("brands_id");
  CREATE INDEX "payload_locked_documents_rels_models_id_idx" ON "payload_locked_documents_rels" USING btree ("models_id");
  CREATE INDEX "payload_locked_documents_rels_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("categories_id");
  CREATE INDEX "payload_locked_documents_rels_products_id_idx" ON "payload_locked_documents_rels" USING btree ("products_id");
  CREATE INDEX "payload_locked_documents_rels_pickup_points_id_idx" ON "payload_locked_documents_rels" USING btree ("pickup_points_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("pages_id");
  CREATE INDEX "payload_locked_documents_rels_banners_id_idx" ON "payload_locked_documents_rels" USING btree ("banners_id");
  CREATE INDEX "payload_locked_documents_rels_reviews_id_idx" ON "payload_locked_documents_rels" USING btree ("reviews_id");
  CREATE INDEX "payload_locked_documents_rels_orders_id_idx" ON "payload_locked_documents_rels" USING btree ("orders_id");
  CREATE INDEX "payload_locked_documents_rels_leads_id_idx" ON "payload_locked_documents_rels" USING btree ("leads_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "brands" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "models" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "categories" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "categories_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "products_oem" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "products" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "products_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "products_texts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "products_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pickup_points" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pickup_points_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "media" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "media_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_hero" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_hero_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_stats_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_stats_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_stats" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_stats_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_categories_block" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_categories_block_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_models_picker" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_models_picker_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_new_arrivals" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_new_arrivals_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_services_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_services_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_services" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_services_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_pickups_parts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_pickups_parts_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_suvs_parts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_suvs_parts_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_video_check" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_video_check_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_faq_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_faq_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_faq" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_faq_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_reviews_block" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_reviews_block_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_benefits_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_benefits_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_benefits" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_what_else_we_do_cards" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_what_else_we_do_cards_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_what_else_we_do" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_what_else_we_do_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_about_hero" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_about_hero_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_why_disassembly_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_why_disassembly_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_why_disassembly" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_why_disassembly_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_part_path_steps" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_part_path_steps_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_part_path" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_part_path_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_team" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_team_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_cta_text" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_cta_text_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_rich_text" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_rich_text_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_contacts_block" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_contacts_block_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "banners" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "banners_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "reviews" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "orders_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "orders" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "leads" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "settings_phones" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "settings" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "settings_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "brands" CASCADE;
  DROP TABLE "models" CASCADE;
  DROP TABLE "categories" CASCADE;
  DROP TABLE "categories_locales" CASCADE;
  DROP TABLE "products_oem" CASCADE;
  DROP TABLE "products" CASCADE;
  DROP TABLE "products_locales" CASCADE;
  DROP TABLE "products_texts" CASCADE;
  DROP TABLE "products_rels" CASCADE;
  DROP TABLE "pickup_points" CASCADE;
  DROP TABLE "pickup_points_locales" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "media_locales" CASCADE;
  DROP TABLE "pages_blocks_hero" CASCADE;
  DROP TABLE "pages_blocks_hero_locales" CASCADE;
  DROP TABLE "pages_blocks_stats_items" CASCADE;
  DROP TABLE "pages_blocks_stats_items_locales" CASCADE;
  DROP TABLE "pages_blocks_stats" CASCADE;
  DROP TABLE "pages_blocks_stats_locales" CASCADE;
  DROP TABLE "pages_blocks_categories_block" CASCADE;
  DROP TABLE "pages_blocks_categories_block_locales" CASCADE;
  DROP TABLE "pages_blocks_models_picker" CASCADE;
  DROP TABLE "pages_blocks_models_picker_locales" CASCADE;
  DROP TABLE "pages_blocks_new_arrivals" CASCADE;
  DROP TABLE "pages_blocks_new_arrivals_locales" CASCADE;
  DROP TABLE "pages_blocks_services_items" CASCADE;
  DROP TABLE "pages_blocks_services_items_locales" CASCADE;
  DROP TABLE "pages_blocks_services" CASCADE;
  DROP TABLE "pages_blocks_services_locales" CASCADE;
  DROP TABLE "pages_blocks_pickups_parts" CASCADE;
  DROP TABLE "pages_blocks_pickups_parts_locales" CASCADE;
  DROP TABLE "pages_blocks_suvs_parts" CASCADE;
  DROP TABLE "pages_blocks_suvs_parts_locales" CASCADE;
  DROP TABLE "pages_blocks_video_check" CASCADE;
  DROP TABLE "pages_blocks_video_check_locales" CASCADE;
  DROP TABLE "pages_blocks_faq_items" CASCADE;
  DROP TABLE "pages_blocks_faq_items_locales" CASCADE;
  DROP TABLE "pages_blocks_faq" CASCADE;
  DROP TABLE "pages_blocks_faq_locales" CASCADE;
  DROP TABLE "pages_blocks_reviews_block" CASCADE;
  DROP TABLE "pages_blocks_reviews_block_locales" CASCADE;
  DROP TABLE "pages_blocks_benefits_items" CASCADE;
  DROP TABLE "pages_blocks_benefits_items_locales" CASCADE;
  DROP TABLE "pages_blocks_benefits" CASCADE;
  DROP TABLE "pages_blocks_what_else_we_do_cards" CASCADE;
  DROP TABLE "pages_blocks_what_else_we_do_cards_locales" CASCADE;
  DROP TABLE "pages_blocks_what_else_we_do" CASCADE;
  DROP TABLE "pages_blocks_what_else_we_do_locales" CASCADE;
  DROP TABLE "pages_blocks_about_hero" CASCADE;
  DROP TABLE "pages_blocks_about_hero_locales" CASCADE;
  DROP TABLE "pages_blocks_why_disassembly_items" CASCADE;
  DROP TABLE "pages_blocks_why_disassembly_items_locales" CASCADE;
  DROP TABLE "pages_blocks_why_disassembly" CASCADE;
  DROP TABLE "pages_blocks_why_disassembly_locales" CASCADE;
  DROP TABLE "pages_blocks_part_path_steps" CASCADE;
  DROP TABLE "pages_blocks_part_path_steps_locales" CASCADE;
  DROP TABLE "pages_blocks_part_path" CASCADE;
  DROP TABLE "pages_blocks_part_path_locales" CASCADE;
  DROP TABLE "pages_blocks_team" CASCADE;
  DROP TABLE "pages_blocks_team_locales" CASCADE;
  DROP TABLE "pages_blocks_cta_text" CASCADE;
  DROP TABLE "pages_blocks_cta_text_locales" CASCADE;
  DROP TABLE "pages_blocks_rich_text" CASCADE;
  DROP TABLE "pages_blocks_rich_text_locales" CASCADE;
  DROP TABLE "pages_blocks_contacts_block" CASCADE;
  DROP TABLE "pages_blocks_contacts_block_locales" CASCADE;
  DROP TABLE "pages" CASCADE;
  DROP TABLE "pages_locales" CASCADE;
  DROP TABLE "pages_rels" CASCADE;
  DROP TABLE "banners" CASCADE;
  DROP TABLE "banners_locales" CASCADE;
  DROP TABLE "reviews" CASCADE;
  DROP TABLE "orders_items" CASCADE;
  DROP TABLE "orders" CASCADE;
  DROP TABLE "leads" CASCADE;
  DROP TABLE "settings_phones" CASCADE;
  DROP TABLE "settings" CASCADE;
  DROP TABLE "settings_locales" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_brands_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_models_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_categories_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_products_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_pickup_points_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_media_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_pages_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_banners_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_reviews_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_orders_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_leads_fk";
  
  DROP INDEX "payload_locked_documents_rels_brands_id_idx";
  DROP INDEX "payload_locked_documents_rels_models_id_idx";
  DROP INDEX "payload_locked_documents_rels_categories_id_idx";
  DROP INDEX "payload_locked_documents_rels_products_id_idx";
  DROP INDEX "payload_locked_documents_rels_pickup_points_id_idx";
  DROP INDEX "payload_locked_documents_rels_media_id_idx";
  DROP INDEX "payload_locked_documents_rels_pages_id_idx";
  DROP INDEX "payload_locked_documents_rels_banners_id_idx";
  DROP INDEX "payload_locked_documents_rels_reviews_id_idx";
  DROP INDEX "payload_locked_documents_rels_orders_id_idx";
  DROP INDEX "payload_locked_documents_rels_leads_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "brands_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "models_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "categories_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "products_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "pickup_points_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "media_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "pages_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "banners_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "reviews_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "orders_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "leads_id";
  DROP TYPE "public"."enum_models_body_type";
  DROP TYPE "public"."enum_products_status";
  DROP TYPE "public"."enum_pickup_points_schedule_day_from";
  DROP TYPE "public"."enum_pickup_points_schedule_day_to";
  DROP TYPE "public"."enum_pages_blocks_hero_variant";
  DROP TYPE "public"."enum_pages_blocks_categories_block_variant";
  DROP TYPE "public"."enum_banners_variant";
  DROP TYPE "public"."enum_banners_season";
  DROP TYPE "public"."enum_orders_sync_status";
  DROP TYPE "public"."enum_orders_delivery_type";
  DROP TYPE "public"."enum_leads_type";
  DROP TYPE "public"."enum_settings_season_current";`)
}
