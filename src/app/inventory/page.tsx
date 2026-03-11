import { prisma } from '@/lib/prisma'
import { Search, Filter } from 'lucide-react'
import { AddMaterialButton } from '@/components/AddMaterialButton'
import { DeleteMaterialButton } from '@/components/DeleteMaterialButton'

export const dynamic = 'force-dynamic'

export default async function InventoryPage() {
    const materials = await prisma.material.findMany({
        orderBy: { name: 'asc' }
    })

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Kumaş & Stok Yönetimi</h2>
                    <p className="text-slate-500 text-sm">Kumaş stoklarınızın güncel durumları.</p>
                </div>
                <AddMaterialButton />
            </div>

            {/* Filters */}
            <div className="flex gap-3 items-center bg-white p-2 rounded-lg border border-slate-200 shadow-sm w-fit">
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Malzeme ara..."
                        className="pl-9 pr-4 py-1.5 text-sm outline-none bg-transparent w-64"
                    />
                </div>
                <div className="w-px h-6 bg-slate-200" />
                <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 rounded-md">
                    <Filter className="w-4 h-4" />
                    Filtrele
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4">Malzeme Adı</th>
                            <th className="px-6 py-4">SKU / Kod</th>
                            <th className="px-6 py-4">Renk</th>
                            <th className="px-6 py-4">Tip</th>
                            <th className="px-6 py-4 text-center">Stok Durumu</th>
                            <th className="px-6 py-4 text-right">Birim Fiyat</th>
                            <th className="px-6 py-4 text-right">Toplam Değer</th>
                            <th className="px-6 py-4"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {materials.map((item) => {
                            const isLowStock = item.reorderLevel && item.quantity <= item.reorderLevel

                            return (
                                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4 font-medium text-slate-900">
                                        {item.name}
                                        {isLowStock && (
                                            <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded border border-red-200">
                                                KRİTİK
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 font-mono text-xs">{item.sku || '-'}</td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-slate-700 bg-slate-100 px-2 py-1 rounded-full">{item.color}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                                            {item.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex flex-col items-center">
                                            <span className={`font-bold ${isLowStock ? 'text-red-600' : 'text-slate-900'}`}>
                                                {item.quantity} {item.unit}
                                            </span>
                                            {item.reorderLevel && (
                                                <span className="text-[10px] text-slate-400">Min: {item.reorderLevel}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono">${item.unitPrice.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-right font-mono font-medium text-slate-900">
                                        ${(item.quantity * item.unitPrice).toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <DeleteMaterialButton id={item.id} />
                                    </td>
                                </tr>
                            )
                        })}
                        {materials.length === 0 && (
                            <tr>
                                <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                                    Henüz kayıtlı malzeme yok.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
