const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

// Connect Database
connectDB();

// ========== SIMPLIFIED CORS FOR AZURE ==========
// Allow all origins temporarily to fix 403 error
app.use(cors({
  origin: '*', // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With']
}));

// Handle preflight requests
app.options('*', cors());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} | Origin: ${req.headers.origin || 'none'}`);
  next();
});

// Body parser middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ========== ESSENTIAL ROUTES FOR AZURE ==========
// Default route - Azure requires this
app.get('/', (req, res) => {
  res.json({
    message: '🚀 OmixFlow API Server is running on Azure',
    status: 'active',
    serverTime: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? '✅ Connected' : '❌ Disconnected',
    azureUrl: 'https://omixflow-ui-nodejs.azurewebsites.net',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login'
      },
      users: 'GET /api/users',
      audit: 'GET /api/audit',
      comparison: 'GET /api/comparison',
      query: 'GET /api/query',
      target: 'GET /api/target',
      project: 'GET /api/project',
      projectData: 'GET /api/project-data',
      files: 'GET /api/files',
      health: 'GET /health'
    },
    note: 'Use Content-Type: application/json for POST requests'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: mongoose.connection.readyState === 1,
    memory: process.memoryUsage(),
    nodeVersion: process.version
  });
});

// ========== API ROUTES ==========
app.use('/api/users', require('./routes/api/users'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/audit', require('./routes/api/audit'));
app.use('/api/comparison', require('./routes/api/comparison'));
app.use('/api/query', require('./routes/api/query'));
app.use('/api/target', require('./routes/api/target'));
app.use('/api/project', require('./routes/api/project'));
app.use('/api/project-data', require('./routes/api/project-data'));
app.use('/api/files', require('./routes/api/files'));

// ========== ERROR HANDLING ==========
// 404 - Route not found
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    requestedUrl: req.originalUrl,
    method: req.method,
    availableRoutes: [
      'GET /',
      'GET /health',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET /api/users',
      'GET /api/audit',
      'GET /api/comparison',
      'GET /api/query',
      'GET /api/target',
      'GET /api/project',
      'GET /api/project-data',
      'GET /api/files'
    ]
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
  });
});

// ========== SERVER START ==========
// Azure uses port 8080 by default
const PORT = process.env.PORT || 8080;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                 🚀 OmixFlow Server Started                   ║
╠══════════════════════════════════════════════════════════════╣
║ Port: ${PORT}                                               ║
║ Environment: ${process.env.NODE_ENV || 'development'}       ║
║ Database: ${mongoose.connection.readyState === 1 ? '✅ Connected' : '❌ Disconnected'} ║
║ Local URL: http://localhost:${PORT}                         ║
║ Azure URL: https://omixflow-ui-nodejs.azurewebsites.net     ║
║ Health Check: /health                                        ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;