'use client'

import { useState } from 'react'
import { Plus, Trash2, X, Package, Scissors, Search } from 'lucide-react'
import { createProduct, deleteProduct, deleteMaterial } from '@/app/actions/product'
import { createMaterial } from '@/app/actions/inventory'
import { useRouter } from 'next/navigation'

type Product = {
    id: number
    name: string
    sku: string
    description: string | null
}

type Fabric = {
    id: number
    name: string
    sku: string | null
    quantity: number
    unit: string
    unitPrice: number
}

type Tab = 'products' | 'fabrics'

export function StockCards({ products, fabrics }: { products: Product[], fabrics: Fabric[] }) {
    const [tab, setTab] = useState<Tab>('products')
    const [showModal, setShowModal] = useState<Tab | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [search, setSearch] = useState('')
    const router = useRouter()

    // Product form state
    const [prodName, setProdName] = useState('')
    const [prodSku, setProdSku] = useState('')
    const [prodDesc, setProdDesc] = useState('')

    // Fabric form state
    const [fabName, setFabName] = useState('')
    const [fabSku, setFabSku] = useState('')
    const [fabQty, setFabQty] = useState('')
    const [fabPrice, setFabPrice] = useState('')
    const [fabReorder, setFabReorder] = useState('')

    const resetForms = () => {
        setProdName(''); setProdSku(''); setProdDesc('')
        setFabName(''); setFabSku(''); setFabQty(''); setFabPrice(''); setFabReorder('')
        setError('')
    }

    const handleAddProduct = async () => {
        setLoading(true); setError('')
        try {
            await createProduct({ name: prodName, sku: prodSku, description: prodDesc || undefined })
            setShowModal(null); resetForms(); router.refresh()
        } catch (e: any) { setError(e?.message || 'Hata oluştu.') }
        finally { setLoading(false) }
    }

    const handleAddFabric = async () => {
        setLoading(true); setError('')
        try {
            const fd = new FormData()
            fd.set('name', fabName)
            fd.set('sku', fabSku)
            fd.set('type', 'FABRIC')
            fd.set('unit', 'METER')
            fd.set('quantity', fabQty || '0')
            fd.set('unitPrice', fabPrice || '0')
            fd.set('reorderLevel', fabReorder)
            await createMaterial(fd)
            setShowModal(null); resetForms(); router.refresh()
        } catch (e: any) { setError(e?.message || 'Hata oluştu.') }
        finally { setLoading(false) }
    }

    const handleDeleteProduct = async (id: number) => {
        if (!confirm('Bu ürünü silmek istediğinize emin misiniz?')) return
        try { await deleteProduct(id); router.refresh() }
        catch { alert('Silme başarısız. Bu ürüne bağlı sipariş olabilir.') }
    }

    const handleDeleteFabric = async (id: number) => {
        if (!confirm('Bu kumaşı silmek istediğinize emin misiniz?')) return
        try { await deleteMaterial(id); router.refresh() }
        catch { alert('Silme başarısız. Bu kumaşa bağlı kayıt olabilir.') }
    }

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase())
    )
    const filteredFabrics = fabrics.filter(f =>
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        (f.sku || '').toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-6">
            {/* Tabs */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm w-fit">
                <button
                    onClick={() => { setTab('products'); setSearch('') }}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === 'products'
                        ? 'bg-slate-900 text-white shadow-md'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                        }`}
                >
                    <Package className="w-4 h-4" />
                    Ürünler ({products.length})
                </button>
                <button
                    onClick={() => { setTab('fabrics'); setSearch('') }}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === 'fabrics'
                        ? 'bg-slate-900 text-white shadow-md'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                        }`}
                >
                    <Scissors className="w-4 h-4" />
                    Kumaşlar ({fabrics.length})
                </button>
            </div>

            {/* Search + Add */}
            <div className="flex items-center justify-between gap-4">
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        type="text"
                        placeholder={tab === 'products' ? 'Ürün ara...' : 'Kumaş ara...'}
                        className="pl-9 pr-4 py-2 text-sm outline-none bg-white border border-slate-200 rounded-lg w-72 shadow-sm focus:ring-2 focus:ring-amber-500"
                    />
                </div>
                <button
                    onClick={() => { setShowModal(tab); resetForms() }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/20 text-sm font-medium"
                >
                    <Plus className="w-4 h-4" />
                    {tab === 'products' ? 'Yeni Ürün Ekle' : 'Yeni Kumaş Ekle'}
                </button>
            </div>

            {/* Products Table */}
            {tab === 'products' && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4">Ürün Adı</th>
                                <th className="px-6 py-4">Ürün Kodu</th>
                                <th className="px-6 py-4">Açıklama</th>
                                <th className="px-6 py-4 w-16"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredProducts.map(p => (
                                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <Package className="w-4 h-4" />
                                            </div>
                                            <span className="font-semibold text-slate-900">{p.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">{p.sku}</span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 max-w-xs truncate">{p.description || '—'}</td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => handleDeleteProduct(p.id)}
                                            className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredProducts.length === 0 && (
                                <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                                    {search ? 'Arama sonucu bulunamadı.' : 'Henüz ürün tanımlanmamış.'}
                                </td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Fabrics Table */}
            {tab === 'fabrics' && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4">Kumaş Adı</th>
                                <th className="px-6 py-4">Kumaş Kodu</th>
                                <th className="px-6 py-4 text-center">Stok (Metre)</th>
                                <th className="px-6 py-4 text-right">Birim Fiyat</th>
                                <th className="px-6 py-4 w-16"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredFabrics.map(f => (
                                <tr key={f.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <Scissors className="w-4 h-4" />
                                            </div>
                                            <span className="font-semibold text-slate-900">{f.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {f.sku ? (
                                            <span className="font-mono text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded border border-indigo-200">{f.sku}</span>
                                        ) : <span className="text-slate-400">—</span>}
                                    </td>
                                    <td className="px-6 py-4 text-center font-bold text-slate-900">{f.quantity} m</td>
                                    <td className="px-6 py-4 text-right font-mono text-slate-700">${f.unitPrice.toFixed(2)}</td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => handleDeleteFabric(f.id)}
                                            className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredFabrics.length === 0 && (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                    {search ? 'Arama sonucu bulunamadı.' : 'Henüz kumaş tanımlanmamış.'}
                                </td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add Product Modal */}
            {showModal === 'products' && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <h3 className="text-lg font-bold text-slate-900">Yeni Ürün Ekle</h3>
                            <button onClick={() => setShowModal(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-700">Ürün Adı</label>
                                <input value={prodName} onChange={e => setProdName(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none" placeholder="Örn: Perde, Yastık Kılıfı, Masa Örtüsü" />
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
                                <button onClick={() => setShowModal(null)} className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-lg">İptal</button>
                                <button onClick={handleAddProduct} disabled={loading || !prodName || !prodSku} className="px-6 py-2 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-lg shadow-md disabled:opacity-50 transition-all">{loading ? 'Ekleniyor...' : 'Kaydet'}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Fabric Modal */}
            {showModal === 'fabrics' && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <h3 className="text-lg font-bold text-slate-900">Yeni Kumaş Ekle</h3>
                            <button onClick={() => setShowModal(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700">Kumaş Adı</label>
                                    <input value={fabName} onChange={e => setFabName(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none" placeholder="Örn: Keten Kumaş" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700">Kumaş Kodu</label>
                                    <input value={fabSku} onChange={e => setFabSku(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none font-mono" placeholder="Örn: KMS-001" />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700">Stok (Metre)</label>
                                    <input value={fabQty} onChange={e => setFabQty(e.target.value)} type="number" step="0.01" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none" placeholder="0" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700">Birim Fiyat ($)</label>
                                    <input value={fabPrice} onChange={e => setFabPrice(e.target.value)} type="number" step="0.01" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none" placeholder="0" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700">Kritik Stok</label>
                                    <input value={fabReorder} onChange={e => setFabReorder(e.target.value)} type="number" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none" placeholder="10" />
                                </div>
                            </div>
                            <div className="pt-2 flex justify-end gap-3">
                                <button onClick={() => setShowModal(null)} className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-lg">İptal</button>
                                <button onClick={handleAddFabric} disabled={loading || !fabName} className="px-6 py-2 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-lg shadow-md disabled:opacity-50 transition-all">{loading ? 'Ekleniyor...' : 'Kaydet'}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
