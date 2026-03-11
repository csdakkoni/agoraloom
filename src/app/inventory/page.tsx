import { prisma } from '@/lib/prisma'
import { AddMaterialButton } from '@/components/AddMaterialButton'
import { InventoryTable } from '@/components/InventoryTable'

export const dynamic = 'force-dynamic'

export default async function InventoryPage() {
    const materials = await prisma.material.findMany({
        orderBy: { name: 'asc' },
        select: {
            id: true, name: true, sku: true, color: true, type: true,
            quantity: true, unit: true, unitPrice: true,
            widthCm: true, gsm: true, reorderLevel: true
        }
    })

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Kumaş & Stok Yönetimi</h2>
                    <p className="text-slate-500 text-sm">Kumaş stoklarınızın güncel durumları. Düzenlemek için hücreye tıklayın.</p>
                </div>
                <AddMaterialButton />
            </div>

            <InventoryTable materials={materials} />
        </div>
    )
}
