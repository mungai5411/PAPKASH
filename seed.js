const mongoose = require('mongoose');
const Task = require('./models/Task');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/papkash', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const sampleTasks = [
  {
    title: "Watch Marketing Video - Brand Awareness",
    description: "Watch a 3-minute promotional video about a new product launch and provide feedback",
    category: "video",
    reward: 30,
    requirements: "Must watch the complete video and answer 3 simple questions",
    instructions: "1. Click on the video link provided\n2. Watch the entire video\n3. Answer the feedback questions\n4. Submit a screenshot of the completed survey",
    platform: "youtube",
    videoUrl: "https://www.youtube.com/watch?v=example1",
    verificationMethod: "screenshot",
    estimatedTime: 5,
    difficulty: "easy"
  },
  {
    title: "Share Product Image on WhatsApp Status",
    description: "Share a promotional image on your WhatsApp status for 24 hours",
    category: "whatsapp",
    reward: 50,
    requirements: "Must have at least 50 WhatsApp contacts",
    instructions: "1. Download the promotional image\n2. Post it on your WhatsApp status\n3. Keep it active for 24 hours\n4. Take a screenshot showing the status post",
    platform: "whatsapp",
    imageUrl: "/images/promo1.jpg",
    verificationMethod: "screenshot",
    estimatedTime: 3,
    difficulty: "easy"
  },
  {
    title: "Follow and Like Facebook Business Page",
    description: "Follow a business Facebook page and like their recent posts",
    category: "social_media",
    reward: 25,
    requirements: "Must have an active Facebook account",
    instructions: "1. Visit the Facebook page link\n2. Click Follow/Like the page\n3. Like the 3 most recent posts\n4. Share one post to your timeline\n5. Screenshot your actions",
    platform: "facebook",
    targetUrl: "https://facebook.com/examplepage",
    verificationMethod: "screenshot",
    estimatedTime: 4,
    difficulty: "easy"
  },
  {
    title: "Subscribe to YouTube Channel",
    description: "Subscribe to a YouTube channel and watch 3 videos",
    category: "social_media",
    reward: 35,
    requirements: "Must have a YouTube account",
    instructions: "1. Visit the YouTube channel\n2. Click Subscribe\n3. Watch 3 videos (at least 2 minutes each)\n4. Leave a positive comment on one video\n5. Screenshot your subscription and comments",
    platform: "youtube",
    targetUrl: "https://youtube.com/c/examplechannel",
    verificationMethod: "screenshot",
    estimatedTime: 15,
    difficulty: "medium"
  },
  {
    title: "Instagram Account Follow and Engagement",
    description: "Follow an Instagram account and engage with their content",
    category: "social_media",
    reward: 40,
    requirements: "Must have an Instagram account with profile picture",
    instructions: "1. Follow the Instagram account\n2. Like the 5 most recent posts\n3. Leave genuine comments on 2 posts\n4. Share one post to your story\n5. Screenshot all activities",
    platform: "instagram",
    targetUrl: "https://instagram.com/exampleaccount",
    verificationMethod: "screenshot",
    estimatedTime: 8,
    difficulty: "medium"
  },
  {
    title: "Product Review Survey",
    description: "Complete a detailed survey about a product or service",
    category: "survey",
    reward: 150,
    requirements: "Must provide honest and detailed responses",
    instructions: "1. Access the survey link\n2. Complete all questions thoroughly\n3. Provide detailed feedback in text fields\n4. Submit the survey\n5. Screenshot the completion confirmation",
    verificationMethod: "screenshot",
    estimatedTime: 20,
    difficulty: "medium"
  },
  {
    title: "Twitter Account Follow and Retweet",
    description: "Follow a Twitter account and retweet their content",
    category: "social_media",
    reward: 30,
    requirements: "Must have an active Twitter account",
    instructions: "1. Follow the Twitter account\n2. Retweet 3 recent tweets\n3. Like 5 recent tweets\n4. Reply to one tweet with a meaningful comment\n5. Screenshot your activities",
    platform: "twitter",
    targetUrl: "https://twitter.com/exampleaccount",
    verificationMethod: "screenshot",
    estimatedTime: 6,
    difficulty: "easy"
  },
  {
    title: "TikTok Account Follow and Engagement",
    description: "Follow a TikTok account and engage with their videos",
    category: "social_media",
    reward: 45,
    requirements: "Must have a TikTok account",
    instructions: "1. Follow the TikTok account\n2. Like 5 recent videos\n3. Share 2 videos to your friends\n4. Leave comments on 2 videos\n5. Screenshot your activities",
    platform: "tiktok",
    targetUrl: "https://tiktok.com/@exampleaccount",
    verificationMethod: "screenshot",
    estimatedTime: 10,
    difficulty: "medium"
  },
  {
    title: "App Download and Review",
    description: "Download a mobile app and write a review",
    category: "other",
    reward: 100,
    requirements: "Must have Android or iOS device",
    instructions: "1. Download the app from Play Store/App Store\n2. Use the app for at least 10 minutes\n3. Write a detailed review (minimum 50 words)\n4. Rate the app (4-5 stars)\n5. Screenshot your review",
    verificationMethod: "screenshot",
    estimatedTime: 15,
    difficulty: "medium"
  },
  {
    title: "Website Registration and Email Verification",
    description: "Register on a website and verify your email",
    category: "other",
    reward: 60,
    requirements: "Must have a valid email address",
    instructions: "1. Visit the website registration page\n2. Fill out the registration form\n3. Verify your email address\n4. Complete your profile (if required)\n5. Screenshot your completed profile",
    verificationMethod: "screenshot",
    estimatedTime: 8,
    difficulty: "easy"
  },
  {
    title: "WhatsApp Group Join and Participation",
    description: "Join a WhatsApp group and participate in discussions",
    category: "whatsapp",
    reward: 80,
    requirements: "Must be active in group for 3 days",
    instructions: "1. Join the WhatsApp group via invite link\n2. Introduce yourself to the group\n3. Participate in discussions for 3 days\n4. Share relevant content when appropriate\n5. Screenshot your participation",
    platform: "whatsapp",
    verificationMethod: "screenshot",
    estimatedTime: 30,
    difficulty: "hard"
  },
  {
    title: "Online Quiz Completion",
    description: "Complete an online quiz about general knowledge",
    category: "survey",
    reward: 75,
    requirements: "Must score at least 70%",
    instructions: "1. Access the quiz link\n2. Answer all questions to the best of your ability\n3. Complete the quiz within the time limit\n4. Achieve a score of 70% or higher\n5. Screenshot your results",
    verificationMethod: "screenshot",
    estimatedTime: 12,
    difficulty: "medium"
  }
];

async function seedDatabase() {
  try {
    // Clear existing tasks
    await Task.deleteMany({});
    console.log('Cleared existing tasks');

    // Insert sample tasks
    await Task.insertMany(sampleTasks);
    console.log('Sample tasks inserted successfully');

    console.log(`${sampleTasks.length} tasks have been added to the database`);
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    mongoose.connection.close();
  }
}

seedDatabase();