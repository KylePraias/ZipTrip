const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

// Retry helper function
async function retryWithBackoff(fn, maxRetries = 3, initialDelay = 1000) {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

router.post('/', async (req, res) => {
  const { destination, dateRange, purpose, weather } = req.body;

  if (!destination || !dateRange || !purpose) {
    return res.status(400).json({ error: "Missing required fields: destination, dateRange, purpose" });
  }

  const prompt = `
    Create a categorized travel packing checklist for a ${purpose} trip to ${destination} from ${dateRange}.
    Weather: ${weather || 'Mild'}.
    Categories: Clothing, Essentials, Toiletries, Tech.
    Return as plain text.
  `;

  try {
    const result = await retryWithBackoff(async () => {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      return await model.generateContent(prompt);
    });
    
    const text = result.response.text();
    res.json({ checklist: text });
  } catch (err) {
    console.error("Gemini API Error:", err.message || err);
    res.status(500).json({ error: "Gemini API failed. Please try again." });
  }
});

module.exports = router;
