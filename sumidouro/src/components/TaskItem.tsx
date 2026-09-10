'use client'
import { toggleTask } from '@/app/actions'
import { CheckCircle2, Circle } from 'lucide-react'

export default function TaskItem({ task }: { task: any }) {
  return (
    <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg group transition-colors border-b border-gray-50 last:border-0">
      <button onClick={() => toggleTask(task.id, !task.isCompleted)} className="flex-shrink-0">
        {task.isCompleted ? (
          <CheckCircle2 className="w-5 h-5 text-green-500" />
        ) : (
          <Circle className="w-5 h-5 text-gray-300 group-hover:text-gray-400" />
        )}
      </button>
      <span className={`flex-1 text-sm ${task.isCompleted ? 'line-through text-gray-400' : 'text-gray-700'}`}>
        {task.title}
      </span>
    </div>
  )
}
