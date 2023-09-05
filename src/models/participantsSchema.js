const { DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Assuming you have a Sequelize instance called 'sequelize'

const EventParticipants = sequelize.define('EventParticipants', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  eventId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Events', // Make sure to match the table name in your database
      key: 'id',
    },
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users', // Make sure to match the table name in your database
      key: 'id',
    },
  },
  status: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  
});

module.exports = EventParticipants;
