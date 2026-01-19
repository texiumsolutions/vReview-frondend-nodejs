const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

// Connect Database
connectDB();

// CORS Configuration for Azure
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    
    // List of allowed origins - ADD YOUR AZURE URL HERE
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://5173-firebase-texium-bitsgit-1759839424435.cluster-owzhzna3l5cj6tredjpnwucna4.cloudworkstations.dev',
      'https://omixflow-ui-nodejs.azurewebsites.net', // YOUR AZURE URL
      'https://*.azurewebsites.net', // Allow all Azure subdomains
      'https://portal.azure.com'
    ];
    
    // Check if origin is in allowed list
    if (allowedOrigins.some(allowedOrigin => 
      origin === allowedOrigin || 
      (allowedOrigin.includes('*') && origin.endsWith(allowedOrigin.split('*')[1]))
    )) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
};

// Use CORS middleware
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Body parser middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint (Azure needs this)
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV || 'development',
    appUrl: 'https://omixflow-ui-nodejs.azurewebsites.net'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'OmixFlow API Server is running on Azure',
    appUrl: 'https://omixflow-ui-nodejs.azurewebsites.net',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      audit: '/api/audit',
      comparison: '/api/comparison',
      query: '/api/query',
      target: '/api/target',
      project: '/api/project',
      projectData: '/api/project-data',
      files: '/api/files',
      health: '/health'
    },
    documentation: 'Add /api/{endpoint} to access resources'
  });
});

// Define Routes
app.use('/api/users', require('./routes/api/users'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/audit', require('./routes/api/audit'));
app.use('/api/comparison', require('./routes/api/comparison'));
app.use('/api/query', require('./routes/api/query'));
app.use('/api/target', require('./routes/api/target'));
app.use('/api/project', require('./routes/api/project'));
app.use('/api/project-data', require('./routes/api/project-data'));
app.use('/api/files', require('./routes/api/files'));

// 404 Handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    method: req.method,
    appUrl: 'https://omixflow-ui-nodejs.azurewebsites.net',
    availableEndpoints: [
      '/api/auth/register',
      '/api/auth/login',
      '/api/users',
      '/api/audit',
      '/api/comparison',
      '/api/query',
      '/api/target',
      '/api/project',
      '/api/project-data',
      '/api/files',
      '/health'
    ]
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', {
    message: err.message,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Handle CORS errors specifically
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      error: 'CORS Error',
      message: 'Origin not allowed',
      requestedOrigin: req.headers.origin,
      allowedOrigins: [
        'http://localhost:5173',
        'http://localhost:3000',
        'https://omixflow-ui-nodejs.azurewebsites.net',
        'https://*.azurewebsites.net'
      ]
    });
  }

  // Handle other errors
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message,
    support: 'Contact support if issue persists'
  });
});

// Use PORT from Azure environment variable
const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                 OmixFlow Server Started                      ║
╠══════════════════════════════════════════════════════════════╣
║ Port: ${PORT}                                               ║
║ Environment: ${process.env.NODE_ENV || 'development'}       ║
║ Database: ${mongoose.connection.readyState === 1 ? '✅ Connected' : '❌ Disconnected'} ║
║ Local URL: http://localhost:${PORT}                         ║
║ Azure URL: https://omixflow-ui-nodejs.azurewebsites.net     ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;