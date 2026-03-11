'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

type CreateOrderParams = {
    customerName: string
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
    }[]
}

export async function createOrder(data: CreateOrderParams) {
    // 1. Calculate Total
    const totalAmount = 0

    // 2. Transaction for Order Creation + Stock Deduction
    await prisma.$transaction(async (tx) => {
        // A. Create Order
        const order = await tx.order.create({
            data: {
                customerName: data.customerName,
                shippingAddress: data.shippingAddress,
                deadline: data.deadline ? new Date(data.deadline) : null,
                notes: data.notes,
                status: 'PENDING',
                totalAmount,
                currency: 'USD',
                items: {
                    create: data.items.map(item => ({
                        productId: item.productId && item.productId > 0 ? item.productId : null,
                        productName: item.productName,
                        quantity: item.quantity,
                        unitPrice: 0,
                        widthInch: item.widthInch || null,
                        heightInch: item.heightInch || null,
                        fabricCode: item.fabricCode
                    }))
                }
            },
            include: { items: true }
        })

        // B. Deduct Stock for EACH Item
        for (const item of data.items) {
            if (!item.productId) continue

            const recipes = await tx.recipe.findMany({
                where: { productId: item.productId },
                include: { material: true }
            })

            for (const recipe of recipes) {
                let consumedAmount = 0

                if (recipe.calculationType === 'DYNAMIC_HEIGHT') {
                    // Rule: Height (Inch) * 0.0254 * Waste * OrderQty
                    if (item.heightInch) {
                        consumedAmount = (item.heightInch * 0.0254) * recipe.wasteFactor * item.quantity
                    }
                } else {
                    // Rule: Fixed Amount * OrderQty
                    consumedAmount = recipe.quantity * item.quantity
                }

                if (consumedAmount > 0) {
                    // Update Material Stock
                    await tx.material.update({
                        where: { id: recipe.materialId },
                        data: { quantity: { decrement: consumedAmount } }
                    })

                    // Log Movement
                    await tx.stockMovement.create({
                        data: {
                            materialId: recipe.materialId,
                            change: -consumedAmount,
                            type: 'PRODUCTION',
                            reason: `Order #${order.id} - ${item.productName}`
                        }
                    })
                }
            }
        }
    })

    revalidatePath('/orders')
    revalidatePath('/inventory')
}

const STATUS_ORDER = ['PENDING', 'CUTTING', 'COMPLETED', 'SHIPPED', 'DELIVERED'] as const

export async function updateOrderStatus(orderId: number, newStatus: string) {
    await prisma.order.update({
        where: { id: orderId },
        data: { status: newStatus }
    })

    revalidatePath('/orders')
    revalidatePath(`/orders/${orderId}`)
}

export async function bulkUpdateOrderStatus(orderIds: number[], newStatus: string) {
    await prisma.order.updateMany({
        where: { id: { in: orderIds } },
        data: { status: newStatus }
    })

    revalidatePath('/orders')
    for (const id of orderIds) {
        revalidatePath(`/orders/${id}`)
    }
}

type UpdateOrderFieldParams = {
    customerName?: string
    notes?: string | null
    deadline?: string | null
    shippingAddress?: string | null
}

export async function updateOrderField(orderId: number, data: UpdateOrderFieldParams) {
    const updateData: Record<string, unknown> = {}

    if (data.customerName !== undefined) updateData.customerName = data.customerName
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
}
