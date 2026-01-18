const express = require('express');
const connectDB = require('./config/db'); // Adjust path as needed
require('dotenv').config();

const app = express();

// Connect to Database
connectDB();

// Middleware
app.use(express.json());

// Routes
app.get('/', (req, res) => {
    res.json({
        message: 'Server is running!',
        database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
        timestamp: new Date().toISOString()
    });
});

app.get('/health', (req, res) => {
    const dbStatus = mongoose.connection.readyState;
    res.json({
        server: 'running',
        database: dbStatus === 1 ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
    });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`✅ MongoDB State Code: ${mongoose.connection.readyState}`);
    console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
});