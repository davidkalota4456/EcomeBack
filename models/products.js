const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Products = sequelize.define('Products', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    previousPrice: {  // New column for original price
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
    },
    description: { // Add this line for the description field
        type: DataTypes.TEXT,
        allowNull: true, // Allow NULL values for the description field
    },
    family: {
        type: DataTypes.TEXT,
    },
    quantity: {
        type: DataTypes.STRING,
        allowNull: false,
    },
});

module.exports = Products;
