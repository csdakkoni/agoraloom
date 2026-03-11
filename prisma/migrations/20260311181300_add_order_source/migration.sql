-- AlterTable
ALTER TABLE "Order" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'MANUAL';

-- Update existing orders: mark ones with etsyOrderId as ETSY
UPDATE "Order" SET "source" = 'ETSY' WHERE "etsyOrderId" IS NOT NULL;
