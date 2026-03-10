'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    ShoppingBag,
    Package,
    Settings,
    Scissors,
    Box
} from 'lucide-react'
import { cn } from '@/lib/utils'

const menuItems = [
    { icon: LayoutDashboard, label: 'Panel', href: '/' },
    { icon: ShoppingBag, label: 'Siparişler', href: '/orders' },
    { icon: Package, label: 'Stok (Kumaş)', href: '/inventory' },
    { icon: Box, label: 'Stok Kartları', href: '/products' },
]

export function Sidebar() {
    const pathname = usePathname()

    return (
        <aside className="w-64 bg-slate-900 text-white h-screen flex flex-col fixed left-0 top-0 border-r border-slate-800 shadow-xl z-50">
            <div className="p-6 border-b border-slate-800">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                    AgoraLoom
                </h1>
                <p className="text-xs text-slate-400 mt-1">ERP Sistemi</p>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
                                isActive
                                    ? "bg-amber-500/10 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.1)]"
                                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                            )}
                        >
                            <item.icon className={cn("w-5 h-5", isActive ? "text-amber-500" : "text-slate-500 group-hover:text-white")} />
                            <span className="font-medium">{item.label}</span>
                            {isActive && (
                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                            )}
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 border-t border-slate-800">
                <div className="flex items-center gap-3 px-4 py-3 bg-slate-800/50 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-orange-600 flex items-center justify-center text-xs font-bold text-white">
                        AL
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">Admin User</p>
                        <p className="text-xs text-slate-400 truncate">admin@agoraloom.com</p>
                    </div>
                </div>
            </div>
        </aside>
    )
}
