const express = require('express');
const cors = require('cors');
require('dotenv').config();

const geminiRoute = require('./routes/geminiservice');
const geminiActivities = require('./routes/geminiactivities');

const app = express();

app.use(
  cors({
    origin: [
      'http://localhost:5173',
      process.env.FRONTEND_URL
    ],
    credentials: true
  })
);

app.use(express.json());

// Routes
app.use('/api/gemini', geminiRoute);
app.use('/api/gemini-activities', geminiActivities);

app.get('/', (req, res) => {
  res.send('API is running...');
});

const PORT = process.env.PORT || 8989;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
