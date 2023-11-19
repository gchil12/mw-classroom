// Get a reference to the form element and the success message element
const registrationForm = document.getElementById('registration-form');
const successMessage = document.querySelector('.success');
const errorMessage = document.querySelector('.error-message');

// Add an event listener for form submission
registrationForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevent the default form submission behavior

    // Clear the error message
    errorMessage.textContent = '';

    // Create a new FormData object from the form
    const formData = new FormData(registrationForm);

    // Get the email from the form data
    const email = formData.get('email');

    // Check if the email is already registered
    try {
        const emailCheckResponse = await fetch('/check-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
        });

        if (!emailCheckResponse.ok) {
            const emailCheckErrorData = await emailCheckResponse.json();
            if (emailCheckResponse.status === 400 && emailCheckErrorData.error === 'Email already registered') {
                // Handle the case where the email is already registered
                errorMessage.textContent = 'Email is already registered. Please use a different email address.';
                return; // Stop processing the form submission
            } else if (emailCheckResponse.status === 400) {
                // Handle other validation errors
                errorMessage.textContent = 'Validation error: ' + emailCheckErrorData.message;
                return; // Stop processing the form submission
            } else {
                // Handle other server errors
                displayErrors(emailCheckErrorData.errors);
                return; // Stop processing the form submission
            }
        }
    } catch (emailCheckError) {
        console.error('Email Check Error:', emailCheckError);
    }

    // Send a POST request to the server with the form data
    try {
        const response = await fetch('/teacher-regver', {
            method: 'POST',
            body: formData, // Use the FormData object
        });

        if (response.ok) {
            window.location.href = 'teacher-registration-success.html';
        } else {
            // If there are validation errors, display them and highlight the fields
            const errorData = await response.json();
            if (response.status === 400) {
                // Handle the "Weak Password" error specifically
                errorMessage.textContent = 'Weak password. Write minimum 8 characters and include a number, a special character, and a capital letter';
            } else {
                displayErrors(errorData.errors);
            }
        }
    } catch (error) {
        console.error('Error:', error);
    }
});

// Rest of your code...

// Function to check if any of the required fields are empty
function isEmpty(formData) {
    for (const value of formData.values()) {
        if (!value) {
            return true;
        }
    }
    return false;
}

// Function to display validation errors
function displayErrors(errors) {
    // Remove any existing error styles
    const errorFields = document.querySelectorAll('.error');
    errorFields.forEach((field) => {
        field.classList.remove('error');
    });

    // Clear the error message
    errorMessage.textContent = '';

    // Iterate through the errors and display them for existing form fields
    for (const fieldName in errors) {
        // Check if the field exists in the form
        const errorElement = registrationForm.querySelector(`[name="${fieldName}"]`);
        if (errorElement) {
            errorElement.classList.add('error');
            errorMessage.textContent += `${errors[fieldName]} `;
        }
    }
}
