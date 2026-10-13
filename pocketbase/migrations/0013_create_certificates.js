migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    const usersId = users.id
    const courses = app.findCollectionByNameOrId('courses')
    const coursesId = courses.id

    try {
      app.findCollectionByNameOrId('certificates')
    } catch (_) {
      const certificates = new Collection({
        name: 'certificates',
        type: 'base',
        listRule:
          "@request.auth.id != '' && (student = @request.auth.id || @request.auth.role = 'adm' || @request.auth.role = 'coordenador')",
        viewRule:
          "@request.auth.id != '' && (student = @request.auth.id || @request.auth.role = 'adm' || @request.auth.role = 'coordenador')",
        createRule: "@request.auth.id != ''",
        updateRule:
          "@request.auth.id != '' && (@request.auth.role = 'adm' || @request.auth.role = 'coordenador')",
        deleteRule:
          "@request.auth.id != '' && (@request.auth.role = 'adm' || @request.auth.role = 'coordenador')",
        fields: [
          {
            name: 'student',
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
            name: 'issued_at',
            type: 'date',
            required: true,
          },
          {
            name: 'code',
            type: 'text',
            required: true,
          },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE UNIQUE INDEX idx_certificates_student_course ON certificates (student, course)',
          'CREATE UNIQUE INDEX idx_certificates_code ON certificates (code)',
          'CREATE INDEX idx_certificates_student ON certificates (student)',
        ],
      })
      app.save(certificates)
    }
  },
  (app) => {
    try {
      const certificates = app.findCollectionByNameOrId('certificates')
      app.delete(certificates)
    } catch (_) {}
  },
)
