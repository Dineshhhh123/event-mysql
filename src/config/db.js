const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('event', 'root', 'Dinesh@123', {
  host: 'localhost',
  dialect: 'mysql',
});

module.exports = sequelize;