'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, CheckSquare, StickyNote, Activity, Wallet, Clock } from 'lucide-react'

export default function Sidebar() {
  const pathname = usePathname()
  const navItems = [
    { name: 'Painel', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Tarefas', href: '/', icon: CheckSquare },
    { name: 'Rotina', href: '/rotina', icon: Clock },
    { name: 'Notas', href: '/notes', icon: StickyNote },
    { name: 'Treino', href: '/treino', icon: Activity },
    { name: 'Finanças', href: '/finance', icon: Wallet },
  ]

  return (
    <>
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-300 h-screen fixed top-0 left-0 z-50">
        <div className="p-6 text-xl font-bold text-white flex items-center gap-2">
          <span className="text-2xl">🌀</span> Sumidouro
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map(item => {
            const isActive = pathname === item.href
            return (
              <Link key={item.name} href={item.href} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive ? 'bg-emerald-500 text-slate-900 font-bold' : 'hover:bg-slate-800 hover:text-white'}`}>
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </aside>

      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-slate-900 text-slate-300 flex justify-around items-center h-16 z-50 border-t border-slate-800 pb-safe">
        {navItems.map(item => {
          const isActive = pathname === item.href
          return (
            <Link key={item.name} href={item.href} className={`flex flex-col items-center p-2 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`}>
              <item.icon className="w-6 h-6" />
              <span className="text-[10px] mt-1">{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
