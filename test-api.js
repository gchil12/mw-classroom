const axios = require('axios');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImphcmppYnVraEBnbWFpbC5jb20iLCJpYXQiOjE2OTk0NjE3ODAsImV4cCI6MTY5OTgyMTc4MH0.1JY10RybLbRZ-w_0gn0oHlPe4jX-mXZvBa93w1xH62M'; // Replace with your valid JWT token

const apiUrl = 'http://localhost:3000'; // Adjust the URL to match your server configuration

axios.post(`${apiUrl}/api/classes`, {}, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
})
  .then((response) => {
    console.log('Response:', response.data);
  })
  .catch((error) => {
    console.error('Error:', error.response.data);
  });
