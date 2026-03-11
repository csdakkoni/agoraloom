-- DropTable
DROP TABLE IF EXISTS "Recipe";

-- AlterTable: Remove dead columns from Product
ALTER TABLE "Product" DROP COLUMN IF EXISTS "color";
ALTER TABLE "Product" DROP COLUMN IF EXISTS "etsyId";
