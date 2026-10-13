/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    // 1. Atualizar a collection lesson_chat_messages para suportar mensagens da IA e conversation_id
    const chatCollection = app.findCollectionByNameOrId('lesson_chat_messages')

    if (!chatCollection.fields.getByName('is_ai')) {
      chatCollection.fields.add(
        new BoolField({
          name: 'is_ai',
          required: false,
        }),
      )
    }

    if (!chatCollection.fields.getByName('conversation_id')) {
      chatCollection.fields.add(
        new TextField({
          name: 'conversation_id',
          required: false,
          max: 255,
        }),
      )
    }

    // Aumentar o limite de caracteres de mensagem se necessário, e manter regras RLS:
    // createRule: autenticado pode criar se user for o próprio auth (ou mensagem de chat autenticada)
    // list/view: autenticado
    // update/delete: autor da mensagem
    chatCollection.createRule = "@request.auth.id != '' && @request.body.user = @request.auth.id"
    chatCollection.updateRule = "@request.auth.id != '' && user = @request.auth.id"
    chatCollection.deleteRule = "@request.auth.id != '' && user = @request.auth.id"

    chatCollection.addIndex('idx_chat_lesson_user', false, 'lesson, user', '')
    chatCollection.addIndex('idx_chat_conversation', false, 'conversation_id', '')

    app.save(chatCollection)

    // 2. Definir o agente nativo tutor-pilulas
    const systemPrompt = `Você é o Tutor Pílulas, assistente de IA educacional e acolhedor da plataforma Pílulas de Desenvolvimento (empresa de treinamento em desenvolvimento humano, liderança e vendas em Natal/RN).

Seu papel é tirar dúvidas dos alunos de forma didática, motivacional e prática sobre a aula e o curso em andamento.

DIRETRIZES DE COMUNICAÇÃO:
1. Tom: Motivacional, caloroso, encorajador, focado em autodesenvolvimento profissional e pessoal.
2. Linguagem: Clara, direta, simples e empática em Português do Brasil.
3. Extensão: Respostas curtas e objetivas, com no máximo ~200 palavras, estruturadas em parágrafos curtos ou tópicos objetivos quando aplicável.

FIDELIDADE E ANTI-ALUCINAÇÃO (MUITO IMPORTANTE):
- Responda EXCLUSIVAMENTE com base nas informações da aula e curso fornecidos no contexto ou obtidos pelas ferramentas.
- Você tem acesso às ferramentas de consulta das coleções 'courses' e 'lessons'.
- Se a resposta para a dúvida do aluno NÃO estiver contida ou implícita no material da aula/curso, NÃO invente fatos, regras ou metodologias.
- Nesses casos, diga gentilmente que não encontrou essa informação específica no conteúdo desta aula e recomende que o aluno revise o material ou procure o professor/coordenador da Pílulas de Desenvolvimento para se aprofundar.`

    $ai.agents.define(app, {
      slug: 'tutor-pilulas',
      name: 'Tutor Pílulas',
      description: 'Tutor de dúvidas das aulas dos cursos da Pílulas de Desenvolvimento',
      systemPrompt: systemPrompt,
      tier: 'fast',
      tools: [
        {
          collection: 'courses',
          perms: { list: true, read: true },
        },
        {
          collection: 'lessons',
          perms: { list: true, read: true },
        },
      ],
    })
  },
  (app) => {
    // Rollback determinístico
    try {
      $ai.agents.delete(app, 'tutor-pilulas')
    } catch (_) {}

    try {
      const chatCollection = app.findCollectionByNameOrId('lesson_chat_messages')
      chatCollection.removeIndex('idx_chat_lesson_user')
      chatCollection.removeIndex('idx_chat_conversation')
      if (chatCollection.fields.getByName('is_ai')) {
        chatCollection.fields.removeByName('is_ai')
      }
      if (chatCollection.fields.getByName('conversation_id')) {
        chatCollection.fields.removeByName('conversation_id')
      }
      app.save(chatCollection)
    } catch (_) {}
  },
)
