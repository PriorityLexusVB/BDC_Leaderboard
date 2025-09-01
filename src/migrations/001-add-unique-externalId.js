const { sequelize } = require('../db');

async function up() {
  const qi = sequelize.getQueryInterface();
  await qi.addConstraint('Calls', {
    fields: ['externalId'],
    type: 'unique',
    name: 'calls_externalId_unique',
  });
}

up()
  .then(() => {
    console.log('Migration completed');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Migration failed', err);
    process.exit(1);
  });

