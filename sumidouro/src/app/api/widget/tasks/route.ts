import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-store, max-age=0'
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      where: { isCompleted: false, isHabit: false },
      select: { id: true, title: true, isCompleted: true },
      orderBy: { createdAt: 'asc' },
      take: 15
    });

    return NextResponse.json(tasks, { status: 200, headers: corsHeaders });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar tarefas' }, { status: 500, headers: corsHeaders });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { taskId, id, action, title } = body;
    const targetId = taskId || id;

    // 1. CRIAR TAREFA
    if (action === 'create' || (title && !targetId)) {
      if (!title || typeof title !== 'string' || !title.trim()) {
        return NextResponse.json({ error: 'Título inválido' }, { status: 400, headers: corsHeaders });
      }

      const newTask = await prisma.task.create({
        data: {
          title: title.trim(),
          isCompleted: false
        }
      });

      return NextResponse.json({ success: true, task: newTask }, { status: 200, headers: corsHeaders });
    }

    // 2. EXCLUIR TAREFA
    if (action === 'delete' && targetId) {
      await prisma.task.delete({ where: { id: targetId } });
      return NextResponse.json({ success: true, message: 'Tarefa excluída' }, { status: 200, headers: corsHeaders });
    }

    // 3. ATUALIZAR TÍTULO DA TAREFA
    if (action === 'update' && targetId && title) {
      const updated = await prisma.task.update({
        where: { id: targetId },
        data: { title: title.trim() }
      });
      return NextResponse.json({ success: true, task: updated }, { status: 200, headers: corsHeaders });
    }

    // 4. ALTERNAR CONCLUSÃO (TOGGLE)
    if (targetId) {
      const existingTask = await prisma.task.findUnique({ where: { id: targetId } });
      if (!existingTask) {
        return NextResponse.json({ error: 'Tarefa não encontrada' }, { status: 404, headers: corsHeaders });
      }

      const updated = await prisma.task.update({
        where: { id: targetId },
        data: { isCompleted: !existingTask.isCompleted }
      });

      return NextResponse.json({ success: true, task: updated }, { status: 200, headers: corsHeaders });
    }

    return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400, headers: corsHeaders });
  } catch (error) {
    console.error('Erro no endpoint do widget:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500, headers: corsHeaders });
  }
}
