const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect('mongodb+srv://omixflow:aDwrgsUfDCfFzdsg@cluster0.o3jj6wy.mongodb.net/yourDatabaseName?retryWrites=true&w=majority&appName=Cluster0');
        console.log('✅ MongoDB Connected Successfully!');
    } catch (err) {
        console.error('❌ MongoDB Connection Error:', err.message);
        process.exit(1);
    }
};

module.exports = connectDB;
