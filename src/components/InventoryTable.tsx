'use client'

import { useState } from 'react'
import { Pencil, Check, X, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
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
    const [sortConfig, setSortConfig] = useState<{ key: keyof Material; direction: 'asc' | 'desc' } | null>({ key: 'sku', direction: 'asc' })

    const handleUpdate = async (id: number, field: string, value: string) => {
        await updateMaterialField(id, field, value)
        router.refresh()
    }

    const handleDelete = async (id: number) => {
        if (!confirm('Bu kumaşı silmek istediğinize emin misiniz?')) return
        try { await deleteMaterial(id); router.refresh() }
        catch { alert('Silme başarısız.') }
    }

    const handleSort = (key: keyof Material) => {
        setSortConfig(prev => {
            if (prev?.key === key) {
                return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
            }
            return { key, direction: 'asc' }
        })
    }

    // Apply natural sorting (numeric: true covers values like 2km02 and 2km29 naturally)
    const sortedMaterials = [...materials].sort((a, b) => {
        if (!sortConfig) return 0
        const { key, direction } = sortConfig

        let valA: any = a[key]
        let valB: any = b[key]

        // Handle null values
        if (valA === null || valA === undefined) return direction === 'asc' ? 1 : -1
        if (valB === null || valB === undefined) return direction === 'asc' ? -1 : 1

        if (typeof valA === 'string' && typeof valB === 'string') {
            return direction === 'asc'
                ? valA.localeCompare(valB, 'tr', { numeric: true, sensitivity: 'base' })
                : valB.localeCompare(valA, 'tr', { numeric: true, sensitivity: 'base' })
        }

        if (valA < valB) return direction === 'asc' ? -1 : 1
        if (valB < valA) return direction === 'asc' ? 1 : -1
        return 0
    })

    const renderHeader = (label: string, key: keyof Material, align: 'left' | 'center' | 'right' = 'left') => {
        const isSorted = sortConfig?.key === key
        const direction = isSorted ? sortConfig?.direction : null

        return (
            <th 
                className={`px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors select-none ${
                    align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'
                }`}
                onClick={() => handleSort(key)}
            >
                <div className={`flex items-center gap-1.5 ${
                    align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start'
                }`}>
                    <span>{label}</span>
                    <span className="text-slate-400">
                        {isSorted ? (
                            direction === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-amber-500" /> : <ArrowDown className="w-3.5 h-3.5 text-amber-500" />
                        ) : (
                            <ArrowUpDown className="w-3.5 h-3.5 opacity-40 hover:opacity-100" />
                        )}
                    </span>
                </div>
            </th>
        )
    }

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[700px]">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                    <tr>
                        {renderHeader('Kumaş Adı', 'name')}
                        {renderHeader('Kod', 'sku')}
                        {renderHeader('Renk', 'color')}
                        {renderHeader('En (cm)', 'widthCm', 'center')}
                        {renderHeader('Gramaj', 'gsm', 'center')}
                        {renderHeader('Stok (m)', 'quantity', 'center')}
                        {renderHeader('Fiyat ($)', 'unitPrice', 'right')}
                        {renderHeader('Kritik', 'reorderLevel', 'center')}
                        <th className="px-4 py-4 w-12"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {sortedMaterials.map((item) => {
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
        </div>
    )
}
