'use client'
import { useState } from 'react'
import { createTask } from '@/app/actions'
import { Plus } from 'lucide-react'

export default function QuickAdd() {
  const [title, setTitle] = useState('')
  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && title.trim()) {
      await createTask({ title })
      setTitle('')
    }
  }
  return (
    <div className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm border border-gray-100 mb-6">
      <Plus className="text-gray-400 w-5 h-5" />
      <input 
        type="text" 
        placeholder="Adicionar tarefa (pressione Enter)..." 
        value={title} 
        onChange={(e) => setTitle(e.target.value)} 
        onKeyDown={handleKeyDown}
        className="w-full outline-none text-gray-700 bg-transparent placeholder-gray-400"
      />
    </div>
  )
}
