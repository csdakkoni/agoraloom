'use client'

import { useState } from 'react'
import { Plus, Trash2, Save } from 'lucide-react'
import { createOrder } from '@/app/actions/order'
import { useRouter } from 'next/navigation'

type Product = {
    id: number
    name: string
    sku: string
    color: string
}

type Fabric = {
    id: number
    name: string
    sku: string | null
    color: string
}

export function NewOrderForm({ products, fabrics }: { products: Product[], fabrics: Fabric[] }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [customerName, setCustomerName] = useState('')
    const [notes, setNotes] = useState('')
    const [items, setItems] = useState([{
        productId: products[0]?.id || 0,
        widthInch: 0,
        heightInch: 0,
        quantity: 1,
        fabricCode: ''
    }])

    const addItem = () => {
        setItems([...items, {
            productId: products[0]?.id || 0,
            widthInch: 0,
            heightInch: 0,
            quantity: 1,
            fabricCode: ''
        }])
    }

    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...items]
        newItems[index] = { ...newItems[index], [field]: value }
        setItems(newItems)
    }

    const removeItem = (index: number) => {
        const newItems = [...items]
        newItems.splice(index, 1)
        setItems(newItems)
    }


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            await createOrder({
                customerName,
                notes: notes || undefined,
                items: items.map(item => ({
                    ...item,
                    fabricCode: item.fabricCode || undefined,
                    productName: products.find(p => p.id === Number(item.productId))?.name || 'Unknown'
                }))
            })
            router.push('/orders')
        } catch (error) {
            alert('Sipariş oluşturulurken hata oluştu.')
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* Customer Info */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-semibold text-lg mb-4 text-slate-900 border-b border-slate-100 pb-2">Müşteri Bilgileri</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Müşteri Adı / Unvanı</label>
                        <input
                            required
                            value={customerName}
                            onChange={e => setCustomerName(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                            placeholder="Örn: John Doe"
                        />
                    </div>
                </div>
            </div>

            {/* Notes */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-semibold text-lg mb-4 text-slate-900 border-b border-slate-100 pb-2">Terzi Notları</h3>
                <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                    placeholder="Terziye özel notlar (opsiyonel)..."
                />
            </div>

            {/* Items */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                    <h3 className="font-semibold text-lg text-slate-900">Sipariş Kalemleri</h3>
                    <button
                        type="button"
                        onClick={addItem}
                        className="flex items-center gap-1 text-sm text-amber-600 font-medium hover:bg-amber-50 px-3 py-1.5 rounded-lg transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Ürün Ekle
                    </button>
                </div>

                <div className="space-y-4">
                    {items.map((item, idx) => (
                        <div key={idx} className="flex flex-col md:flex-row gap-4 items-start md:items-end bg-slate-50/50 p-4 rounded-lg border border-slate-200">
                            {/* Product Select */}
                            <div className="flex-1 w-full md:w-auto">
                                <label className="text-xs font-medium text-slate-500 mb-1 block">Ürün</label>
                                <select
                                    value={item.productId}
                                    onChange={e => updateItem(idx, 'productId', Number(e.target.value))}
                                    className="w-full text-sm bg-white border border-slate-300 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-amber-500"
                                >
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} - {p.color} ({p.sku})</option>
                                    ))}
                                </select>
                            </div>

                            {/* Dimensions */}
                            <div className="flex gap-2 w-full md:w-auto">
                                <div className="w-24">
                                    <label className="text-xs font-medium text-slate-500 mb-1 block">En (Inch)</label>
                                    <input
                                        type="number"
                                        value={item.widthInch}
                                        onChange={e => updateItem(idx, 'widthInch', Number(e.target.value))}
                                        className="w-full text-sm bg-white border border-slate-300 rounded-md px-2 py-2 outline-none"
                                        placeholder="0"
                                    />
                                </div>
                                <div className="w-24">
                                    <label className="text-xs font-medium text-slate-500 mb-1 block">Boy (Inch)</label>
                                    <input
                                        type="number"
                                        value={item.heightInch}
                                        onChange={e => updateItem(idx, 'heightInch', Number(e.target.value))}
                                        className="w-full text-sm bg-white border border-slate-300 rounded-md px-2 py-2 outline-none"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            {/* Fabric Selection */}
                            <div className="w-44">
                                <label className="text-xs font-medium text-slate-500 mb-1 block">Kumaş</label>
                                <select
                                    value={item.fabricCode}
                                    onChange={e => updateItem(idx, 'fabricCode', e.target.value)}
                                    className="w-full text-sm bg-white border border-slate-300 rounded-md px-2 py-2 outline-none focus:ring-2 focus:ring-amber-500"
                                >
                                    <option value="">Kumaş Seçin...</option>
                                    {fabrics.map(f => (
                                        <option key={f.id} value={f.sku || f.name}>
                                            {f.name} - {f.color} {f.sku ? `(${f.sku})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Qty */}
                            <div className="w-20">
                                <label className="text-xs font-medium text-slate-500 mb-1 block">Adet</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={e => updateItem(idx, 'quantity', Number(e.target.value))}
                                    className="w-full text-sm bg-white border border-slate-300 rounded-md px-2 py-2 outline-none font-bold text-center"
                                />
                            </div>

                            <button
                                type="button"
                                onClick={() => removeItem(idx)}
                                className="text-slate-400 hover:text-red-500 p-2 transition-colors self-end md:self-center"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    ))}
                </div>

            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-4 pt-4">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-6 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                    İptal
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-8 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20 text-sm font-bold disabled:opacity-70"
                >
                    <Save className="w-4 h-4" />
                    {loading ? 'Oluşturuluyor...' : 'Siparişi Oluştur'}
                </button>
            </div>
        </form>
    )
}
