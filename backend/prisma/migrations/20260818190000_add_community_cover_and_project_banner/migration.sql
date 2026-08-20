-- Add persisted image URLs for community covers and project banners.
ALTER TABLE "public"."Project" ADD COLUMN "bannerImage" TEXT;
ALTER TABLE "public"."Community" ADD COLUMN "coverImage" TEXT;
ALTER TABLE "public"."ProjectFile" ADD COLUMN "publicId" TEXT;
ALTER TABLE "public"."ProjectFile" ADD COLUMN "provider" TEXT NOT NULL DEFAULT 'local';
