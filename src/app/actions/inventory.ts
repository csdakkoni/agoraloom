'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createMaterial(formData: FormData) {
    const name = formData.get('name') as string
    const sku = (formData.get('sku') as string)?.trim() || null
    const color = formData.get('color') as string
    const type = formData.get('type') as string || 'FABRIC'
    const quantity = parseFloat(formData.get('quantity') as string) || 0
    const unit = formData.get('unit') as string || 'METER'
    const unitPrice = parseFloat(formData.get('unitPrice') as string) || 0
    const reorderLevelRaw = parseFloat(formData.get('reorderLevel') as string)
    const reorderLevel = isNaN(reorderLevelRaw) ? null : reorderLevelRaw

    if (!name || !color) {
        throw new Error('Malzeme adı ve rengi zorunludur.')
    }

    await prisma.material.create({
        data: {
            name,
            sku,
            color,
            type,
            quantity,
            unit,
            unitPrice,
            reorderLevel,
            lastStockCheck: new Date()
        }
    })

    revalidatePath('/inventory')
}

