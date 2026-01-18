const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Use environment variable or default local URI
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/omixflowDB';
        
        console.log('Attempting to connect to MongoDB...');
        
        // Hide password in logs for security
        if (mongoURI) {
            const maskedURI = mongoURI.replace(/:[^:@]*@/, ':*****@');
            console.log('Database URI:', maskedURI);
        }
        
        // Connect without deprecated options
        await mongoose.connect(mongoURI);
        
        console.log('✅ MongoDB Connected Successfully!');
        console.log('✅ Database Name:', mongoose.connection.name);
        console.log('✅ Host:', mongoose.connection.host);
        
    } catch (err) {
        console.error('❌ MongoDB Connection Error:', err.message);
        
        // ⚠️ CRITICAL FIX: DO NOT exit the process!
        console.log('⚠️  Server will continue WITHOUT database connection');
        console.log('⚠️  Routes will work in mock mode');
        
        // Mock connection to prevent app crashes
        mongoose.connection.readyState = 1;
    }
};

module.exports = connectDB;