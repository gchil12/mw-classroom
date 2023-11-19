const express = require('express');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;

// Replace with your actual secret key from the .env file
const jwtSecretKey = 'eb58574e95b57de9b9b216e0dc8ea054e73fc8ad9986498dd70bfb93612899c8';

// Middleware for parsing JSON
app.use(bodyParser.json());

// Middleware for verifying the token
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization');

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token.replace('Bearer ', ''), jwtSecretKey);
    req.teacher = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token.' });
  }
};

// Endpoint to add a new class
app.post('/api/addclass', verifyToken, (req, res) => {
  try {
    const { classname, class_description, subject, grade, start_date, end_date, teacher_id } = req.body;

    // Replace this with your desired logic to save the class data to the database
    // For this example, we'll just send a success message
    res.json({ message: 'Class added successfully' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
