'use client'

import { Trash2 } from 'lucide-react'
import { deleteOrder } from '@/app/actions/order'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function DeleteOrderButton({ orderId }: { orderId: number }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const handleDelete = async () => {
        if (!confirm('Bu siparişi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) return
        setLoading(true)
        try {
            await deleteOrder(orderId)
            router.push('/orders')
        } catch {
            alert('Sipariş silinemedi.')
            setLoading(false)
        }
    }

    return (
        <button
            onClick={handleDelete}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
            <Trash2 className="w-4 h-4" />
            {loading ? 'Siliniyor...' : 'Siparişi Sil'}
        </button>
    )
}
