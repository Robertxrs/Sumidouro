'use server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getFinanceData() {
  const transactions = await prisma.transaction.findMany({
    include: { category: true },
    orderBy: { date: 'desc' }
  })
  
  const categories = await prisma.category.findMany()

  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  const currentMonthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`

  let currentBalance = 0
  let monthlyIncome = 0
  let monthlyExpense = 0
  let projectedBalance = 0
  let realizedIncome = 0
  let realizedExpense = 0

  transactions.forEach(t => {
    const isCurrentMonth = t.date.getMonth() === currentMonth && t.date.getFullYear() === currentYear
    const isRealizedThisMonth = t.isRecurring 
      ? t.lastPaidMonth === currentMonthKey 
      : t.isCompleted

    // Saldo realizado (efetivamente pago / recebido)
    if (isRealizedThisMonth) {
      if (t.type === 'INCOME') realizedIncome += t.amount
      else realizedExpense += t.amount
    }

    if (t.type === 'INCOME') {
      currentBalance += t.amount
      if (isCurrentMonth || t.isRecurring) monthlyIncome += t.amount
      projectedBalance += t.amount
    } else {
      currentBalance -= t.amount
      if (isCurrentMonth || t.isRecurring) monthlyExpense += t.amount
      projectedBalance -= t.amount
    }
  })

  const realizedBalance = realizedIncome - realizedExpense

  return { 
    transactions, 
    categories, 
    currentBalance, 
    monthlyIncome, 
    monthlyExpense, 
    projectedBalance,
    realizedIncome,
    realizedExpense,
    realizedBalance,
    currentMonthKey
  }
}

export async function addTransaction(data: { 
  title: string
  amount: number
  type: string
  isRecurring: boolean
  isCompleted?: boolean
  categoryId?: string
  date?: Date 
}) {
  await prisma.transaction.create({
    data: {
      title: data.title,
      amount: data.amount,
      type: data.type,
      isRecurring: data.isRecurring,
      isCompleted: data.isCompleted || false,
      categoryId: data.categoryId || null,
      date: data.date || new Date()
    }
  })
  revalidatePath('/finance')
  revalidatePath('/dashboard')
}

export async function updateTransaction(id: string, data: { 
  title: string
  amount: number
  type: string
  isRecurring: boolean
  isCompleted?: boolean
  lastPaidMonth?: string | null
  categoryId?: string
  date?: Date 
}) {
  await prisma.transaction.update({
    where: { id },
    data: {
      title: data.title,
      amount: data.amount,
      type: data.type,
      isRecurring: data.isRecurring,
      ...(data.isCompleted !== undefined ? { isCompleted: data.isCompleted } : {}),
      ...(data.lastPaidMonth !== undefined ? { lastPaidMonth: data.lastPaidMonth } : {}),
      categoryId: data.categoryId || null,
      ...(data.date ? { date: data.date } : {})
    }
  })
  revalidatePath('/finance')
  revalidatePath('/dashboard')
}

export async function toggleTransactionRealized(id: string, currentMonthKey: string) {
  const tx = await prisma.transaction.findUnique({ where: { id } })
  if (!tx) return

  if (tx.isRecurring) {
    const isPaid = tx.lastPaidMonth === currentMonthKey
    await prisma.transaction.update({
      where: { id },
      data: {
        lastPaidMonth: isPaid ? null : currentMonthKey
      }
    })
  } else {
    await prisma.transaction.update({
      where: { id },
      data: {
        isCompleted: !tx.isCompleted
      }
    })
  }
  revalidatePath('/finance')
  revalidatePath('/dashboard')
}

export async function resetRecurringMonth() {
  await prisma.transaction.updateMany({
    where: { isRecurring: true },
    data: { lastPaidMonth: null }
  })
  revalidatePath('/finance')
  revalidatePath('/dashboard')
}

export async function deleteTransaction(id: string) {
  await prisma.transaction.delete({
    where: { id }
  })
  revalidatePath('/finance')
  revalidatePath('/dashboard')
}

