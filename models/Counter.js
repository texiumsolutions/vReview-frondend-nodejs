const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  seq: {
    type: Number,
    default: 690000 // Starting from 690000 as in your frontend
  }
});

module.exports = mongoose.model('Counter', counterSchema);