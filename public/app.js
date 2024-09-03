const API_URL = 'http://localhost:3000';
const INACTIVITY_TIMEOUT = 60 * 60 * 1000; // One hour in milliseconds
let inactivityTimer;
let tasksMap = new Map(); // For storing tasks by ID

// Show login section
function showLogin() {
    document.getElementById('login-section').style.display = 'block';
    document.getElementById('register-section').style.display = 'none';
    document.getElementById('task-manager-section').style.display = 'none';
    resetInactivityTimer(false); // Stop inactivity timer if on login or register screen
}

// Show register section
function showRegister() {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('register-section').style.display = 'block';
    document.getElementById('task-manager-section').style.display = 'none';
    resetInactivityTimer(false); // Stop inactivity timer if on login or register screen
}

// Register user
async function register() {
    const username = document.getElementById('register-username').value.trim();
    const password = document.getElementById('register-password').value.trim();

    if (!username || !password) {
        alert('Username and password are required.');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();
        if (response.ok) {
            alert('Registration successful! Please log in.');
            showLogin();
        } else {
            alert(data.error || 'Registration failed.');
        }
    } catch (error) {
        console.error('Error registering:', error);
        alert('An error occurred while registering.');
    }
}

// Login user
async function login() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value.trim();

    if (!username || !password) {
        alert('Username and password are required.');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('username', username);
            document.getElementById('username-display').textContent = username;
            document.getElementById('auth-section').style.display = 'none';
            document.getElementById('task-manager-section').style.display = 'block';
            resetInactivityTimer(); // Start inactivity timer after login
            fetchTasks();
        } else {
            alert(data.error || 'Login failed.');
        }
    } catch (error) {
        console.error('Error logging in:', error);
        alert('An error occurred while logging in.');
    }
}

// Check if the user is logged in on page load
function checkLoginStatus() {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');

    if (token) {
        document.getElementById('auth-section').style.display = 'none';
        document.getElementById('task-manager-section').style.display = 'block';
        document.getElementById('username-display').textContent = username;
        fetchTasks();
        resetInactivityTimer(true); // Start inactivity timer if logged in
    } else {
        showLogin();
    }
}

// Reset the inactivity timer
function resetInactivityTimer(shouldStart = true) {
    if (shouldStart) {
        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(logoutbyInactivity, INACTIVITY_TIMEOUT);
    } else {
        clearTimeout(inactivityTimer);
    }
}

// Normal logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    document.getElementById('auth-section').style.display = 'block';
    document.getElementById('task-manager-section').style.display = 'none';
    resetInactivityTimer(false); // Stop inactivity timer on logout
}

// Inactivity logout
function logoutbyInactivity() {
    logout();
    alert('You have been logged out due to inactivity.');
}

// Whenever there's user activity execute function
function onUserActivity() {
    if (localStorage.getItem('token')) {
        resetInactivityTimer(true);
    }
}

// Set up event listeners for user activity
window.onload = () => {
    checkLoginStatus();
    checkMode();
    window.addEventListener('mousemove', onUserActivity);
    window.addEventListener('keypress', onUserActivity);
    window.addEventListener('click', onUserActivity);
};

// Fetch tasks for the logged-in user
async function fetchTasks() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/tasks`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.ok) {
            const tasks = await response.json();
            tasksMap.clear(); // Clear existing tasks
            tasks.forEach(task => tasksMap.set(task.id, task));
            renderTasks(tasks);
        } else if (response.status === 401) {
            logout(); // Log out if token is invalid
            alert('You need to log in to view tasks.');
        }
    } catch (error) {
        console.error('Error fetching tasks:', error);
        alert('An error occurred while fetching tasks.');
    }
}

// Render tasks
function renderTasks(tasks) {
    const taskList = document.getElementById('task-list');
    taskList.innerHTML = '';

    tasks.forEach(task => {
        const taskItem = document.createElement('div');
        taskItem.className = 'task-item bg-white text-dark shadow-sm';

        taskItem.innerHTML = `
            <div>
                <strong>${task.name}</strong><br />
                <span>${task.description}</span><br />
                <span>Status: ${task.status}</span>
            </div>
            <div>
                <button class="btn btn-warning" onclick="showEditTaskModal(${task.id})">Edit</button>
                <button class="btn btn-danger" onclick="deleteTask(${task.id})">Delete</button>
            </div>
        `;

        taskList.appendChild(taskItem);
    });
}

// Add a new task
async function addTask() {
    const nameInput = document.getElementById('task-name');
    const descriptionInput = document.getElementById('task-description');
    const statusSelect = document.getElementById('task-status');
    const taskInputs = document.querySelector('.task-inputs');

    let isValid = true;

    // Validate inputs
    if (!nameInput.value.trim()) {
        nameInput.classList.add('is-invalid');
        isValid = false;
    }

    if (!descriptionInput.value.trim()) {
        descriptionInput.classList.add('is-invalid');
        isValid = false;
    }

    const validStatuses = ['Pending', 'In Progress', 'Completed'];
    if (!validStatuses.includes(statusSelect.value)) {
        statusSelect.classList.add('is-invalid-add');
        isValid = false;
    }

    if (!isValid) {
        taskInputs.classList.add('shake');
        setTimeout(() => taskInputs.classList.remove('shake'), 500);
        document.querySelector('.is-invalid-add')?.focus();
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                name: nameInput.value.trim(),
                description: descriptionInput.value.trim(),
                status: statusSelect.value,
            }),
        });

        if (response.ok) {
            fetchTasks();
            nameInput.value = '';
            descriptionInput.value = '';
            statusSelect.value = '';

            document.querySelectorAll('.is-invalid').forEach(input => input.classList.remove('is-invalid'));
            document.querySelectorAll('.is-invalid-add').forEach(input => input.classList.remove('is-invalid-add'));
            taskInputs.classList.remove('shake');
        } else {
            alert('Failed to add task.');
        }
    } catch (error) {
        console.error('Error adding task:', error);
        alert('An error occurred while adding the task.');
    }
}



// Show edit task modal
function showEditTaskModal(id) {
    const task = tasksMap.get(id);
    if (task) {
        document.getElementById('edit-task-id').value = id;
        document.getElementById('edit-task-name').value = task.name;
        document.getElementById('edit-task-description').value = task.description;
        document.getElementById('edit-task-status').value = task.status;
        const editTaskModal = new bootstrap.Modal(document.getElementById('editTaskModal'));
        editTaskModal.show();
    } else {
        alert('Task not found.');
    }
}

// Update task
async function updateTask() {
    const id = document.getElementById('edit-task-id').value;
    const name = document.getElementById('edit-task-name');
    const description = document.getElementById('edit-task-description');
    const status = document.getElementById('edit-task-status');
    const modalElement = document.getElementById('editTaskModal');
    const editTaskModal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);

    document.querySelectorAll('.is-invalid').forEach(input => input.classList.remove('is-invalid'));
    modalElement.classList.remove('shake');

    let isValid = true;

    if (!name.value.trim()) {
        name.classList.add('is-invalid');
        isValid = false;
    }

    if (!description.value.trim()) {
        description.classList.add('is-invalid');
        isValid = false;
    }

    const validStatuses = ['Pending', 'In Progress', 'Completed'];
    if (!validStatuses.includes(status.value)) {
        status.classList.add('is-invalid');
        isValid = false;
    }

    if (!isValid) {
        modalElement.classList.add('shake');
        setTimeout(() => modalElement.classList.remove('shake'), 500);
        document.querySelector('.is-invalid')?.focus();
        return;
    }

    try {
        const updatedTask = { name: name.value, description: description.value, status: status.value };
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/tasks/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(updatedTask),
        });

        if (response.ok) {
            fetchTasks();
            editTaskModal.hide();
        } else {
            alert('Failed to update task.');
        }
    } catch (error) {
        console.error('Error updating task:', error);
        alert('An error occurred while updating the task.');
    }
}







// Delete task
async function deleteTask(id) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/tasks/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.ok) {
            fetchTasks();
        } else {
            alert('Failed to delete task.');
        }
    } catch (error) {
        console.error('Error deleting task:', error);
        alert('An error occurred while deleting the task.');
    }
}

// Toggle Dark/Light Mode
function toggleMode() {
    const body = document.body;
    const isDarkMode = body.classList.contains('bg-dark');

    // Toggle the classes
    body.classList.toggle('bg-light');
    body.classList.toggle('bg-dark');
    body.classList.toggle('text-light');
    body.classList.toggle('text-dark');

    // Store the current mode in localStorage
    localStorage.setItem('darkmode', !isDarkMode);
}

function checkMode() {
    const body = document.body;
    const item = localStorage.getItem('darkmode');
    
    switch (item) {
        case 'true': // If dark mode is enabled
            body.classList.add('bg-dark');
            body.classList.add('text-light');
            body.classList.remove('bg-light');
            body.classList.remove('text-dark');
            break;

        case 'false': // If dark mode is disabled
            body.classList.add('bg-light');
            body.classList.add('text-dark');
            body.classList.remove('bg-dark');
            body.classList.remove('text-light');
            break;

        default: // If no darkmode setting exists
            body.classList.add('bg-light');
            body.classList.add('text-dark');
            localStorage.setItem('darkmode', 'false'); 
            break;
    }
}
