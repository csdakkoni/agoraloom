'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { createMaterial } from '@/app/actions/inventory'
import { useRouter } from 'next/navigation'

export function AddMaterialButton() {
    const [isOpen, setIsOpen] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()

    const handleSubmit = async (formData: FormData) => {
        setError('')
        try {
            await createMaterial(formData)
            setIsOpen(false)
            router.refresh()
        } catch (e: any) {
            setError(e?.message || 'Bir hata oluştu.')
        }
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/20 text-sm font-medium"
            >
                <Plus className="w-4 h-4" />
                Yeni Kumaş Ekle
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <h3 className="text-lg font-bold text-slate-900">Yeni Kumaş Ekle</h3>
                            <button onClick={() => { setIsOpen(false); setError('') }} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form action={handleSubmit} className="p-6 space-y-4">
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                                    {error}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700">Kumaş Adı</label>
                                    <input name="name" required className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none" placeholder="Örn: Keten Kumaş" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700">Kumaş Kodu</label>
                                    <input name="sku" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none" placeholder="Örn: KMS-001" />
                                </div>
                            </div>

                            {/* Hidden defaults for fabric */}
                            <input type="hidden" name="type" value="FABRIC" />
                            <input type="hidden" name="unit" value="METER" />

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700">Miktar (Metre)</label>
                                    <input name="quantity" type="number" step="0.01" required className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none" placeholder="0.00" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700">Birim Fiyat ($)</label>
                                    <input name="unitPrice" type="number" step="0.01" required className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none" placeholder="0.00" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700">Kritik Seviye</label>
                                    <input name="reorderLevel" type="number" step="1" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none" placeholder="10" />
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => { setIsOpen(false); setError('') }} className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-lg">İptal</button>
                                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-lg shadow-md hover:shadow-lg transition-all">Kaydet</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
