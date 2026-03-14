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

// --- Seçenek Grubu İşlemleri ---

export async function addOptionGroup(productId: number, name: string) {
    if (!name.trim()) throw new Error('Grup adı zorunludur.')

    const maxSort = await prisma.optionGroup.findFirst({
        where: { productId },
        orderBy: { sortOrder: 'desc' },
        select: { sortOrder: true }
    })

    await prisma.optionGroup.create({
        data: {
            productId,
            name: name.trim(),
            sortOrder: (maxSort?.sortOrder ?? -1) + 1,
        }
    })

    revalidatePath('/products')
    revalidatePath('/orders/new')
}

export async function updateOptionGroupName(groupId: number, name: string) {
    if (!name.trim()) throw new Error('Grup adı zorunludur.')

    await prisma.optionGroup.update({
        where: { id: groupId },
        data: { name: name.trim() }
    })

    revalidatePath('/products')
    revalidatePath('/orders/new')
}

export async function deleteOptionGroup(groupId: number) {
    await prisma.optionGroup.delete({ where: { id: groupId } })

    revalidatePath('/products')
    revalidatePath('/orders/new')
}

// --- Seçenek İşlemleri ---

export async function addOption(groupId: number, label: string) {
    if (!label.trim()) throw new Error('Seçenek adı zorunludur.')

    const maxSort = await prisma.option.findFirst({
        where: { groupId },
        orderBy: { sortOrder: 'desc' },
        select: { sortOrder: true }
    })

    await prisma.option.create({
        data: {
            groupId,
            label: label.trim(),
            sortOrder: (maxSort?.sortOrder ?? -1) + 1,
        }
    })

    revalidatePath('/products')
    revalidatePath('/orders/new')
}

export async function updateOptionLabel(optionId: number, label: string) {
    if (!label.trim()) throw new Error('Seçenek adı zorunludur.')

    await prisma.option.update({
        where: { id: optionId },
        data: { label: label.trim() }
    })

    revalidatePath('/products')
    revalidatePath('/orders/new')
}

export async function deleteOption(optionId: number) {
    await prisma.option.delete({ where: { id: optionId } })

    revalidatePath('/products')
    revalidatePath('/orders/new')
}

