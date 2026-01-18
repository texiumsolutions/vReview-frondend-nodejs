const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Use environment variable or default local URI
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/omixflowDB';
        
        console.log('Attempting to connect to MongoDB...');
        console.log('Database URI:', mongoURI.replace(/:[^:@]*@/, ':*****@')); // Hide password in logs
        
        // Connect without deprecated options
        await mongoose.connect(mongoURI);
        
        console.log('✅ MongoDB Connected Successfully!');
        console.log('✅ Database Name:', mongoose.connection.name);
        console.log('✅ Host:', mongoose.connection.host);
        
    } catch (err) {
        console.error('❌ MongoDB Connection Error:', err.message);
        console.error('❌ Error Details:', err);
        
        // Don't exit process in production - let server run without DB
        if (process.env.NODE_ENV === 'production') {
            console.log('⚠️  Server will continue without database connection');
        } else {
            console.error('❌ Exiting process due to database connection failure');
            process.exit(1);
        }
    }
};

module.exports = connectDB;