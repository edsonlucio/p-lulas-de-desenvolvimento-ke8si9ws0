migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    const usersId = users.id

    // 1. Alterar collection courses: adicionar campo 'price' (number)
    const courses = app.findCollectionByNameOrId('courses')
    if (!courses.fields.getByName('price')) {
      courses.fields.add(
        new NumberField({
          name: 'price',
          required: false,
          min: 0,
        }),
      )
      app.save(courses)
    }

    // 2. Alterar collection lessons: adicionar campo 'content' (text)
    const lessons = app.findCollectionByNameOrId('lessons')
    if (!lessons.fields.getByName('content')) {
      lessons.fields.add(
        new TextField({
          name: 'content',
          required: false,
        }),
      )
      app.save(lessons)
    }

    // 3. Alterar collection mentorships: adicionar campo 'resumo' (text)
    const mentorships = app.findCollectionByNameOrId('mentorships')
    if (!mentorships.fields.getByName('resumo')) {
      mentorships.fields.add(
        new TextField({
          name: 'resumo',
          required: false,
        }),
      )
      app.save(mentorships)
    }

    // 4. Alterar collection enrollments: permitir status 'pendente' além de 'ativo' e 'cancelado'
    const enrollments = app.findCollectionByNameOrId('enrollments')
    const statusField = enrollments.fields.getByName('status')
    if (statusField) {
      statusField.values = ['ativo', 'pendente', 'cancelado']
      statusField.maxSelect = 1
    }
    // E permitir que aluno crie sua própria solicitação de matrícula (status pendente)
    enrollments.createRule = "@request.auth.id != ''"
    app.save(enrollments)

    // 5. Criar collection lesson_favorites: favoritos de aulas
    const lessonsId = lessons.id
    try {
      app.findCollectionByNameOrId('lesson_favorites')
    } catch (_) {
      const favorites = new Collection({
        name: 'lesson_favorites',
        type: 'base',
        listRule: "@request.auth.id != '' && user = @request.auth.id",
        viewRule: "@request.auth.id != '' && user = @request.auth.id",
        createRule: "@request.auth.id != '' && @request.body.user = @request.auth.id",
        updateRule: "@request.auth.id != '' && user = @request.auth.id",
        deleteRule: "@request.auth.id != '' && user = @request.auth.id",
        fields: [
          {
            name: 'user',
            type: 'relation',
            required: true,
            collectionId: usersId,
            cascadeDelete: true,
            maxSelect: 1,
          },
          {
            name: 'lesson',
            type: 'relation',
            required: true,
            collectionId: lessonsId,
            cascadeDelete: true,
            maxSelect: 1,
          },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE UNIQUE INDEX idx_favorites_user_lesson ON lesson_favorites (user, lesson)',
          'CREATE INDEX idx_favorites_user ON lesson_favorites (user)',
        ],
      })
      app.save(favorites)
    }

    // 6. Criar collection notifications: notificações in-app
    try {
      app.findCollectionByNameOrId('notifications')
    } catch (_) {
      const notifications = new Collection({
        name: 'notifications',
        type: 'base',
        listRule:
          "@request.auth.id != '' && (user = @request.auth.id || @request.auth.role = 'adm' || @request.auth.role = 'coordenador')",
        viewRule:
          "@request.auth.id != '' && (user = @request.auth.id || @request.auth.role = 'adm' || @request.auth.role = 'coordenador')",
        createRule: "@request.auth.id != ''",
        updateRule:
          "@request.auth.id != '' && (user = @request.auth.id || @request.auth.role = 'adm' || @request.auth.role = 'coordenador')",
        deleteRule:
          "@request.auth.id != '' && (user = @request.auth.id || @request.auth.role = 'adm' || @request.auth.role = 'coordenador')",
        fields: [
          {
            name: 'user',
            type: 'relation',
            required: true,
            collectionId: usersId,
            cascadeDelete: true,
            maxSelect: 1,
          },
          { name: 'title', type: 'text', required: true, max: 200 },
          { name: 'message', type: 'text', required: true, max: 1000 },
          {
            name: 'type',
            type: 'select',
            required: true,
            values: ['aula', 'clube', 'mentoria', 'matricula', 'sistema'],
            maxSelect: 1,
          },
          { name: 'link', type: 'text', required: false },
          { name: 'read', type: 'bool', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_notifications_user ON notifications (user)',
          'CREATE INDEX idx_notifications_read ON notifications (read)',
          'CREATE INDEX idx_notifications_user_created ON notifications (user, created DESC)',
        ],
      })
      app.save(notifications)
    }
  },
  (app) => {
    try {
      const favorites = app.findCollectionByNameOrId('lesson_favorites')
      app.delete(favorites)
    } catch (_) {}

    try {
      const notifications = app.findCollectionByNameOrId('notifications')
      app.delete(notifications)
    } catch (_) {}

    try {
      const courses = app.findCollectionByNameOrId('courses')
      if (courses.fields.getByName('price')) {
        courses.fields.removeByName('price')
        app.save(courses)
      }
    } catch (_) {}

    try {
      const lessons = app.findCollectionByNameOrId('lessons')
      if (lessons.fields.getByName('content')) {
        lessons.fields.removeByName('content')
        app.save(lessons)
      }
    } catch (_) {}

    try {
      const mentorships = app.findCollectionByNameOrId('mentorships')
      if (mentorships.fields.getByName('resumo')) {
        mentorships.fields.removeByName('resumo')
        app.save(mentorships)
      }
    } catch (_) {}
  },
)
