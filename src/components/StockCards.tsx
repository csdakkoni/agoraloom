'use client'

import { useState } from 'react'
import { Plus, Trash2, X, Package, Search, Pencil, Check, ChevronDown, ChevronRight, Settings2 } from 'lucide-react'
import { createProduct, deleteProduct, updateProductField, addOptionGroup, addOption, deleteOptionGroup, deleteOption, updateOptionGroupName, updateOptionLabel } from '@/app/actions/product'
import { useRouter } from 'next/navigation'

type OptionType = {
    id: number
    label: string
    sortOrder: number
}

type OptionGroupType = {
    id: number
    name: string
    sortOrder: number
    options: OptionType[]
}

type Product = {
    id: number
    name: string
    sku: string
    description: string | null
    optionGroups: OptionGroupType[]
}

function InlineEdit({ value, onSave, className = '' }: { value: string, onSave: (v: string) => Promise<void>, className?: string }) {
    const [editing, setEditing] = useState(false)
    const [val, setVal] = useState(value)
    const [saving, setSaving] = useState(false)

    const save = async () => {
        if (val === value) { setEditing(false); return }
        setSaving(true)
        try { await onSave(val); setEditing(false) }
        catch { setVal(value) }
        finally { setSaving(false) }
    }

    if (editing) {
        return (
            <div className="flex items-center gap-1">
                <input
                    value={val}
                    onChange={e => setVal(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setVal(value); setEditing(false) } }}
                    className={`px-2 py-1 border border-amber-400 rounded text-sm outline-none focus:ring-2 focus:ring-amber-500 ${className}`}
                    autoFocus
                    disabled={saving}
                />
                <button onClick={save} disabled={saving} className="p-1 text-green-600 hover:bg-green-50 rounded">
                    <Check className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => { setVal(value); setEditing(false) }} className="p-1 text-red-500 hover:bg-red-50 rounded">
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>
        )
    }

    return (
        <button onClick={() => setEditing(true)} className="group/edit flex items-center gap-1.5 text-left w-full rounded px-1 -mx-1 hover:bg-slate-100 transition-colors min-h-[28px]">
            <span className={className}>{value || <span className="text-slate-300">—</span>}</span>
            <Pencil className="w-3 h-3 text-slate-300 opacity-0 group-hover/edit:opacity-100 flex-shrink-0" />
        </button>
    )
}

// --- Inline add input ---
function InlineAddInput({ placeholder, onAdd }: { placeholder: string, onAdd: (val: string) => Promise<void> }) {
    const [val, setVal] = useState('')
    const [saving, setSaving] = useState(false)

    const handleAdd = async () => {
        if (!val.trim()) return
        setSaving(true)
        try {
            await onAdd(val.trim())
            setVal('')
        } catch (e: any) {
            console.error(e)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="flex items-center gap-1.5">
            <input
                value={val}
                onChange={e => setVal(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
                placeholder={placeholder}
                disabled={saving}
                className="px-2.5 py-1.5 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-400 w-44"
            />
            <button
                onClick={handleAdd}
                disabled={saving || !val.trim()}
                className="p-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-40 transition-all text-xs"
            >
                <Plus className="w-3.5 h-3.5" />
            </button>
        </div>
    )
}

// --- Option Group expanded panel ---
function OptionGroupPanel({ group, onRefresh }: { group: OptionGroupType, onRefresh: () => void }) {
    const handleAddOption = async (label: string) => {
        await addOption(group.id, label)
        onRefresh()
    }

    const handleDeleteOption = async (optionId: number) => {
        await deleteOption(optionId)
        onRefresh()
    }

    const handleDeleteGroup = async () => {
        if (!confirm(`"${group.name}" grubunu ve tüm seçeneklerini silmek istediğinize emin misiniz?`)) return
        await deleteOptionGroup(group.id)
        onRefresh()
    }

    const handleUpdateGroupName = async (name: string) => {
        await updateOptionGroupName(group.id, name)
        onRefresh()
    }

    const handleUpdateOptionLabel = async (optionId: number, label: string) => {
        await updateOptionLabel(optionId, label)
        onRefresh()
    }

    return (
        <div className="bg-white border border-slate-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                    <Settings2 className="w-3.5 h-3.5 text-indigo-500" />
                    <InlineEdit
                        value={group.name}
                        onSave={handleUpdateGroupName}
                        className="font-semibold text-sm text-indigo-700"
                    />
                </div>
                <button
                    onClick={handleDeleteGroup}
                    className="text-slate-300 hover:text-red-500 transition-colors p-1"
                    title="Grubu sil"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Options list */}
            <div className="flex flex-wrap gap-1.5 mb-2.5">
                {group.options.map(opt => (
                    <div key={opt.id} className="group/opt inline-flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-full px-3 py-1 text-xs font-medium text-slate-700 hover:border-indigo-300 transition-colors">
                        <InlineEdit
                            value={opt.label}
                            onSave={(v) => handleUpdateOptionLabel(opt.id, v)}
                            className="text-xs"
                        />
                        <button
                            onClick={() => handleDeleteOption(opt.id)}
                            className="text-slate-300 hover:text-red-500 opacity-0 group-hover/opt:opacity-100 transition-all ml-0.5"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                ))}
                {group.options.length === 0 && (
                    <span className="text-xs text-slate-400 italic py-1">Henüz seçenek eklenmemiş</span>
                )}
            </div>

            {/* Add option */}
            <InlineAddInput placeholder="Yeni seçenek..." onAdd={handleAddOption} />
        </div>
    )
}

export function StockCards({ products }: { products: Product[] }) {
    const [showModal, setShowModal] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [search, setSearch] = useState('')
    const [expandedId, setExpandedId] = useState<number | null>(null)
    const router = useRouter()

    const [prodName, setProdName] = useState('')
    const [prodSku, setProdSku] = useState('')
    const [prodDesc, setProdDesc] = useState('')

    const resetForm = () => { setProdName(''); setProdSku(''); setProdDesc(''); setError('') }

    const handleAddProduct = async () => {
        setLoading(true); setError('')
        try {
            await createProduct({ name: prodName, sku: prodSku, description: prodDesc || undefined })
            setShowModal(false); resetForm(); router.refresh()
        } catch (e: any) { setError(e?.message || 'Hata oluştu.') }
        finally { setLoading(false) }
    }

    const handleDeleteProduct = async (id: number) => {
        if (!confirm('Bu ürünü silmek istediğinize emin misiniz?')) return
        try { await deleteProduct(id); router.refresh() }
        catch { alert('Silme başarısız. Bu ürüne bağlı sipariş olabilir.') }
    }

    const handleUpdate = async (id: number, field: string, value: string) => {
        await updateProductField(id, field, value)
        router.refresh()
    }

    const handleAddGroup = async (productId: number, name: string) => {
        await addOptionGroup(productId, name)
        router.refresh()
    }

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        type="text"
                        placeholder="Ürün ara..."
                        className="pl-9 pr-4 py-2 text-sm outline-none bg-white border border-slate-200 rounded-lg w-full sm:w-72 shadow-sm focus:ring-2 focus:ring-amber-500"
                    />
                </div>
                <button
                    onClick={() => { setShowModal(true); resetForm() }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/20 text-sm font-medium"
                >
                    <Plus className="w-4 h-4" />
                    Yeni Ürün Ekle
                </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4 w-10"></th>
                            <th className="px-6 py-4">Ürün Adı</th>
                            <th className="px-6 py-4">Ürün Kodu</th>
                            <th className="px-6 py-4">Açıklama</th>
                            <th className="px-6 py-4">Seçenekler</th>
                            <th className="px-6 py-4 w-16"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredProducts.map(p => (
                            <ProductRow
                                key={p.id}
                                product={p}
                                isExpanded={expandedId === p.id}
                                onToggle={() => setExpandedId(expandedId === p.id ? null : p.id)}
                                onUpdate={handleUpdate}
                                onDelete={handleDeleteProduct}
                                onAddGroup={handleAddGroup}
                                onRefresh={() => router.refresh()}
                            />
                        ))}
                        {filteredProducts.length === 0 && (
                            <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                {search ? 'Arama sonucu bulunamadı.' : 'Henüz ürün tanımlanmamış.'}
                            </td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <h3 className="text-lg font-bold text-slate-900">Yeni Ürün Ekle</h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-700">Ürün Adı</label>
                                <input value={prodName} onChange={e => setProdName(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none" placeholder="Örn: Perde, Yastık Kılıfı" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-700">Ürün Kodu</label>
                                <input value={prodSku} onChange={e => setProdSku(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none font-mono" placeholder="Örn: PRD-PERDE-001" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-700">Açıklama (opsiyonel)</label>
                                <textarea value={prodDesc} onChange={e => setProdDesc(e.target.value)} rows={2} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none resize-none" placeholder="Ürün hakkında kısa not..." />
                            </div>
                            <div className="pt-2 flex justify-end gap-3">
                                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-lg">İptal</button>
                                <button onClick={handleAddProduct} disabled={loading || !prodName || !prodSku} className="px-6 py-2 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-lg shadow-md disabled:opacity-50 transition-all">{loading ? 'Ekleniyor...' : 'Kaydet'}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// --- Product Row with expandable options ---
function ProductRow({
    product,
    isExpanded,
    onToggle,
    onUpdate,
    onDelete,
    onAddGroup,
    onRefresh
}: {
    product: Product
    isExpanded: boolean
    onToggle: () => void
    onUpdate: (id: number, field: string, value: string) => Promise<void>
    onDelete: (id: number) => Promise<void>
    onAddGroup: (productId: number, name: string) => Promise<void>
    onRefresh: () => void
}) {
    const optionCount = product.optionGroups.reduce((sum, g) => sum + g.options.length, 0)

    return (
        <>
            <tr className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-3">
                    <button
                        onClick={onToggle}
                        className="p-1 rounded hover:bg-slate-200 transition-colors"
                    >
                        {isExpanded
                            ? <ChevronDown className="w-4 h-4 text-slate-500" />
                            : <ChevronRight className="w-4 h-4 text-slate-400" />}
                    </button>
                </td>
                <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Package className="w-4 h-4" />
                        </div>
                        <InlineEdit
                            value={product.name}
                            onSave={v => onUpdate(product.id, 'name', v)}
                            className="font-semibold text-slate-900"
                        />
                    </div>
                </td>
                <td className="px-6 py-3">
                    <InlineEdit
                        value={product.sku}
                        onSave={v => onUpdate(product.id, 'sku', v)}
                        className="font-mono text-xs text-slate-600"
                    />
                </td>
                <td className="px-6 py-3">
                    <InlineEdit
                        value={product.description || ''}
                        onSave={v => onUpdate(product.id, 'description', v)}
                        className="text-slate-500"
                    />
                </td>
                <td className="px-6 py-3">
                    {product.optionGroups.length > 0 ? (
                        <button
                            onClick={onToggle}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors"
                        >
                            <Settings2 className="w-3 h-3" />
                            {product.optionGroups.length} grup, {optionCount} seçenek
                        </button>
                    ) : (
                        <button
                            onClick={onToggle}
                            className="text-xs text-slate-400 hover:text-indigo-600 transition-colors"
                        >
                            + Seçenek Ekle
                        </button>
                    )}
                </td>
                <td className="px-6 py-3">
                    <button
                        onClick={() => onDelete(product.id)}
                        className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </td>
            </tr>
            {isExpanded && (
                <tr>
                    <td colSpan={6} className="px-6 py-4 bg-slate-50/70 border-t border-slate-100">
                        <div className="space-y-3 max-w-2xl">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold text-slate-700">
                                    Seçenek Grupları
                                </h4>
                            </div>

                            {product.optionGroups.map(group => (
                                <OptionGroupPanel
                                    key={group.id}
                                    group={group}
                                    onRefresh={onRefresh}
                                />
                            ))}

                            {/* Add new group */}
                            <div className="pt-1">
                                <InlineAddInput
                                    placeholder="Yeni seçenek grubu adı..."
                                    onAdd={(name) => onAddGroup(product.id, name)}
                                />
                            </div>
                        </div>
                    </td>
                </tr>
            )}
        </>
    )
}
