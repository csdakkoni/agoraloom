'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Search, ChevronRight, Printer, CheckSquare, Square, RefreshCw, Pencil, Check, X, RotateCcw, XCircle, AlertTriangle, Clock, TrendingUp, ShoppingCart, Package, CheckCircle2 } from 'lucide-react'
import { bulkUpdateOrderStatus, updateOrderField, updateOrderStatus } from '@/app/actions/order'
import { createReturn } from '@/app/actions/returns'
import { InlineOptionsEditor } from '@/components/InlineOptionsEditor'

type OrderItem = {
    id: number
    productId: number | null
    productName: string
    quantity: number
    widthInch: number | null
    heightInch: number | null
    fabricCode: string | null
    fabricColor?: string | null
    selectedOptions: string | null
}

type Order = {
    id: number
    customerName: string | null
    notes: string | null
    etsyOrderId: string | null
    source: string
    currency: string
    status: string
    orderDate: Date | string
    deadline: Date | string | null
    items: OrderItem[]
}

const statusConfig: Record<string, { label: string, style: string }> = {
    PENDING: { label: 'Bekliyor', style: 'bg-amber-50 text-amber-700 border-amber-200' },
    CUTTING: { label: 'Terzide', style: 'bg-blue-50 text-blue-700 border-blue-200' },
    COMPLETED: { label: 'Tamamlandı', style: 'bg-green-50 text-green-700 border-green-200' },
    SHIPPED: { label: 'Kargoda', style: 'bg-purple-50 text-purple-700 border-purple-200' },
    DELIVERED: { label: 'Teslim Edildi', style: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    RETURNED: { label: 'İade', style: 'bg-orange-50 text-orange-700 border-orange-200' },
    CANCELLED: { label: 'İptal', style: 'bg-red-50 text-red-700 border-red-200' },
}

// Dropdown'da seçilebilir durumlar (İade/İptal sadece özel butonlardan yapılır)
const selectableStatuses = ['PENDING', 'CUTTING', 'COMPLETED', 'SHIPPED', 'DELIVERED'] as const

const returnReasons = [
    { value: 'WRONG_PRODUCT', label: 'Yanlış Ürün Gönderildi' },
    { value: 'LATE_DELIVERY', label: 'Gecikme' },
    { value: 'CUSTOMER_CHANGED_MIND', label: 'Müşteri Vazgeçti' },
    { value: 'DEFECTIVE', label: 'Kusurlu Ürün' },
    { value: 'OTHER', label: 'Diğer' },
]

const sourceConfig: Record<string, { label: string, emoji: string, style: string }> = {
    ETSY: { label: 'Etsy', emoji: '🟠', style: 'bg-orange-50 text-orange-700 border-orange-200' },
    SHOPIFY: { label: 'Shopify', emoji: '🟢', style: 'bg-green-50 text-green-700 border-green-200' },
    MANUAL: { label: 'Manuel', emoji: '📋', style: 'bg-slate-50 text-slate-600 border-slate-200' },
}

function inchToCm(inch: number): number {
    return Math.ceil(inch * 2.54)
}

// Inline editable text cell
function EditableCell({
    value,
    placeholder,
    onSave,
    type = 'text',
}: {
    value: string
    placeholder: string
    onSave: (val: string) => Promise<void>
    type?: 'text' | 'date' | 'textarea'
}) {
    const [editing, setEditing] = useState(false)
    const [draft, setDraft] = useState(value)
    const [saving, setSaving] = useState(false)
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

    useEffect(() => {
        if (editing && inputRef.current) {
            inputRef.current.focus()
            if (type !== 'date') {
                inputRef.current.select()
            }
        }
    }, [editing, type])

    const handleSave = async () => {
        if (draft === value) { setEditing(false); return }
        setSaving(true)
        try {
            await onSave(draft)
            setEditing(false)
        } catch (e) {
            console.error(e)
        } finally {
            setSaving(false)
        }
    }

    const handleCancel = () => {
        setDraft(value)
        setEditing(false)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && type !== 'textarea') {
            e.preventDefault()
            handleSave()
        }
        if (e.key === 'Escape') {
            handleCancel()
        }
    }

    if (!editing) {
        return (
            <button
                onClick={(e) => { e.stopPropagation(); setEditing(true); setDraft(value) }}
                className="group/edit inline-flex items-center gap-1.5 text-left w-full min-h-[28px] rounded px-1 -mx-1 hover:bg-slate-100 transition-colors"
                title="Düzenlemek için tıklayın"
            >
                {type === 'date' ? (
                    <span className={value ? 'text-slate-900' : 'text-slate-300'}>
                        {value ? new Date(value).toLocaleDateString('tr-TR') : '—'}
                    </span>
                ) : (
                    <span className={value ? 'text-slate-900 font-medium' : 'text-slate-400 italic text-xs'}>
                        {value || placeholder}
                    </span>
                )}
                <Pencil className="w-3 h-3 text-slate-300 opacity-0 group-hover/edit:opacity-100 transition-opacity flex-shrink-0" />
            </button>
        )
    }

    return (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            {type === 'textarea' ? (
                <textarea
                    ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={2}
                    className="w-full px-2 py-1 text-sm border border-amber-300 rounded-md outline-none focus:ring-2 focus:ring-amber-200 bg-white resize-none"
                />
            ) : (
                <input
                    ref={inputRef as React.RefObject<HTMLInputElement>}
                    type={type}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full px-2 py-1 text-sm border border-amber-300 rounded-md outline-none focus:ring-2 focus:ring-amber-200 bg-white"
                />
            )}
            <button
                onClick={handleSave}
                disabled={saving}
                className="p-1 rounded-md bg-green-50 text-green-600 hover:bg-green-100 transition-colors disabled:opacity-50"
            >
                {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            </button>
            <button
                onClick={handleCancel}
                className="p-1 rounded-md bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
            >
                <X className="w-3.5 h-3.5" />
            </button>
        </div>
    )
}

// Inline status dropdown
function StatusDropdown({ orderId, currentStatus }: { orderId: number, currentStatus: string }) {
    const [open, setOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [pos, setPos] = useState({ top: 0, left: 0 })
    const router = useRouter()
    const ref = useRef<HTMLDivElement>(null)
    const btnRef = useRef<HTMLButtonElement>(null)

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node) &&
                btnRef.current && !btnRef.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [])

    const toggleOpen = () => {
        if (!open && btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect()
            setPos({ top: rect.bottom + 4, left: rect.left })
        }
        setOpen(!open)
    }

    const handleChange = async (newStatus: string) => {
        if (newStatus === currentStatus) { setOpen(false); return }
        setSaving(true)
        try {
            await updateOrderStatus(orderId, newStatus)
            setOpen(false)
            router.refresh()
        } catch (e) {
            console.error(e)
        } finally {
            setSaving(false)
        }
    }

    const cur = statusConfig[currentStatus] || statusConfig.PENDING

    return (
        <div onClick={(e) => e.stopPropagation()}>
            <button
                ref={btnRef}
                onClick={toggleOpen}
                disabled={saving}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-full border uppercase cursor-pointer hover:shadow-md transition-all ${cur.style}`}
            >
                {saving ? <RefreshCw className="w-3 h-3 animate-spin" /> : cur.label}
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {open && (
                <div
                    ref={ref}
                    className="fixed z-50 bg-white rounded-lg border border-slate-200 shadow-xl py-1 min-w-[140px]"
                    style={{ top: pos.top, left: pos.left }}
                >
                    {selectableStatuses.map((key) => {
                        const cfg = statusConfig[key]
                        return (
                            <button
                                key={key}
                                onClick={() => handleChange(key)}
                                className={`w-full text-left px-3 py-1.5 text-xs font-semibold hover:bg-slate-50 transition-colors ${key === currentStatus ? 'bg-slate-50' : ''}`}
                            >
                                <span className={`inline-block px-2 py-0.5 rounded-full border text-[10px] uppercase ${cfg.style}`}>
                                    {cfg.label}
                                </span>
                            </button>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

// Inline source dropdown
function SourceDropdown({ orderId, currentSource }: { orderId: number, currentSource: string }) {
    const [open, setOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [pos, setPos] = useState({ top: 0, left: 0 })
    const router = useRouter()
    const ref = useRef<HTMLDivElement>(null)
    const btnRef = useRef<HTMLButtonElement>(null)

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node) &&
                btnRef.current && !btnRef.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [])

    const toggleOpen = () => {
        if (!open && btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect()
            setPos({ top: rect.bottom + 4, left: rect.left })
        }
        setOpen(!open)
    }

    const handleChange = async (newSource: string) => {
        if (newSource === currentSource) { setOpen(false); return }
        setSaving(true)
        try {
            await updateOrderField(orderId, { source: newSource })
            setOpen(false)
            router.refresh()
        } catch (e) {
            console.error(e)
        } finally {
            setSaving(false)
        }
    }

    const cur = sourceConfig[currentSource] || sourceConfig.MANUAL

    return (
        <div onClick={(e) => e.stopPropagation()}>
            <button
                ref={btnRef}
                onClick={toggleOpen}
                disabled={saving}
                className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold rounded-full border cursor-pointer hover:shadow-md transition-all ${cur.style}`}
            >
                {saving ? <RefreshCw className="w-3 h-3 animate-spin" /> : (
                    <>{cur.emoji} {cur.label}</>
                )}
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {open && (
                <div
                    ref={ref}
                    className="fixed z-50 bg-white rounded-lg border border-slate-200 shadow-xl py-1 min-w-[130px]"
                    style={{ top: pos.top, left: pos.left }}
                >
                    {Object.entries(sourceConfig).map(([key, cfg]) => (
                        <button
                            key={key}
                            onClick={() => handleChange(key)}
                            className={`w-full text-left px-3 py-1.5 text-xs font-semibold hover:bg-slate-50 transition-colors ${key === currentSource ? 'bg-slate-50' : ''}`}
                        >
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] ${cfg.style}`}>
                                {cfg.emoji} {cfg.label}
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

export function OrderListClient({ orders, productOptionsMap }: { orders: Order[], productOptionsMap?: Record<number, { id: number, name: string, options: { id: number, label: string }[] }[]> }) {
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
    const [selectMode, setSelectMode] = useState(false)
    const [updating, setUpdating] = useState(false)
    const router = useRouter()

    // Filter states
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL')
    const [selectedSourceFilter, setSelectedSourceFilter] = useState<string>('ALL')

    // Return/Cancel modal state
    const [returnModal, setReturnModal] = useState<{ orderId: number, type: 'RETURN' | 'CANCEL' } | null>(null)
    const [returnReason, setReturnReason] = useState('WRONG_PRODUCT')
    const [returnNotes, setReturnNotes] = useState('')
    const [returnAddToStock, setReturnAddToStock] = useState(false)
    const [returnSaving, setReturnSaving] = useState(false)

    const handleReturnSubmit = async () => {
        if (!returnModal) return
        setReturnSaving(true)
        try {
            await createReturn({
                orderId: returnModal.orderId,
                type: returnModal.type,
                reason: returnReason,
                notes: returnNotes || undefined,
                addToStock: returnAddToStock,
            })
            setReturnModal(null)
            setReturnReason('WRONG_PRODUCT')
            setReturnNotes('')
            setReturnAddToStock(false)
            router.refresh()
        } catch (err) {
            alert('Hata: ' + (err instanceof Error ? err.message : 'Bilinmeyen hata'))
        } finally {
            setReturnSaving(false)
        }
    }

    const toggleSelect = (id: number) => {
        setSelectedIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const now = new Date()

    // Calculate stats based on raw orders list
    const stats = {
        ALL: orders.length,
        PENDING: orders.filter(o => o.status === 'PENDING').length,
        CUTTING: orders.filter(o => o.status === 'CUTTING').length,
        SHIPPED: orders.filter(o => o.status === 'SHIPPED').length,
        COMPLETED: orders.filter(o => ['COMPLETED', 'DELIVERED'].includes(o.status)).length,
        OVERDUE: orders.filter(o => o.deadline && new Date(o.deadline) < now && !['SHIPPED', 'DELIVERED'].includes(o.status)).length
    }

    // Advanced filtering logic
    const filteredOrders = orders.filter(order => {
        // Search Filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase()
            const matchesId = order.id.toString().includes(query)
            const matchesCustomer = order.customerName?.toLowerCase().includes(query) || false
            const matchesNotes = order.notes?.toLowerCase().includes(query) || false
            const matchesEtsyId = order.etsyOrderId?.toLowerCase().includes(query) || false
            const matchesItems = order.items.some(item => 
                item.productName.toLowerCase().includes(query) || 
                item.fabricCode?.toLowerCase().includes(query) ||
                item.selectedOptions?.toLowerCase().includes(query)
            )
            if (!matchesId && !matchesCustomer && !matchesNotes && !matchesEtsyId && !matchesItems) {
                return false
            }
        }

        // Status Filter (via stats cards)
        if (selectedStatusFilter !== 'ALL') {
            if (selectedStatusFilter === 'OVERDUE') {
                const isOverdue = order.deadline && new Date(order.deadline) < now && !['SHIPPED', 'DELIVERED'].includes(order.status)
                if (!isOverdue) return false
            } else if (selectedStatusFilter === 'COMPLETED') {
                if (!['COMPLETED', 'DELIVERED'].includes(order.status)) return false
            } else {
                if (order.status !== selectedStatusFilter) return false
            }
        }

        // Source Filter
        if (selectedSourceFilter !== 'ALL') {
            if (order.source !== selectedSourceFilter) return false
        }

        return true
    })

    const toggleAll = () => {
        if (selectedIds.size === filteredOrders.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(filteredOrders.map(o => o.id)))
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

    const handleFieldSave = async (orderId: number, field: string, value: string) => {
        await updateOrderField(orderId, { [field]: value || null })
        router.refresh()
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
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${selectMode
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

            {/* Interactive Stats Cards as Filters */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 no-print">
                <button
                    onClick={() => setSelectedStatusFilter('ALL')}
                    className={`p-4 rounded-xl border text-left transition-all ${
                        selectedStatusFilter === 'ALL'
                            ? 'bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-900/10 scale-[1.02]'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:shadow-sm'
                    }`}
                >
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-semibold uppercase tracking-wider opacity-85">Tümü</span>
                        <ShoppingCart className={`w-4 h-4 ${selectedStatusFilter === 'ALL' ? 'text-amber-400' : 'text-slate-400'}`} />
                    </div>
                    <div className="text-2xl font-bold mt-2">{stats.ALL}</div>
                    <div className="text-[10px] mt-1 opacity-70">Toplam sipariş</div>
                </button>

                <button
                    onClick={() => setSelectedStatusFilter('PENDING')}
                    className={`p-4 rounded-xl border text-left transition-all ${
                        selectedStatusFilter === 'PENDING'
                            ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/10 scale-[1.02]'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:shadow-sm'
                    }`}
                >
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-semibold uppercase tracking-wider opacity-85">Bekleyenler</span>
                        <Clock className={`w-4 h-4 ${selectedStatusFilter === 'PENDING' ? 'text-white' : 'text-amber-500'}`} />
                    </div>
                    <div className="text-2xl font-bold mt-2">{stats.PENDING}</div>
                    <div className="text-[10px] mt-1 opacity-70">Onay bekleyen</div>
                </button>

                <button
                    onClick={() => setSelectedStatusFilter('CUTTING')}
                    className={`p-4 rounded-xl border text-left transition-all ${
                        selectedStatusFilter === 'CUTTING'
                            ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/10 scale-[1.02]'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:shadow-sm'
                    }`}
                >
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-semibold uppercase tracking-wider opacity-85">Terzide</span>
                        <Package className={`w-4 h-4 ${selectedStatusFilter === 'CUTTING' ? 'text-white' : 'text-blue-500'}`} />
                    </div>
                    <div className="text-2xl font-bold mt-2">{stats.CUTTING}</div>
                    <div className="text-[10px] mt-1 opacity-70">Dikim/Kesimde</div>
                </button>

                <button
                    onClick={() => setSelectedStatusFilter('SHIPPED')}
                    className={`p-4 rounded-xl border text-left transition-all ${
                        selectedStatusFilter === 'SHIPPED'
                            ? 'bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-600/10 scale-[1.02]'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:shadow-sm'
                    }`}
                >
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-semibold uppercase tracking-wider opacity-85">Kargoda</span>
                        <TrendingUp className={`w-4 h-4 ${selectedStatusFilter === 'SHIPPED' ? 'text-white' : 'text-purple-500'}`} />
                    </div>
                    <div className="text-2xl font-bold mt-2">{stats.SHIPPED}</div>
                    <div className="text-[10px] mt-1 opacity-70">Kargoya verilen</div>
                </button>

                <button
                    onClick={() => setSelectedStatusFilter('COMPLETED')}
                    className={`p-4 rounded-xl border text-left transition-all ${
                        selectedStatusFilter === 'COMPLETED'
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-600/10 scale-[1.02]'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:shadow-sm'
                    }`}
                >
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-semibold uppercase tracking-wider opacity-85">Tamamlanan</span>
                        <CheckCircle2 className={`w-4 h-4 ${selectedStatusFilter === 'COMPLETED' ? 'text-white' : 'text-emerald-500'}`} />
                    </div>
                    <div className="text-2xl font-bold mt-2">{stats.COMPLETED}</div>
                    <div className="text-[10px] mt-1 opacity-70">Teslim edilenler</div>
                </button>

                <button
                    onClick={() => setSelectedStatusFilter('OVERDUE')}
                    className={`p-4 rounded-xl border text-left transition-all ${
                        selectedStatusFilter === 'OVERDUE'
                            ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-600/10 scale-[1.02]'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:shadow-sm'
                    }`}
                >
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-semibold uppercase tracking-wider opacity-85">Gecikenler</span>
                        <AlertTriangle className={`w-4 h-4 ${selectedStatusFilter === 'OVERDUE' ? 'text-white' : 'text-red-500'}`} />
                    </div>
                    <div className="text-2xl font-bold mt-2">{stats.OVERDUE}</div>
                    <div className="text-[10px] mt-1 opacity-70 font-semibold text-red-500 bg-red-50/50 rounded px-1.5 py-0.5 border border-red-100 max-w-fit mt-1 select-none">Süresi geçen</div>
                </button>
            </div>

            {/* Selection toolbar */}
            {selectMode && (
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg">
                    <button
                        onClick={toggleAll}
                        className="inline-flex items-center gap-2 text-sm font-medium hover:text-amber-400 transition-colors"
                    >
                        {selectedIds.size === filteredOrders.length ? (
                            <CheckSquare className="w-4 h-4" />
                        ) : (
                            <Square className="w-4 h-4" />
                        )}
                        {selectedIds.size === filteredOrders.length ? 'Tümünü Kaldır' : 'Tümünü Seç'}
                    </button>
                    <span className="text-sm text-slate-400">
                        {selectedIds.size} sipariş seçili
                    </span>
                    <div className="flex-1" />

                    {/* Status update buttons */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs text-slate-400 mr-1">Durumu:</span>
                        {selectableStatuses.map((key) => {
                            const cfg = statusConfig[key]
                            return (
                                <button
                                    key={key}
                                    onClick={() => handleBulkStatus(key)}
                                    disabled={selectedIds.size === 0 || updating}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${cfg.style} hover:scale-105`}
                                >
                                    {updating ? <RefreshCw className="w-3 h-3 animate-spin" /> : cfg.label}
                                </button>
                            )
                        })}
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

            {/* Filters Row */}
            <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center no-print">
                <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Sipariş No, müşteri, ürün veya kumaş kodu ara..."
                        className="pl-9 pr-10 py-2.5 text-sm outline-none bg-white border border-slate-200 rounded-xl w-full shadow-sm focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-2 bg-white px-3 py-2 border border-slate-200 rounded-xl shadow-sm self-start md:self-auto">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Kaynak:</span>
                    <button
                        onClick={() => setSelectedSourceFilter('ALL')}
                        className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${
                            selectedSourceFilter === 'ALL'
                                ? 'bg-slate-900 text-white shadow-sm'
                                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                        Tümü
                    </button>
                    {Object.entries(sourceConfig).map(([key, cfg]) => {
                        const isActive = selectedSourceFilter === key
                        let activeClass = ''
                        if (key === 'ETSY') activeClass = 'bg-orange-600 text-white border-orange-600'
                        else if (key === 'SHOPIFY') activeClass = 'bg-green-600 text-white border-green-600'
                        else activeClass = 'bg-slate-700 text-white border-slate-700'

                        return (
                            <button
                                key={key}
                                onClick={() => setSelectedSourceFilter(key)}
                                className={`px-2.5 py-1 text-xs font-bold rounded-full transition-all border flex items-center gap-1 ${
                                    isActive ? activeClass : `${cfg.style} hover:shadow-sm`
                                }`}
                            >
                                <span>{cfg.emoji}</span>
                                <span>{cfg.label}</span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Active filters status summary */}
            {(searchQuery || selectedStatusFilter !== 'ALL' || selectedSourceFilter !== 'ALL') && (
                <div className="flex items-center gap-2 text-xs text-slate-500 bg-amber-50/40 px-3 py-2 rounded-lg border border-amber-100/60 max-w-fit no-print">
                    <span>Filtreler aktif:</span>
                    {selectedStatusFilter !== 'ALL' && (
                        <span className="bg-white px-2 py-0.5 rounded border text-slate-600 font-medium">
                            Durum: {selectedStatusFilter === 'OVERDUE' ? 'Gecikenler' : selectedStatusFilter === 'COMPLETED' ? 'Tamamlananlar' : statusConfig[selectedStatusFilter]?.label}
                        </span>
                    )}
                    {selectedSourceFilter !== 'ALL' && (
                        <span className="bg-white px-2 py-0.5 rounded border text-slate-600 font-medium">
                            Kaynak: {sourceConfig[selectedSourceFilter]?.label}
                        </span>
                    )}
                    {searchQuery && (
                        <span className="bg-white px-2 py-0.5 rounded border text-slate-600 font-medium truncate max-w-[150px]">
                            Arama: "{searchQuery}"
                        </span>
                    )}
                    <button
                        onClick={() => {
                            setSearchQuery('')
                            setSelectedStatusFilter('ALL')
                            setSelectedSourceFilter('ALL')
                        }}
                        className="inline-flex items-center gap-0.5 text-amber-600 hover:text-amber-700 font-bold transition-colors ml-2"
                    >
                        <X className="w-3 h-3" />
                        Filtreleri Temizle
                    </button>
                </div>
            )}

            {/* Order Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50/80">
                                {selectMode && (
                                    <th className="w-10 px-3 py-3 text-left">
                                        <button onClick={toggleAll}>
                                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${selectedIds.size === filteredOrders.length && filteredOrders.length > 0
                                                ? 'bg-amber-500 border-amber-500 text-white'
                                                : 'border-slate-300 hover:border-amber-400'
                                                }`}>
                                                {selectedIds.size === filteredOrders.length && filteredOrders.length > 0 && (
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </div>
                                        </button>
                                    </th>
                                )}
                                <th className="px-4 py-3 text-left font-semibold text-slate-500 text-xs uppercase tracking-wider">#</th>
                                <th className="px-4 py-3 text-left font-semibold text-slate-500 text-xs uppercase tracking-wider">Kaynak</th>
                                <th className="px-4 py-3 text-left font-semibold text-slate-500 text-xs uppercase tracking-wider">Müşteri</th>
                                <th className="px-4 py-3 text-left font-semibold text-slate-500 text-xs uppercase tracking-wider">Durum</th>
                                <th className="px-4 py-3 text-left font-semibold text-slate-500 text-xs uppercase tracking-wider">Tarih</th>
                                <th className="px-4 py-3 text-left font-semibold text-slate-500 text-xs uppercase tracking-wider">Teslim</th>
                                <th className="px-4 py-3 text-left font-semibold text-slate-500 text-xs uppercase tracking-wider hidden 2xl:table-cell">Not</th>
                                <th className="px-4 py-3 text-left font-semibold text-slate-500 text-xs uppercase tracking-wider hidden xl:table-cell">Ürünler</th>
                                <th className="w-10 px-3 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredOrders.map((order) => {
                                const isSelected = selectedIds.has(order.id)
                                const deadlineStr = order.deadline ? new Date(order.deadline).toISOString().split('T')[0] : ''

                                return (
                                    <tr
                                        key={order.id}
                                        className={`group transition-colors ${isSelected ? 'bg-amber-50/60' : 'hover:bg-slate-50/80'} ${selectMode ? 'cursor-pointer' : ''}`}
                                        onClick={() => {
                                            if (selectMode) {
                                                toggleSelect(order.id)
                                            }
                                        }}
                                    >
                                        {selectMode && (
                                            <td className="px-3 py-3">
                                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${isSelected
                                                    ? 'bg-amber-500 border-amber-500 text-white'
                                                    : 'border-slate-300 group-hover:border-amber-400'
                                                    }`}>
                                                    {isSelected && (
                                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                        <td className="px-4 py-3">
                                            <span className="font-bold text-slate-900">#{order.id}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <SourceDropdown orderId={order.id} currentSource={order.source || 'MANUAL'} />
                                        </td>
                                        <td className="px-4 py-3 min-w-[110px]">
                                            <EditableCell
                                                value={order.customerName || ''}
                                                placeholder="Müşteri adı..."
                                                onSave={(val) => handleFieldSave(order.id, 'customerName', val)}
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <StatusDropdown orderId={order.id} currentStatus={order.status} />
                                        </td>
                                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                                            {new Date(order.orderDate).toLocaleDateString('tr-TR')}
                                        </td>
                                        <td className="px-4 py-3 min-w-[105px]">
                                            <EditableCell
                                                value={deadlineStr}
                                                placeholder="Teslim tarihi..."
                                                type="date"
                                                onSave={(val) => handleFieldSave(order.id, 'deadline', val)}
                                            />
                                        </td>
                                        <td className="px-4 py-3 hidden 2xl:table-cell min-w-[140px] max-w-[180px]">
                                            <EditableCell
                                                value={order.notes || ''}
                                                placeholder="Not ekle..."
                                                type="textarea"
                                                onSave={(val) => handleFieldSave(order.id, 'notes', val)}
                                            />
                                        </td>
                                        <td className="px-4 py-3 hidden xl:table-cell">
                                            <div className="space-y-1 max-w-xs">
                                                {order.items.slice(0, 2).map((item) => {
                                                    const itemGroups = (item.productId && productOptionsMap)
                                                        ? (productOptionsMap[item.productId] || [])
                                                        : []
                                                    return (
                                                        <div key={item.id} className="text-xs text-slate-600">
                                                            <div className="truncate">
                                                                <span className="font-medium">{item.quantity}x</span>{' '}
                                                                {item.productName}
                                                                {item.fabricCode && <span className="text-slate-400"> ({item.fabricCode})</span>}
                                                                {(() => {
                                                                    const isFabric = item.productName.toUpperCase().includes('KUMAŞ') || item.productName.toUpperCase().includes('KUMAS');
                                                                    if (isFabric) {
                                                                        return item.heightInch ? (
                                                                            <span className="text-slate-500 font-mono ml-1">
                                                                                ({inchToCm(item.heightInch)}cm)
                                                                            </span>
                                                                        ) : null;
                                                                    } else {
                                                                        return (item.widthInch || item.heightInch) ? (
                                                                            <span className="text-slate-500 font-mono ml-1">
                                                                                ({item.widthInch ? `${inchToCm(item.widthInch)}cm` : '—'}×{item.heightInch ? `${inchToCm(item.heightInch)}cm` : '—'})
                                                                            </span>
                                                                        ) : null;
                                                                    }
                                                                })()}
                                                            </div>
                                                            {itemGroups.length > 0 && (
                                                                <div className="mt-0.5" onClick={e => e.stopPropagation()}>
                                                                    <InlineOptionsEditor
                                                                        itemId={item.id}
                                                                        currentOptions={item.selectedOptions}
                                                                        optionGroups={itemGroups}
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    )
                                                })}
                                                {order.items.length > 2 && (
                                                    <span className="text-[10px] text-slate-400 font-medium">+{order.items.length - 2} ürün daha</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-3 py-3">
                                            <div className="flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
                                                {order.status !== 'RETURNED' && order.status !== 'CANCELLED' && (
                                                    <>
                                                        <button
                                                            onClick={() => setReturnModal({ orderId: order.id, type: 'RETURN' })}
                                                            className="p-1.5 rounded-lg hover:bg-orange-50 text-slate-400 hover:text-orange-600 transition-colors"
                                                            title="İade Et"
                                                        >
                                                            <RotateCcw className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => setReturnModal({ orderId: order.id, type: 'CANCEL' })}
                                                            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                                                            title="İptal Et"
                                                        >
                                                            <XCircle className="w-3.5 h-3.5" />
                                                        </button>
                                                    </>
                                                )}
                                                <Link
                                                    href={`/orders/${order.id}`}
                                                    className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors inline-flex"
                                                    title="Detaya git"
                                                >
                                                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                    {filteredOrders.length === 0 && (
                        <div className="p-12 text-center text-slate-500">
                            Filtrelere uygun sipariş bulunamadı.
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
                                                {item.fabricCode ? ` (${item.fabricCode})` : ''}
                                            </div>
                                            {item.selectedOptions && (
                                                <div className="text-xs mt-0.5 ml-3 text-gray-600 font-semibold">
                                                    ▸ {item.selectedOptions}
                                                </div>
                                            )}
                                            <div className="grid grid-cols-2 gap-0 text-xs mt-1 ml-3">
                                                {(() => {
                                                    const isFabric = item.productName.toUpperCase().includes('KUMAŞ') || item.productName.toUpperCase().includes('KUMAS');
                                                    if (isFabric) {
                                                        const cm = Math.round(item.quantity * 91.44);
                                                        return (
                                                            <div>
                                                                <span className="text-gray-600">Boy: </span>
                                                                <span className="font-bold text-base">{item.quantity} Yard / {cm}cm</span>
                                                            </div>
                                                        );
                                                    } else {
                                                        return (
                                                            <div>
                                                                <span className="text-gray-600">Adet: </span>
                                                                <span className="font-bold text-base">{item.quantity}</span>
                                                            </div>
                                                        );
                                                    }
                                                })()}
                                                {item.fabricCode && (
                                                    <div>
                                                        <span className="text-gray-600">Kumaş: </span>
                                                        <span className="font-bold">
                                                            {item.fabricCode}
                                                            {item.fabricColor ? ` (${item.fabricColor})` : ''}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            {(() => {
                                                const isFabric = item.productName.toUpperCase().includes('KUMAŞ') || item.productName.toUpperCase().includes('KUMAS');
                                                if (isFabric) {
                                                    return item.heightInch ? (
                                                        <div className="text-xs mt-1 ml-3">
                                                            <div>
                                                                <span className="text-gray-600">Boy: </span>
                                                                <span className="font-bold text-base">{inchToCm(item.heightInch)}cm</span>
                                                            </div>
                                                        </div>
                                                    ) : null;
                                                } else {
                                                    return (item.widthInch || item.heightInch) ? (
                                                        <div className="text-xs mt-1 ml-3">
                                                            {item.widthInch ? (
                                                                <div>
                                                                    <span className="text-gray-600">En: </span>
                                                                    <span className="font-bold text-base">{inchToCm(item.widthInch)}cm</span>
                                                                </div>
                                                            ) : null}
                                                            {item.heightInch ? (
                                                                <div>
                                                                    <span className="text-gray-600">Boy: </span>
                                                                    <span className="font-bold text-base">{inchToCm(item.heightInch)}cm</span>
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    ) : null;
                                                }
                                            })()}
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

            {/* Return/Cancel Modal */}
            {returnModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setReturnModal(null)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
                        <h3 className="text-lg font-bold text-slate-900 mb-1">
                            {returnModal.type === 'RETURN' ? '📦 Sipariş İadesi' : '❌ Sipariş İptali'}
                        </h3>
                        <p className="text-sm text-slate-500 mb-5">
                            Sipariş <span className="font-bold">#{returnModal.orderId}</span> için {returnModal.type === 'RETURN' ? 'iade' : 'iptal'} kaydı oluşturulacak.
                        </p>

                        <div className="space-y-4">
                            {/* Reason */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Sebep</label>
                                <select
                                    value={returnReason}
                                    onChange={(e) => setReturnReason(e.target.value)}
                                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                                >
                                    {returnReasons.map(r => (
                                        <option key={r.value} value={r.value}>{r.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Not (opsiyonel)</label>
                                <textarea
                                    value={returnNotes}
                                    onChange={(e) => setReturnNotes(e.target.value)}
                                    placeholder="Ek açıklama..."
                                    rows={2}
                                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 resize-none"
                                />
                            </div>

                            {/* Add to stock */}
                            <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={returnAddToStock}
                                    onChange={(e) => setReturnAddToStock(e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                                />
                                <div>
                                    <span className="text-sm font-medium text-slate-700">Kumaşı stoğa geri ekle</span>
                                    <p className="text-xs text-slate-400">Üretimde kullanılan kumaş miktarı stoğa iade edilir</p>
                                </div>
                            </label>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-2 mt-6">
                            <button
                                onClick={() => setReturnModal(null)}
                                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                Vazgeç
                            </button>
                            <button
                                onClick={handleReturnSubmit}
                                disabled={returnSaving}
                                className={`px-5 py-2 text-sm font-bold text-white rounded-lg transition-colors disabled:opacity-50 shadow-lg ${returnModal.type === 'RETURN'
                                    ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20'
                                    : 'bg-red-500 hover:bg-red-600 shadow-red-500/20'
                                    }`}
                            >
                                {returnSaving ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                    returnModal.type === 'RETURN' ? 'İade Et' : 'İptal Et'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
