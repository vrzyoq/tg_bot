const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const User = sequelize.define('User', {
    userId: {
        type: DataTypes.BIGINT,
        primaryKey: true,
    },
    balance: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    }
});

async function addBalance(userId, amount) {
    const [user] = await User.findOrCreate({
        where: { userId },
    });

    await user.increment('balance', { by: amount });
    return user;
}

async function removeBalance(userId, amount) {
    const [user] = await User.findOrCreate({
        where: { userId },
    });

    user.balance -= amount;

    if (user.balance < 0) user.balance = 0;

    await user.save();
}

module.exports = { User, addBalance, removeBalance };