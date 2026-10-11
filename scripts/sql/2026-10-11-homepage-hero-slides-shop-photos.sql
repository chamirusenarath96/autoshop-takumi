-- Production (Postgres) schema for Homepage.heroSlides and Homepage.shopPhotos.
-- Run once against the production database BEFORE deploying the code that reads them
-- (the landing page degrades to a photo-less hero if the tables are missing, but the
-- admin Homepage screen will error until they exist).
-- Mirrors the tables Payload creates automatically on SQLite for local dev/CI.

CREATE TABLE IF NOT EXISTS "homepage_hero_slides" (
  "_order" integer NOT NULL,
  "_parent_id" integer NOT NULL,
  "id" varchar PRIMARY KEY NOT NULL,
  "image_id" integer NOT NULL
);

CREATE TABLE IF NOT EXISTS "homepage_shop_photos" (
  "_order" integer NOT NULL,
  "_parent_id" integer NOT NULL,
  "id" varchar PRIMARY KEY NOT NULL,
  "image_id" integer NOT NULL
);

DO $$ BEGIN
  ALTER TABLE "homepage_hero_slides" ADD CONSTRAINT "homepage_hero_slides_image_id_media_id_fk"
    FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "homepage_hero_slides" ADD CONSTRAINT "homepage_hero_slides_parent_id_fk"
    FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "homepage_shop_photos" ADD CONSTRAINT "homepage_shop_photos_image_id_media_id_fk"
    FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "homepage_shop_photos" ADD CONSTRAINT "homepage_shop_photos_parent_id_fk"
    FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "homepage_hero_slides_order_idx" ON "homepage_hero_slides" ("_order");
CREATE INDEX IF NOT EXISTS "homepage_hero_slides_parent_id_idx" ON "homepage_hero_slides" ("_parent_id");
CREATE INDEX IF NOT EXISTS "homepage_hero_slides_image_idx" ON "homepage_hero_slides" ("image_id");
CREATE INDEX IF NOT EXISTS "homepage_shop_photos_order_idx" ON "homepage_shop_photos" ("_order");
CREATE INDEX IF NOT EXISTS "homepage_shop_photos_parent_id_idx" ON "homepage_shop_photos" ("_parent_id");
CREATE INDEX IF NOT EXISTS "homepage_shop_photos_image_idx" ON "homepage_shop_photos" ("image_id");
