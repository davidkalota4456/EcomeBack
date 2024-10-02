

const { Sequelize } = require('sequelize');
require('dotenv').config();  // Load environment variables from .env file

const isProduction = process.env.NODE_ENV ==='production';

const sequelize = new Sequelize(
    isProduction ? process.env.RDS_DB_NAME : process.env.DB_NAME,  // Use RDS DB name in production
    isProduction ? process.env.RDS_DB_USER : process.env.DB_USER,  // Use RDS DB user in production
    isProduction ? process.env.RDS_DB_PASSWORD : process.env.DB_PASSWORD,  // Use RDS DB password in production
    {
        host: isProduction ? process.env.RDS_DB_HOST : process.env.DB_HOST,  // Use RDS host in production
        dialect: 'mysql',  // The database dialect (in this case, MySQL)
        port: process.env.DB_PORT, // MySQL server's port
    }
);

module.exports = sequelize;
