'use server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getTaskLists() {
  const lists = await prisma.taskList.findMany({
    include: { sections: { orderBy: { order: 'asc' } } }
  })
  // Cria listas padrão se não existirem
  if (lists.length === 0) {
    await prisma.taskList.createMany({
      data: [
        { name: 'Jud\'s Confeitaria', color: 'bg-amber-500' },
        { name: 'Unicesumar', color: 'bg-blue-600' },
        { name: 'Freelance / Dev', color: 'bg-purple-500' },
        { name: 'Pessoal', color: 'bg-emerald-500' }
      ]
    })
    return await prisma.taskList.findMany({
      include: { sections: { orderBy: { order: 'asc' } } }
    })
  }
  return lists
}

export async function createTaskList(name: string, color?: string) {
  if (!name.trim()) return
  const newList = await prisma.taskList.create({
    data: { name: name.trim(), color: color || 'bg-blue-500' }
  })
  revalidatePath('/')
  return newList
}

export async function deleteTaskList(id: string) {
  await prisma.taskList.delete({ where: { id } })
  revalidatePath('/')
}

export async function getSections(listId?: string | null) {
  return await prisma.taskSection.findMany({
    where: { listId: listId ? listId : null },
    orderBy: { order: 'asc' }
  })
}

export async function createSection(name: string, listId?: string | null) {
  if (!name.trim()) return
  const section = await prisma.taskSection.create({
    data: { name: name.trim(), listId: listId ? listId : null }
  })
  revalidatePath('/')
  return section
}

export async function updateSection(id: string, name: string) {
  if (!name.trim()) return
  const section = await prisma.taskSection.update({
    where: { id },
    data: { name: name.trim() }
  })
  revalidatePath('/')
  return section
}

export async function deleteSection(id: string) {
  await prisma.taskSection.delete({ where: { id } })
  revalidatePath('/')
  return { success: true }
}

export async function getTasks() {
  return await prisma.task.findMany({
    where: { parentId: null },
    include: {
      subtasks: { orderBy: { createdAt: 'asc' } },
      list: true,
      section: true
    },
    orderBy: [
      { order: 'asc' },
      { createdAt: 'desc' }
    ]
  })
}

export async function createTask(data: {
  title: string
  description?: string
  priority?: string
  isHabit?: boolean
  dueDate?: Date | string | null
  listId?: string | null
  sectionId?: string | null
  parentId?: string | null
}) {
  if (!data.title.trim()) return

  const task = await prisma.task.create({
    data: {
      title: data.title.trim(),
      description: data.description || null,
      priority: data.priority || 'P4',
      isHabit: data.isHabit || false,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      listId: data.listId || null,
      sectionId: data.sectionId || null,
      parentId: data.parentId || null
    }
  })

  revalidatePath('/')
  return task
}

export async function updateTask(
  id: string,
  data: {
    title?: string
    description?: string | null
    priority?: string
    isHabit?: boolean
    dueDate?: Date | string | null
    listId?: string | null
    sectionId?: string | null
    isCompleted?: boolean
    order?: number
  }
) {
  const updateData: any = { ...data }
  if (data.dueDate !== undefined) {
    updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null
  }

  const updated = await prisma.task.update({
    where: { id },
    data: updateData
  })
  revalidatePath('/')
  return updated
}

export async function setTaskDueDate(id: string, dueDate: Date | string | null) {
  const updated = await prisma.task.update({
    where: { id },
    data: {
      dueDate: dueDate ? new Date(dueDate) : null
    }
  })
  revalidatePath('/')
  return updated
}

export async function toggleTask(id: string, isCompleted: boolean) {
  const updated = await prisma.task.update({ where: { id }, data: { isCompleted } })
  revalidatePath('/')
  return updated
}

export async function deleteTask(id: string) {
  await prisma.task.delete({ where: { id } })
  revalidatePath('/')
  return { success: true }
}

export async function reorderTasks(taskIds: string[]) {
  await Promise.all(
    taskIds.map((id, index) =>
      prisma.task.update({
        where: { id },
        data: { order: index }
      })
    )
  )
  revalidatePath('/')
}
