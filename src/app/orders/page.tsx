import { prisma } from '@/lib/prisma'
import { OrderListClient } from '@/components/OrderListClient'

export const dynamic = 'force-dynamic'

export default async function OrdersPage() {
    const [orders, products, fabrics] = await Promise.all([
        prisma.order.findMany({
            include: {
                items: true
            },
            orderBy: { orderDate: 'desc' }
        }),
        prisma.product.findMany({
            select: {
                id: true,
                optionGroups: {
                    orderBy: { sortOrder: 'asc' },
                    select: {
                        id: true,
                        name: true,
                        options: {
                            orderBy: { sortOrder: 'asc' },
                            select: { id: true, label: true }
                        }
                    }
                }
            }
        }),
        prisma.material.findMany({
            where: { type: 'FABRIC' },
            select: { name: true, sku: true, color: true }
        })
    ])

    // Create fabric color lookup: sku/name -> color
    const fabricColorMap = new Map<string, string>()
    fabrics.forEach(f => {
        if (f.sku) fabricColorMap.set(f.sku, f.color)
        fabricColorMap.set(f.name, f.color)
    })

    // Enhance order items with fabricColor
    const enhancedOrders = orders.map(order => ({
        ...order,
        items: order.items.map(item => ({
            ...item,
            fabricColor: item.fabricCode ? fabricColorMap.get(item.fabricCode) || null : null
        }))
    }))

    // Build productId -> optionGroups map as serializable object
    const productOptionsMap: Record<number, { id: number, name: string, options: { id: number, label: string }[] }[]> = {}
    products.forEach(p => {
        productOptionsMap[p.id] = p.optionGroups
    })

    return (
        <OrderListClient
            orders={JSON.parse(JSON.stringify(enhancedOrders))}
            productOptionsMap={productOptionsMap}
        />
    )
}
