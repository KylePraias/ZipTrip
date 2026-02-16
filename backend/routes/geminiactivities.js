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
  const { destination } = req.body;

  if (!destination) {
    return res.status(400).json({ error: "Missing required field: destination" });
  }

  const prompt = `You are a travel expert. Suggest 5 unique and memorable activities for a trip to ${destination}.

For each activity, provide:
- A clear activity name
- A brief description (1-2 sentences) explaining what it is and why it's worth doing

Format your response as a JSON array with objects containing "name" and "description" fields.
Example format:
[
  {"name": "Visit the Eiffel Tower", "description": "Iconic landmark offering stunning panoramic views of Paris from its observation decks."},
  {"name": "Seine River Cruise", "description": "Relaxing boat tour showcasing Paris's beautiful architecture and bridges."}
]

Only return the JSON array, no additional text.`;

  try {
    const result = await retryWithBackoff(async () => {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      return await model.generateContent(prompt);
    });
    
    const text = result.response.text();
    
    // Try to parse as JSON first
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const activities = JSON.parse(jsonMatch[0]);
        return res.json({ activities, format: 'structured' });
      }
    } catch (parseErr) {
      // Fall back to text format
    }
    
    res.json({ suggestions: text, format: 'text' });
  } catch (err) {
    console.error("Gemini Activity API Error:", err.message || err);
    res.status(500).json({ error: "Failed to generate activity suggestions. Please try again." });
  }
});

module.exports = router;
