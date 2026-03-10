import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        // 1. Malzemeleri Ekle
        const fabric = await prisma.material.create({
            data: {
                name: 'Linen Fabric - Natural',
                sku: 'MAT-LINEN-001',
                color: 'Natural',
                type: 'FABRIC',
                quantity: 100.0,
                unit: 'METER',
                unitPrice: 15.0,
                reorderLevel: 20.0
            }
        })

        const thread = await prisma.material.create({
            data: {
                name: 'Polyester Thread - White',
                sku: 'MAT-THRD-001',
                color: 'White',
                type: 'THREAD',
                quantity: 50.0,
                unit: 'PIECE',
                unitPrice: 2.5,
                reorderLevel: 5.0
            }
        })

        // 2. Ürün Ekle
        const product = await prisma.product.create({
            data: {
                name: 'Linen Curtain 36x60',
                sku: 'PRD-LN-3660',
                color: 'Natural',
                description: 'Natural linen curtain, custom size possible',
                etsyId: '123456789',
            }
        })

        // 3. Reçete Bağla
        await prisma.recipe.create({
            data: {
                productId: product.id,
                materialId: fabric.id,
                quantity: 1.6,
                wasteFactor: 1.10
            }
        })

        return NextResponse.json({ success: true, message: 'Seeded successfully' })
    } catch (error) {
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
    }
}
