/// <reference path="../pb_data/types.d.ts" />

routerAdd(
  'POST',
  '/backend/v1/lesson-tutor-chat',
  (e) => {
    try {
      const userId = e.auth?.id
      if (!userId) {
        return e.json(401, { error: 'Autenticação necessária.' })
      }

      const info = e.requestInfo()
      const body = info.body || {}

      const lessonId = body.lesson_id
      const message = typeof body.message === 'string' ? body.message.trim() : ''
      let conversationId =
        typeof body.conversation_id === 'string' && body.conversation_id.trim()
          ? body.conversation_id.trim()
          : null

      if (!lessonId) {
        return e.json(400, { error: 'O id da aula (lesson_id) é obrigatório.' })
      }

      if (!message) {
        return e.json(400, { error: 'A mensagem é obrigatória.' })
      }

      // Validar existência da aula
      let lessonRecord
      try {
        lessonRecord = e.app.findRecordById('lessons', lessonId)
      } catch (_) {
        return e.json(404, { error: 'Aula não encontrada.' })
      }

      // Buscar curso vinculado para contextualização rica
      let courseTitle = 'Curso'
      let courseDescription = ''
      try {
        const courseId = lessonRecord.getString('course')
        if (courseId) {
          const courseRecord = e.app.findRecordById('courses', courseId)
          courseTitle = courseRecord.getString('title') || 'Curso'
          courseDescription = courseRecord.getString('description') || ''
        }
      } catch (_) {}

      const lessonTitle = lessonRecord.getString('title') || 'Aula'
      const lessonDescription = lessonRecord.getString('description') || 'Sem descrição específica.'
      const lessonDuration = lessonRecord.getInt('duration_min') || 0
      const lessonOrder = lessonRecord.getInt('order') || 1

      // Obter ou criar conversa com o agente nativo
      const conv = $ai.agent('tutor-pilulas').getOrCreateConversation({
        user_id: userId,
        id: conversationId || null,
        title: `Dúvidas: ${lessonTitle}`.slice(0, 100),
      })
      conversationId = conv.id

      // Na PRIMEIRA mensagem da conversa (quando conversation_id não foi passado pelo cliente),
      // injetamos como contexto o título da aula, curso e descrição.
      let promptToSend = message
      if (!body.conversation_id) {
        promptToSend = `[CONTEXTO DA AULA ATUAL DO ALUNO]
Curso: ${courseTitle}
${courseDescription ? `Descrição do curso: ${courseDescription}\n` : ''}Aula ${lessonOrder}: ${lessonTitle} (${lessonDuration} minutos)
Descrição da aula: ${lessonDescription}
ID da aula: ${lessonId}
[FIM DO CONTEXTO]

Dúvida do aluno sobre esta aula:
"${message}"

Por favor, responda como Tutor Pílulas de forma acolhedora, didática e direta ao ponto, seguindo rigorosamente as diretrizes e regras de fidelidade ao conteúdo desta aula.`
      }

      const iter = $ai.agent('tutor-pilulas').chat({
        user_id: userId,
        conversation_id: conversationId,
        message: promptToSend,
        stream: true,
      })

      e.response.header().set('Content-Type', 'text/event-stream')
      e.response.header().set('Cache-Control', 'no-cache')
      e.response.header().set('Connection', 'keep-alive')
      e.response.header().set('X-Conversation-Id', conversationId)

      return $response.stream(e, iter)
    } catch (err) {
      if (err instanceof SkipAiConfigError) {
        return e.json(503, { error: 'Serviço de IA temporariamente indisponível.' })
      }
      if (err instanceof SkipAiAgentsError) {
        const status = err.status || 500
        return e.json(status, {
          error: status >= 500 ? 'Não foi possível responder agora. Tente novamente.' : err.message,
        })
      }
      if (err instanceof SkipAiError) {
        const status = err.status || 502
        return e.json(status, {
          error: status >= 500 ? 'Serviço de IA temporariamente indisponível.' : err.message,
        })
      }
      return e.json(500, { error: 'Não foi possível responder agora. Tente novamente.' })
    }
  },
  $apis.requireAuth(),
)
