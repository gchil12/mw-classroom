// Import any necessary modules or libraries here

// Define the makeAuthorizedRequest function
const makeAuthorizedRequest = async (url, method, data) => {
  // Retrieve the token from localStorage
  const token = localStorage.getItem('jwtToken');

  // Create headers with the Authorization token
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      // Handle non-successful responses here, e.g., throw an error
      throw new Error('Request failed with status ' + response.status);
    }

    // Parse the response and return data
    const responseData = await response.json();
    return responseData;
  } catch (error) {
    // Handle any errors that occur during the request
    throw new Error('An error occurred while making the authorized request: ' + error.message);
  }
};

// Export the makeAuthorizedRequest function
export { makeAuthorizedRequest };
