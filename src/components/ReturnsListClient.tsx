'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RotateCcw, Package, Trash2, RefreshCw, Search, Filter, AlertTriangle, XCircle, Clock, HelpCircle, Wrench } from 'lucide-react'
import { deleteReturn, reorder } from '@/app/actions/returns'

type OrderItem = {
    id: number
    productName: string
    quantity: number
    widthInch: number | null
    heightInch: number | null
    fabricCode: string | null
    selectedOptions: string | null
}

type ReturnRecord = {
    id: number
    orderId: number
    type: string
    reason: string
    notes: string | null
    addedToStock: boolean
    reorderId: number | null
    createdAt: string
    order: {
        id: number
        customerName: string | null
        status: string
        orderDate: string
        items: OrderItem[]
    }
    reorder: {
        id: number
        status: string
    } | null
}

const typeConfig: Record<string, { label: string, icon: React.ReactNode, style: string }> = {
    RETURN: { label: 'İade', icon: <RotateCcw className="w-3.5 h-3.5" />, style: 'bg-orange-50 text-orange-700 border-orange-200' },
    CANCEL: { label: 'İptal', icon: <XCircle className="w-3.5 h-3.5" />, style: 'bg-red-50 text-red-700 border-red-200' },
}

const reasonConfig: Record<string, { label: string, icon: React.ReactNode }> = {
    WRONG_PRODUCT: { label: 'Yanlış Ürün', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
    LATE_DELIVERY: { label: 'Gecikme', icon: <Clock className="w-3.5 h-3.5" /> },
    CUSTOMER_CHANGED_MIND: { label: 'Müşteri Vazgeçti', icon: <HelpCircle className="w-3.5 h-3.5" /> },
    DEFECTIVE: { label: 'Kusurlu Ürün', icon: <Wrench className="w-3.5 h-3.5" /> },
    OTHER: { label: 'Diğer', icon: <HelpCircle className="w-3.5 h-3.5" /> },
}

export function ReturnsListClient({ returns }: { returns: ReturnRecord[] }) {
    const router = useRouter()
    const [search, setSearch] = useState('')
    const [typeFilter, setTypeFilter] = useState<string>('ALL')
    const [reasonFilter, setReasonFilter] = useState<string>('ALL')
    const [loading, setLoading] = useState<number | null>(null)

    const filtered = returns.filter(r => {
        if (typeFilter !== 'ALL' && r.type !== typeFilter) return false
        if (reasonFilter !== 'ALL' && r.reason !== reasonFilter) return false
        if (search) {
            const q = search.toLowerCase()
            const matchCustomer = r.order.customerName?.toLowerCase().includes(q)
            const matchId = r.order.id.toString().includes(q)
            const matchProducts = r.order.items.some(i => i.productName.toLowerCase().includes(q))
            if (!matchCustomer && !matchId && !matchProducts) return false
        }
        return true
    })

    const handleReorder = async (returnId: number) => {
        if (!confirm('Bu siparişin kopyası oluşturulacak. Onaylıyor musunuz?')) return
        setLoading(returnId)
        try {
            const newOrderId = await reorder(returnId)
            router.refresh()
            alert(`Yeni sipariş #${newOrderId} oluşturuldu!`)
        } catch (err) {
            alert('Hata: ' + (err instanceof Error ? err.message : 'Bilinmeyen hata'))
        } finally {
            setLoading(null)
        }
    }

    const handleDelete = async (returnId: number) => {
        if (!confirm('Bu iade kaydı silinecek. Onaylıyor musunuz?')) return
        setLoading(returnId)
        try {
            await deleteReturn(returnId)
            router.refresh()
        } catch (err) {
            alert('Hata: ' + (err instanceof Error ? err.message : 'Bilinmeyen hata'))
        } finally {
            setLoading(null)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">İadeler & İptaller</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Toplam {returns.length} kayıt
                        {filtered.length !== returns.length && ` · ${filtered.length} sonuç gösteriliyor`}
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Müşteri, sipariş no veya ürün ara..."
                            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-colors"
                        />
                    </div>

                    {/* Type Filter */}
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-colors"
                        >
                            <option value="ALL">Tümü</option>
                            <option value="RETURN">İadeler</option>
                            <option value="CANCEL">İptaller</option>
                        </select>
                    </div>

                    {/* Reason Filter */}
                    <div className="relative">
                        <select
                            value={reasonFilter}
                            onChange={(e) => setReasonFilter(e.target.value)}
                            className="pl-4 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-colors"
                        >
                            <option value="ALL">Tüm Sebepler</option>
                            {Object.entries(reasonConfig).map(([key, val]) => (
                                <option key={key} value={key}>{val.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Table */}
            {filtered.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
                    <RotateCcw className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-600 mb-1">İade/İptal Kaydı Yok</h3>
                    <p className="text-sm text-slate-400">Henüz iade veya iptal kaydı bulunmuyor.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                                <tr>
                                    <th className="px-5 py-3">Sipariş</th>
                                    <th className="px-5 py-3">Müşteri</th>
                                    <th className="px-5 py-3">Ürünler</th>
                                    <th className="px-5 py-3">Tür</th>
                                    <th className="px-5 py-3">Sebep</th>
                                    <th className="px-5 py-3">Stok</th>
                                    <th className="px-5 py-3">Tarih</th>
                                    <th className="px-5 py-3">Yeniden Sipariş</th>
                                    <th className="px-5 py-3">İşlem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.map(ret => {
                                    const typeInfo = typeConfig[ret.type] || typeConfig.RETURN
                                    const reasonInfo = reasonConfig[ret.reason] || reasonConfig.OTHER

                                    return (
                                        <tr key={ret.id} className="hover:bg-slate-50/50 transition-colors">
                                            {/* Sipariş No */}
                                            <td className="px-5 py-4">
                                                <button
                                                    onClick={() => router.push(`/orders/${ret.orderId}`)}
                                                    className="font-mono font-bold text-amber-600 hover:text-amber-800 hover:underline transition-colors"
                                                >
                                                    #{ret.orderId}
                                                </button>
                                            </td>

                                            {/* Müşteri */}
                                            <td className="px-5 py-4">
                                                <span className="font-medium text-slate-900">
                                                    {ret.order.customerName || 'İsimsiz'}
                                                </span>
                                            </td>

                                            {/* Ürünler */}
                                            <td className="px-5 py-4">
                                                <div className="flex flex-col gap-1">
                                                    {ret.order.items.slice(0, 2).map(item => (
                                                        <span key={item.id} className="text-xs text-slate-600">
                                                            {item.quantity}× {item.productName}
                                                        </span>
                                                    ))}
                                                    {ret.order.items.length > 2 && (
                                                        <span className="text-xs text-slate-400">
                                                            +{ret.order.items.length - 2} daha
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Tür */}
                                            <td className="px-5 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${typeInfo.style}`}>
                                                    {typeInfo.icon}
                                                    {typeInfo.label}
                                                </span>
                                            </td>

                                            {/* Sebep */}
                                            <td className="px-5 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-700">
                                                        {reasonInfo.icon}
                                                        {reasonInfo.label}
                                                    </span>
                                                    {ret.notes && (
                                                        <span className="text-xs text-slate-400 max-w-[200px] truncate" title={ret.notes}>
                                                            {ret.notes}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Stok */}
                                            <td className="px-5 py-4">
                                                {ret.addedToStock ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-green-50 text-green-700 rounded-full border border-green-200">
                                                        <Package className="w-3 h-3" />
                                                        Eklendi
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-slate-400">—</span>
                                                )}
                                            </td>

                                            {/* Tarih */}
                                            <td className="px-5 py-4 text-xs text-slate-500">
                                                {new Date(ret.createdAt).toLocaleDateString('tr-TR', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                })}
                                            </td>

                                            {/* Yeniden Sipariş */}
                                            <td className="px-5 py-4">
                                                {ret.reorderId ? (
                                                    <button
                                                        onClick={() => router.push(`/orders/${ret.reorderId}`)}
                                                        className="inline-flex items-center gap-1 text-xs font-mono font-bold text-emerald-600 hover:text-emerald-800 hover:underline transition-colors"
                                                    >
                                                        <RefreshCw className="w-3 h-3" />
                                                        #{ret.reorderId}
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleReorder(ret.id)}
                                                        disabled={loading === ret.id}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-50"
                                                    >
                                                        <RefreshCw className={`w-3 h-3 ${loading === ret.id ? 'animate-spin' : ''}`} />
                                                        Yeniden Oluştur
                                                    </button>
                                                )}
                                            </td>

                                            {/* İşlem */}
                                            <td className="px-5 py-4">
                                                <button
                                                    onClick={() => handleDelete(ret.id)}
                                                    disabled={loading === ret.id}
                                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                    title="Kaydı Sil"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
