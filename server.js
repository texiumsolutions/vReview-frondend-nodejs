const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

// Connect Database
connectDB();

// ========== CORS CONFIGURATION ==========
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://wonderful-ground-077d1db10.1.azurestaticapps.net',
  'https://omixflow-ui-nodejs.azurewebsites.net',
  'https://*.azurestaticapps.net',
  'https://*.azurewebsites.net'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (origin === allowedOrigin) return true;
      if (allowedOrigin.includes('*')) {
        const domain = allowedOrigin.replace('*.', '');
        return origin.endsWith(domain);
      }
      return false;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('❌ CORS blocked origin:', origin);
      callback(new Error(`CORS Error: ${origin} not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With', 'x-auth-token'],
  exposedHeaders: ['x-auth-token'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} | Origin: ${req.headers.origin || 'none'}`);
  next();
});

// Body parser middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ========== ESSENTIAL ROUTES ==========
app.get('/', (req, res) => {
  res.json({
    message: '🚀 Vreview API Server is running on Azure',
    status: 'active',
    serverTime: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? '✅ Connected' : '❌ Disconnected',
    backendUrl: 'https://omixflow-ui-nodejs.azurewebsites.net',
    frontendUrl: 'https://wonderful-ground-077d1db10.1.azurestaticapps.net',
    allowedOrigins: allowedOrigins,
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
    }
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    cors: {
      enabled: true,
      allowedOrigins: allowedOrigins.length,
      frontendUrl: 'https://wonderful-ground-077d1db10.1.azurestaticapps.net'
    },
    database: mongoose.connection.readyState === 1
  });
});

// Test endpoint for CORS
app.get('/cors-test', (req, res) => {
  res.json({
    message: 'CORS test successful!',
    origin: req.headers.origin,
    allowed: true,
    timestamp: new Date().toISOString()
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
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    requestedUrl: req.originalUrl,
    allowedOrigins: allowedOrigins,
    frontendUrl: 'https://wonderful-ground-077d1db10.1.azurestaticapps.net'
  });
});

app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  
  // Handle CORS errors
  if (err.message.includes('CORS')) {
    return res.status(403).json({
      error: 'CORS Error',
      message: err.message,
      yourOrigin: req.headers.origin,
      allowedOrigins: allowedOrigins,
      frontendUrl: 'https://wonderful-ground-077d1db10.1.azurestaticapps.net',
      fix: 'Ensure your frontend URL is in allowedOrigins list'
    });
  }
  
  res.status(500).json({
    error: 'Server Error',
    message: err.message
  });
});

// ========== SERVER START ==========
const PORT = process.env.PORT || 8080;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                 🚀 Vreview Server Started                   ║
╠══════════════════════════════════════════════════════════════╣
║ Port: ${PORT}                                               ║
║ Environment: ${process.env.NODE_ENV || 'development'}       ║
║ Database: ${mongoose.connection.readyState === 1 ? '✅ Connected' : '❌ Disconnected'} ║
║ 
║       ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;