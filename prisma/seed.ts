import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
    datasourceUrl: "file:./dev.db"
})

async function main() {
    // 1. Malzemeleri Ekle
    const fabric = await prisma.material.create({
        data: {
            name: 'Linen Fabric - Natural',
            sku: 'MAT-LINEN-001',
            type: 'FABRIC',
            quantity: 100.0, // 100 Metre
            unit: 'METER',
            unitPrice: 15.0,
            reorderLevel: 20.0
        }
    })

    const thread = await prisma.material.create({
        data: {
            name: 'Polyester Thread - White',
            sku: 'MAT-THRD-001',
            type: 'THREAD',
            quantity: 50.0, // 50 adet
            unit: 'PIECE',
            unitPrice: 2.5,
            reorderLevel: 5.0
        }
    })

    console.log('Materials created:', fabric, thread)

    // 2. Ürün Ekle (36x60 Inch Perde)
    const product = await prisma.product.create({
        data: {
            name: 'Linen Curtain 36x60',
            sku: 'PRD-LN-3660',
            description: 'Natural linen curtain, custom size possible',
            etsyId: '123456789',
        }
    })

    console.log('Product created:', product)

    // 3. Reçete Bağla
    await prisma.recipe.create({
        data: {
            productId: product.id,
            materialId: fabric.id,
            quantity: 1.6, // Metre
            wasteFactor: 1.10 // %10 fire (1.10)
        }
    })

    console.log('Recipe created')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
