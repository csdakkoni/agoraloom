'use client'

import { Printer } from 'lucide-react'

type OrderItem = {
    id: number
    productName: string
    quantity: number
    widthInch: number | null
    heightInch: number | null
    fabricCode: string | null
    fabricColor: string | null
    selectedOptions: string | null
}

type Order = {
    id: number
    customerName: string | null
    notes: string | null
    orderDate: Date | string
    status: string
    items: OrderItem[]
}

function inchToCm(inch: number): number {
    return Math.ceil(inch * 2.54)
}

export function TailorReceipt({ order }: { order: Order }) {
    const handlePrint = () => {
        window.print()
    }

    const orderDate = new Date(order.orderDate)

    return (
        <>
            {/* Print Button */}
            <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20 text-sm font-bold no-print"
            >
                <Printer className="w-4 h-4" />
                Terzi Fişi Yazdır
            </button>

            {/* Printable Receipt - Hidden on screen, shown only when printing */}
            <div className="hidden" data-receipt>
                <div
                    className="font-mono text-sm"
                    style={{ width: '80mm', padding: '4mm', margin: '0 auto' }}
                >
                    {/* Header */}
                    <div className="text-center border-b-2 border-dashed border-black pb-3 mb-3">
                        <div className="text-lg font-extrabold tracking-wide">AgoraLoom</div>
                        <div className="text-xs mt-0.5 font-semibold">TERZİ İŞ EMRİ</div>
                    </div>

                    {/* Order Info */}
                    <div className="border-b border-dashed border-black pb-2 mb-3 text-xs">
                        <div className="flex justify-between">
                            <span className="font-bold">Sipariş No:</span>
                            <span>#{order.id}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-bold">Tarih:</span>
                            <span>{orderDate.toLocaleDateString('tr-TR')}</span>
                        </div>
                        {order.customerName && (
                            <div className="flex justify-between">
                                <span className="font-bold">Müşteri:</span>
                                <span>{order.customerName}</span>
                            </div>
                        )}
                    </div>

                    {/* Items */}
                    <div className="mb-3">
                        <div className="text-xs font-bold text-center border-b border-black pb-1 mb-2">
                            ÜRÜN DETAYLARI
                        </div>
                        {order.items.map((item, idx) => (
                            <div key={item.id} className="mb-3 pb-2 border-b border-dotted border-gray-400 last:border-b-0">
                                <div className="font-bold text-sm">
                                    {idx + 1}. {item.productName}
                                </div>
                                {item.selectedOptions && (
                                    <div className="text-xs mt-0.5 ml-3 text-gray-600 font-semibold">
                                        ▸ {item.selectedOptions}
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-0 text-xs mt-1 ml-3">
                                    <div>
                                        <span className="text-gray-600">Adet: </span>
                                        <span className="font-bold text-base">{item.quantity}</span>
                                    </div>
                                    {item.fabricCode && (
                                        <div>
                                            <span className="text-gray-600">Kumaş: </span>
                                            <span className="font-bold">{item.fabricCode}{item.fabricColor ? ` (${item.fabricColor})` : ''}</span>
                                        </div>
                                    )}
                                </div>
                                {(item.widthInch || item.heightInch) && (
                                    <div className="text-xs mt-1 ml-3">
                                        <div>
                                            <span className="text-gray-600">En: </span>
                                            <span className="font-bold text-base">{item.widthInch ? inchToCm(item.widthInch) : '—'}cm</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Boy: </span>
                                            <span className="font-bold text-base">{item.heightInch ? inchToCm(item.heightInch) : '—'}cm</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Notes */}
                    {order.notes && (
                        <div className="border-t border-dashed border-black pt-2 mb-3">
                            <div className="text-xs font-bold mb-1">NOTLAR:</div>
                            <div className="text-xs whitespace-pre-wrap">{order.notes}</div>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="text-center border-t-2 border-dashed border-black pt-3 mt-3">
                        <div className="text-xs text-gray-500">
                            {orderDate.toLocaleDateString('tr-TR')} {orderDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-xs mt-1 text-gray-400">- - - ✂ - - -</div>
                    </div>
                </div>
            </div>
        </>
    )
}
