'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

type CreateReturnParams = {
    orderId: number
    type: 'RETURN' | 'CANCEL'
    reason: string
    notes?: string
    addToStock?: boolean
}

export async function createReturn(data: CreateReturnParams) {
    const order = await prisma.order.findUnique({
        where: { id: data.orderId },
        include: { items: true }
    })

    if (!order) throw new Error('Sipariş bulunamadı.')

    await prisma.$transaction(async (tx) => {
        // İade/iptal kaydı oluştur
        await tx.orderReturn.create({
            data: {
                orderId: data.orderId,
                type: data.type,
                reason: data.reason,
                notes: data.notes || null,
                addedToStock: data.addToStock || false,
            }
        })

        // Sipariş durumunu güncelle
        const newStatus = data.type === 'RETURN' ? 'RETURNED' : 'CANCELLED'
        await tx.order.update({
            where: { id: data.orderId },
            data: { status: newStatus }
        })

        // Eğer stoka eklenecekse, üretimde kullanılan kumaşı geri ekle
        if (data.addToStock && (order.status === 'COMPLETED' || order.status === 'SHIPPED' || order.status === 'DELIVERED')) {
            for (const item of order.items) {
                if (!item.fabricCode) continue

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

                // Tüketimi geri ekle (boy inch → metre × adet)
                let returnedMeters = 0
                if (item.heightInch && item.heightInch > 0) {
                    returnedMeters = (item.heightInch * 0.0254) * item.quantity
                }

                if (returnedMeters > 0) {
                    await tx.material.update({
                        where: { id: fabric.id },
                        data: { quantity: { increment: returnedMeters } }
                    })

                    await tx.stockMovement.create({
                        data: {
                            materialId: fabric.id,
                            change: returnedMeters,
                            type: 'ADJUSTMENT',
                            reason: `İade - Sipariş #${data.orderId} - ${item.productName} (${item.quantity} adet)`
                        }
                    })
                }
            }
        }
    })

    revalidatePath('/orders')
    revalidatePath('/returns')
    revalidatePath('/inventory')
    revalidatePath('/')
}

export async function getReturns() {
    return prisma.orderReturn.findMany({
        include: {
            order: {
                include: { items: true }
            },
            reorder: true
        },
        orderBy: { createdAt: 'desc' }
    })
}

export async function deleteReturn(returnId: number) {
    const ret = await prisma.orderReturn.findUnique({
        where: { id: returnId },
        select: { orderId: true }
    })

    if (!ret) throw new Error('İade kaydı bulunamadı.')

    await prisma.orderReturn.delete({ where: { id: returnId } })

    revalidatePath('/returns')
    revalidatePath('/orders')
    revalidatePath('/')
}

export async function reorder(returnId: number) {
    const ret = await prisma.orderReturn.findUnique({
        where: { id: returnId },
        include: {
            order: {
                include: { items: true }
            }
        }
    })

    if (!ret) throw new Error('İade kaydı bulunamadı.')
    if (ret.reorderId) throw new Error('Bu iade için zaten yeniden sipariş oluşturulmuş.')

    const original = ret.order

    // Orijinal siparişin kopyasını oluştur
    const newOrder = await prisma.order.create({
        data: {
            customerName: original.customerName,
            source: original.source,
            shippingAddress: original.shippingAddress,
            deadline: original.deadline,
            notes: original.notes ? `[Yeniden Sipariş - Orijinal #${original.id}] ${original.notes}` : `[Yeniden Sipariş - Orijinal #${original.id}]`,
            status: 'PENDING',
            totalAmount: original.totalAmount,
            currency: original.currency,
            items: {
                create: original.items.map((item: { productId: number | null; productName: string; quantity: number; unitPrice: number; widthInch: number | null; heightInch: number | null; fabricCode: string | null; selectedOptions: string | null }) => ({
                    productId: item.productId,
                    productName: item.productName,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    widthInch: item.widthInch,
                    heightInch: item.heightInch,
                    fabricCode: item.fabricCode,
                    selectedOptions: item.selectedOptions,
                }))
            }
        }
    })

    // Return kaydına reorderId ekle
    await prisma.orderReturn.update({
        where: { id: returnId },
        data: { reorderId: newOrder.id }
    })

    revalidatePath('/returns')
    revalidatePath('/orders')
    revalidatePath('/')

    return newOrder.id
}
