'use client'

import { useState } from 'react'
import { Pencil, Check, X, Trash2 } from 'lucide-react'
import { updateMaterialField } from '@/app/actions/inventory'
import { deleteMaterial } from '@/app/actions/product'
import { useRouter } from 'next/navigation'

type Material = {
    id: number
    name: string
    sku: string | null
    color: string
    type: string
    quantity: number
    unit: string
    unitPrice: number
    widthCm: number | null
    gsm: number | null
    reorderLevel: number | null
}

function InlineEdit({ value, onSave, type = 'text', className = '' }: {
    value: string, onSave: (v: string) => Promise<void>, type?: 'text' | 'number', className?: string
}) {
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
                    type={type}
                    step={type === 'number' ? '0.01' : undefined}
                    className={`px-2 py-1 border border-amber-400 rounded text-sm outline-none focus:ring-2 focus:ring-amber-500 w-full ${className}`}
                    autoFocus
                    disabled={saving}
                />
                <button onClick={save} disabled={saving} className="p-1 text-green-600 hover:bg-green-50 rounded flex-shrink-0">
                    <Check className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => { setVal(value); setEditing(false) }} className="p-1 text-red-500 hover:bg-red-50 rounded flex-shrink-0">
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>
        )
    }

    return (
        <button onClick={() => setEditing(true)} className="group/edit flex items-center gap-1 text-left w-full rounded px-1 -mx-1 hover:bg-slate-100 transition-colors min-h-[28px]">
            <span className={className}>{value || <span className="text-slate-300">—</span>}</span>
            <Pencil className="w-3 h-3 text-slate-300 opacity-0 group-hover/edit:opacity-100 flex-shrink-0" />
        </button>
    )
}

export function InventoryTable({ materials }: { materials: Material[] }) {
    const router = useRouter()

    const handleUpdate = async (id: number, field: string, value: string) => {
        await updateMaterialField(id, field, value)
        router.refresh()
    }

    const handleDelete = async (id: number) => {
        if (!confirm('Bu kumaşı silmek istediğinize emin misiniz?')) return
        try { await deleteMaterial(id); router.refresh() }
        catch { alert('Silme başarısız.') }
    }

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                    <tr>
                        <th className="px-4 py-4">Kumaş Adı</th>
                        <th className="px-4 py-4">Kod</th>
                        <th className="px-4 py-4">Renk</th>
                        <th className="px-4 py-4 text-center">En (cm)</th>
                        <th className="px-4 py-4 text-center">Gramaj</th>
                        <th className="px-4 py-4 text-center">Stok (m)</th>
                        <th className="px-4 py-4 text-right">Fiyat ($)</th>
                        <th className="px-4 py-4 text-center">Kritik</th>
                        <th className="px-4 py-4 w-12"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {materials.map((item) => {
                        const isLowStock = item.reorderLevel && item.quantity <= item.reorderLevel
                        return (
                            <tr key={item.id} className={`hover:bg-slate-50/50 transition-colors group ${isLowStock ? 'bg-red-50/30' : ''}`}>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <InlineEdit
                                            value={item.name}
                                            onSave={v => handleUpdate(item.id, 'name', v)}
                                            className="font-semibold text-slate-900"
                                        />
                                        {isLowStock && (
                                            <span className="text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded border border-red-200 flex-shrink-0">KRİTİK</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <InlineEdit
                                        value={item.sku || ''}
                                        onSave={v => handleUpdate(item.id, 'sku', v)}
                                        className="font-mono text-xs text-slate-500"
                                    />
                                </td>
                                <td className="px-4 py-3">
                                    <InlineEdit
                                        value={item.color}
                                        onSave={v => handleUpdate(item.id, 'color', v)}
                                        className="text-slate-700"
                                    />
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <InlineEdit
                                        value={item.widthCm?.toString() || ''}
                                        onSave={v => handleUpdate(item.id, 'widthCm', v)}
                                        type="number"
                                        className="text-slate-600 text-center"
                                    />
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <InlineEdit
                                        value={item.gsm?.toString() || ''}
                                        onSave={v => handleUpdate(item.id, 'gsm', v)}
                                        type="number"
                                        className="text-slate-600 text-center"
                                    />
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <InlineEdit
                                        value={item.quantity.toString()}
                                        onSave={v => handleUpdate(item.id, 'quantity', v)}
                                        type="number"
                                        className={`font-bold ${isLowStock ? 'text-red-600' : 'text-slate-900'}`}
                                    />
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <InlineEdit
                                        value={item.unitPrice.toFixed(2)}
                                        onSave={v => handleUpdate(item.id, 'unitPrice', v)}
                                        type="number"
                                        className="font-mono text-slate-700"
                                    />
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <InlineEdit
                                        value={item.reorderLevel?.toString() || ''}
                                        onSave={v => handleUpdate(item.id, 'reorderLevel', v)}
                                        type="number"
                                        className="text-slate-500"
                                    />
                                </td>
                                <td className="px-4 py-3">
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        )
                    })}
                    {materials.length === 0 && (
                        <tr><td colSpan={9} className="px-6 py-12 text-center text-slate-500">
                            Henüz kayıtlı kumaş yok.
                        </td></tr>
                    )}
                </tbody>
            </table>
        </div>
    )
}
