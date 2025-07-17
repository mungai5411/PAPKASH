const express = require('express');
const multer = require('multer');
const path = require('path');
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Get all available tasks
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user.isActive) {
      return res.status(403).json({ 
        message: 'Please complete your registration payment to access tasks' 
      });
    }

    const tasks = await Task.find({ isActive: true });
    
    // Add completion status for each task
    const tasksWithStatus = tasks.map(task => {
      const completedTask = user.completedTasks.find(ct => 
        ct.taskId.toString() === task._id.toString()
      );
      
      return {
        ...task.toObject(),
        completed: !!completedTask,
        completionStatus: completedTask?.status || null,
        completedAt: completedTask?.completedAt || null
      };
    });

    res.json({ tasks: tasksWithStatus });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get task by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const user = await User.findById(req.user._id);
    const completedTask = user.completedTasks.find(ct => 
      ct.taskId.toString() === task._id.toString()
    );

    const taskWithStatus = {
      ...task.toObject(),
      completed: !!completedTask,
      completionStatus: completedTask?.status || null,
      completedAt: completedTask?.completedAt || null
    };

    res.json({ task: taskWithStatus });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Submit task completion
router.post('/:id/complete', auth, upload.single('screenshot'), async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (!task.isActive) {
      return res.status(400).json({ message: 'Task is no longer active' });
    }

    const user = await User.findById(req.user._id);
    
    if (!user.isActive) {
      return res.status(403).json({ 
        message: 'Please complete your registration payment to complete tasks' 
      });
    }

    // Check if user has already completed this task
    const existingCompletion = user.completedTasks.find(ct => 
      ct.taskId.toString() === task._id.toString()
    );

    if (existingCompletion) {
      return res.status(400).json({ message: 'You have already completed this task' });
    }

    // Check if task has reached max completions
    if (task.maxCompletions && task.currentCompletions >= task.maxCompletions) {
      return res.status(400).json({ message: 'Task has reached maximum completions' });
    }

    let proofData = {};
    
    // Handle different verification methods
    if (task.verificationMethod === 'screenshot' && req.file) {
      proofData.screenshot = `/uploads/${req.file.filename}`;
    } else if (task.verificationMethod === 'link' && req.body.proofLink) {
      proofData.link = req.body.proofLink;
    }

    // Add task completion to user
    user.completedTasks.push({
      taskId: task._id,
      earnings: task.reward,
      status: 'pending',
      proof: proofData
    });

    // Update user earnings (pending)
    user.earnings.pending += task.reward;

    // Update task completion count
    task.currentCompletions += 1;

    await Promise.all([user.save(), task.save()]);

    res.json({ 
      message: 'Task completed successfully! Your submission is under review.',
      earnings: task.reward,
      status: 'pending'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's completed tasks
router.get('/user/completed', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('completedTasks.taskId', 'title description reward category');

    const completedTasks = user.completedTasks.map(ct => ({
      task: ct.taskId,
      completedAt: ct.completedAt,
      earnings: ct.earnings,
      status: ct.status
    }));

    res.json({ completedTasks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;