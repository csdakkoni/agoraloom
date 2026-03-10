-- AlterTable: Add color column with default for existing rows
ALTER TABLE "Material" ADD COLUMN "color" TEXT NOT NULL DEFAULT 'Belirtilmemiş';

-- AlterTable: Add color column with default for existing rows
ALTER TABLE "Product" ADD COLUMN "color" TEXT NOT NULL DEFAULT 'Belirtilmemiş';
