import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { RecipeManager } from './RecipeManager'

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const product = await prisma.product.findUnique({
        where: { id: Number(id) },
        include: {
            recipes: {
                include: {
                    material: true
                }
            }
        }
    })

    if (!product) {
        notFound()
    }

    const materials = await prisma.material.findMany({
        orderBy: { name: 'asc' }
    })

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">{product.name}</h2>
                <div className="flex items-center gap-4 mt-2">
                    <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-md text-sm font-mono border border-slate-200">
                        SKU: {product.sku}
                    </span>
                    {product.etsyId && (
                        <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-md text-sm font-mono border border-orange-200">
                            Etsy ID: {product.etsyId}
                        </span>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Details */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="font-semibold text-lg mb-4">Ürün Bilgileri</h3>
                        <div className="space-y-4 text-sm">
                            <div>
                                <span className="block text-slate-500 mb-1">Renk</span>
                                <p className="text-slate-900 font-medium">{product.color}</p>
                            </div>
                            <div>
                                <span className="block text-slate-500 mb-1">Açıklama</span>
                                <p className="text-slate-900">{product.description || 'Girilmemiş'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Recipe Manager */}
                <div className="lg:col-span-2">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <div className="mb-6">
                            <h3 className="font-semibold text-lg">Ürün Reçetesi (BOM)</h3>
                            <p className="text-sm text-slate-500">Bu ürün üretilirken kullanılan malzemeleri ve miktarları tanımlayın.</p>
                        </div>

                        <RecipeManager
                            productId={product.id}
                            initialRecipes={product.recipes}
                            materials={materials}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
