import { prisma } from '@/lib/prisma'
import { OrderListClient } from '@/components/OrderListClient'

export const dynamic = 'force-dynamic'

export default async function OrdersPage() {
    const [orders, products] = await Promise.all([
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
        })
    ])

    // Build productId -> optionGroups map as serializable object
    const productOptionsMap: Record<number, { id: number, name: string, options: { id: number, label: string }[] }[]> = {}
    products.forEach(p => {
        productOptionsMap[p.id] = p.optionGroups
    })

    return (
        <OrderListClient
            orders={JSON.parse(JSON.stringify(orders))}
            productOptionsMap={productOptionsMap}
        />
    )
}
