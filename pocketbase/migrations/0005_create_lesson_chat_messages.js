migrate(
  (app) => {
    const lessons = app.findCollectionByNameOrId('lessons')

    const chatCollection = new Collection({
      name: 'lesson_chat_messages',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != '' && @request.body.user = @request.auth.id",
      updateRule: "@request.auth.id != '' && user = @request.auth.id",
      deleteRule: "@request.auth.id != '' && user = @request.auth.id",
      fields: [
        {
          name: 'lesson',
          type: 'relation',
          required: true,
          collectionId: lessons.id,
          cascadeDelete: true,
          minSelect: 1,
          maxSelect: 1,
        },
        {
          name: 'user',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          minSelect: 1,
          maxSelect: 1,
        },
        {
          name: 'message',
          type: 'text',
          required: true,
          max: 2000,
        },
        {
          name: 'created',
          type: 'autodate',
          onCreate: true,
          onUpdate: false,
        },
        {
          name: 'updated',
          type: 'autodate',
          onCreate: true,
          onUpdate: true,
        },
      ],
      indexes: [
        'CREATE INDEX idx_chat_lesson_created ON lesson_chat_messages (lesson, created)',
        'CREATE INDEX idx_chat_user ON lesson_chat_messages (user)',
      ],
    })

    app.save(chatCollection)
  },
  (app) => {
    try {
      const chatCollection = app.findCollectionByNameOrId('lesson_chat_messages')
      app.delete(chatCollection)
    } catch (_) {}
  },
)
