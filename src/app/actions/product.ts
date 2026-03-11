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
            color: '',
            description: data.description || null,
        }
    })

    revalidatePath('/products')
}

export async function deleteProduct(id: number) {
    await prisma.$transaction(async (tx) => {
        await tx.recipe.deleteMany({ where: { productId: id } })
        await tx.orderItem.updateMany({ where: { productId: id }, data: { productId: null } })
        await tx.product.delete({ where: { id } })
    })
    revalidatePath('/products')
}

export async function deleteMaterial(id: number) {
    await prisma.$transaction(async (tx) => {
        await tx.recipe.deleteMany({ where: { materialId: id } })
        await tx.stockMovement.deleteMany({ where: { materialId: id } })
        await tx.material.delete({ where: { id } })
    })
    revalidatePath('/products')
    revalidatePath('/inventory')
}

export async function updateProductRecipe(productId: number, formData: FormData) {
    // Basitlik için form verilerini JSON string olarak alıyorum, karmaşık form yapısı için daha kolay
    const recipesJson = formData.get('recipes') as string
    if (!recipesJson) return

    const recipes = JSON.parse(recipesJson) as { materialId: number, quantity: number, wasteFactor: number, calculationType: string }[]

    await prisma.$transaction(async (tx) => {
        // 1. Mevcut reçeteyi temizle
        await tx.recipe.deleteMany({
            where: { productId }
        })

        // 2. Yenilerini ekle
        if (recipes.length > 0) {
            await tx.recipe.createMany({
                data: recipes.map(r => ({
                    productId,
                    materialId: Number(r.materialId),
                    quantity: Number(r.quantity),
                    wasteFactor: Number(r.wasteFactor) || 1.0,
                    calculationType: r.calculationType || 'FIXED'
                }))
            })
        }
    })

    revalidatePath(`/products/${productId}`)
    revalidatePath('/products')
}
