const devConfig = require('./dev.config');
const mongoose = require('mongoose');

const connectDB = async () => {
    const uri = devConfig.DB_URL;
    console.log(uri);
    try {
        await mongoose.connect(uri);
        console.log('MongoDB connected successfully');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
};

module.exports = connectDB;