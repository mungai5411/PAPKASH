const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['video', 'social_media', 'whatsapp', 'survey', 'other'],
    required: true
  },
  reward: {
    type: Number,
    required: true,
    min: 0
  },
  requirements: {
    type: String,
    required: true
  },
  instructions: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  maxCompletions: {
    type: Number,
    default: null // null means unlimited
  },
  currentCompletions: {
    type: Number,
    default: 0
  },
  platform: {
    type: String, // For social media tasks
    enum: ['facebook', 'instagram', 'twitter', 'whatsapp', 'youtube', 'tiktok', 'other']
  },
  videoUrl: {
    type: String // For video watching tasks
  },
  imageUrl: {
    type: String // For image posting tasks
  },
  targetUrl: {
    type: String // For subscription/follow tasks
  },
  verificationMethod: {
    type: String,
    enum: ['screenshot', 'link', 'automatic', 'manual'],
    default: 'screenshot'
  },
  estimatedTime: {
    type: Number, // in minutes
    default: 5
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'easy'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Task', taskSchema);