'use client'
import { useEffect, useState } from 'react'
import { getFinanceData, addTransaction } from './actions'
import { Wallet, TrendingUp, TrendingDown, CalendarDays, Plus, Repeat } from 'lucide-react'

export default function FinancePage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Form states
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState('EXPENSE')
  const [isRecurring, setIsRecurring] = useState(false)

  const loadData = async () => {
    const result = await getFinanceData()
    setData(result)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !amount) return
    
    await addTransaction({
      title,
      amount: parseFloat(amount),
      type,
      isRecurring
    })
    
    setTitle('')
    setAmount('')
    setIsRecurring(false)
    loadData()
  }

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-gray-500">Carregando finanças...</div>

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans text-slate-800">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <header className="flex justify-between items-center">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wallet className="text-blue-500" /> Minhas Finanças
          </h1>
        </header>

        {/* CARDS DE RESUMO */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-400 font-medium mb-1">Saldo Atual</p>
            <p className={`text-2xl font-bold ${data.currentBalance >= 0 ? 'text-slate-800' : 'text-red-500'}`}>
              {formatCurrency(data.currentBalance)}
            </p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-400 font-medium mb-1 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-green-500"/> Receitas (Mês)</p>
            <p className="text-2xl font-bold text-green-500">{formatCurrency(data.monthlyIncome)}</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-400 font-medium mb-1 flex items-center gap-2"><TrendingDown className="w-4 h-4 text-red-500"/> Despesas (Mês)</p>
            <p className="text-2xl font-bold text-red-500">{formatCurrency(data.monthlyExpense)}</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-400 font-medium mb-1 flex items-center gap-2"><CalendarDays className="w-4 h-4 text-blue-400"/> Projeção</p>
            <p className="text-2xl font-bold text-blue-500">{formatCurrency(data.projectedBalance)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* COLUNA ESQUERDA: Formulário e Recorrentes */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <h2 className="font-semibold mb-4 flex items-center gap-2"><Plus className="w-5 h-5 text-gray-400"/> Nova Transação</h2>
              <form onSubmit={handleAddTransaction} className="space-y-4">
                <div>
                  <label className="text-xs text-gray-500 uppercase font-semibold">Título</label>
                  <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full mt-1 p-2 bg-slate-50 border border-gray-200 rounded-lg outline-none focus:border-blue-400 transition-colors" placeholder="Ex: Conta de Luz" required />
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase font-semibold">Valor (R$)</label>
                  <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="w-full mt-1 p-2 bg-slate-50 border border-gray-200 rounded-lg outline-none focus:border-blue-400 transition-colors" placeholder="0.00" required />
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name="type" checked={type === 'EXPENSE'} onChange={() => setType('EXPENSE')} /> Despesa
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name="type" checked={type === 'INCOME'} onChange={() => setType('INCOME')} /> Receita
                  </label>
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer bg-slate-50 p-2 rounded-lg border border-gray-100">
                  <input type="checkbox" checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)} />
                  <Repeat className="w-4 h-4 text-blue-400"/> É uma conta recorrente (mensal)?
                </label>
                <button type="submit" className="w-full bg-slate-800 text-white font-medium py-3 rounded-lg hover:bg-slate-700 transition-colors">
                  Adicionar
                </button>
              </form>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <h2 className="font-semibold mb-4 flex items-center gap-2"><Repeat className="w-5 h-5 text-gray-400"/> Contas Recorrentes</h2>
              <ul className="space-y-3">
                {data.transactions.filter((t: any) => t.isRecurring).map((t: any) => (
                  <li key={'rec-'+t.id} className="flex justify-between items-center text-sm p-2 bg-slate-50 rounded-lg">
                    <span className="text-gray-700">{t.title}</span>
                    <span className={t.type === 'INCOME' ? 'text-green-500 font-medium' : 'text-red-500 font-medium'}>{formatCurrency(t.amount)}</span>
                  </li>
                ))}
                {data.transactions.filter((t: any) => t.isRecurring).length === 0 && <p className="text-xs text-gray-400">Nenhuma conta recorrente.</p>}
              </ul>
            </div>
          </div>

          {/* COLUNA DIREITA: Histórico */}
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-full">
              <h2 className="font-semibold mb-6">Histórico de Transações</h2>
              <div className="space-y-4">
                {data.transactions.map((t: any) => (
                  <div key={t.id} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-gray-100">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.type === 'INCOME' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {t.type === 'INCOME' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{t.title}</p>
                        <p className="text-xs text-gray-400">{new Date(t.date).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${t.type === 'INCOME' ? 'text-green-500' : 'text-red-500'}`}>
                        {t.type === 'INCOME' ? '+' : '-'}{formatCurrency(t.amount)}
                      </p>
                      {t.isRecurring && <span className="text-[10px] uppercase tracking-wider text-blue-500 font-semibold bg-blue-50 px-2 py-0.5 rounded-full">Recorrente</span>}
                    </div>
                  </div>
                ))}
                {data.transactions.length === 0 && (
                  <div className="text-center py-10 text-gray-400 text-sm">
                    Nenhuma transação registrada ainda.
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  )
}
