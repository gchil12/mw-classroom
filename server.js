require('dotenv').config(); // Load environment variables from .env file

const jwt = require('jsonwebtoken');
const jwtSecretKey = process.env.JWT_SECRET_KEY; // Access the JWT secret key from the environment variables
const express = require('express');
const multer = require('multer');
const app = express();
const port = process.env.PORT || 3000;
const { validationResult } = require('express-validator');
const { validatePasswordStrength, validateTeacherRegistration } = require('./validation');
const path = require('path');
const bcrypt = require('bcrypt');
const { pool } = require('./db');
const pgp = require('pg-promise')();
const dbPassword = encodeURIComponent('mw#classroom');
const dbConnectionString = `postgres://postgres:${dbPassword}@localhost:5432/MW_Classroom`;
const db = pgp(dbConnectionString);
const { generateToken } = require('./db');  
const { sendVerificationEmail } = require('./db');
const { verifyUser } = require('./db');
const { storeVerificationToken } = require('./db');
const bodyParser = require('body-parser');

// Configure multer to handle multipart/form-data
const upload = multer();

const verifyToken = (req, res, next) => {
  // Get the token from the request headers
  const authHeader = req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  // Extract the token without the "Bearer " prefix
  const token = authHeader.split(' ')[1];

  try {
    // Verify the token using your secret key
    const decoded = jwt.verify(token, jwtSecretKey);
    req.teacher = decoded; // Store the decoded user data in the request object
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token.' });
  }
};


// Middleware for parsing JSON
app.use(express.json());
app.use(bodyParser.json());

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});

app.set('view engine', 'ejs');

// Middleware for serving static files from the 'teacher-registration' folder
app.use('/teacher-registration', express.static(__dirname + '/teacher-registration'));

// Middleware for serving static files from the 'mw-teacher-desk' folder
app.use('/mw-teacher-desk', express.static(__dirname + '/mw-teacher-desk'));

// Serve 'addclass.html' from the '/mw-teacher-desk' directory
app.get('/mw-teacher-desk/addclass.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'mw-teacher-desk', 'addclass.html'));
});

// Serve static files from the '/public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve JavaScript files from the '/js' directory
app.use('/js', express.static(path.join(__dirname, 'js')));

// Serve CSS files from the '/css' directory
app.use('/css', express.static(path.join(__dirname, 'css')));


const invalidateToken = (req, res) => {
  const token = req.header('Authorization');
  console.log('token invalidation function was called');
  console.log(token);
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    // Verify the token's signature (use the same secret key)
    jwt.verify(token.replace('Bearer ', ''), jwtSecretKey);
    // Here, you can add logic to mark the token as invalidated in your database
    // Example: save the token ID in a list of invalidated tokens

    res.status(200).json({ message: 'Token invalidated successfully' });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token.' });
  }
};

// Endpoint for token invalidation
app.post('/api/logout', invalidateToken);

// Sample route
app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.get('/js/*.js', (req, res) => {
  res.type('application/javascript');
  res.sendFile(req.params[0], { root: __dirname + '/js' }); // Replace 'js' with your directory name
});

// API endpoint to add a new class
app.post('/api/classes', verifyToken, async (req, res) => {
  try {
    const { classname, class_description, subject, grade, start_date, end_date, teacher_id } = req.body;

    // Log the value of 'classname' to check the binding
    console.log('Received classname:', classname);

    // Insert the new class data into the database
    const client = await pool.connect();
    const query = `
      INSERT INTO classes (classname, class_description, subject, grade, start_date, end_date, teacher_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    const values = [classname, class_description, subject, grade, start_date, end_date, teacher_id];
    const result = await client.query(query, values);
    client.release();

    // Respond with the newly added class data as JSON
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API endpoint to retrieve class data
app.get('/api/classes', async (req, res) => {
  try {
    // Get class data from the database
    const client = await pool.connect();
    const query = 'SELECT * FROM classes';
    const result = await client.query(query);
    client.release();

    // Respond with the retrieved class data as JSON
    res.json(result.rows);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Function to check if an email already exists in the database
const checkEmailExists = async (email) => {
  const client = await pool.connect();
  const result = await client.query('SELECT email FROM teachers WHERE email = $1', [email]);
  client.release();
  return result.rows.length > 0;
};

// Check email route
app.post('/check-email', async (req, res) => {
  try {
    const { email } = req.body;

    // Check if the email already exists in the database
    const emailExists = await checkEmailExists(email);

    if (emailExists) {
      // Email is already registered, send a custom error response
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Send a response indicating that the email is available
    res.json({ available: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
// Teacher registration route with password strength validation
app.post('/teacher-regver', upload.none(), validateTeacherRegistration, async (req, res) => {
  const { password } = req.body;

  console.log('Received Form Data:', req.body); // Log the received form data

  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // Check password strength
  const isStrongPassword = validatePasswordStrength(password);

  if (!isStrongPassword) {
    return res.status(400).json({ errors: [{ msg: 'Password must be minimum 8 characters and contain one digit, an uppercase letter, and a lowercase letter' }] });
  }

  // Hash the password before storing it in the database
  const hashedPassword = await bcrypt.hash(password, 10);

  // Insert data into the database
  try {
    const { school, subject, name, surname, email } = req.body;

    // Check if the email already exists in the database before inserting
    const emailExists = await checkEmailExists(email);

    if (emailExists) {
      // Email already exists in the database
      return res.status(400).json({ errors: [{ msg: 'Email already exists in the database. Please use a different email address.' }] });
    }

    console.log('Data to be inserted into the database:', {
      school,
      subject,
      name,
      surname,
      email,
      hashedPassword,
      teacherToken,
    });

    const client = await pool.connect();
    const result = await client.query(
      'INSERT INTO teachers (school, subject, "firstName", "lastName", email, password, "teacherverificationtoken", "registrationDate") VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())',
      [school, subject, name, surname, email, hashedPassword, teacherToken]
    );

    client.release();

    // Check if the data was inserted successfully
    if (result.rowCount === 1) {
      // Registration was successful
      res.json({ message: 'Teacher registration successful' });

      // Send verification email
      try {
        await sendVerificationEmail(email, teacherToken);
        console.log('Verification email sent successfully');
      } catch (error) {
        console.error('Error sending verification email:', error);
        // Handle email sending errors if needed
      }
    } else {
      // Handle the case where the data was not inserted
      res.status(500).json({ error: 'Internal server error' });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/verify', async (req, res) => {
  try {
    const { token } = req.query;

    // Verify the user with the token using the verifyUser function
    const userVerified = await verifyUser(token);

    // Update the verification status in the database
    if (userVerified) {
      await storeVerificationToken(token);

      // Redirect to dashboard.html with the notification anchor
      res.redirect('/dashboard.html#dashboard');
    } else {
      // Render the confirmation page with the verification result
      res.render('confirmation', { userVerified });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Query the database to find a teacher with the given email
    const client = await pool.connect();
    const query = 'SELECT * FROM teachers WHERE email = $1';
    const result = await client.query(query, [email]);
    client.release();

    // Check if a teacher with the given email was found
    if (result.rows.length === 1) {
      const teacher = result.rows[0];
    
      // Compare the password hash from the database with the provided password
      const passwordMatch = await bcrypt.compare(password, teacher.password);
    
      if (passwordMatch) {
        // Passwords match, authentication successful
    
        // Generate a JWT token here
        const jwt = require('jsonwebtoken');
        const secretKey = jwtSecretKey; // Replace with your secret key
        console.log(secretKey);
        const teacherData = {
          id: teacher.id, // Use the teacher's actual ID from the database
          email: teacher.email, // Use the teacher's actual email from the database
        };
        const token = jwt.sign(teacherData, secretKey, { expiresIn: '100h' });
        console.log('Generated JWT Token:', token);

        // Save the token in the database
        saveTokenInDatabase(token);

        res.status(200).json({ message: 'Login successful', token });
      } else {
        // Passwords do not match, authentication failed
        res.status(401).json({ error: 'Invalid email or password' });
      }
    } else {
      // No teacher with the given email found, authentication failed
      res.status(401).json({ error: 'Invalid email or password' });
    }
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const saveTokenInDatabase = async (token) => {
  try {
    // Insert the token into the database with is_valid set to true
    const query = 'INSERT INTO all_tokens (token, is_valid) VALUES ($1, true)';
    const values = [token];
    await db.none(query, values); // Use your database library to execute the query
  } catch (error) {
    console.error('Error saving token in the database:', error);
    // Handle the error appropriately
  }

};

// Start the server
app.listen(port, async () => {
  console.log(`Server is running on port ${port}`);
});
