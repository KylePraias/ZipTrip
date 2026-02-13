const express = require('express');
const cors = require('cors');
require('dotenv').config();

const geminiRoute = require('./routes/geminiservice');
const geminiActivities = require('./routes/geminiactivities');

const app = express();

/*
  ✅ CORS
  Allows local frontend (Vite) and your deployed frontend.
  Replace the Vercel URL with your real one after deployment.
*/
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      process.env.FRONTEND_URL // set this in Render later
    ],
    credentials: true
  })
);

app.use(express.json());

// Routes
app.use('/api/gemini', geminiRoute);
app.use('/api/gemini-activities', geminiActivities);

// Optional health check route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// ✅ Required for Render
const PORT = process.env.PORT || 8989;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
