-- Production (Postgres) schema for Homepage.heroSlides and the Gallery global.
-- Run once against the production database BEFORE deploying the code that reads them
-- (the public pages degrade to a photo-less hero / empty gallery if the tables are missing,
-- but the admin Homepage and Gallery screens will error until they exist).
-- Mirrors the tables Payload creates automatically on SQLite for local dev/CI.

CREATE TABLE IF NOT EXISTS "homepage_hero_slides" (
  "_order" integer NOT NULL,
  "_parent_id" integer NOT NULL,
  "id" varchar PRIMARY KEY NOT NULL,
  "image_id" integer NOT NULL
);

CREATE TABLE IF NOT EXISTS "gallery" (
  "id" serial PRIMARY KEY NOT NULL,
  "updated_at" timestamp(3) with time zone,
  "created_at" timestamp(3) with time zone
);

CREATE TABLE IF NOT EXISTS "gallery_photos" (
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
  ALTER TABLE "gallery_photos" ADD CONSTRAINT "gallery_photos_image_id_media_id_fk"
    FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "gallery_photos" ADD CONSTRAINT "gallery_photos_parent_id_fk"
    FOREIGN KEY ("_parent_id") REFERENCES "public"."gallery"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "homepage_hero_slides_order_idx" ON "homepage_hero_slides" ("_order");
CREATE INDEX IF NOT EXISTS "homepage_hero_slides_parent_id_idx" ON "homepage_hero_slides" ("_parent_id");
CREATE INDEX IF NOT EXISTS "homepage_hero_slides_image_idx" ON "homepage_hero_slides" ("image_id");
CREATE INDEX IF NOT EXISTS "gallery_photos_order_idx" ON "gallery_photos" ("_order");
CREATE INDEX IF NOT EXISTS "gallery_photos_parent_id_idx" ON "gallery_photos" ("_parent_id");
CREATE INDEX IF NOT EXISTS "gallery_photos_image_idx" ON "gallery_photos" ("image_id");
