const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const { getTasks, createTask, updateTask, deleteTask } = require('./tasks');

const app = express();
const PORT = 3000;
const USERS_FILE = path.join(__dirname, 'users.json');
const SECRET_KEY = 'your_secret_key'; // Use a strong secret key in production

app.use(bodyParser.json());
app.use(cors());

let users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));

// Save users to JSON file
const saveUsers = () => {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
};

// Register new user
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    if (users[username]) {
        return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    users[username] = { password: hashedPassword, tasks: [] };
    saveUsers();

    res.status(201).json({ message: 'User registered successfully' });
});

// Login user
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    const user = users[username];
    if (!user) {
        return res.status(400).json({ error: 'Invalid username or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return res.status(400).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token });
});

// Token Authentication 
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Fetch tasks for the logged user
app.get('/tasks', authenticateToken, (req, res) => {
    try {
        const tasks = users[req.user.username].tasks;
        res.json(tasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Create a new task for the logged user
app.post('/tasks', authenticateToken, (req, res) => {
    try {
        const task = req.body;
        task.id = Date.now();
        users[req.user.username].tasks.push(task);
        saveUsers();
        res.status(201).json(task);
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Update task for the logged user
app.put('/tasks/:id', authenticateToken, (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const updatedTask = req.body;
        const tasks = users[req.user.username].tasks;

        const taskIndex = tasks.findIndex((task) => task.id === id);
        if (taskIndex !== -1) {
            tasks[taskIndex] = { ...tasks[taskIndex], ...updatedTask };
            saveUsers();
            res.json(updatedTask);
        } else {
            res.status(404).json({ error: 'Task not found' });
        }
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Delete a task for the logged user
app.delete('/tasks/:id', authenticateToken, (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const tasks = users[req.user.username].tasks;

        users[req.user.username].tasks = tasks.filter((task) => task.id !== id);
        saveUsers();
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
