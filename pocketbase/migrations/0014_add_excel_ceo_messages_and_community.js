migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    const usersId = users.id
    const courses = app.findCollectionByNameOrId('courses')
    const coursesId = courses.id
    const lessons = app.findCollectionByNameOrId('lessons')

    // 1. Adicionar excel_file em lessons (máx 5MB, tipos .xlsx, .xls, .csv)
    if (!lessons.fields.getByName('excel_file')) {
      lessons.fields.add(
        new FileField({
          name: 'excel_file',
          maxSelect: 1,
          maxSize: 5242880, // 5MB
          mimeTypes: [
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/csv',
            'application/csv',
          ],
        }),
      )
      app.save(lessons)
    }

    // 2. Collection ceo_messages: Mensagens "Fale com o CEO" e canais de contato
    try {
      app.findCollectionByNameOrId('ceo_messages')
    } catch (_) {
      const ceoMessages = new Collection({
        name: 'ceo_messages',
        type: 'base',
        // Aluno vê as próprias mensagens, Adm/Coordenador vê tudo
        listRule:
          "@request.auth.id != '' && (user = @request.auth.id || @request.auth.role = 'adm' || @request.auth.role = 'coordenador')",
        viewRule:
          "@request.auth.id != '' && (user = @request.auth.id || @request.auth.role = 'adm' || @request.auth.role = 'coordenador')",
        createRule: "@request.auth.id != ''",
        updateRule:
          "@request.auth.id != '' && (@request.auth.role = 'adm' || @request.auth.role = 'coordenador')",
        deleteRule:
          "@request.auth.id != '' && (@request.auth.role = 'adm' || @request.auth.role = 'coordenador')",
        fields: [
          {
            name: 'user',
            type: 'relation',
            required: true,
            collectionId: usersId,
            cascadeDelete: true,
            maxSelect: 1,
          },
          { name: 'name', type: 'text', required: true },
          { name: 'email', type: 'email', required: true },
          { name: 'subject', type: 'text', required: false },
          { name: 'message', type: 'text', required: true },
          {
            name: 'status',
            type: 'select',
            required: true,
            values: ['nova', 'em_analise', 'respondida', 'arquivada'],
            maxSelect: 1,
          },
          { name: 'reply', type: 'text', required: false },
          { name: 'replied_at', type: 'date', required: false },
          { name: 'channel', type: 'text', required: false }, // 'form' ou 'chat'
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_ceo_messages_user ON ceo_messages (user)',
          'CREATE INDEX idx_ceo_messages_status ON ceo_messages (status)',
          'CREATE INDEX idx_ceo_messages_created ON ceo_messages (created)',
        ],
      })
      app.save(ceoMessages)
    }

    // 3. Collection community_posts: Comunidade geral e por curso
    try {
      app.findCollectionByNameOrId('community_posts')
    } catch (_) {
      const communityPosts = new Collection({
        name: 'community_posts',
        type: 'base',
        // Alunos veem posts aprovados OU os próprios pendentes. Adm/Coordenador vê tudo.
        listRule:
          "@request.auth.id != '' && (status = 'aprovado' || author = @request.auth.id || @request.auth.role = 'adm' || @request.auth.role = 'coordenador')",
        viewRule:
          "@request.auth.id != '' && (status = 'aprovado' || author = @request.auth.id || @request.auth.role = 'adm' || @request.auth.role = 'coordenador')",
        createRule: "@request.auth.id != '' && author = @request.auth.id",
        updateRule:
          "@request.auth.id != '' && (author = @request.auth.id || @request.auth.role = 'adm' || @request.auth.role = 'coordenador')",
        deleteRule:
          "@request.auth.id != '' && (author = @request.auth.id || @request.auth.role = 'adm' || @request.auth.role = 'coordenador')",
        fields: [
          {
            name: 'author',
            type: 'relation',
            required: true,
            collectionId: usersId,
            cascadeDelete: true,
            maxSelect: 1,
          },
          {
            name: 'course',
            type: 'relation',
            required: false, // null/vazio = comunidade geral da plataforma
            collectionId: coursesId,
            cascadeDelete: true,
            maxSelect: 1,
          },
          { name: 'title', type: 'text', required: true, max: 200 },
          { name: 'content', type: 'text', required: true },
          {
            name: 'status',
            type: 'select',
            required: true,
            values: ['pendente', 'aprovado', 'rejeitado'],
            maxSelect: 1,
          },
          { name: 'rejection_reason', type: 'text', required: false },
          {
            name: 'moderated_by',
            type: 'relation',
            required: false,
            collectionId: usersId,
            cascadeDelete: false,
            maxSelect: 1,
          },
          { name: 'moderated_at', type: 'date', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_community_posts_course ON community_posts (course)',
          'CREATE INDEX idx_community_posts_status ON community_posts (status)',
          'CREATE INDEX idx_community_posts_author ON community_posts (author)',
          'CREATE INDEX idx_community_posts_created ON community_posts (created)',
        ],
      })
      app.save(communityPosts)
    }

    // 4. Collection community_replies: Respostas às threads
    try {
      app.findCollectionByNameOrId('community_replies')
    } catch (_) {
      const postsCol = app.findCollectionByNameOrId('community_posts')
      const communityReplies = new Collection({
        name: 'community_replies',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != '' && author = @request.auth.id",
        updateRule:
          "@request.auth.id != '' && (author = @request.auth.id || @request.auth.role = 'adm' || @request.auth.role = 'coordenador')",
        deleteRule:
          "@request.auth.id != '' && (author = @request.auth.id || @request.auth.role = 'adm' || @request.auth.role = 'coordenador')",
        fields: [
          {
            name: 'post',
            type: 'relation',
            required: true,
            collectionId: postsCol.id,
            cascadeDelete: true,
            maxSelect: 1,
          },
          {
            name: 'author',
            type: 'relation',
            required: true,
            collectionId: usersId,
            cascadeDelete: true,
            maxSelect: 1,
          },
          { name: 'content', type: 'text', required: true },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_community_replies_post ON community_replies (post)',
          'CREATE INDEX idx_community_replies_author ON community_replies (author)',
          'CREATE INDEX idx_community_replies_created ON community_replies (created)',
        ],
      })
      app.save(communityReplies)
    }
  },
  (app) => {
    try {
      const replies = app.findCollectionByNameOrId('community_replies')
      app.delete(replies)
    } catch (_) {}

    try {
      const posts = app.findCollectionByNameOrId('community_posts')
      app.delete(posts)
    } catch (_) {}

    try {
      const ceo = app.findCollectionByNameOrId('ceo_messages')
      app.delete(ceo)
    } catch (_) {}

    try {
      const lessons = app.findCollectionByNameOrId('lessons')
      if (lessons.fields.getByName('excel_file')) {
        lessons.fields.removeByName('excel_file')
        app.save(lessons)
      }
    } catch (_) {}
  },
)
