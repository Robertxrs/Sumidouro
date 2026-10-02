'use client'

import { useState, useEffect } from 'react'
import { getTasks, getTaskLists, createTask, createTaskList, deleteTaskList, getSections } from './actions'
import { notifyWidgetRefresh } from '@/lib/widget'
import TaskItem from '@/components/TaskItem'
import QuickAddModal from '@/components/QuickAddModal'
import KanbanView from '@/components/KanbanView'
import UpcomingView from '@/components/UpcomingView'
import { parseTaskInput } from '@/lib/nlpTaskParser'
import {
  CheckCircle2,
  Plus,
  Inbox,
  Sun,
  Calendar as CalendarIcon,
  Filter,
  Flag,
  Repeat,
  Tags,
  LayoutGrid,
  List,
  PanelLeftClose,
  PanelLeft,
  Sparkles,
  Trash2,
  FolderPlus,
  X
} from 'lucide-react'

export default function Home() {
  const [tasks, setTasks] = useState<any[]>([])
  const [lists, setLists] = useState<any[]>([])
  const [sections, setSections] = useState<any[]>([])

  // State de Navegação e Filtros
  const [filter, setFilter] = useState<string>('INBOX') // INBOX, TODAY, UPCOMING, HABITS, P1, P2, P3, P4, or listId
  const [selectedListId, setSelectedListId] = useState<string>('')
  
  // UI States
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list')
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Criar nova lista
  const [isAddingList, setIsAddingList] = useState(false)
  const [newListName, setNewListName] = useState('')

  // Form Inline Input
  const [newTaskInput, setNewTaskInput] = useState('')

  const loadData = async () => {
    try {
      const [fetchedTasks, fetchedLists] = await Promise.all([
        getTasks(),
        getTaskLists()
      ])
      setTasks(fetchedTasks || [])
      setLists(fetchedLists || [])

      // Carrega seções se um projeto estiver selecionado
      if (selectedListId) {
        const fetchedSections = await getSections(selectedListId)
        setSections(fetchedSections || [])
      } else {
        setSections([])
      }
    } catch (e) {
      console.error('Erro ao carregar dados:', e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedListId])

  // Atalho de Teclado Global: Pressionar 'q' para abrir Adição Rápida
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key.toLowerCase() === 'q' &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)
      ) {
        e.preventDefault()
        setIsQuickAddOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Seleção de Filtro / Lista
  const handleSelectFilter = async (filterKey: string, listId: string = '') => {
    setFilter(filterKey)
    setSelectedListId(listId)

    if (listId) {
      const sec = await getSections(listId)
      setSections(sec || [])
    } else {
      setSections([])
    }
  }

  // Criar Projeto / Lista
  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newListName.trim()) return
    const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500', 'bg-rose-500']
    const randomColor = colors[Math.floor(Math.random() * colors.length)]
    const created = await createTaskList(newListName.trim(), randomColor)
    setNewListName('')
    setIsAddingList(false)
    if (created) {
      await handleSelectFilter(created.id, created.id)
    }
    await loadData()
  }

  const handleDeleteList = async (listId: string) => {
    if (confirm('Tem certeza que deseja excluir esta lista e suas seções?')) {
      await deleteTaskList(listId)
      handleSelectFilter('INBOX')
      await loadData()
    }
  }

  // Submit Inline Task Add (com NLP)
  const handleInlineAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskInput.trim()) return

    const parsed = parseTaskInput(newTaskInput, lists, sections)
    const finalListId = parsed.listId || selectedListId || (filter !== 'INBOX' && filter !== 'TODAY' && filter !== 'UPCOMING' && filter !== 'HABITS' && !filter.startsWith('P') ? filter : null)

    await createTask({
      title: parsed.cleanTitle,
      priority: parsed.priority || 'P4',
      dueDate: parsed.dueDate || (filter === 'TODAY' ? new Date() : null),
      listId: finalListId,
      sectionId: parsed.sectionId || null,
      isHabit: filter === 'HABITS'
    })

    setNewTaskInput('')
    notifyWidgetRefresh()
    await loadData()
  }

  // Filtragem de Tarefas
  const filteredTasks = tasks.filter((t) => {
    if (filter === 'HABITS') return t.isHabit
    if (filter === 'TODAY') {
      if (t.isHabit) return false
      if (!t.dueDate) return false
      const today = new Date().toDateString()
      return new Date(t.dueDate).toDateString() === today
    }
    if (filter === 'UPCOMING') {
      return !t.isHabit
    }
    if (filter === 'INBOX') return !t.isHabit && !t.listId
    if (filter === 'P1') return t.priority === 'P1'
    if (filter === 'P2') return t.priority === 'P2'
    if (filter === 'P3') return t.priority === 'P3'
    if (filter === 'P4') return t.priority === 'P4'

    // Filtro por ID de lista específica
    return t.listId === filter
  })

  const selectedListObj = lists.find((l) => l.id === filter)
  const parsedInline = parseTaskInput(newTaskInput, lists, sections)

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 py-6 px-4 md:px-8 flex flex-col max-w-7xl mx-auto">
      
      {/* BARRA SUPERIOR DE AÇÕES & BOTÃO GLOBAL + */}
      <header className="flex items-center justify-between pb-6 mb-6 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition-colors"
            title={isSidebarOpen ? 'Ocultar Barra Lateral' : 'Exibir Barra Lateral'}
          >
            {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
          </button>

          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              {filter === 'INBOX' && '📥 Caixa de Entrada'}
              {filter === 'TODAY' && '☀️ Hoje'}
              {filter === 'UPCOMING' && '📅 Em Breve'}
              {filter === 'HABITS' && '🔄 Hábitos Diários'}
              {filter === 'P1' && '🚩 Prioridade 1 (Urgente)'}
              {filter === 'P2' && '🚩 Prioridade 2 (Alta)'}
              {filter === 'P3' && '🚩 Prioridade 3 (Média)'}
              {filter === 'P4' && '🚩 Prioridade 4 (Baixa)'}
              {selectedListObj && (
                <>
                  <div className={`w-3 h-3 rounded-full ${selectedListObj.color || 'bg-blue-500'}`} />
                  {selectedListObj.name}
                </>
              )}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {filter === 'UPCOMING' ? 'Próximos 7 dias de atividades' : 'Organize suas tarefas com atalhos e NLP'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Toggle de Modo Lista / Modo Quadro Kanban */}
          {filter !== 'UPCOMING' && (
            <div className="flex items-center bg-slate-900 p-1 border border-slate-800 rounded-xl">
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <List className="w-3.5 h-3.5" /> Lista
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  viewMode === 'kanban'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" /> Quadro (Kanban)
              </button>
            </div>
          )}

          {/* BOTÃO GLOBAL DE ADIÇÃO RÁPIDA (RED + BUTTON) */}
          <button
            onClick={() => setIsQuickAddOpen(true)}
            className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-red-900/40 active:scale-95 transition-all flex items-center gap-1.5"
            title="Adicionar Tarefa Rápida (Atalho: Q)"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span className="hidden sm:inline">Adicionar Tarefa</span>
            <span className="text-[10px] bg-red-800/80 px-1.5 py-0.5 rounded font-mono">Q</span>
          </button>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL (SIDEBAR + ÁREA DE CONTEÚDO) */}
      <div className="flex gap-8 flex-1">
        
        {/* BARRA LATERAL COLAPSÁVEL (SIDEBAR) */}
        {isSidebarOpen && (
          <aside className="w-64 space-y-6 flex-shrink-0 animate-in slide-in-from-left-4 duration-200">
            
            {/* Visualizações Principais */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 px-3">
                Visualização
              </h3>
              <div className="space-y-1">
                <button
                  onClick={() => handleSelectFilter('INBOX')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    filter === 'INBOX'
                      ? 'bg-blue-950/60 text-blue-400 font-semibold border border-blue-800/50'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Inbox className="w-4 h-4 text-blue-400" /> Caixa de Entrada
                  </div>
                  <span className="text-xs bg-slate-900 text-slate-400 border border-slate-800 px-2 py-0.5 rounded-full font-bold">
                    {tasks.filter((t) => !t.isHabit && !t.listId).length}
                  </span>
                </button>

                <button
                  onClick={() => handleSelectFilter('TODAY')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    filter === 'TODAY'
                      ? 'bg-amber-950/60 text-amber-400 font-semibold border border-amber-800/50'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Sun className="w-4 h-4 text-amber-400" /> Hoje
                  </div>
                  <span className="text-xs bg-amber-950/80 text-amber-400 border border-amber-800/60 px-2 py-0.5 rounded-full font-bold">
                    {tasks.filter((t) => !t.isHabit && t.dueDate && new Date(t.dueDate).toDateString() === new Date().toDateString()).length}
                  </span>
                </button>

                <button
                  onClick={() => handleSelectFilter('UPCOMING')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    filter === 'UPCOMING'
                      ? 'bg-purple-950/60 text-purple-400 font-semibold border border-purple-800/50'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CalendarIcon className="w-4 h-4 text-purple-400" /> Em Breve
                  </div>
                  <span className="text-xs bg-purple-950/80 text-purple-400 border border-purple-800/60 px-2 py-0.5 rounded-full font-bold">
                    {tasks.filter((t) => !t.isHabit && t.dueDate).length}
                  </span>
                </button>

                <button
                  onClick={() => handleSelectFilter('HABITS')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    filter === 'HABITS'
                      ? 'bg-emerald-950/60 text-emerald-400 font-semibold border border-emerald-800/50'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Repeat className="w-4 h-4 text-emerald-400" /> Hábitos
                  </div>
                  <span className="text-xs bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 px-2 py-0.5 rounded-full font-bold">
                    {tasks.filter((t) => t.isHabit).length}
                  </span>
                </button>
              </div>
            </div>

            {/* Filtros por Prioridade */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 px-3 flex items-center gap-1.5">
                <Flag className="w-3.5 h-3.5" /> Prioridades
              </h3>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => handleSelectFilter('P1')}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border flex items-center justify-between ${
                    filter === 'P1'
                      ? 'bg-red-950/80 text-red-400 border-red-800'
                      : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-red-400'
                  }`}
                >
                  <span>🚩 P1</span>
                  <span className="text-[10px] bg-slate-950 px-1.5 py-0.5 rounded font-mono">
                    {tasks.filter(t => t.priority === 'P1').length}
                  </span>
                </button>

                <button
                  onClick={() => handleSelectFilter('P2')}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border flex items-center justify-between ${
                    filter === 'P2'
                      ? 'bg-orange-950/80 text-orange-400 border-orange-800'
                      : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-orange-400'
                  }`}
                >
                  <span>🚩 P2</span>
                  <span className="text-[10px] bg-slate-950 px-1.5 py-0.5 rounded font-mono">
                    {tasks.filter(t => t.priority === 'P2').length}
                  </span>
                </button>

                <button
                  onClick={() => handleSelectFilter('P3')}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border flex items-center justify-between ${
                    filter === 'P3'
                      ? 'bg-blue-950/80 text-blue-400 border-blue-800'
                      : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-blue-400'
                  }`}
                >
                  <span>🚩 P3</span>
                  <span className="text-[10px] bg-slate-950 px-1.5 py-0.5 rounded font-mono">
                    {tasks.filter(t => t.priority === 'P3').length}
                  </span>
                </button>

                <button
                  onClick={() => handleSelectFilter('P4')}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border flex items-center justify-between ${
                    filter === 'P4'
                      ? 'bg-slate-900 text-slate-200 border-slate-700'
                      : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <span>🚩 P4</span>
                  <span className="text-[10px] bg-slate-950 px-1.5 py-0.5 rounded font-mono">
                    {tasks.filter(t => t.priority === 'P4' || !t.priority).length}
                  </span>
                </button>
              </div>
            </div>

            {/* Projetos / Listas */}
            <div>
              <div className="flex items-center justify-between mb-2.5 px-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Tags className="w-3.5 h-3.5" /> Projetos
                </h3>
                <button
                  onClick={() => setIsAddingList(true)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-900 transition-colors"
                  title="Criar novo projeto"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Form de Criar Nova Lista */}
              {isAddingList && (
                <form onSubmit={handleCreateList} className="mb-2 p-2 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                  <input
                    type="text"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="Nome do projeto..."
                    className="w-full bg-slate-950 border border-slate-800 text-xs px-2.5 py-1.5 rounded-lg text-white outline-none focus:border-blue-500"
                    autoFocus
                  />
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingList(false)}
                      className="text-[11px] text-slate-400 px-2 py-1 hover:text-white"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="text-[11px] bg-blue-600 text-white px-2.5 py-1 rounded-md font-semibold hover:bg-blue-500"
                    >
                      Salvar
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-1">
                {lists.map((list) => {
                  const isActive = filter === list.id
                  const count = tasks.filter((t) => t.listId === list.id).length
                  return (
                    <div
                      key={list.id}
                      className="group/item flex items-center justify-between"
                    >
                      <button
                        onClick={() => handleSelectFilter(list.id, list.id)}
                        className={`flex-1 flex items-center justify-between px-3 py-2 text-sm font-medium rounded-xl transition-colors ${
                          isActive
                            ? 'bg-slate-900 text-white font-semibold border border-slate-800'
                            : 'text-slate-400 hover:bg-slate-900/60 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3 truncate">
                          <div className={`w-2.5 h-2.5 rounded-full ${list.color || 'bg-blue-500'}`} />
                          <span className="truncate">{list.name}</span>
                        </div>
                        {count > 0 && (
                          <span className="text-xs text-slate-500 font-semibold">{count}</span>
                        )}
                      </button>

                      <button
                        onClick={() => handleDeleteList(list.id)}
                        className="opacity-0 group-hover/item:opacity-100 p-1.5 text-slate-500 hover:text-red-400 rounded-lg transition-all"
                        title="Excluir lista"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>

          </aside>
        )}

        {/* ÁREA PRINCIPAL DE CONTEÚDO */}
        <div className="flex-1 min-w-0">
          
          {/* VISUALIZAÇÃO "EM BREVE" (PRÓXIMOS 7 DIAS) */}
          {filter === 'UPCOMING' ? (
            <UpcomingView
              tasks={filteredTasks}
              lists={lists}
              sections={sections}
              onRefresh={loadData}
            />
          ) : viewMode === 'kanban' ? (
            /* VISUALIZAÇÃO QUADRO (KANBAN) */
            <KanbanView
              tasks={filteredTasks}
              sections={sections}
              lists={lists}
              currentListId={selectedListId}
              onRefresh={loadData}
            />
          ) : (
            /* VISUALIZAÇÃO LISTA VERTICAL TRADICIONAL */
            <div className="space-y-6">
              
              {/* CAMPO DE CRIAÇÃO RÁPIDA INLINE COM RECONHECIMENTO NLP */}
              <form
                onSubmit={handleInlineAdd}
                className="bg-slate-900 p-3.5 rounded-2xl shadow-lg border border-slate-800 focus-within:border-blue-500/80 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all space-y-3"
              >
                <div className="flex items-center gap-3">
                  <Plus className="text-slate-500 w-5 h-5 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder='Digite uma nova tarefa (ex: "Comprar leite amanhã p1 #Pessoal /Mercado")...'
                    value={newTaskInput}
                    onChange={(e) => setNewTaskInput(e.target.value)}
                    className="w-full outline-none text-slate-100 bg-transparent placeholder-slate-500 text-sm font-medium"
                  />
                  <button
                    type="submit"
                    disabled={!newTaskInput.trim()}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center gap-1.5 flex-shrink-0"
                  >
                    <Plus className="w-4 h-4" /> Adicionar
                  </button>
                </div>

                {/* Badges de Feedback de Reconhecimento NLP Inline */}
                {newTaskInput.trim() && (
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60 text-xs">
                    <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400" /> NLP:
                    </span>

                    {parsedInline.dueDate && (
                      <span className="text-[10px] text-amber-400 font-semibold bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-900/40">
                        📅 {parsedInline.dueDate.toLocaleDateString('pt-BR')}
                      </span>
                    )}

                    {parsedInline.listId && (
                      <span className="text-[10px] text-slate-200 font-semibold bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                        #{lists.find(l => l.id === parsedInline.listId)?.name}
                      </span>
                    )}

                    {parsedInline.sectionId && (
                      <span className="text-[10px] text-purple-300 font-semibold bg-purple-950/60 px-2 py-0.5 rounded-md border border-purple-900/40">
                        /{sections.find(s => s.id === parsedInline.sectionId)?.name}
                      </span>
                    )}

                    <span className="text-[10px] font-bold text-slate-300 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                      🚩 {parsedInline.priority || 'P4'}
                    </span>
                  </div>
                )}
              </form>

              {/* LISTAGEM DE TAREFAS */}
              <div className="bg-slate-900 rounded-2xl shadow-lg border border-slate-800 overflow-hidden">
                {isLoading ? (
                  <div className="p-10 text-center text-slate-400 text-sm">
                    Carregando tarefas...
                  </div>
                ) : filteredTasks.length === 0 ? (
                  <div className="p-12 text-center flex flex-col items-center text-slate-400">
                    <Sparkles className="w-12 h-12 mb-3 text-slate-600 opacity-60" />
                    <p className="text-sm font-semibold text-slate-300">Tudo limpo por aqui!</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Nenhuma tarefa encontrada para a visualização selecionada.
                    </p>
                  </div>
                ) : (
                  filteredTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      lists={lists}
                      sections={sections}
                      onRefresh={loadData}
                    />
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL GLOBAL DE ADIÇÃO RÁPIDA (TECLA Q OU BOTÃO RED +) */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        lists={lists}
        sections={sections}
        onTaskCreated={loadData}
        defaultListId={selectedListId}
      />

    </main>
  )
}
