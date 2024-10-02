const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Discounts = sequelize.define('Discounts', {
    productName: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: true,
    },
    newPrice: { 
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    originalPrice: {  
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
    },
    minimumSunOrders: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
    },
    minimumOrderAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
    },
    startDate: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    endDate: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    usageLimit: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    usedCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    earnPerLose: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    percentageOffDiscount: {
        type: DataTypes.DECIMAL(5, 2), // Allows percentage values, e.g., 10.00 for 10%
        allowNull: true,
    },
    sumOfDiscount: {
        type: DataTypes.DECIMAL(10, 2), // Total discount sum applied
        allowNull: true,
    },
    productFamily: {
        type: DataTypes.STRING, // To categorize discounts by product family
        allowNull: true,
    },
    
});

module.exports = Discounts;
