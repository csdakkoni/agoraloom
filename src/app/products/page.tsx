import { prisma } from '@/lib/prisma'
import { StockCards } from '@/components/StockCards'

export default async function StockCardsPage() {
    const products = await prisma.product.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true, sku: true, description: true }
    })

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Tanımlar</h2>
                <p className="text-slate-500 text-sm">Ürünleri buradan tanımlayın. Sipariş oluştururken bunlardan seçim yapacaksınız.</p>
            </div>

            <StockCards products={products} />
        </div>
    )
}
