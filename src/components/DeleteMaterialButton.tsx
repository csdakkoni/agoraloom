'use client'

import { Trash2 } from 'lucide-react'
import { deleteMaterial } from '@/app/actions/product'
import { useRouter } from 'next/navigation'

export function DeleteMaterialButton({ id }: { id: number }) {
    const router = useRouter()

    const handleDelete = async () => {
        if (!confirm('Bu kumaşı silmek istediğinize emin misiniz?')) return
        try {
            await deleteMaterial(id)
            router.refresh()
        } catch {
            alert('Silme başarısız oldu.')
        }
    }

    return (
        <button
            onClick={handleDelete}
            className="text-red-400 hover:text-red-600 font-medium text-xs opacity-0 group-hover:opacity-100 transition-all"
            title="Sil"
        >
            <Trash2 className="w-4 h-4" />
        </button>
    )
}
