import { prisma } from '@/lib/prisma'
import { Plus, Search, Package, ChevronRight } from 'lucide-react'
import Link from 'next/link'

const statusConfig: Record<string, { label: string, style: string }> = {
    PENDING: { label: 'Bekliyor', style: 'bg-amber-50 text-amber-700 border-amber-200' },
    CUTTING: { label: 'Terzide', style: 'bg-blue-50 text-blue-700 border-blue-200' },
    COMPLETED: { label: 'Tamamlandı', style: 'bg-green-50 text-green-700 border-green-200' },
    SHIPPED: { label: 'Kargoda', style: 'bg-purple-50 text-purple-700 border-purple-200' },
    DELIVERED: { label: 'Teslim Edildi', style: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
}

export default async function OrdersPage() {
    const orders = await prisma.order.findMany({
        include: {
            items: true
        },
        orderBy: { orderDate: 'desc' }
    })

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Sipariş Yönetimi</h2>
                    <p className="text-slate-500 text-sm">Gelen siparişleri ve üretim durumlarını takip edin.</p>
                </div>
                <Link
                    href="/orders/new"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/20 text-sm font-medium"
                >
                    <Plus className="w-4 h-4" />
                    Yeni Sipariş (Manuel)
                </Link>
            </div>

            {/* Filters */}
            <div className="flex gap-3 items-center bg-white p-2 rounded-lg border border-slate-200 shadow-sm w-fit">
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Sipariş No, Müşteri..."
                        className="pl-9 pr-4 py-1.5 text-sm outline-none bg-transparent w-64"
                    />
                </div>
            </div>

            {/* Order List */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="divide-y divide-slate-100">
                    {orders.map((order) => {
                        const status = statusConfig[order.status] || statusConfig.PENDING
                        return (
                            <Link
                                key={order.id}
                                href={`/orders/${order.id}`}
                                className="block p-4 hover:bg-slate-50/50 transition-colors cursor-pointer"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    {/* Left: Icon & Info */}
                                    <div className="flex gap-4">
                                        <div className="mt-1 p-2 bg-slate-100 rounded-lg text-slate-500">
                                            <Package className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold text-slate-900">#{order.id}</span>
                                                {order.etsyOrderId && (
                                                    <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-bold rounded-full border border-orange-200 uppercase">
                                                        ETSY
                                                    </span>
                                                )}
                                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border uppercase ${status.style}`}>
                                                    {status.label}
                                                </span>
                                            </div>
                                            <h3 className="text-sm font-medium text-slate-900">{order.customerName || 'İsimsiz Müşteri'}</h3>
                                            <p className="text-xs text-slate-500 mt-1">
                                                {new Date(order.orderDate).toLocaleDateString('tr-TR')} • Toplam: <span className="font-mono text-slate-700">${order.totalAmount.toFixed(2)}</span>
                                            </p>
                                        </div>
                                    </div>

                                    {/* Right: Items Preview */}
                                    <div className="flex-1 max-w-md hidden md:block">
                                        <p className="text-xs font-semibold text-slate-400 mb-2 uppercase">Sipariş İçeriği</p>
                                        <div className="space-y-1">
                                            {order.items.map((item) => (
                                                <div key={item.id} className="flex justify-between text-sm">
                                                    <span className="text-slate-700 truncate mr-2">
                                                        {item.quantity}x {item.productName}
                                                    </span>
                                                    {(item.widthInch && item.heightInch) && (
                                                        <span className="text-slate-400 text-xs font-mono whitespace-nowrap">
                                                            {item.widthInch}&quot; x {item.heightInch}&quot;
                                                        </span>
                                                    )}
                                                    {item.fabricCode && (
                                                        <span className="text-indigo-600 text-xs font-mono ml-2">{item.fabricCode}</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Arrow */}
                                    <div className="self-center">
                                        <ChevronRight className="w-5 h-5 text-slate-300" />
                                    </div>
                                </div>
                            </Link>
                        )
                    })}
                    {orders.length === 0 && (
                        <div className="p-12 text-center text-slate-500">
                            Henüz sipariş bulunmuyor.
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
