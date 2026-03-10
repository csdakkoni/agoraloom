'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Search, Package, ChevronRight, Printer, CheckSquare, Square, RefreshCw } from 'lucide-react'
import { bulkUpdateOrderStatus } from '@/app/actions/order'

type OrderItem = {
    id: number
    productName: string
    quantity: number
    widthInch: number | null
    heightInch: number | null
    fabricCode: string | null
    unitPrice: number
    product: { color: string } | null
}

type Order = {
    id: number
    customerName: string | null
    notes: string | null
    etsyOrderId: string | null
    totalAmount: number
    currency: string
    status: string
    orderDate: Date | string
    items: OrderItem[]
}

const statusConfig: Record<string, { label: string, style: string }> = {
    PENDING: { label: 'Bekliyor', style: 'bg-amber-50 text-amber-700 border-amber-200' },
    CUTTING: { label: 'Terzide', style: 'bg-blue-50 text-blue-700 border-blue-200' },
    COMPLETED: { label: 'Tamamlandı', style: 'bg-green-50 text-green-700 border-green-200' },
    SHIPPED: { label: 'Kargoda', style: 'bg-purple-50 text-purple-700 border-purple-200' },
    DELIVERED: { label: 'Teslim Edildi', style: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
}

export function OrderListClient({ orders }: { orders: Order[] }) {
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
    const [selectMode, setSelectMode] = useState(false)
    const [updating, setUpdating] = useState(false)
    const router = useRouter()

    const toggleSelect = (id: number) => {
        setSelectedIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const toggleAll = () => {
        if (selectedIds.size === orders.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(orders.map(o => o.id)))
        }
    }

    const handleBulkPrint = () => {
        window.print()
    }

    const selectedOrders = orders.filter(o => selectedIds.has(o.id))

    const handleBulkStatus = async (newStatus: string) => {
        if (selectedIds.size === 0) return
        setUpdating(true)
        try {
            await bulkUpdateOrderStatus(Array.from(selectedIds), newStatus)
            setSelectedIds(new Set())
            setSelectMode(false)
            router.refresh()
        } catch (e) {
            console.error(e)
        } finally {
            setUpdating(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Sipariş Yönetimi</h2>
                    <p className="text-slate-500 text-sm">Gelen siparişleri ve üretim durumlarını takip edin.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => { setSelectMode(!selectMode); setSelectedIds(new Set()) }}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                            selectMode
                                ? 'bg-slate-900 text-white border-slate-900 shadow-lg'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        <CheckSquare className="w-4 h-4" />
                        {selectMode ? 'Seçim  Aktif' : 'Toplu İşlem'}
                    </button>
                    <Link
                        href="/orders/new"
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/20 text-sm font-medium"
                    >
                        <Plus className="w-4 h-4" />
                        Yeni Sipariş
                    </Link>
                </div>
            </div>

            {/* Selection toolbar */}
            {selectMode && (
                <div className="flex items-center gap-4 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg">
                    <button
                        onClick={toggleAll}
                        className="inline-flex items-center gap-2 text-sm font-medium hover:text-amber-400 transition-colors"
                    >
                        {selectedIds.size === orders.length ? (
                            <CheckSquare className="w-4 h-4" />
                        ) : (
                            <Square className="w-4 h-4" />
                        )}
                        {selectedIds.size === orders.length ? 'Tümünü Kaldır' : 'Tümünü Seç'}
                    </button>
                    <span className="text-sm text-slate-400">
                        {selectedIds.size} sipariş seçili
                    </span>
                    <div className="flex-1" />

                    {/* Status update buttons */}
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-400 mr-1">Durumu:</span>
                        {Object.entries(statusConfig).map(([key, cfg]) => (
                            <button
                                key={key}
                                onClick={() => handleBulkStatus(key)}
                                disabled={selectedIds.size === 0 || updating}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${cfg.style} hover:scale-105`}
                            >
                                {updating ? <RefreshCw className="w-3 h-3 animate-spin" /> : cfg.label}
                            </button>
                        ))}
                    </div>

                    <div className="w-px h-6 bg-slate-700" />

                    <button
                        onClick={handleBulkPrint}
                        disabled={selectedIds.size === 0}
                        className="inline-flex items-center gap-2 px-5 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm font-bold shadow-md"
                    >
                        <Printer className="w-4 h-4" />
                        Yazdır ({selectedIds.size})
                    </button>
                </div>
            )}

            {/* Filters */}
            <div className="flex gap-3 items-center bg-white p-2 rounded-lg border border-slate-200 shadow-sm w-fit no-print">
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
                        const isSelected = selectedIds.has(order.id)

                        return (
                            <div key={order.id} className="flex items-center">
                                {/* Checkbox */}
                                {selectMode && (
                                    <button
                                        onClick={(e) => { e.preventDefault(); toggleSelect(order.id) }}
                                        className="pl-4 pr-1 py-4 flex-shrink-0"
                                    >
                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                            isSelected
                                                ? 'bg-amber-500 border-amber-500 text-white'
                                                : 'border-slate-300 hover:border-amber-400'
                                        }`}>
                                            {isSelected && (
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>
                                    </button>
                                )}

                                {/* Order card - clickable link */}
                                <Link
                                    href={`/orders/${order.id}`}
                                    className="flex-1 block p-4 hover:bg-slate-50/50 transition-colors cursor-pointer"
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
                                                            {item.product?.color && <span className="text-slate-400"> ({item.product.color})</span>}
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
                            </div>
                        )
                    })}
                    {orders.length === 0 && (
                        <div className="p-12 text-center text-slate-500">
                            Henüz sipariş bulunmuyor.
                        </div>
                    )}
                </div>
            </div>

            {/* BULK PRINT AREA — hidden on screen, shown when printing */}
            {selectedOrders.length > 0 && (
                <div className="hidden" data-bulk-receipts>
                    {selectedOrders.map((order) => {
                        const orderDate = new Date(order.orderDate)
                        return (
                            <div
                                key={order.id}
                                className="font-mono text-sm"
                                style={{ width: '80mm', padding: '4mm', margin: '0 auto', pageBreakAfter: 'always' }}
                            >
                                {/* Header */}
                                <div className="text-center border-b-2 border-dashed border-black pb-3 mb-3">
                                    <div className="text-lg font-extrabold tracking-wide">AgoraLoom</div>
                                    <div className="text-xs mt-0.5 font-semibold">TERZİ İŞ EMRİ</div>
                                </div>

                                {/* Order Info */}
                                <div className="border-b border-dashed border-black pb-2 mb-3 text-xs">
                                    <div className="flex justify-between">
                                        <span className="font-bold">Sipariş No:</span>
                                        <span>#{order.id}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-bold">Tarih:</span>
                                        <span>{orderDate.toLocaleDateString('tr-TR')}</span>
                                    </div>
                                    {order.customerName && (
                                        <div className="flex justify-between">
                                            <span className="font-bold">Müşteri:</span>
                                            <span>{order.customerName}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Items */}
                                <div className="mb-3">
                                    <div className="text-xs font-bold text-center border-b border-black pb-1 mb-2">
                                        ÜRÜN DETAYLARI
                                    </div>
                                    {order.items.map((item, idx) => (
                                        <div key={item.id} className="mb-3 pb-2 border-b border-dotted border-gray-400 last:border-b-0">
                                            <div className="font-bold text-sm">
                                                {idx + 1}. {item.productName}
                                                {item.product?.color && ` (${item.product.color})`}
                                            </div>
                                            <div className="grid grid-cols-2 gap-0 text-xs mt-1 ml-3">
                                                <div>
                                                    <span className="text-gray-600">Adet: </span>
                                                    <span className="font-bold text-base">{item.quantity}</span>
                                                </div>
                                                {item.fabricCode && (
                                                    <div>
                                                        <span className="text-gray-600">Kumaş: </span>
                                                        <span className="font-bold">{item.fabricCode}</span>
                                                    </div>
                                                )}
                                            </div>
                                            {(item.widthInch || item.heightInch) && (
                                                <div className="text-xs mt-1 ml-3">
                                                    <span className="text-gray-600">Ölçü: </span>
                                                    <span className="font-bold text-base">
                                                        {item.widthInch}&quot; x {item.heightInch}&quot;
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Notes */}
                                {order.notes && (
                                    <div className="border-t border-dashed border-black pt-2 mb-3">
                                        <div className="text-xs font-bold mb-1">NOTLAR:</div>
                                        <div className="text-xs whitespace-pre-wrap">{order.notes}</div>
                                    </div>
                                )}

                                {/* Footer */}
                                <div className="text-center border-t-2 border-dashed border-black pt-3 mt-3">
                                    <div className="text-xs text-gray-500">
                                        {orderDate.toLocaleDateString('tr-TR')} {orderDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <div className="text-xs mt-1 text-gray-400">- - - ✂ - - -</div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
