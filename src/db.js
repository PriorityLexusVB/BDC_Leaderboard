const { Sequelize, DataTypes } = require('sequelize');

const connectionString = process.env.DATABASE_URL || 'sqlite:database.sqlite';
const sequelize = new Sequelize(connectionString, { logging: false });

const Agent = sequelize.define('Agent', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  firstName: DataTypes.STRING,
  lastName: DataTypes.STRING,
  totalPoints: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
});

const Call = sequelize.define('Call', {
  externalId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
  points: DataTypes.INTEGER
});

Agent.hasMany(Call, { foreignKey: 'agentId' });
Call.belongsTo(Agent, { foreignKey: 'agentId' });

async function initDb() {
  await sequelize.sync();
}

module.exports = { sequelize, Agent, Call, initDb };
