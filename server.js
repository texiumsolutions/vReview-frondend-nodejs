const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

// Connect Database
connectDB();

// Allowed origins
const allowedOrigins = [
  'http://localhost:5173',
  'https://5173-firebase-texium-bitsgit-1759839424376.cluster-owzhzna3l5cj6tredjpnwucna4.cloudworkstations.dev'
];

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Define Routes
app.use('/api/users', require('./routes/api/users'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/audit', require('./routes/api/audit'));
app.use('/api/comparison', require('./routes/api/comparison'));
app.use('/api/query', require('./routes/api/query'));
app.use('/api/target', require('./routes/api/target'));
app.use('/api/project', require('./routes/api/project'));
app.use('/api/project-data', require('./routes/api/project-data'));
app.use('/api/files', require('./routes/api/files')); // Add this line

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));