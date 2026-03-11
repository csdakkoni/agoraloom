'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createProduct(data: { name: string, sku: string, description?: string }) {
    if (!data.name || !data.sku) {
        throw new Error('Ürün adı ve kodu zorunludur.')
    }

    await prisma.product.create({
        data: {
            name: data.name,
            sku: data.sku,
            description: data.description || null,
        }
    })

    revalidatePath('/products')
}

export async function updateProductField(id: number, field: string, value: string) {
    const allowed = ['name', 'sku', 'description']
    if (!allowed.includes(field)) throw new Error('Geçersiz alan.')

    await prisma.product.update({
        where: { id },
        data: { [field]: value || null }
    })

    revalidatePath('/products')
    revalidatePath('/orders/new')
}

export async function deleteProduct(id: number) {
    await prisma.$transaction(async (tx) => {
        await tx.orderItem.updateMany({ where: { productId: id }, data: { productId: null } })
        await tx.product.delete({ where: { id } })
    })
    revalidatePath('/products')
}

export async function deleteMaterial(id: number) {
    await prisma.$transaction(async (tx) => {
        await tx.stockMovement.deleteMany({ where: { materialId: id } })
        await tx.material.delete({ where: { id } })
    })
    revalidatePath('/products')
    revalidatePath('/inventory')
}
