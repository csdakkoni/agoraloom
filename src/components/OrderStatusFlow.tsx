'use client'

import { useState } from 'react'
import { updateOrderStatus } from '@/app/actions/order'
import { useRouter } from 'next/navigation'
import {
    Clock,
    Scissors,
    CheckCircle2,
    Truck,
    PackageCheck,
    ChevronRight
} from 'lucide-react'

const STATUSES = [
    { key: 'PENDING', label: 'Bekliyor', icon: Clock, color: 'amber' },
    { key: 'CUTTING', label: 'Terzide', icon: Scissors, color: 'blue' },
    { key: 'COMPLETED', label: 'Tamamlandı', icon: CheckCircle2, color: 'green' },
    { key: 'SHIPPED', label: 'Kargoda', icon: Truck, color: 'purple' },
    { key: 'DELIVERED', label: 'Teslim Edildi', icon: PackageCheck, color: 'emerald' },
]

export function OrderStatusFlow({ orderId, currentStatus }: { orderId: number, currentStatus: string }) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const currentIdx = STATUSES.findIndex(s => s.key === currentStatus)
    const nextStatus = currentIdx < STATUSES.length - 1 ? STATUSES[currentIdx + 1] : null

    const handleAdvance = async () => {
        if (!nextStatus) return
        setLoading(true)
        try {
            await updateOrderStatus(orderId, nextStatus.key)
            router.refresh()
        } catch (err) {
            alert('Durum güncellenirken hata oluştu.')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const colorClasses: Record<string, { bg: string, text: string, ring: string, bar: string }> = {
        amber: { bg: 'bg-amber-100', text: 'text-amber-700', ring: 'ring-amber-500', bar: 'bg-amber-500' },
        blue: { bg: 'bg-blue-100', text: 'text-blue-700', ring: 'ring-blue-500', bar: 'bg-blue-500' },
        green: { bg: 'bg-green-100', text: 'text-green-700', ring: 'ring-green-500', bar: 'bg-green-500' },
        purple: { bg: 'bg-purple-100', text: 'text-purple-700', ring: 'ring-purple-500', bar: 'bg-purple-500' },
        emerald: { bg: 'bg-emerald-100', text: 'text-emerald-700', ring: 'ring-emerald-500', bar: 'bg-emerald-500' },
    }

    return (
        <div className="space-y-6">
            {/* Status Steps */}
            <div className="flex items-center justify-between gap-1">
                {STATUSES.map((status, idx) => {
                    const isActive = idx === currentIdx
                    const isPast = idx < currentIdx
                    const colors = colorClasses[status.color]
                    const Icon = status.icon

                    return (
                        <div key={status.key} className="flex items-center flex-1">
                            <div className="flex flex-col items-center flex-1">
                                <div
                                    className={`
                                        w-10 h-10 rounded-full flex items-center justify-center mb-1.5 transition-all duration-300
                                        ${isActive ? `${colors.bg} ${colors.text} ring-2 ${colors.ring} ring-offset-2 scale-110` : ''}
                                        ${isPast ? `bg-green-500 text-white` : ''}
                                        ${!isActive && !isPast ? 'bg-slate-100 text-slate-400' : ''}
                                    `}
                                >
                                    {isPast ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                                </div>
                                <span className={`text-xs font-medium ${isActive ? colorClasses[status.color].text : isPast ? 'text-green-600' : 'text-slate-400'}`}>
                                    {status.label}
                                </span>
                            </div>
                            {idx < STATUSES.length - 1 && (
                                <div className={`h-0.5 w-6 flex-shrink-0 mt-[-18px] ${idx < currentIdx ? 'bg-green-400' : 'bg-slate-200'}`} />
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Advance Button */}
            {nextStatus && (
                <button
                    onClick={handleAdvance}
                    disabled={loading}
                    className={`
                        w-full py-3 rounded-xl font-bold text-white text-sm transition-all duration-200
                        flex items-center justify-center gap-2
                        ${colorClasses[nextStatus.color].bar} 
                        hover:opacity-90 shadow-lg disabled:opacity-60
                    `}
                >
                    {loading ? (
                        <span className="animate-pulse">Güncelleniyor...</span>
                    ) : (
                        <>
                            <nextStatus.icon className="w-4 h-4" />
                            {nextStatus.label} Olarak İşaretle
                            <ChevronRight className="w-4 h-4" />
                        </>
                    )}
                </button>
            )}

            {currentStatus === 'DELIVERED' && (
                <div className="text-center py-3 bg-emerald-50 rounded-xl border border-emerald-200">
                    <span className="text-emerald-700 font-bold text-sm flex items-center justify-center gap-2">
                        <PackageCheck className="w-5 h-5" />
                        Sipariş Tamamlandı & Teslim Edildi ✓
                    </span>
                </div>
            )}
        </div>
    )
}
