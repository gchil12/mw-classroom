document.addEventListener('DOMContentLoaded', function () {
  const loginForm = document.getElementById('login-form');
  const loginError = document.getElementById('login-error');

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
      // Send a POST request to the server to authenticate the user
      const response = await fetch('/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.status === 200) {
        // Login successful, redirect to a dashboard or another page
        window.location.href = '/dashboard.html';

          // Store the token in localStorage
        localStorage.setItem('jwtToken', data.token); // Correct placement
        
      } else {
        // Login failed, display an error message
        loginError.textContent = data.error || 'Login failed. Please check your credentials.';
      }
    } catch (error) {
      console.error('Error:', error);
      loginError.textContent = 'An error occurred while processing your request.';
    }
  });
});

