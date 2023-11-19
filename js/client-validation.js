// Get a reference to the form element and the success message element
const registrationForm = document.getElementById('registration-form');
const successMessage = document.querySelector('.success');

// Add an event listener for form submission
registrationForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevent the default form submission behavior

    // Fetch the form data
    const formData = new FormData(registrationForm);

    // Validate the form data
    const validationErrors = validateTeacherRegistration(formData);

    // Clear existing error messages
    clearErrorMessages();

    if (Object.keys(validationErrors).length === 0) {
        // No validation errors, submit the form
        try {
            const response = await fetch('/teacher-registration', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                // If registration is successful, display the success message
                registrationForm.reset();
                successMessage.classList.remove('hide');
            } else {
                // If there are validation errors, display them
                const errorData = await response.json();
                displayErrors(errorData.errors);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    } else {
        // There are validation errors, display them
        displayErrors(validationErrors);
    }
});

// Validation function
function validateTeacherRegistration(formData) {
    const school = formData.get('school');
    const subject = formData.get('subject');
    const name = formData.get('name');
    const surname = formData.get('surname');
    const email = formData.get('email');
    const password = formData.get('password');
    const verifyPassword = formData.get('verify-password');

    const errors = {};

    // Check if the email is in a valid format
    if (!validateEmail(email)) {
        errors.email = 'Invalid email format';
    }

    // Check if the password meets criteria (e.g., length, uppercase, numbers, special characters)
    if (!validatePassword(password)) {
        errors.password = 'Password must be at least 8 characters and contain one uppercase letter, one number, and one special character';
    }

    // Check if the password and verify password match
    if (password !== verifyPassword) {
        errors.verifyPassword = 'Passwords do not match';
    }

    // Check if the name, surname, school, and subject are not empty
    if (name === '') {
        errors.name = 'Name is required';
    }

    if (surname === '') {
        errors.surname = 'Surname is required';
    }

    if (school === '') {
        errors.school = 'School is required';
    }

    if (subject === '') {
        errors.subject = 'Subject is required';
    }

    return errors;
}

// Function to display validation errors
function displayErrors(errors) {
    for (const fieldName in errors) {
        const errorElement = document.querySelector(`[name=${fieldName}]`);
        if (errorElement) {
            errorElement.classList.add('error');
            // Display the error message next to the input field
            const errorText = document.createElement('div');
            errorText.className = 'error-text';
            errorText.textContent = errors[fieldName];
            errorElement.parentNode.appendChild(errorText);
        }
    }
}

// Function to clear error messages and remove error styles
function clearErrorMessages() {
    const errorElements = document.querySelectorAll('.error');
    errorElements.forEach((element) => {
        element.classList.remove('error');
    });

    const errorTextElements = document.querySelectorAll('.error-text');
    errorTextElements.forEach((element) => {
        element.parentNode.removeChild(element);
    });
}
