// models/Revenue.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Revenue = sequelize.define('Revenue', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    date: {
        type: DataTypes.DATE,
        allowNull: false,
    },
});

module.exports = Revenue;
