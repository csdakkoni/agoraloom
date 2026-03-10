const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log('Tum veriler temizleniyor...')
    await prisma.stockMovement.deleteMany()
    console.log('- Stok hareketleri silindi')
    await prisma.recipe.deleteMany()
    console.log('- Receteler silindi')
    await prisma.orderItem.deleteMany()
    console.log('- Siparis kalemleri silindi')
    await prisma.order.deleteMany()
    console.log('- Siparisler silindi')
    await prisma.product.deleteMany()
    console.log('- Urunler silindi')
    await prisma.material.deleteMany()
    console.log('- Malzemeler silindi')
    console.log('Tamamlandi! Veritabani temizlendi.')
}

main().catch(console.error).finally(() => prisma.$disconnect())
