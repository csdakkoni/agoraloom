import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        // 1. Kumaş Ekle
        await prisma.material.create({
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

        // 2. Ürün Ekle
        await prisma.product.create({
            data: {
                name: 'Perde 36x60',
                sku: 'PRD-PERDE-3660',
                description: 'Keten perde, özel ölçü',
            }
        })

        return NextResponse.json({ success: true, message: 'Seeded successfully' })
    } catch (error) {
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
    }
}
