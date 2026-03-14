'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

type CreateOrderParams = {
    customerName: string
    source?: string
    shippingAddress?: string
    deadline?: string
    notes?: string
    items: {
        productId: number
        productName: string
        quantity: number
        widthInch?: number
        heightInch?: number
        fabricCode?: string
        selectedOptions?: string
    }[]
}

export async function createOrder(data: CreateOrderParams) {
    await prisma.order.create({
        data: {
            customerName: data.customerName,
            source: data.source || 'MANUAL',
            shippingAddress: data.shippingAddress,
            deadline: data.deadline ? new Date(data.deadline) : null,
            notes: data.notes,
            status: 'PENDING',
            totalAmount: 0,
            currency: 'USD',
            items: {
                create: data.items.map(item => ({
                    productId: item.productId && item.productId > 0 ? item.productId : null,
                    productName: item.productName,
                    quantity: item.quantity,
                    unitPrice: 0,
                    widthInch: item.widthInch || null,
                    heightInch: item.heightInch || null,
                    fabricCode: item.fabricCode,
                    selectedOptions: item.selectedOptions || null,
                }))
            }
        }
    })

    revalidatePath('/orders')
    revalidatePath('/')
}

const STATUS_ORDER = ['PENDING', 'CUTTING', 'COMPLETED', 'SHIPPED', 'DELIVERED'] as const

export async function updateOrderStatus(orderId: number, newStatus: string) {
    // Mevcut siparişi al
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true }
    })

    if (!order) throw new Error('Sipariş bulunamadı.')

    // COMPLETED'a geçerken stoktan düş (sadece ilk kez)
    if (newStatus === 'COMPLETED' && order.status !== 'COMPLETED') {
        await prisma.$transaction(async (tx) => {
            // Siparişin durumunu güncelle
            await tx.order.update({
                where: { id: orderId },
                data: { status: newStatus }
            })

            // Her kalem için kumaş stoktan düş
            for (const item of order.items) {
                if (!item.fabricCode) continue

                // FabricCode ile kumaşı bul (SKU veya Name ile eşle)
                const fabric = await tx.material.findFirst({
                    where: {
                        OR: [
                            { sku: item.fabricCode },
                            { name: item.fabricCode }
                        ],
                        type: 'FABRIC'
                    }
                })

                if (!fabric) continue

                // Tüketim hesabı: boy (inch → metre) × adet
                let consumedMeters = 0
                if (item.heightInch && item.heightInch > 0) {
                    consumedMeters = (item.heightInch * 0.0254) * item.quantity
                }

                if (consumedMeters > 0) {
                    // Stoktan düş
                    await tx.material.update({
                        where: { id: fabric.id },
                        data: { quantity: { decrement: consumedMeters } }
                    })

                    // Hareket kaydı
                    await tx.stockMovement.create({
                        data: {
                            materialId: fabric.id,
                            change: -consumedMeters,
                            type: 'PRODUCTION',
                            reason: `Sipariş #${orderId} - ${item.productName} (${item.quantity} adet)`
                        }
                    })
                }
            }
        })
    } else {
        // Normal durum güncellemesi
        await prisma.order.update({
            where: { id: orderId },
            data: { status: newStatus }
        })
    }

    revalidatePath('/orders')
    revalidatePath('/inventory')
    revalidatePath(`/orders/${orderId}`)
    revalidatePath('/')
}

export async function bulkUpdateOrderStatus(orderIds: number[], newStatus: string) {
    // Toplu güncelleme - her birini ayrı ayrı çağır (stok düşme için)
    for (const id of orderIds) {
        await updateOrderStatus(id, newStatus)
    }
}

type UpdateOrderFieldParams = {
    customerName?: string
    source?: string
    notes?: string | null
    deadline?: string | null
    shippingAddress?: string | null
}

export async function updateOrderField(orderId: number, data: UpdateOrderFieldParams) {
    const updateData: Record<string, unknown> = {}

    if (data.customerName !== undefined) updateData.customerName = data.customerName
    if (data.source !== undefined) updateData.source = data.source
    if (data.notes !== undefined) updateData.notes = data.notes || null
    if (data.shippingAddress !== undefined) updateData.shippingAddress = data.shippingAddress || null
    if (data.deadline !== undefined) {
        updateData.deadline = data.deadline ? new Date(data.deadline) : null
    }

    await prisma.order.update({
        where: { id: orderId },
        data: updateData
    })

    revalidatePath('/orders')
    revalidatePath(`/orders/${orderId}`)
}

export async function getOrder(orderId: number) {
    return prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true }
    })
}

export async function deleteOrder(orderId: number) {
    await prisma.$transaction(async (tx) => {
        await tx.orderItem.deleteMany({ where: { orderId } })
        await tx.order.delete({ where: { id: orderId } })
    })

    revalidatePath('/orders')
    revalidatePath('/')
}
