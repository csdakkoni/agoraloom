'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Check, X, RefreshCw, Settings2 } from 'lucide-react'
import { updateOrderItemOptions } from '@/app/actions/order'

type OptionType = {
    id: number
    label: string
}

type OptionGroupType = {
    id: number
    name: string
    options: OptionType[]
}

/**
 * Inline editor for order item options.
 * Shows current selections as a badge, click to edit with dropdowns.
 */
export function InlineOptionsEditor({
    itemId,
    currentOptions,
    optionGroups,
}: {
    itemId: number
    currentOptions: string | null
    optionGroups: OptionGroupType[]
}) {
    const [editing, setEditing] = useState(false)
    const [saving, setSaving] = useState(false)
    const [selections, setSelections] = useState<Record<string, string>>({})
    const router = useRouter()
    const ref = useRef<HTMLDivElement>(null)

    // Parse currentOptions string back into selections map
    useEffect(() => {
        if (currentOptions) {
            const map: Record<string, string> = {}
            currentOptions.split(',').forEach(part => {
                const [key, val] = part.split(':').map(s => s.trim())
                if (key && val) map[key] = val
            })
            setSelections(map)
        } else {
            setSelections({})
        }
    }, [currentOptions])

    // Close on outside click
    useEffect(() => {
        if (!editing) return
        const handleClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setEditing(false)
            }
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [editing])

    const handleSave = async () => {
        setSaving(true)
        try {
            const entries = Object.entries(selections).filter(([, v]) => v)
            const optionsStr = entries.length > 0
                ? entries.map(([k, v]) => `${k}: ${v}`).join(', ')
                : null
            await updateOrderItemOptions(itemId, optionsStr)
            setEditing(false)
            router.refresh()
        } catch (e) {
            console.error(e)
        } finally {
            setSaving(false)
        }
    }

    // No option groups defined for this product — show simple text
    if (optionGroups.length === 0) {
        return currentOptions ? (
            <span className="text-xs text-slate-500">{currentOptions}</span>
        ) : (
            <span className="text-slate-300 text-xs">—</span>
        )
    }

    if (!editing) {
        return (
            <button
                onClick={(e) => { e.stopPropagation(); setEditing(true) }}
                className="group/opt inline-flex items-center gap-1.5 text-left rounded px-1 -mx-1 hover:bg-indigo-50 transition-colors min-h-[28px]"
                title="Seçenekleri düzenle"
            >
                {currentOptions ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-md border border-indigo-200">
                        {currentOptions}
                    </span>
                ) : (
                    <span className="text-xs text-slate-400 italic">Seçenek seç...</span>
                )}
                <Pencil className="w-3 h-3 text-slate-300 opacity-0 group-hover/opt:opacity-100 transition-opacity flex-shrink-0" />
            </button>
        )
    }

    return (
        <div ref={ref} className="bg-white border border-indigo-300 rounded-lg p-3 shadow-lg space-y-2 min-w-[200px]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-1.5 mb-1">
                <Settings2 className="w-3.5 h-3.5 text-indigo-500" />
                <span className="text-xs font-semibold text-indigo-700">Seçenekler</span>
            </div>
            {optionGroups.map(group => (
                <div key={group.id}>
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">
                        {group.name}
                    </label>
                    <select
                        value={selections[group.name] || ''}
                        onChange={e => {
                            const newSel = { ...selections }
                            if (e.target.value) {
                                newSel[group.name] = e.target.value
                            } else {
                                delete newSel[group.name]
                            }
                            setSelections(newSel)
                        }}
                        className="w-full text-sm bg-white border border-slate-300 rounded-md px-2 py-1.5 outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                    >
                        <option value="">Seçiniz...</option>
                        {group.options.map(opt => (
                            <option key={opt.id} value={opt.label}>{opt.label}</option>
                        ))}
                    </select>
                </div>
            ))}
            <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-100">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                    {saving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                    Kaydet
                </button>
                <button
                    onClick={() => setEditing(false)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
                >
                    <X className="w-3 h-3" />
                </button>
            </div>
        </div>
    )
}
