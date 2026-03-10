import {
  ShoppingCart,
  AlertTriangle,
  Package,
  Scissors,
  ArrowRight,
  ClipboardList
} from 'lucide-react'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export default async function Home() {
  const [orders, products, materials] = await Promise.all([
    prisma.order.findMany({ orderBy: { orderDate: 'desc' }, take: 5, include: { items: true } }),
    prisma.product.count(),
    prisma.material.findMany({ where: { type: 'FABRIC' } })
  ])

  const pendingOrders = orders.filter(o => o.status === 'PENDING').length
  const cuttingOrders = orders.filter(o => o.status === 'CUTTING').length
  const totalOrders = await prisma.order.count()
  const lowStockFabrics = materials.filter(m => m.reorderLevel && m.quantity <= m.reorderLevel)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Panel Özet</h2>
          <p className="text-slate-500 mt-1">İşletmenizin genel durumunu buradan takip edebilirsiniz.</p>
        </div>
        <Link
          href="/orders/new"
          className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-colors"
        >
          + Yeni Sipariş
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Toplam Sipariş"
          value={String(totalOrders)}
          sub={`${pendingOrders} bekliyor, ${cuttingOrders} terzide`}
          icon={ShoppingCart}
        />
        <StatsCard
          title="Terzideki Siparişler"
          value={String(cuttingOrders)}
          sub="Üretimde olan siparişler"
          icon={ClipboardList}
          highlight={cuttingOrders > 0}
        />
        <StatsCard
          title="Tanımlı Ürünler"
          value={String(products)}
          sub="Stok kartlarında kayıtlı"
          icon={Package}
        />
        <StatsCard
          title="Kumaş Türleri"
          value={String(materials.length)}
          sub={lowStockFabrics.length > 0 ? `${lowStockFabrics.length} kritik stok` : 'Stoklar yeterli'}
          icon={Scissors}
          highlight={lowStockFabrics.length > 0}
        />
      </div>

      {/* Recent Activity & Critical Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-lg">Son Siparişler</h3>
            <Link href="/orders" className="text-sm text-amber-600 font-medium hover:text-amber-700 flex items-center gap-1">
              Tümünü Gör <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {orders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3">Sipariş No</th>
                    <th className="px-6 py-3">Müşteri</th>
                    <th className="px-6 py-3">Tutar</th>
                    <th className="px-6 py-3">Durum</th>
                    <th className="px-6 py-3">Tarih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <Link href={`/orders/${order.id}`} className="font-medium text-amber-600 hover:text-amber-700">
                          #{order.id}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-slate-700">{order.customerName || '—'}</td>
                      <td className="px-6 py-4 font-mono text-slate-700">${order.totalAmount.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {new Date(order.orderDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400">
              <ShoppingCart className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Henüz sipariş yok.</p>
              <Link href="/orders/new" className="text-amber-600 font-medium text-sm mt-2 inline-block hover:text-amber-700">
                İlk siparişi oluşturun →
              </Link>
            </div>
          )}
        </div>

        {/* Critical Stock Alerts */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 h-fit">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-red-100 text-red-600 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-lg">Kritik Stoklar</h3>
          </div>

          {lowStockFabrics.length > 0 ? (
            <div className="space-y-4">
              {lowStockFabrics.map((fabric) => (
                <div key={fabric.id} className="p-3 border border-slate-100 rounded-lg bg-slate-50/50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="text-sm font-medium text-slate-900">{fabric.name}</h4>
                      <p className="text-xs text-slate-500">{fabric.sku || '—'}</p>
                    </div>
                    <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">Acil</span>
                  </div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-500">Mevcut: <strong className="text-slate-900">{fabric.quantity} m</strong></span>
                    <span className="text-slate-500">Min: {fabric.reorderLevel} m</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-red-500 h-1.5 rounded-full"
                      style={{ width: `${Math.min((fabric.quantity / (fabric.reorderLevel || 1)) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-slate-400">
              <p className="text-sm">Tüm stoklar yeterli seviyede 👍</p>
            </div>
          )}

          <Link
            href="/inventory"
            className="w-full mt-6 py-2.5 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors block text-center"
          >
            Stokları Görüntüle
          </Link>
        </div>
      </div>
    </div>
  )
}

function StatsCard({ title, value, sub, icon: Icon, highlight }: {
  title: string, value: string, sub: string, icon: any, highlight?: boolean
}) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className="text-2xl font-bold mt-1 text-slate-900">{value}</h3>
        </div>
        <div className={`p-2.5 rounded-lg ${highlight ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-600'}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-4 text-sm">
        <span className={highlight ? 'text-red-600 font-medium' : 'text-slate-500'}>{sub}</span>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-700',
    CUTTING: 'bg-blue-100 text-blue-700',
    COMPLETED: 'bg-green-100 text-green-700',
    SHIPPED: 'bg-purple-100 text-purple-700',
    DELIVERED: 'bg-emerald-100 text-emerald-700',
  }
  const labels: Record<string, string> = {
    PENDING: 'Bekliyor',
    CUTTING: 'Terzide',
    COMPLETED: 'Tamamlandı',
    SHIPPED: 'Kargoda',
    DELIVERED: 'Teslim Edildi',
  }
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles[status] || styles.PENDING}`}>
      {labels[status] || status}
    </span>
  )
}
