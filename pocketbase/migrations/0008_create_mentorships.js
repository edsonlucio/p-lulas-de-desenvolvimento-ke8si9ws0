migrate(
  (app) => {
    const collection = new Collection({
      name: 'mentorships',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (student = @request.auth.id || @request.auth.role = 'adm' || @request.auth.role = 'coordenador')",
      viewRule:
        "@request.auth.id != '' && (student = @request.auth.id || @request.auth.role = 'adm' || @request.auth.role = 'coordenador')",
      createRule:
        "@request.auth.id != '' && (@request.body.student = @request.auth.id || @request.auth.role = 'adm' || @request.auth.role = 'coordenador')",
      updateRule:
        "@request.auth.id != '' && (@request.auth.role = 'adm' || @request.auth.role = 'coordenador')",
      deleteRule:
        "@request.auth.id != '' && (@request.auth.role = 'adm' || @request.auth.role = 'coordenador')",
      fields: [
        {
          name: 'student',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'topic', type: 'text', required: true, max: 300 },
        { name: 'scheduled_at', type: 'date', required: true },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['agendada', 'concluida', 'cancelada'],
          maxSelect: 1,
        },
        { name: 'meeting_link', type: 'text' },
        { name: 'notes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_mentorships_student ON mentorships (student)',
        'CREATE INDEX idx_mentorships_status ON mentorships (status)',
        'CREATE INDEX idx_mentorships_scheduled ON mentorships (scheduled_at)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('mentorships')
    app.delete(collection)
  },
)
