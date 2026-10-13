migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    const usersId = users.id
    const courses = app.findCollectionByNameOrId('courses')
    const coursesId = courses.id

    // 1. enrollments
    const enrollments = new Collection({
      name: 'enrollments',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (user = @request.auth.id || @request.auth.role = 'adm' || @request.auth.role = 'coordenador')",
      viewRule:
        "@request.auth.id != '' && (user = @request.auth.id || @request.auth.role = 'adm' || @request.auth.role = 'coordenador')",
      createRule:
        "@request.auth.id != '' && (@request.auth.role = 'adm' || @request.auth.role = 'coordenador')",
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
        {
          name: 'course',
          type: 'relation',
          required: true,
          collectionId: coursesId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['ativo', 'cancelado'],
          maxSelect: 1,
        },
        { name: 'purchased_at', type: 'date', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_enrollments_user_course ON enrollments (user, course)',
        'CREATE INDEX idx_enrollments_status ON enrollments (status)',
      ],
    })
    app.save(enrollments)

    // 2. Adicionar campos de material de estudo em mentorships se ainda não existirem
    const mentorships = app.findCollectionByNameOrId('mentorships')
    let mutatedMentorships = false
    if (!mentorships.fields.getByName('study_material')) {
      mentorships.fields.add(
        new TextField({
          name: 'study_material',
          required: false,
        }),
      )
      mutatedMentorships = true
    }
    if (!mentorships.fields.getByName('study_material_file')) {
      mentorships.fields.add(
        new FileField({
          name: 'study_material_file',
          required: false,
          maxSelect: 1,
          maxSize: 20971520, // 20 MB
          mimeTypes: [
            'application/pdf',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          ],
        }),
      )
      mutatedMentorships = true
    }
    if (!mentorships.fields.getByName('course')) {
      mentorships.fields.add(
        new RelationField({
          name: 'course',
          required: false,
          collectionId: coursesId,
          cascadeDelete: false,
          maxSelect: 1,
        }),
      )
      mutatedMentorships = true
    }
    if (mutatedMentorships) {
      app.save(mentorships)
    }
  },
  (app) => {
    try {
      const enrollments = app.findCollectionByNameOrId('enrollments')
      app.delete(enrollments)
    } catch (_) {}
    try {
      const mentorships = app.findCollectionByNameOrId('mentorships')
      if (mentorships.fields.getByName('study_material')) {
        mentorships.fields.removeByName('study_material')
      }
      if (mentorships.fields.getByName('study_material_file')) {
        mentorships.fields.removeByName('study_material_file')
      }
      if (mentorships.fields.getByName('course')) {
        mentorships.fields.removeByName('course')
      }
      app.save(mentorships)
    } catch (_) {}
  },
)
