'use client'
import { useEffect, useState } from 'react'
import { getFinanceData, addTransaction, updateTransaction, deleteTransaction } from './actions'
import { Wallet, TrendingUp, TrendingDown, CalendarDays, Plus, Repeat, Pencil, Trash2, X, Check } from 'lucide-react'

export default function FinancePage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Form states for creation
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState('EXPENSE')
  const [isRecurring, setIsRecurring] = useState(false)

  // Edit Modal states
  const [editingTx, setEditingTx] = useState<any | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editAmount, setEditAmount] = useState('')
  const [editType, setEditType] = useState('EXPENSE')
  const [editIsRecurring, setEditIsRecurring] = useState(false)

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

  const handleOpenEdit = (tx: any) => {
    setEditingTx(tx)
    setEditTitle(tx.title)
    setEditAmount(tx.amount.toString())
    setEditType(tx.type)
    setEditIsRecurring(tx.isRecurring)
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTx || !editTitle || !editAmount) return
    
    await updateTransaction(editingTx.id, {
      title: editTitle,
      amount: parseFloat(editAmount),
      type: editType,
      isRecurring: editIsRecurring
    })
    
    setEditingTx(null)
    loadData()
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta transação?')) {
      await deleteTransaction(id)
      loadData()
    }
  }

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Carregando finanças...</div>

  return (
    <main className="min-h-screen bg-slate-950 p-6 md:p-10 font-sans text-slate-100">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <header className="flex justify-between items-center">
          <h1 className="text-2xl font-bold flex items-center gap-2 text-white">
            <Wallet className="text-blue-400" /> Minhas Finanças
          </h1>
        </header>

        {/* CARDS DE RESUMO */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-lg">
            <p className="text-sm text-slate-400 font-medium mb-1">Saldo Atual</p>
            <p className={`text-2xl font-bold ${data.currentBalance >= 0 ? 'text-white' : 'text-red-400'}`}>
              {formatCurrency(data.currentBalance)}
            </p>
          </div>
          <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-lg">
            <p className="text-sm text-slate-400 font-medium mb-1 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-400"/> Receitas (Mês)</p>
            <p className="text-2xl font-bold text-emerald-400">{formatCurrency(data.monthlyIncome)}</p>
          </div>
          <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-lg">
            <p className="text-sm text-slate-400 font-medium mb-1 flex items-center gap-2"><TrendingDown className="w-4 h-4 text-red-400"/> Despesas (Mês)</p>
            <p className="text-2xl font-bold text-red-400">{formatCurrency(data.monthlyExpense)}</p>
          </div>
          <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-lg">
            <p className="text-sm text-slate-400 font-medium mb-1 flex items-center gap-2"><CalendarDays className="w-4 h-4 text-blue-400"/> Projeção</p>
            <p className="text-2xl font-bold text-blue-400">{formatCurrency(data.projectedBalance)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* COLUNA ESQUERDA: Formulário e Recorrentes */}
          <div className="space-y-6">
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg">
              <h2 className="font-semibold mb-4 flex items-center gap-2 text-white"><Plus className="w-5 h-5 text-slate-400"/> Nova Transação</h2>
              <form onSubmit={handleAddTransaction} className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 uppercase font-semibold">Título</label>
                  <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full mt-1 p-2 bg-slate-950 border border-slate-800 rounded-lg outline-none text-white placeholder-slate-500 focus:border-blue-500 transition-colors text-sm" placeholder="Ex: Conta de Luz" required />
                </div>
                <div>
                  <label className="text-xs text-slate-400 uppercase font-semibold">Valor (R$)</label>
                  <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="w-full mt-1 p-2 bg-slate-950 border border-slate-800 rounded-lg outline-none text-white placeholder-slate-500 focus:border-blue-500 transition-colors text-sm" placeholder="0.00" required />
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer text-slate-300">
                    <input type="radio" name="type" checked={type === 'EXPENSE'} onChange={() => setType('EXPENSE')} /> Despesa
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer text-slate-300">
                    <input type="radio" name="type" checked={type === 'INCOME'} onChange={() => setType('INCOME')} /> Receita
                  </label>
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <input type="checkbox" checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)} />
                  <Repeat className="w-4 h-4 text-blue-400"/> É uma conta recorrente (mensal)?
                </label>
                <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 rounded-lg transition-colors">
                  Adicionar
                </button>
              </form>
            </div>

            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg">
              <h2 className="font-semibold mb-4 flex items-center gap-2 text-white"><Repeat className="w-5 h-5 text-slate-400"/> Contas Recorrentes</h2>
              <ul className="space-y-3">
                {data.transactions.filter((t: any) => t.isRecurring).map((t: any) => (
                  <li key={'rec-'+t.id} className="flex justify-between items-center text-sm p-2 bg-slate-950 rounded-lg border border-slate-800 group">
                    <span className="text-slate-300">{t.title}</span>
                    <div className="flex items-center gap-2">
                      <span className={t.type === 'INCOME' ? 'text-emerald-400 font-medium' : 'text-red-400 font-medium'}>{formatCurrency(t.amount)}</span>
                      <button onClick={() => handleOpenEdit(t)} className="p-1 text-slate-400 hover:text-blue-400 rounded" title="Editar">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(t.id)} className="p-1 text-slate-400 hover:text-red-400 rounded" title="Excluir">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
                {data.transactions.filter((t: any) => t.isRecurring).length === 0 && <p className="text-xs text-slate-500">Nenhuma conta recorrente.</p>}
              </ul>
            </div>
          </div>

          {/* COLUNA DIREITA: Histórico com CRUD Completo */}
          <div className="lg:col-span-2">
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg h-full">
              <h2 className="font-semibold mb-6 text-white flex items-center justify-between">
                <span>Histórico de Transações</span>
                <span className="text-xs font-normal text-slate-400">{data.transactions.length} registros</span>
              </h2>
              <div className="space-y-3">
                {data.transactions.map((t: any) => (
                  <div key={t.id} className="flex items-center justify-between p-4 hover:bg-slate-800/60 rounded-xl transition-colors border border-slate-800/50 group">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${t.type === 'INCOME' ? 'bg-emerald-950/60 text-emerald-400 border-emerald-900/40' : 'bg-red-950/60 text-red-400 border-red-900/40'}`}>
                        {t.type === 'INCOME' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="font-medium text-slate-100">{t.title}</p>
                        <p className="text-xs text-slate-400">{new Date(t.date).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className={`font-bold ${t.type === 'INCOME' ? 'text-emerald-400' : 'text-red-400'}`}>
                          {t.type === 'INCOME' ? '+' : '-'}{formatCurrency(t.amount)}
                        </p>
                        {t.isRecurring && <span className="text-[10px] uppercase tracking-wider text-blue-400 font-semibold bg-blue-950/80 px-2 py-0.5 rounded-full border border-blue-900/50">Recorrente</span>}
                      </div>

                      {/* Botões de Ação CRUD */}
                      <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleOpenEdit(t)}
                          className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Editar transação"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Excluir transação"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {data.transactions.length === 0 && (
                  <div className="text-center py-10 text-slate-500 text-sm">
                    Nenhuma transação registrada ainda.
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* MODAL DE EDIÇÃO DE TRANSAÇÃO */}
      {editingTx && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-800 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Editar Transação</h3>
              <button 
                onClick={() => setEditingTx(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">Título</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white bg-slate-950 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">Valor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="w-full border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white bg-slate-950 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer text-slate-300">
                  <input
                    type="radio"
                    name="editType"
                    checked={editType === 'EXPENSE'}
                    onChange={() => setEditType('EXPENSE')}
                  /> Despesa
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer text-slate-300">
                  <input
                    type="radio"
                    name="editType"
                    checked={editType === 'INCOME'}
                    onChange={() => setEditType('INCOME')}
                  /> Receita
                </label>
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <input
                  type="checkbox"
                  checked={editIsRecurring}
                  onChange={(e) => setEditIsRecurring(e.target.checked)}
                />
                <Repeat className="w-4 h-4 text-blue-400"/> É uma conta recorrente (mensal)?
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTx(null)}
                  className="px-4 py-2 text-sm text-slate-400 hover:bg-slate-800 rounded-xl font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium shadow-sm"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
