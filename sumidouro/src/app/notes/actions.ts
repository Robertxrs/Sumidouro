'use server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getNotesData() {
  const groups = await prisma.noteGroup.findMany({ 
    include: { 
      notes: {
        orderBy: { createdAt: 'desc' }
      } 
    },
    orderBy: { createdAt: 'desc' }
  })
  const standaloneNotes = await prisma.note.findMany({ 
    where: { groupId: null },
    orderBy: { createdAt: 'desc' }
  })
  return { groups, standaloneNotes }
}

export async function createGroup(name: string, color?: string) {
  if (!name.trim()) return;
  await prisma.noteGroup.create({ data: { name, color: color || 'bg-red-500' } })
  revalidatePath('/notes')
}

export async function updateGroup(id: string, name: string) {
  if (!name.trim()) return;
  await prisma.noteGroup.update({ where: { id }, data: { name } })
  revalidatePath('/notes')
}

export async function deleteGroup(id: string) {
  await prisma.note.deleteMany({ where: { groupId: id } })
  await prisma.chatMessage.deleteMany({ where: { groupId: id } })
  await prisma.noteGroup.delete({ where: { id } })
  revalidatePath('/notes')
}

export async function createNote(title: string, content: string, groupId?: string) {
  if (!title.trim()) return;
  await prisma.note.create({ data: { title, content, groupId: groupId || null } })
  revalidatePath('/notes')
}

export async function updateNote(id: string, title: string, content: string) {
  if (!title.trim()) return;
  await prisma.note.update({ where: { id }, data: { title, content } })
  revalidatePath('/notes')
}

export async function deleteNote(id: string) {
  await prisma.note.delete({ where: { id } })
  revalidatePath('/notes')
}

export async function getTopicMessages(groupId: string) {
  return await prisma.chatMessage.findMany({
    where: { groupId },
    orderBy: { createdAt: 'asc' }
  })
}

export async function sendTopicMessage(groupId: string, userText: string) {
  if (!userText.trim()) return

  // Save user message
  await prisma.chatMessage.create({
    data: {
      groupId,
      role: 'user',
      content: userText.trim()
    }
  })

  // Fetch topic details and all notes in this topic
  const group = await prisma.noteGroup.findUnique({
    where: { id: groupId },
    include: { notes: true }
  })

  let aiResponseText = ''

  if (!group || group.notes.length === 0) {
    aiResponseText = `Ainda não há notas adicionadas ao tópico "${group?.name || 'este tópico'}". Adicione notas e fontes para podermos conversar sobre elas!`
  } else {
    const lower = userText.toLowerCase()
    if (lower.includes('resumo') || lower.includes('resumir') || lower.includes('visão geral')) {
      aiResponseText = `📑 **Visão Geral & Resumo do Tópico "${group.name}"**:\n\n` +
        `Este tópico contém **${group.notes.length} nota(s)**:\n` +
        group.notes.map(n => `• **${n.title}**: ${n.content ? n.content.slice(0, 100) + '...' : 'Sem detalhes.'}`).join('\n') +
        `\n\n💡 *Dica:* Você pode me pedir para extrair ações, criar um guia de estudo ou esclarecer dúvidas específicas sobre estas notas.`
    } else if (lower.includes('pontos chave') || lower.includes('principais') || lower.includes('destaque')) {
      aiResponseText = `🎯 **Principais Pontos Chave em "${group.name}"**:\n\n` +
        group.notes.map(n => `1. **${n.title}**: ${n.content || 'Item anotado sem detalhes adicionais.'}`).join('\n')
    } else {
      aiResponseText = `Com base nas **${group.notes.length} nota(s)** do tópico **${group.name}**:\n\n` +
        `Em relação a "${userText}":\n\n` +
        `Conforme registrado em suas notas:\n` +
        group.notes.slice(0, 3).map(n => `> *${n.title}*: ${n.content ? n.content.slice(0, 150) : 'Disponível no tópico'}`).join('\n\n') +
        `\n\n✨ *NotebookLM Assistente:* Se precisar de uma análise mais profunda ou um plano de ação, só pedir!`
    }
  }

  // Save AI response message
  await prisma.chatMessage.create({
    data: {
      groupId,
      role: 'assistant',
      content: aiResponseText
    }
  })

  revalidatePath('/notes')
  return await getTopicMessages(groupId)
}

export async function generateTopicSummary(groupId: string) {
  const group = await prisma.noteGroup.findUnique({
    where: { id: groupId },
    include: { notes: true }
  })

  if (!group || group.notes.length === 0) {
    return
  }

  const content = `🎧 **Resumo em Áudio & Síntese Executiva - Tópico: ${group.name}**\n\n` +
    `🎙️ *Visão do Podcast NotebookLM:*\n` +
    `"Bem-vindo à síntese do tópico ${group.name}. Analisando suas ${group.notes.length} notas carregadas, aqui estão as principais conclusões que você registrou:"\n\n` +
    group.notes.map((n, i) => `**Bloco ${i + 1} - ${n.title}:**\n${n.content || 'Sem texto detalhado.'}`).join('\n\n') +
    `\n\n✅ *Status:* Síntese gerada com sucesso.`

  await prisma.chatMessage.create({
    data: {
      groupId,
      role: 'assistant',
      content
    }
  })

  revalidatePath('/notes')
  return await getTopicMessages(groupId)
}

export async function generateStudyGuide(groupId: string) {
  const group = await prisma.noteGroup.findUnique({
    where: { id: groupId },
    include: { notes: true }
  })

  if (!group || group.notes.length === 0) {
    return
  }

  const content = `📘 **Guia de Estudos & Pergunta & Resposta - ${group.name}**\n\n` +
    `### 📖 Questões Importantes Extraídas das Notas:\n\n` +
    group.notes.map((n, i) => `**Q${i + 1}: Qual o objetivo de "${n.title}"?**\n👉 *Resposta:* ${n.content || 'Definido no tópico.'}\n`).join('\n') +
    `\n--- \n💡 Utilize este guia para revisão rápida!`

  await prisma.chatMessage.create({
    data: {
      groupId,
      role: 'assistant',
      content
    }
  })

  revalidatePath('/notes')
  return await getTopicMessages(groupId)
}
