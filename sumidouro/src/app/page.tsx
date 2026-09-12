'use client'

import { useState, useEffect } from 'react'
import { getTasks, getTaskLists, createTask } from './actions'
import { notifyWidgetRefresh } from '@/lib/widget'
import TaskItem from '@/components/TaskItem'
import { CheckCircle2, Plus, Inbox, Repeat, Sun, Tags, ListFilter, Sparkles } from 'lucide-react'

export default function Home() {
  const [tasks, setTasks] = useState<any[]>([])
  const [lists, setLists] = useState<any[]>([])
  const [filter, setFilter] = useState<'INBOX' | 'TODAY' | 'HABITS' | string>('INBOX')
  const [newTask, setNewTask] = useState('')
  const [selectedListId, setSelectedListId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  const loadData = async () => {
    try {
      const [fetchedTasks, fetchedLists] = await Promise.all([
        getTasks(),
        getTaskLists()
      ])
      setTasks(fetchedTasks || [])
      setLists(fetchedLists || [])
    } catch (e) {
      console.error('Erro ao carregar dados:', e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleAdd = async (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault()
    if (!newTask.trim()) return

    const isHabit = filter === 'HABITS'
    const dueDate = filter === 'TODAY' ? new Date() : undefined
    const listId = selectedListId || (filter !== 'INBOX' && filter !== 'TODAY' && filter !== 'HABITS' ? filter : undefined)

    await createTask({
      title: newTask.trim(),
      isHabit,
      dueDate,
      listId
    })

    setNewTask('')
    notifyWidgetRefresh()
    await loadData()
  }

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'HABITS') return t.isHabit
    if (filter === 'TODAY') {
      return (
        !t.isHabit &&
        t.dueDate &&
        new Date(t.dueDate).toDateString() === new Date().toDateString()
      )
    }
    if (filter === 'INBOX') return !t.isHabit
    // Filtro por ID de lista específica
    return t.listId === filter
  })

  const selectedListObj = lists.find((l) => l.id === filter)

  return (
    <main className="min-h-screen bg-slate-50 py-8 px-4 md:px-10 flex gap-8 max-w-6xl mx-auto">
      {/* MENU LATERAL DE FILTROS */}
      <aside className="w-64 hidden md:block space-y-8 flex-shrink-0">
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-3">
            Visualização
          </h3>
          <div className="space-y-1">
            <button
              onClick={() => { setFilter('INBOX'); setSelectedListId(''); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                filter === 'INBOX'
                  ? 'bg-blue-50 text-blue-600 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <Inbox className="w-4 h-4" /> Caixa de Entrada
              </div>
              <span className="text-xs bg-slate-200/60 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                {tasks.filter(t => !t.isHabit).length}
              </span>
            </button>

            <button
              onClick={() => { setFilter('TODAY'); setSelectedListId(''); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                filter === 'TODAY'
                  ? 'bg-orange-50 text-orange-600 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <Sun className="w-4 h-4" /> Hoje
              </div>
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold">
                {tasks.filter(t => !t.isHabit && t.dueDate && new Date(t.dueDate).toDateString() === new Date().toDateString()).length}
              </span>
            </button>

            <button
              onClick={() => { setFilter('HABITS'); setSelectedListId(''); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                filter === 'HABITS'
                  ? 'bg-emerald-50 text-emerald-600 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <Repeat className="w-4 h-4" /> Rotina Diária
              </div>
              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                {tasks.filter(t => t.isHabit).length}
              </span>
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-3 flex items-center gap-2">
            <Tags className="w-3 h-3" /> Minhas Listas
          </h3>
          <div className="space-y-1">
            {lists.map((list) => {
              const isActive = filter === list.id
              const count = tasks.filter(t => t.listId === list.id).length
              return (
                <button
                  key={list.id}
                  onClick={() => { setFilter(list.id); setSelectedListId(list.id); }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-xl transition-colors ${
                    isActive
                      ? 'bg-slate-200/80 text-slate-900 font-semibold'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <div className={`w-2.5 h-2.5 rounded-full ${list.color}`}></div>
                    <span className="truncate">{list.name}</span>
                  </div>
                  {count > 0 && (
                    <span className="text-xs text-slate-500 font-semibold">{count}</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL DE TAREFAS */}
      <div className="flex-1 min-w-0">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              {filter === 'INBOX' && 'Caixa de Entrada'}
              {filter === 'TODAY' && 'Tarefas de Hoje'}
              {filter === 'HABITS' && 'Hábitos Diários'}
              {selectedListObj && (
                <>
                  <div className={`w-3 h-3 rounded-full ${selectedListObj.color}`}></div>
                  {selectedListObj.name}
                </>
              )}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Gerencie suas tarefas e mantenha seu widget sincronizado em tempo real.
            </p>
          </div>
        </header>

        {/* FORMULÁRIO DE NOVA TAREFA (CREATE) */}
        <form onSubmit={handleAdd} className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200/70 mb-6 flex flex-col md:flex-row items-center gap-3 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
          <div className="flex items-center gap-3 flex-1 w-full">
            <Plus className="text-slate-400 w-5 h-5 flex-shrink-0" />
            <input
              type="text"
              placeholder={
                filter === 'HABITS'
                  ? 'Adicionar novo hábito...'
                  : selectedListObj
                  ? `Adicionar tarefa em ${selectedListObj.name}...`
                  : 'Adicionar nova tarefa (Pressione Enter)...'
              }
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              className="w-full outline-none text-slate-700 bg-transparent placeholder-slate-400 text-sm"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-2 md:pt-0 border-slate-100">
            {lists.length > 0 && filter !== selectedListObj?.id && (
              <select
                value={selectedListId}
                onChange={(e) => setSelectedListId(e.target.value)}
                className="text-xs py-1.5 px-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-600 outline-none hover:bg-slate-100 transition-colors"
              >
                <option value="">Sem lista</option>
                {lists.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            )}

            <button
              type="submit"
              disabled={!newTask.trim()}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-semibold rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Criar
            </button>
          </div>
        </form>

        {/* LISTA DE TAREFAS (READ, UPDATE, DELETE) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/70 overflow-hidden">
          {isLoading ? (
            <div className="p-10 text-center text-slate-400 text-sm">
              Carregando tarefas...
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center text-slate-400">
              <Sparkles className="w-12 h-12 mb-3 text-slate-300 opacity-60" />
              <p className="text-sm font-semibold text-slate-600">Tudo limpo por aqui!</p>
              <p className="text-xs text-slate-400 mt-1">
                Nenhuma tarefa encontrada neste filtro.
              </p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                lists={lists}
                onRefresh={loadData}
              />
            ))
          )}
        </div>
      </div>
    </main>
  )
}
