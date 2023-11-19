const { Pool } = require('pg');
const pgp = require('pg-promise')();
const crypto = require('crypto'); // Import the crypto module here
const nodemailer = require('nodemailer'); // Import nodemailer here

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'MW_Classroom',
  password: 'mw#classroom',
  port: 5432,
});

const db = pgp({
  // Add your database connection details here
  user: 'postgres',
  password: 'mw#classroom',
  host: 'localhost',
  port: 5432,
  database: 'MW_Classroom',
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Generate a random token
function generateToken() {
  return crypto.randomBytes(32).toString('hex'); // 32 bytes converted to hexadecimal
}

// Function to store the verification token in the database
async function storeVerificationToken(token) {
  const query = `
    UPDATE teachers
    SET "verified" = true
    WHERE "teacherverificationtoken" = $1
  `;

  try {
    await db.none(query, [token]);
  } catch (error) {
    throw error;
  }
}


// Function to send a verification email
async function sendVerificationEmail(email, verificationToken) {
  // Create a Nodemailer transporter with your email service provider settings
  const transporter = nodemailer.createTransport({
    host: 'sandbox.smtp.mailtrap.io',
    port: 587,
    secure: false, // Set this to true if your Mailtrap SMTP settings require SSL
    auth: {
      user: '355a409637f5d8',
      pass: '6e84c74a268aa9',
    },
  });

  // Define the email content
  const mailOptions = {
    from: 'info@milkyway.com',
    to: email,
    subject: 'Verify Your Email',
    text: `Click the following link to verify your email: http://localhost:3000/verify?token=${verificationToken}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

async function verifyUser(token) {
  const query = `
    SELECT email FROM teachers
    WHERE "teacherverificationtoken" = $1
  `;

  try {
    const result = await pool.query(query, [token]);
    return result.rowCount > 0; // Returns true if a matching token is found
  } catch (error) {
    console.error('Error verifying user:', error);
    return false; // Verification failed
  }
}

module.exports = {
  pool,
  db,
  generateToken, // Export the generateToken function
  storeVerificationToken, // Export the storeVerificationToken function
  sendVerificationEmail,
  verifyUser,// Export the sendVerificationEmail function
};
