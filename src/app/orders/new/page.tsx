import { prisma } from '@/lib/prisma'
import { NewOrderForm } from '@/components/NewOrderForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function NewOrderPage() {
    const products = await prisma.product.findMany({
        orderBy: { name: 'asc' },
        select: {
            id: true,
            name: true,
            sku: true,
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

    const fabrics = await prisma.material.findMany({
        where: { type: 'FABRIC' },
        orderBy: { name: 'asc' },
        select: { id: true, name: true, sku: true, color: true }
    })

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link
                    href="/orders"
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Yeni Sipariş Oluştur</h2>
                    <p className="text-slate-500 text-sm">Manuel sipariş girişi ve özel üretim talepleri.</p>
                </div>
            </div>

            <NewOrderForm products={products} fabrics={fabrics} />
        </div>
    )
}
