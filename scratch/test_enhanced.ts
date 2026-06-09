import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
    const [orders, fabrics] = await Promise.all([
        prisma.order.findMany({
            include: {
                items: true
            },
            orderBy: { orderDate: 'desc' }
        }),
        prisma.material.findMany({
            where: { type: 'FABRIC' },
            select: { name: true, sku: true, color: true }
        })
    ])

    const fabricColorMap = new Map<string, string>()
    fabrics.forEach(f => {
        if (f.sku) fabricColorMap.set(f.sku.trim(), f.color.trim())
        fabricColorMap.set(f.name.trim(), f.color.trim())
    })

    const enhancedOrders = orders.map(order => ({
        id: order.id,
        items: order.items.map(item => ({
            id: item.id,
            fabricCode: item.fabricCode,
            fabricColor: item.fabricCode ? fabricColorMap.get(item.fabricCode.trim()) || null : null
        }))
    }))

    console.log('ENHANCED ORDERS (first 5):', JSON.stringify(enhancedOrders.slice(0, 5), null, 2))
    process.exit(0)
}
main()
