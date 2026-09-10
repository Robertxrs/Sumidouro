'use server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getFinanceData() {
  const transactions = await prisma.transaction.findMany({
    include: { category: true },
    orderBy: { date: 'desc' }
  })
  
  const categories = await prisma.category.findMany()

  // Cálculos básicos
  let currentBalance = 0
  let monthlyIncome = 0
  let monthlyExpense = 0
  let projectedBalance = 0

  const currentMonth = new Date().getMonth()

  transactions.forEach(t => {
    const isCurrentMonth = t.date.getMonth() === currentMonth
    
    if (t.type === 'INCOME') {
      currentBalance += t.amount
      if (isCurrentMonth) monthlyIncome += t.amount
      projectedBalance += t.amount
    } else {
      currentBalance -= t.amount
      if (isCurrentMonth) monthlyExpense += t.amount
      projectedBalance -= t.amount
    }

    // Lógica simples de projeção: se é recorrente, soma/subtrai para o futuro (simulação básica)
    if (t.isRecurring && !isCurrentMonth) {
      if (t.type === 'INCOME') projectedBalance += t.amount
      else projectedBalance -= t.amount
    }
  })

  return { transactions, categories, currentBalance, monthlyIncome, monthlyExpense, projectedBalance }
}

export async function addTransaction(data: { title: string, amount: number, type: string, isRecurring: boolean, categoryId?: string }) {
  await prisma.transaction.create({
    data: {
      title: data.title,
      amount: data.amount,
      type: data.type,
      isRecurring: data.isRecurring,
      categoryId: data.categoryId || null
    }
  })
  revalidatePath('/finance')
}
