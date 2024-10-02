const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const User = sequelize.define('User', {
    fullName: {
      type: DataTypes.STRING,  // Use the correct column name and type
      allowNull: false
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    tableName: 'Users',  // Use the correct table name
  });
  

// Export the model to be used elsewhere in your app
module.exports = User;
