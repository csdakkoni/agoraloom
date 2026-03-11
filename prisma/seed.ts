import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    // 1. Kumaş Ekle
    const fabric = await prisma.material.create({
        data: {
            name: 'Keten Kumaş',
            sku: 'KMS-KETEN-001',
            color: 'Doğal',
            type: 'FABRIC',
            quantity: 100.0,
            unit: 'METER',
            unitPrice: 15.0,
            reorderLevel: 20.0
        }
    })

    console.log('Kumaş eklendi:', fabric)

    // 2. Ürün Ekle
    const product = await prisma.product.create({
        data: {
            name: 'Perde 36x60',
            sku: 'PRD-PERDE-3660',
            description: 'Keten perde, özel ölçü',
        }
    })

    console.log('Ürün eklendi:', product)
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
