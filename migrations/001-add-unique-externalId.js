'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addConstraint('Calls', {
      fields: ['externalId'],
      type: 'unique',
      name: 'calls_externalId_unique',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('Calls', 'calls_externalId_unique');
  },
};
