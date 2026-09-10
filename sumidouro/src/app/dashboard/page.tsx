import Link from 'next/link'
import { getDashboardSummary } from './actions'
import { CheckSquare, Wallet, Activity, ArrowRight, Flame } from 'lucide-react'

export default async function Dashboard() {
  const summary = await getDashboardSummary()
  const hoje = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' }).format(new Date())

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  return (
    <main className="p-6 md:p-10 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <header>
        <h1 className="text-3xl font-bold text-slate-800">Olá, Robert! 👋</h1>
        <p className="text-slate-500 capitalize mt-1">{hoje}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* WIDGET: TAREFAS */}
        <Link href="/" className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group flex flex-col justify-between h-48">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-blue-50 text-blue-500 rounded-xl">
              <CheckSquare className="w-6 h-6" />
            </div>
            <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
          </div>
          <div>
            <p className="text-4xl font-black text-slate-800">{summary.pendingTasks}</p>
            <p className="text-sm font-medium text-gray-400 mt-1">Tarefas pendentes hoje</p>
          </div>
        </Link>

        {/* WIDGET: FINANÇAS */}
        <Link href="/finance" className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group flex flex-col justify-between h-48">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-green-50 text-green-500 rounded-xl">
              <Wallet className="w-6 h-6" />
            </div>
            <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-green-500 transition-colors" />
          </div>
          <div>
            <p className={`text-3xl font-black ${summary.balance >= 0 ? 'text-slate-800' : 'text-red-500'}`}>
              {formatCurrency(summary.balance)}
            </p>
            <p className="text-sm font-medium text-gray-400 mt-1">Saldo atual da carteira</p>
          </div>
        </Link>

        {/* WIDGET: TREINO */}
        <div className="bg-slate-900 p-6 rounded-2xl shadow-lg flex flex-col justify-between h-48 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 transform group-hover:scale-110 transition-transform">
            <Activity className="w-32 h-32 text-white" />
          </div>
          <div className="relative z-10 flex justify-between items-start">
            <div className="p-3 bg-slate-800 text-emerald-400 rounded-xl border border-slate-700">
              <Flame className="w-6 h-6" />
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-xl font-bold text-white mb-2">Circuito Diário</p>
            <Link href="/treino" className="inline-flex items-center gap-2 text-sm font-semibold bg-emerald-500 text-slate-900 px-4 py-2 rounded-lg hover:bg-emerald-400 transition-colors">
              Começar Agora <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

      </div>

      {/* WIDGET: INSIGHT DO DIA */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-100">
        <h3 className="text-indigo-800 font-bold mb-2 uppercase tracking-wider text-xs">Foco do Dia</h3>
        <p className="text-indigo-900 text-lg font-medium italic">"A disciplina é a ponte entre metas e realizações."</p>
      </div>

    </main>
  )
}
