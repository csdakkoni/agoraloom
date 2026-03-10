import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Calendar, DollarSign, Hash, Scissors as FabricIcon } from 'lucide-react'
import { TailorReceipt } from '@/components/TailorReceipt'
import { OrderStatusFlow } from '@/components/OrderStatusFlow'
import { DeleteOrderButton } from '@/components/DeleteOrderButton'

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const orderId = parseInt(id, 10)
    if (isNaN(orderId)) notFound()

    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true }
    })

    if (!order) notFound()

    const statusLabels: Record<string, { label: string, style: string }> = {
        PENDING: { label: 'Bekliyor', style: 'bg-amber-100 text-amber-700 border-amber-200' },
        CUTTING: { label: 'Terzide', style: 'bg-blue-100 text-blue-700 border-blue-200' },
        COMPLETED: { label: 'Tamamlandı', style: 'bg-green-100 text-green-700 border-green-200' },
        SHIPPED: { label: 'Kargoda', style: 'bg-purple-100 text-purple-700 border-purple-200' },
        DELIVERED: { label: 'Teslim Edildi', style: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    }

    const curStatus = statusLabels[order.status] || statusLabels.PENDING

    return (
        <div className="space-y-6 max-w-4xl">
            {/* Back Link */}
            <Link
                href="/orders"
                className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Siparişlere Dön
            </Link>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-bold tracking-tight">Sipariş #{order.id}</h2>
                        <span className={`px-3 py-1 text-xs font-bold rounded-full border ${curStatus.style}`}>
                            {curStatus.label}
                        </span>
                    </div>
                    <p className="text-slate-500 text-sm mt-1">
                        {new Date(order.orderDate).toLocaleDateString('tr-TR', {
                            day: 'numeric', month: 'long', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                        })}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <TailorReceipt order={order} />
                    <DeleteOrderButton orderId={order.id} />
                </div>
            </div>

            {/* Status Flow */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-semibold text-lg mb-4 text-slate-900 border-b border-slate-100 pb-2">
                    Sipariş Durumu
                </h3>
                <OrderStatusFlow orderId={order.id} currentStatus={order.status} />
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                            <User className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-semibold text-slate-400 uppercase">Müşteri</span>
                    </div>
                    <p className="font-semibold text-slate-900">{order.customerName || 'İsimsiz'}</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                            <DollarSign className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-semibold text-slate-400 uppercase">Toplam</span>
                    </div>
                    <p className="font-bold text-2xl text-slate-900">${order.totalAmount.toFixed(2)}</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                            <Hash className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-semibold text-slate-400 uppercase">Kalem Sayısı</span>
                    </div>
                    <p className="font-bold text-2xl text-slate-900">{order.items.length}</p>
                </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h3 className="font-semibold text-lg text-slate-900">Sipariş Kalemleri</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-3">#</th>
                                <th className="px-6 py-3">Ürün</th>
                                <th className="px-6 py-3">Ölçüler</th>
                                <th className="px-6 py-3">Adet</th>
                                <th className="px-6 py-3">Kumaş Kodu</th>
                                <th className="px-6 py-3 text-right">Fiyat</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {order.items.map((item, idx) => (
                                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 font-mono text-slate-400">{idx + 1}</td>
                                    <td className="px-6 py-4">
                                        <span className="font-semibold text-slate-900">{item.productName}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {item.widthInch && item.heightInch ? (
                                            <span className="font-mono text-slate-700 bg-slate-100 px-2 py-1 rounded text-xs">
                                                {item.widthInch}&quot; × {item.heightInch}&quot;
                                            </span>
                                        ) : (
                                            <span className="text-slate-400">—</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-bold text-lg text-slate-900">{item.quantity}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {item.fabricCode ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 font-mono text-xs font-bold rounded-md border border-indigo-200">
                                                <FabricIcon className="w-3 h-3" />
                                                {item.fabricCode}
                                            </span>
                                        ) : (
                                            <span className="text-slate-400">—</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono text-slate-700">
                                        ${(item.quantity * item.unitPrice).toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Notes */}
            {order.notes && (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-semibold text-lg mb-3 text-slate-900 border-b border-slate-100 pb-2">
                        Terzi Notları
                    </h3>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap bg-amber-50 p-4 rounded-lg border border-amber-100">
                        {order.notes}
                    </p>
                </div>
            )}
        </div>
    )
}
