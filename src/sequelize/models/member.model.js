const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('member', {
        firstName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        lastName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        joinDate: {
            type: DataTypes.TIME,
            allowNull: false,
        },
    });
};