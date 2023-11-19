import { makeAuthorizedRequest } from './make-authorized-request.js'; // Import the makeAuthorizedRequest function
const teacherToken = localStorage.getItem('jwtToken'); // Use teacherToken here


console.log('dashboard-spa.js loaded');
document.addEventListener("DOMContentLoaded", function () {
  const menuItems = document.querySelectorAll(".menu-item");
  const sections = document.querySelectorAll("main section");

  // Set the initial state (e.g., display "Dashboard" content by default)
  showContent("dashboard");
  highlightMenuItem("dashboard");

  // Add event listeners for menu item clicks
  menuItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      const sectionId = e.target.getAttribute("data-section");
      showContent(sectionId);
      highlightMenuItem(sectionId);
    });
  });

  // Function to display the selected content section
  function showContent(sectionId) {
    sections.forEach((section) => {
      if (section.classList.contains(sectionId)) {
        section.style.display = "block";
      } else {
        section.style.display = "none";
      }
    });
  }

console.log('Arrived at "highllight the selected menu item"');
  // Function to highlight the selected menu item
  const body = document.querySelector('body');
  body.classList.add('loaded');

  function highlightMenuItem(sectionId) {
    menuItems.forEach((item) => {
      item.parentElement.classList.remove("active");
    });

    const selectedMenuItem = [...menuItems].find((item) => {
      return item.getAttribute("data-section") === sectionId;
    });

    if (selectedMenuItem) {
      selectedMenuItem.parentElement.classList.add("active");
    }
  }

  console.log('arrived at function "createNotification');
  function createNotification(message, link) {
  const notification = document.createElement("div");
  notification.classList.add("notification");
  notification.innerHTML = `
    <span class="notification-message">${message}</span>
    <a class="notification-link" href="${link}" target="_blank">Read more</a>
    <button class="notification-close">X</button>
  `;

  console.log('arrived at "add click event listener to close the notification"');
  // Add click event listener to close the notification
  const closeButton = notification.querySelector(".notification-close");
  closeButton.addEventListener("click", () => {
    notification.remove();
  });

  return notification;
}

console.log('arrived at DisplayNotification');
  // Function to display a notification within the notification-center
  function displayNotification(message, link) {
    const notificationCenter = document.querySelector(".notification-center");
    const notification = createNotification(message, link);
    notificationCenter.appendChild(notification);
  }

  // Check if there's a notification query parameter
  const queryParams = new URLSearchParams(window.location.search);
  const notificationMessage = queryParams.get("notification");
  if (notificationMessage) {
    // Decode the message and display the notification
    const decodedMessage = decodeURIComponent(notificationMessage);
    displayNotification(decodedMessage, "");
  }
});
// ... (other code)

document.addEventListener('DOMContentLoaded', () => {
  const addClassForm = document.getElementById('addClassForm');

  addClassForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(addClassForm);
    const classData = {};

    // Convert form data to a JSON object
    formData.forEach((value, key) => {
      classData[key] = value;
    });

    try {
      const decodedToken = jwt_decode(teacherToken); // You may need to install the jwt-decode library

      // Ensure that the Teacher ID is available in the JWT token
      if (decodedToken && decodedToken.id) {
        classData[teacher_id] = decodedToken.id;
      } else {
        console.error('Teacher ID not found in JWT token.');
        return;
      }

      const response = await fetch('/api/classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${teacherToken}`, // Use teacherToken here
        },
        body: JSON.stringify(classData),
      });

      if (response.ok) {
        // Class added successfully, you can handle the response here
        const addedClass = await makeAuthorizedRequest('/api/classes', 'POST', classData);
        console.log('Class added:', addedClass);

        // Clear the form for the next entry
        addClassForm.reset();
      } else {
        // Handle error response
        console.error('Error:', response.statusText);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  });
});

async function logout() {
  console.log('Teacher Token:', teacherToken); // Add this log

  try {
    // Send a request to invalidate the JWT token on the server
    const response = await fetch('/api/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('teacherToken')}`,
      },
    });

    if (response.ok) {
      // Token invalidated on the server, now remove it from client-side storage
      localStorage.removeItem('teacherToken');

      // Redirect the user to the login page
      window.location.href = '/login.html';
    } else {
      console.error('Error:', response.statusText);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

console.log('Arrived to Button Script');
document.addEventListener('DOMContentLoaded', (event) => {
  const logoutButton = document.getElementById('logout-button');
  if (logoutButton) {
    logoutButton.addEventListener('click', logout);
  }
});