// models/ClientsMsg.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const ClientsMsg = sequelize.define('ClientMsg', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isEmail: true,
        },
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false,
    }
});

module.exports = ClientsMsg;
