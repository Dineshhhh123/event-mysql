const { DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Assuming you have a Sequelize instance called 'sequelize'

const Admin = sequelize.define('Admin', {
  adminname: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

module.exports = Admin;
