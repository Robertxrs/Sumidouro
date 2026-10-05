'use client'
import { useEffect, useState } from 'react'
import { 
  getFinanceData, 
  addTransaction, 
  updateTransaction, 
  deleteTransaction, 
  toggleTransactionRealized, 
  resetRecurringMonth 
} from './actions'
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  CalendarDays, 
  Plus, 
  Repeat, 
  Pencil, 
  Trash2, 
  X, 
  Check, 
  CheckCircle2, 
  Clock, 
  RotateCcw, 
  Archive, 
  ListChecks, 
  Sparkles 
} from 'lucide-react'

export default function FinancePage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'PENDING' | 'COMPLETED'>('PENDING')

  // Form states for creation
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState('EXPENSE')
  const [isRecurring, setIsRecurring] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)

  // Edit Modal states
  const [editingTx, setEditingTx] = useState<any | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editAmount, setEditAmount] = useState('')
  const [editType, setEditType] = useState('EXPENSE')
  const [editIsRecurring, setEditIsRecurring] = useState(false)
  const [editIsCompleted, setEditIsCompleted] = useState(false)

  const loadData = async () => {
    const result = await getFinanceData()
    setData(result)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const currentMonthName = new Date().toLocaleDateString('pt-BR', { month: 'long' })
  const formattedMonthName = currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1)

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !amount) return
    
    await addTransaction({
      title,
      amount: parseFloat(amount),
      type,
      isRecurring,
      isCompleted: isRecurring ? false : isCompleted
    })
    
    setTitle('')
    setAmount('')
    setIsRecurring(false)
    setIsCompleted(false)
    loadData()
  }

  const handleOpenEdit = (tx: any) => {
    setEditingTx(tx)
    setEditTitle(tx.title)
    setEditAmount(tx.amount.toString())
    setEditType(tx.type)
    setEditIsRecurring(tx.isRecurring)
    setEditIsCompleted(tx.isCompleted || false)
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTx || !editTitle || !editAmount) return
    
    await updateTransaction(editingTx.id, {
      title: editTitle,
      amount: parseFloat(editAmount),
      type: editType,
      isRecurring: editIsRecurring,
      isCompleted: editIsCompleted
    })
    
    setEditingTx(null)
    loadData()
  }

  const handleToggleRealized = async (tx: any) => {
    if (!data?.currentMonthKey) return
    await toggleTransactionRealized(tx.id, data.currentMonthKey)
    loadData()
  }

  const handleResetRecurring = async () => {
    if (confirm(`Deseja resetar o status de todas as contas recorrentes para o mês de ${formattedMonthName}?`)) {
      await resetRecurringMonth()
      loadData()
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta transação?')) {
      await deleteTransaction(id)
      loadData()
    }
  }

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
      Carregando finanças...
    </div>
  )

  // Separar transações ativas vs concluídas
  // Ativas: recorrentes (com status do mês) + não-recorrentes NÃO concluídas
  // Concluídas: não-recorrentes que já foram marcadas como concluídas
  const currentMonthKey = data.currentMonthKey
  const pendingTransactions = data.transactions.filter((t: any) => {
    if (t.isRecurring) return true // Recorrentes ficam sempre acessíveis nas ativas
    return !t.isCompleted
  })

  const completedTransactions = data.transactions.filter((t: any) => {
    return !t.isRecurring && t.isCompleted
  })

  const recurringTransactions = data.transactions.filter((t: any) => t.isRecurring)

  return (
    <main className="min-h-screen bg-slate-950 p-4 sm:p-6 md:p-10 font-sans text-slate-100">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2 text-white">
              <Wallet className="text-blue-400" /> Minhas Finanças
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Controle de contas pagas, recebidas, recorrentes e histórico consolidado
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-blue-400 flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5" /> Mês: {formattedMonthName}
            </span>
          </div>
        </header>

        {/* CARDS DE RESUMO FINANCEIRO */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-lg">
            <p className="text-xs text-slate-400 font-semibold mb-1 uppercase tracking-wider">Saldo Realizado</p>
            <p className={`text-2xl font-extrabold ${data.realizedBalance >= 0 ? 'text-white' : 'text-red-400'}`}>
              {formatCurrency(data.realizedBalance)}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Efetivamente recebido / pago</p>
          </div>

          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-lg">
            <p className="text-xs text-slate-400 font-semibold mb-1 flex items-center gap-1.5 uppercase tracking-wider">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400"/> Receitas (Mês)
            </p>
            <p className="text-2xl font-extrabold text-emerald-400">{formatCurrency(data.monthlyIncome)}</p>
            <p className="text-[11px] text-slate-500 mt-1">Realizado: {formatCurrency(data.realizedIncome)}</p>
          </div>

          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-lg">
            <p className="text-xs text-slate-400 font-semibold mb-1 flex items-center gap-1.5 uppercase tracking-wider">
              <TrendingDown className="w-3.5 h-3.5 text-red-400"/> Despesas (Mês)
            </p>
            <p className="text-2xl font-extrabold text-red-400">{formatCurrency(data.monthlyExpense)}</p>
            <p className="text-[11px] text-slate-500 mt-1">Pago: {formatCurrency(data.realizedExpense)}</p>
          </div>

          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-lg">
            <p className="text-xs text-slate-400 font-semibold mb-1 flex items-center gap-1.5 uppercase tracking-wider">
              <CalendarDays className="w-3.5 h-3.5 text-blue-400"/> Projeção Total
            </p>
            <p className={`text-2xl font-extrabold ${data.projectedBalance >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
              {formatCurrency(data.projectedBalance)}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Previsto ao quitar todas as contas</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* COLUNA ESQUERDA: Formulário e Recorrentes com Reset Mensal */}
          <div className="space-y-6">
            
            {/* FORMULÁRIO DE NOVA TRANSAÇÃO */}
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-lg">
              <h2 className="font-semibold mb-4 flex items-center gap-2 text-white">
                <Plus className="w-5 h-5 text-emerald-400"/> Nova Transação
              </h2>
              <form onSubmit={handleAddTransaction} className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 uppercase font-semibold">Título</label>
                  <input 
                    type="text" 
                    value={title} 
                    onChange={e => setTitle(e.target.value)} 
                    className="w-full mt-1 p-2.5 bg-slate-950 border border-slate-800 rounded-xl outline-none text-white placeholder-slate-500 focus:border-blue-500 transition-colors text-sm" 
                    placeholder="Ex: Salário, Aluguel, Supermercado..." 
                    required 
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 uppercase font-semibold">Valor (R$)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={amount} 
                    onChange={e => setAmount(e.target.value)} 
                    className="w-full mt-1 p-2.5 bg-slate-950 border border-slate-800 rounded-xl outline-none text-white placeholder-slate-500 focus:border-blue-500 transition-colors text-sm font-semibold" 
                    placeholder="0.00" 
                    required 
                  />
                </div>

                <div className="flex gap-4 p-1 bg-slate-950 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setType('EXPENSE')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                      type === 'EXPENSE'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <TrendingDown className="w-3.5 h-3.5" /> Despesa
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('INCOME')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                      type === 'INCOME'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5" /> Receita
                  </button>
                </div>

                {/* Opção Recorrente */}
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer bg-slate-950 p-3 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={isRecurring} 
                    onChange={e => {
                      setIsRecurring(e.target.checked)
                      if (e.target.checked) setIsCompleted(false)
                    }} 
                    className="rounded border-slate-700 text-blue-500 focus:ring-0"
                  />
                  <div className="flex items-center gap-1.5">
                    <Repeat className="w-3.5 h-3.5 text-blue-400"/> 
                    <span>Conta recorrente (mensal)</span>
                  </div>
                </label>

                {/* Opção Já Realizada (apenas para não-recorrentes) */}
                {!isRecurring && (
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer bg-slate-950 p-3 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={isCompleted} 
                      onChange={e => setIsCompleted(e.target.checked)} 
                      className="rounded border-slate-700 text-emerald-500 focus:ring-0"
                    />
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400"/> 
                      <span>Já foi realizada (paga / recebida)</span>
                    </div>
                  </label>
                )}

                <button 
                  type="submit" 
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/10 active:scale-[0.99]"
                >
                  Adicionar Transação
                </button>
              </form>
            </div>

            {/* PAINEL DE CONTAS RECORRENTES COM RESET MENSAL */}
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-white flex items-center gap-2 text-sm">
                  <Repeat className="w-4 h-4 text-blue-400"/> Contas Recorrentes
                </h2>
                {recurringTransactions.length > 0 && (
                  <button
                    onClick={handleResetRecurring}
                    className="text-[11px] text-slate-400 hover:text-amber-400 flex items-center gap-1 hover:bg-slate-800 px-2 py-1 rounded-lg transition-colors"
                    title="Reseta o status de todas as recorrentes no mês"
                  >
                    <RotateCcw className="w-3 h-3" /> Resetar Mês
                  </button>
                )}
              </div>

              <p className="text-[11px] text-slate-400">
                Marcadas como realizadas resetam a cada novo mês ({formattedMonthName}).
              </p>

              <ul className="space-y-2.5">
                {recurringTransactions.map((t: any) => {
                  const isPaidThisMonth = t.lastPaidMonth === currentMonthKey
                  return (
                    <li 
                      key={'rec-' + t.id} 
                      className={`p-3 rounded-xl border transition-all ${
                        isPaidThisMonth
                          ? 'bg-slate-950/80 border-emerald-900/40'
                          : 'bg-slate-950 border-slate-800/80'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-200 truncate">{t.title}</p>
                          <p className={`text-xs font-bold mt-0.5 ${t.type === 'INCOME' ? 'text-emerald-400' : 'text-red-400'}`}>
                            {t.type === 'INCOME' ? '+' : '-'}{formatCurrency(t.amount)}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button 
                            onClick={() => handleOpenEdit(t)} 
                            className="p-1 text-slate-400 hover:text-blue-400 rounded-lg hover:bg-slate-800 transition-colors" 
                            title="Editar"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDelete(t.id)} 
                            className="p-1 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors" 
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Botão de Toggle do Mês Atual */}
                      <button
                        onClick={() => handleToggleRealized(t)}
                        className={`w-full mt-2 py-1.5 px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                          isPaidThisMonth
                            ? 'bg-emerald-950/60 border-emerald-800/60 text-emerald-400 hover:bg-emerald-900/60'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                        }`}
                      >
                        {isPaidThisMonth ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{t.type === 'INCOME' ? 'Recebido' : 'Descontado'} em {formattedMonthName}</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3.5 h-3.5 text-amber-400" />
                            <span>Marcar como {t.type === 'INCOME' ? 'recebido' : 'descontado'} neste mês</span>
                          </>
                        )}
                      </button>
                    </li>
                  )
                })}
                {recurringTransactions.length === 0 && (
                  <p className="text-xs text-slate-500 py-3 text-center">Nenhuma conta recorrente cadastrada.</p>
                )}
              </ul>
            </div>
          </div>

          {/* COLUNA DIREITA: Transações com Abas (Ativas vs Histórico de Concluídas) */}
          <div className="lg:col-span-2">
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-lg h-full flex flex-col">
              
              {/* HEADER DE ABAS */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-800 gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('PENDING')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      activeTab === 'PENDING'
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                        : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    <ListChecks className="w-3.5 h-3.5" />
                    <span>Transações Ativas</span>
                    <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-900/80 border border-slate-800 text-slate-300">
                      {pendingTransactions.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab('COMPLETED')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      activeTab === 'COMPLETED'
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                        : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    <Archive className="w-3.5 h-3.5" />
                    <span>Histórico de Concluídas</span>
                    <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-900/80 border border-slate-800 text-slate-300">
                      {completedTransactions.length}
                    </span>
                  </button>
                </div>

                <span className="text-xs text-slate-500">
                  {activeTab === 'PENDING' 
                    ? 'Contas em aberto e recorrentes' 
                    : 'Transações finalizadas'}
                </span>
              </div>

              {/* LISTA DE TRANSAÇÕES */}
              <div className="space-y-3 flex-1">
                
                {/* ABA DE TRANSAÇÕES ATIVAS */}
                {activeTab === 'PENDING' && (
                  <>
                    {pendingTransactions.map((t: any) => {
                      const isPaidRec = t.isRecurring && t.lastPaidMonth === currentMonthKey

                      return (
                        <div 
                          key={t.id} 
                          className="flex items-center justify-between p-3.5 sm:p-4 hover:bg-slate-800/50 rounded-2xl transition-all border border-slate-800/60 bg-slate-950/40 group"
                        >
                          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                            {/* Botão de Toggle Realizado */}
                            <button
                              onClick={() => handleToggleRealized(t)}
                              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border transition-transform active:scale-90 flex-shrink-0 ${
                                isPaidRec
                                  ? 'bg-emerald-950 border-emerald-500 text-emerald-400'
                                  : 'border-slate-700 hover:border-emerald-500 hover:bg-emerald-950/30 text-transparent hover:text-emerald-400'
                              }`}
                              title={
                                t.isRecurring
                                  ? isPaidRec ? 'Marcar como pendente no mês' : 'Marcar como quitado no mês'
                                  : 'Marcar como realizada (vai para concluídas)'
                              }
                            >
                              <Check className="w-4 h-4" />
                            </button>

                            <div className="min-w-0">
                              <p className="font-semibold text-sm text-slate-100 truncate">{t.title}</p>
                              <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                <span className="text-[11px] text-slate-400">
                                  {new Date(t.date).toLocaleDateString('pt-BR')}
                                </span>

                                {t.isRecurring ? (
                                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                    isPaidRec
                                      ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400'
                                      : 'bg-blue-950/60 border-blue-800 text-blue-300'
                                  }`}>
                                    {isPaidRec ? `Recorrente • Pago em ${formattedMonthName}` : 'Recorrente • Pendente'}
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-amber-300/80">
                                    Em aberto
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
                            <div className="text-right">
                              <p className={`font-bold text-sm sm:text-base ${t.type === 'INCOME' ? 'text-emerald-400' : 'text-red-400'}`}>
                                {t.type === 'INCOME' ? '+' : '-'}{formatCurrency(t.amount)}
                              </p>
                            </div>

                            {/* Botões de Ação */}
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleOpenEdit(t)}
                                className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors"
                                title="Editar"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(t.id)}
                                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                                title="Excluir"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}

                    {pendingTransactions.length === 0 && (
                      <div className="text-center py-12 text-slate-500 text-sm flex flex-col items-center">
                        <Sparkles className="w-8 h-8 text-slate-600 mb-2 opacity-60" />
                        <p className="font-semibold text-slate-400">Nenhuma transação ativa no momento!</p>
                        <p className="text-xs text-slate-600 mt-0.5">Todas as contas foram concluídas ou você não possui registros.</p>
                      </div>
                    )}
                  </>
                )}

                {/* ABA DE HISTÓRICO DE CONCLUÍDAS */}
                {activeTab === 'COMPLETED' && (
                  <>
                    {completedTransactions.map((t: any) => (
                      <div 
                        key={t.id} 
                        className="flex items-center justify-between p-3.5 sm:p-4 bg-slate-950/70 rounded-2xl border border-slate-800/80 group transition-all"
                      >
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                          {/* Botão para Reabrir/Desmarcar */}
                          <button
                            onClick={() => handleToggleRealized(t)}
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border border-emerald-500/80 bg-emerald-950/60 text-emerald-400 hover:bg-slate-800 hover:text-amber-400 hover:border-amber-400 transition-all flex-shrink-0"
                            title="Reabrir transação (mover de volta para Ativas)"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>

                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-slate-300 line-through decoration-slate-600 truncate">
                              {t.title}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[11px] text-slate-500">
                                {new Date(t.date).toLocaleDateString('pt-BR')}
                              </span>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950/40 border border-emerald-900/60 text-emerald-400 flex items-center gap-1">
                                <Check className="w-2.5 h-2.5" /> Realizada
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
                          <div className="text-right">
                            <p className={`font-bold text-sm sm:text-base opacity-80 ${t.type === 'INCOME' ? 'text-emerald-400' : 'text-slate-300'}`}>
                              {t.type === 'INCOME' ? '+' : '-'}{formatCurrency(t.amount)}
                            </p>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleToggleRealized(t)}
                              className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors text-xs flex items-center gap-1"
                              title="Reabrir transação"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(t.id)}
                              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {completedTransactions.length === 0 && (
                      <div className="text-center py-12 text-slate-500 text-sm flex flex-col items-center">
                        <Archive className="w-8 h-8 text-slate-600 mb-2 opacity-60" />
                        <p className="font-semibold text-slate-400">Nenhuma transação no histórico de concluídas</p>
                        <p className="text-xs text-slate-600 mt-0.5">Marque transações ativas como realizadas para arquivá-las aqui.</p>
                      </div>
                    )}
                  </>
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

              {!editIsRecurring && (
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <input
                    type="checkbox"
                    checked={editIsCompleted}
                    onChange={(e) => setEditIsCompleted(e.target.checked)}
                  />
                  <CheckCircle2 className="w-4 h-4 text-emerald-400"/> Transação já realizada (concluída)
                </label>
              )}

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
