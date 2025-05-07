require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

// Initialize the app
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB (update credentials if needed)
mongoose.connect(process.env.MONGO_NEWS_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB connected"))
.catch(err => console.error("❌ MongoDB connection error:", err));

// Define Schema for News Item
const newsSchema = new mongoose.Schema({
  text: String,
  url: String,
  date: { type: Date, default: Date.now }
});

// Create Model
const News = mongoose.model('News', newsSchema);

// =======================
//        Routes
// =======================

// Get all news items
app.get('/api/news', async (req, res) => {
  try {
    const newsItems = await News.find().sort({ date: -1 }); // Sort by most recent
    res.json(newsItems);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching news', error });
  }
});

// Add new news item
app.post('/api/news', async (req, res) => {
  const { text, url } = req.body;
  try {
    const newNews = new News({ text, url });
    await newNews.save();
    res.status(201).json(newNews);
  } catch (error) {
    res.status(500).json({ message: 'Error adding news', error });
  }
});

// Update full news item (requires both fields)
app.put('/api/news/:id', async (req, res) => {
  const { text, url } = req.body;
  try {
    const updatedNews = await News.findByIdAndUpdate(
      req.params.id,
      { text, url },
      { new: true }
    );
    res.json(updatedNews);
  } catch (error) {
    res.status(500).json({ message: 'Error updating news', error });
  }
});

// 🔥 Partial update for text or url only
app.patch('/api/news/:id', async (req, res) => {
  const updates = req.body;
  try {
    const updatedNews = await News.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    );
    res.json(updatedNews);
  } catch (error) {
    res.status(500).json({ message: 'Error patching news', error });
  }
});

// Delete a news item
app.delete('/api/news/:id', async (req, res) => {
  try {
    const deletedNews = await News.findByIdAndDelete(req.params.id);
    res.json({ message: 'News deleted', deletedNews });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting news', error });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
