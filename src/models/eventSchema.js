const { DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Assuming you have a Sequelize instance called 'sequelize'
const Admin = require('../models/adminSchema')
const User = require('../models/userSchema')

const Event = sequelize.define('Event', {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  location: {
    type: DataTypes.GEOMETRY('POINT'),
    allowNull: true,
  },
  Status: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

// Associations
Event.belongsTo(Admin, { foreignKey: 'organizerId', as: 'organizer' });
Event.belongsToMany(User, { through: 'EventParticipants', as: 'participants', foreignKey: 'eventId' });
User.belongsToMany(Event, { through: 'EventParticipants', as: 'events', foreignKey: 'userId' });

module.exports = Event;
