import {
  ShoppingCart,
  AlertTriangle,
  Clock,
  TrendingUp,
  ArrowRight,
  CalendarClock,
  Package
} from 'lucide-react'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const sourceConfig: Record<string, { label: string, emoji: string, style: string }> = {
  ETSY: { label: 'Etsy', emoji: '🟠', style: 'bg-orange-50 text-orange-700 border-orange-200' },
  SHOPIFY: { label: 'Shopify', emoji: '🟢', style: 'bg-green-50 text-green-700 border-green-200' },
  MANUAL: { label: 'Manuel', emoji: '📋', style: 'bg-slate-100 text-slate-600 border-slate-200' },
}

export default async function Home() {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const [allOrders, materials] = await Promise.all([
    prisma.order.findMany({
      orderBy: { orderDate: 'desc' },
      include: { items: true }
    }),
    prisma.material.findMany({ where: { type: 'FABRIC' } })
  ])

  // Stats
  const totalOrders = allOrders.length
  const pendingOrders = allOrders.filter(o => o.status === 'PENDING')
  const cuttingOrders = allOrders.filter(o => o.status === 'CUTTING')
  const overdueOrders = allOrders.filter(o =>
    o.deadline && new Date(o.deadline) < now && !['SHIPPED', 'DELIVERED'].includes(o.status)
  )
  const todayOrders = allOrders.filter(o => new Date(o.orderDate) >= todayStart)
  const recentOrders = allOrders.slice(0, 7)
  const lowStockFabrics = materials.filter(m => m.reorderLevel && m.quantity <= m.reorderLevel)

  // Source distribution
  const sourceCounts = allOrders.reduce((acc, o) => {
    const src = o.source || 'MANUAL'
    acc[src] = (acc[src] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Panel</h2>
          <p className="text-slate-500 mt-1 text-sm">İşletmenizin genel durumunu buradan takip edin.</p>
        </div>
        <Link
          href="/orders/new"
          className="px-5 py-2.5 bg-amber-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-colors text-center sm:text-left"
        >
          + Yeni Sipariş
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard
          title="Toplam Sipariş"
          value={String(totalOrders)}
          sub={`${pendingOrders.length} bekliyor, ${cuttingOrders.length} terzide`}
          icon={ShoppingCart}
        />
        <StatsCard
          title="Terzideki İşler"
          value={String(cuttingOrders.length)}
          sub={pendingOrders.length > 0 ? `${pendingOrders.length} sipariş sırada` : 'Sırada iş yok'}
          icon={Package}
          highlight={cuttingOrders.length > 0}
          highlightColor="blue"
        />
        <StatsCard
          title="Geciken Siparişler"
          value={String(overdueOrders.length)}
          sub={overdueOrders.length > 0 ? 'Teslim tarihi geçmiş!' : 'Geciken yok 👍'}
          icon={CalendarClock}
          highlight={overdueOrders.length > 0}
          highlightColor="red"
        />
        <StatsCard
          title="Bugünkü Siparişler"
          value={String(todayOrders.length)}
          sub={`${todayOrders.filter(o => o.source === 'ETSY').length} Etsy, ${todayOrders.filter(o => o.source === 'SHOPIFY').length} Shopify`}
          icon={TrendingUp}
          highlight={todayOrders.length > 0}
          highlightColor="green"
        />
      </div>

      {/* Source Distribution */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Sipariş Kaynakları</h3>
        <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
          {Object.entries(sourceConfig).map(([key, cfg]) => {
            const count = sourceCounts[key] || 0
            const pct = totalOrders > 0 ? Math.round((count / totalOrders) * 100) : 0
            return (
              <div key={key} className="flex items-center gap-3">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full border ${cfg.style}`}>
                  {cfg.emoji} {cfg.label}
                </span>
                <div>
                  <span className="text-lg font-bold text-slate-900">{count}</span>
                  <span className="text-xs text-slate-400 ml-1">(%{pct})</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Overdue Alert Banner */}
      {overdueOrders.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <div className="p-2 bg-red-100 rounded-lg text-red-600 flex-shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-red-800 text-sm">⏰ {overdueOrders.length} sipariş gecikmiş!</h4>
            <div className="mt-2 space-y-1">
              {overdueOrders.slice(0, 5).map(o => (
                <Link key={o.id} href={`/orders/${o.id}`} className="block text-sm text-red-700 hover:text-red-900">
                  <span className="font-mono font-bold">#{o.id}</span> — {o.customerName || 'İsimsiz'} —
                  Teslim: {new Date(o.deadline!).toLocaleDateString('tr-TR')}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-lg">Son Siparişler</h3>
            <Link href="/orders" className="text-sm text-amber-600 font-medium hover:text-amber-700 flex items-center gap-1">
              Tümünü Gör <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {recentOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3">#</th>
                    <th className="px-5 py-3">Kaynak</th>
                    <th className="px-5 py-3">Müşteri</th>
                    <th className="px-5 py-3">Durum</th>
                    <th className="px-5 py-3">Teslim</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentOrders.map((order) => {
                    const src = sourceConfig[order.source || 'MANUAL'] || sourceConfig.MANUAL
                    const isOverdue = order.deadline && new Date(order.deadline) < now && !['SHIPPED', 'DELIVERED'].includes(order.status)
                    return (
                      <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3">
                          <Link href={`/orders/${order.id}`} className="font-bold text-amber-600 hover:text-amber-700">
                            #{order.id}
                          </Link>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full border ${src.style}`}>
                            {src.emoji} {src.label}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-slate-700">{order.customerName || '—'}</td>
                        <td className="px-5 py-3">
                          <StatusBadge status={order.status} />
                        </td>
                        <td className="px-5 py-3">
                          {order.deadline ? (
                            <span className={`text-xs font-medium ${isOverdue ? 'text-red-600 font-bold' : 'text-slate-500'}`}>
                              {isOverdue && '⚠ '}{new Date(order.deadline).toLocaleDateString('tr-TR')}
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
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
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 h-fit">
          <div className="flex items-center gap-2 mb-4">
            <div className={`p-2 rounded-lg ${lowStockFabrics.length > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
              {lowStockFabrics.length > 0 ? <AlertTriangle className="w-5 h-5" /> : <Package className="w-5 h-5" />}
            </div>
            <h3 className="font-semibold text-lg">Stok Durumu</h3>
            {lowStockFabrics.length > 0 && (
              <span className="ml-auto text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full border border-red-200">
                {lowStockFabrics.length} kritik
              </span>
            )}
          </div>

          {lowStockFabrics.length > 0 ? (
            <div className="space-y-3">
              {lowStockFabrics.map((fabric) => (
                <div key={fabric.id} className="p-3 border border-red-100 rounded-lg bg-red-50/50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="text-sm font-medium text-slate-900">{fabric.name}</h4>
                      <p className="text-xs text-slate-500">{fabric.color} · {fabric.sku || '—'}</p>
                    </div>
                    <span className="text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded border border-red-200">KRİTİK</span>
                  </div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-500">Mevcut: <strong className="text-red-600">{fabric.quantity} m</strong></span>
                    <span className="text-slate-500">Min: {fabric.reorderLevel} m</span>
                  </div>
                  <div className="w-full bg-red-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-red-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min((fabric.quantity / (fabric.reorderLevel || 1)) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <div className="text-3xl mb-2">✅</div>
              <p className="text-sm font-medium">Tüm stoklar yeterli</p>
            </div>
          )}

          <Link
            href="/inventory"
            className="w-full mt-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors block text-center"
          >
            Stokları Görüntüle
          </Link>
        </div>
      </div>
    </div>
  )
}

function StatsCard({ title, value, sub, icon: Icon, highlight, highlightColor }: {
  title: string, value: string, sub: string, icon: any, highlight?: boolean, highlightColor?: 'red' | 'blue' | 'green'
}) {
  const colorMap = {
    red: { bg: 'bg-red-50', text: 'text-red-600', subText: 'text-red-600' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', subText: 'text-blue-600' },
    green: { bg: 'bg-green-50', text: 'text-green-600', subText: 'text-green-600' },
  }
  const colors = highlight && highlightColor ? colorMap[highlightColor] : null

  return (
    <div className={`p-5 rounded-xl border shadow-sm hover:shadow-md transition-shadow ${colors ? `${colors.bg} border-${highlightColor}-200` : 'bg-white border-slate-200'}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className={`text-3xl font-bold mt-1 ${colors ? colors.text : 'text-slate-900'}`}>{value}</h3>
        </div>
        <div className={`p-2.5 rounded-lg ${colors ? `${colors.bg} ${colors.text}` : 'bg-slate-50 text-slate-500'}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-3 text-sm">
        <span className={colors ? `${colors.subText} font-medium` : 'text-slate-500'}>{sub}</span>
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
    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${styles[status] || styles.PENDING}`}>
      {labels[status] || status}
    </span>
  )
}
