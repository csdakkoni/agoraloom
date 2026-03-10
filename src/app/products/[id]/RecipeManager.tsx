'use client'

import { useState } from 'react'
import { Plus, Trash2, Calculator, Save, Info } from 'lucide-react'
import { updateProductRecipe } from '@/app/actions/product'

type Material = {
    id: number
    name: string
    unit: string
    quantity: number // Mevcut stok
}

type RecipeItem = {
    materialId: number
    quantity: number
    wasteFactor: number
    calculationType: 'FIXED' | 'DYNAMIC_HEIGHT'
}

export function RecipeManager({ productId, initialRecipes, materials }: any) {
    const [recipes, setRecipes] = useState<RecipeItem[]>(
        initialRecipes.map((r: any) => ({
            materialId: r.materialId,
            quantity: r.quantity,
            wasteFactor: r.wasteFactor,
            calculationType: r.quantity === 0 ? 'DYNAMIC_HEIGHT' : 'FIXED'
        })) || []
    )
    const [isSaving, setIsSaving] = useState(false)

    const addIngredient = () => {
        setRecipes([...recipes, {
            materialId: materials[0]?.id || 0,
            quantity: 1,
            wasteFactor: 1.10,
            calculationType: 'FIXED'
        }])
    }

    const removeIngredient = (index: number) => {
        const newRecipes = [...recipes]
        newRecipes.splice(index, 1)
        setRecipes(newRecipes)
    }

    const updateIngredient = (index: number, field: keyof RecipeItem, value: any) => {
        const newRecipes = [...recipes]
        newRecipes[index] = { ...newRecipes[index], [field]: value }
        setRecipes(newRecipes)
    }

    const handleSave = async () => {
        setIsSaving(true)
        const formData = new FormData()
        formData.append('recipes', JSON.stringify(recipes))
        await updateProductRecipe(productId, formData)
        setIsSaving(false)
        alert('Reçete ve Hesaplama Kuralı Kaydedildi! ✅')
    }

    return (
        <div className="space-y-6">
            {/* Information Box */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex gap-3 text-sm text-blue-800">
                <Info className="w-5 h-5 flex-shrink-0" />
                <div>
                    <p className="font-semibold">Nasıl Çalışır?</p>
                    <p className="mt-1 opacity-90">
                        <strong>Sabit:</strong> Her siparişte standart miktar düşer (Örn: İplik, Etiket). <br />
                        <strong>Dinamik (Boy'a Göre):</strong> Siparişin Yüksekliği (Inch) x 0.0254 x Fire Payı formülü ile hesaplanır. Kumaşlar için bunu seçin.
                    </p>
                </div>
            </div>

            {/* List */}
            <div className="space-y-3">
                {recipes.map((item, idx) => (
                    <div key={idx} className="flex gap-3 items-start bg-slate-50 p-4 rounded-lg border border-slate-200">

                        {/* 1. Malzeme Seçimi */}
                        <div className="flex-1 min-w-[200px]">
                            <label className="text-xs font-bold text-slate-500 mb-1.5 block uppercase tracking-wide">Malzeme</label>
                            <select
                                value={item.materialId}
                                onChange={(e) => updateIngredient(idx, 'materialId', Number(e.target.value))}
                                className="w-full text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-amber-500"
                            >
                                {materials.map((m: Material) => (
                                    <option key={m.id} value={m.id}>
                                        {m.name} ({m.unit})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* 2. Hesaplama Tipi */}
                        <div className="w-40">
                            <label className="text-xs font-bold text-slate-500 mb-1.5 block uppercase tracking-wide">Hesaplama</label>
                            <select
                                value={item.calculationType}
                                onChange={(e) => updateIngredient(idx, 'calculationType', e.target.value)}
                                className="w-full text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-amber-500"
                            >
                                <option value="FIXED">Sabit Miktar</option>
                                <option value="DYNAMIC_HEIGHT">Dinamik (Boy)</option>
                            </select>
                        </div>

                        {/* 3. Miktar / Formül */}
                        <div className="w-32">
                            <label className="text-xs font-bold text-slate-500 mb-1.5 block uppercase tracking-wide">
                                {item.calculationType === 'FIXED' ? 'Miktar' : 'Baz Miktar'}
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    step="0.01"
                                    value={item.quantity}
                                    disabled={item.calculationType === 'DYNAMIC_HEIGHT'}
                                    placeholder={item.calculationType === 'DYNAMIC_HEIGHT' ? 'Otomatik' : '0.00'}
                                    onChange={(e) => updateIngredient(idx, 'quantity', Number(e.target.value))}
                                    className="w-full text-sm bg-white border border-slate-300 rounded-lg pl-3 pr-2 py-2 outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-slate-100 disabled:text-slate-400"
                                />
                            </div>
                        </div>

                        {/* 4. Fire Oranı */}
                        <div className="w-24">
                            <label className="text-xs font-bold text-slate-500 mb-1.5 block uppercase tracking-wide">Fire</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    step="0.01"
                                    value={item.wasteFactor}
                                    onChange={(e) => updateIngredient(idx, 'wasteFactor', Number(e.target.value))}
                                    className="w-full text-sm bg-white border border-slate-300 rounded-lg pl-3 pr-2 py-2 outline-none focus:ring-2 focus:ring-amber-500"
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">x</div>
                            </div>
                        </div>

                        <button
                            onClick={() => removeIngredient(idx)}
                            className="mt-6 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                            title="Sil"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                ))}

                {recipes.length === 0 && (
                    <div className="text-center py-12 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl">
                        <p className="text-slate-500 mb-2">Bu ürün için henüz malzeme tanımlanmamış.</p>
                        <p className="text-xs text-slate-400">Hangi kumaşların kullanıldığını ekleyerek başlayın.</p>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <button
                    onClick={addIngredient}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors border border-amber-200 shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Malzeme Ekle
                </button>

                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-8 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 text-sm font-bold disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Kaydediliyor...' : 'Kuralı Kaydet'}
                </button>
            </div>
        </div>
    )
}
