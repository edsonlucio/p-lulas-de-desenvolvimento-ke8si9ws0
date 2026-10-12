migrate(
  (app) => {
    const authRule = "@request.auth.id != ''"

    const courses = new Collection({
      name: 'courses',
      type: 'base',
      listRule: authRule,
      viewRule: authRule,
      createRule: authRule,
      updateRule: authRule,
      deleteRule: authRule,
      fields: [
        { name: 'title', type: 'text', required: true, max: 160 },
        { name: 'slug', type: 'text', required: true, max: 180 },
        { name: 'description', type: 'text', required: true, max: 500 },
        {
          name: 'thumbnail',
          type: 'file',
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
          thumbs: ['640x360'],
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['ativo', 'inativo'],
          maxSelect: 1,
        },
        { name: 'students_count', type: 'number', required: true, min: 0, onlyInt: true },
        { name: 'order', type: 'number', required: true, min: 0, onlyInt: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_courses_slug ON courses (slug)',
        'CREATE INDEX idx_courses_status ON courses (status)',
        'CREATE INDEX idx_courses_order ON courses ("order")',
      ],
    })
    app.save(courses)

    const lessons = new Collection({
      name: 'lessons',
      type: 'base',
      listRule: authRule,
      viewRule: authRule,
      createRule: authRule,
      updateRule: authRule,
      deleteRule: authRule,
      fields: [
        { name: 'title', type: 'text', required: true, max: 180 },
        {
          name: 'course',
          type: 'relation',
          required: true,
          collectionId: courses.id,
          cascadeDelete: true,
          minSelect: 1,
          maxSelect: 1,
        },
        { name: 'duration_min', type: 'number', required: true, min: 0, onlyInt: true },
        { name: 'order', type: 'number', required: true, min: 0, onlyInt: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_lessons_course ON lessons (course)',
        'CREATE INDEX idx_lessons_course_order ON lessons (course, "order")',
      ],
    })
    app.save(lessons)
  },
  (app) => {
    const lessons = app.findCollectionByNameOrId('lessons')
    app.delete(lessons)
    const courses = app.findCollectionByNameOrId('courses')
    app.delete(courses)
  },
)
