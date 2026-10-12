migrate(
  (app) => {
    try {
      app.findAuthRecordByEmail('users', 'edsonlucio@gmail.com')
      return
    } catch (_) {}

    const users = app.findCollectionByNameOrId('users')
    const admin = new Record(users)
    admin.setEmail('edsonlucio@gmail.com')
    admin.setPassword('Skip@Pass')
    admin.setVerified(true)
    admin.set('name', 'Edson Lucio')
    admin.set('avatar', '')
    app.save(admin)
  },
  (app) => {
    try {
      const admin = app.findAuthRecordByEmail('users', 'edsonlucio@gmail.com')
      app.delete(admin)
    } catch (_) {}
  },
)
