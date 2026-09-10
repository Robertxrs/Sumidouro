'use client'
import { useState, useEffect } from 'react'
import { getTasks, getTaskLists, createTask, toggleTask } from './actions'
import { CheckCircle2, Circle, Plus, Calendar, Inbox, Repeat, Sun, Tags } from 'lucide-react'

export default function Home() {
  const [tasks, setTasks] = useState<any[]>([])
  const [lists, setLists] = useState<any[]>([])
  const [filter, setFilter] = useState<'INBOX' | 'TODAY' | 'HABITS'>('INBOX')
  const [newTask, setNewTask] = useState('')

  const loadData = async () => {
    setTasks(await getTasks())
    setLists(await getTaskLists())
  }

  useEffect(() => { loadData() }, [])

  const handleAdd = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTask.trim()) {
      await createTask({ 
        title: newTask, 
        isHabit: filter === 'HABITS',
        dueDate: filter === 'TODAY' ? new Date() : undefined
      })
      setNewTask('')
      loadData()
    }
  }

  const filteredTasks = tasks.filter(t => {
    if (filter === 'HABITS') return t.isHabit
    if (filter === 'TODAY') return !t.isHabit && t.dueDate && new Date(t.dueDate).toDateString() === new Date().toDateString()
    return !t.isHabit // INBOX mostra tudo que não é hábito
  })

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4 md:px-10 flex gap-8 max-w-6xl mx-auto">
      
      {/* MENU LATERAL DE FILTROS */}
      <aside className="w-64 hidden md:block space-y-8">
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-3">Visualização</h3>
          <div className="space-y-1">
            <button onClick={() => setFilter('INBOX')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'INBOX' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-100'}`}><Inbox className="w-4 h-4"/> Entrada</button>
            <button onClick={() => setFilter('TODAY')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'TODAY' ? 'bg-orange-50 text-orange-600' : 'text-slate-600 hover:bg-slate-100'}`}><Sun className="w-4 h-4"/> Hoje</button>
            <button onClick={() => setFilter('HABITS')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'HABITS' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-600 hover:bg-slate-100'}`}><Repeat className="w-4 h-4"/> Rotina Diária</button>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-3 flex items-center gap-2"><Tags className="w-3 h-3"/> Minhas Listas</h3>
          <div className="space-y-1">
            {lists.map(list => (
              <div key={list.id} className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer">
                <div className={`w-2.5 h-2.5 rounded-full ${list.color}`}></div>
                {list.name}
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL DE TAREFAS */}
      <div className="flex-1">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">
            {filter === 'INBOX' ? 'Caixa de Entrada' : filter === 'TODAY' ? 'Tarefas de Hoje' : 'Hábitos Diários'}
          </h1>
        </header>

        <div className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm border border-gray-100 mb-6 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
          <Plus className="text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder={filter === 'HABITS' ? "Ex: Checar estoque mínimo de insumos..." : "Adicionar nova tarefa (Enter)..."} 
            value={newTask} 
            onChange={(e) => setNewTask(e.target.value)} 
            onKeyDown={handleAdd}
            className="w-full outline-none text-slate-700 bg-transparent placeholder-gray-400"
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {filteredTasks.length === 0 ? (
            <div className="p-10 text-center flex flex-col items-center text-gray-400">
              <CheckCircle2 className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm font-medium">Tudo limpo por aqui!</p>
            </div>
          ) : (
            filteredTasks.map(task => (
              <div key={task.id} className="flex items-center gap-3 p-4 hover:bg-slate-50 group transition-colors border-b border-gray-50 last:border-0">
                <button onClick={async () => { await toggleTask(task.id, !task.isCompleted); loadData() }} className="flex-shrink-0">
                  {task.isCompleted ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5 text-gray-300 group-hover:text-blue-400" />}
                </button>
                <div className="flex-1 flex flex-col">
                  <span className={`text-sm font-medium ${task.isCompleted ? 'line-through text-gray-400' : 'text-slate-700'}`}>
                    {task.title}
                  </span>
                  {task.list && (
                    <span className="text-[10px] text-gray-400 font-semibold uppercase mt-0.5 flex items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${task.list.color}`}></div> {task.list.name}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  )
}
