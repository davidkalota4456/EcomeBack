const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize'); // Adjust path as needed

const Session = sequelize.define('Session', {
    sid: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    expires: {
        type: DataTypes.DATE,
    },
    data: {
        type: DataTypes.TEXT,
    },
    username: {
        type: DataTypes.STRING,
    },
    cartSum: {
        type: DataTypes.FLOAT, 
        defaultValue: 0.0,
    },
    itemCount: {
        type: DataTypes.INTEGER, 
        defaultValue: 0,
    },
    cart: {
        type: DataTypes.STRING, // Use STRING (VARCHAR) type
        defaultValue: '[]', // Set default value to empty list as a string
    },
});

module.exports = Session;
