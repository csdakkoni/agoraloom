import { prisma } from '@/lib/prisma'
import { OrderListClient } from '@/components/OrderListClient'

export const dynamic = 'force-dynamic'

export default async function OrdersPage() {
    const orders = await prisma.order.findMany({
        include: {
            items: {
                include: { product: { select: { color: true } } }
            }
        },
        orderBy: { orderDate: 'desc' }
    })

    return <OrderListClient orders={JSON.parse(JSON.stringify(orders))} />
}
