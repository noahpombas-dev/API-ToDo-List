let tasks = [];
let currentId = 1;

const getTasks = () => {
    return tasks;
};

const createTask = (task) => {
    task.id = currentId++;
    tasks.push(task);
};

const updateTask = (id, updatedTask) => {
    const taskIndex = tasks.findIndex((task) => task.id === parseInt(id));
    if (taskIndex !== -1) {
        tasks[taskIndex] = { ...tasks[taskIndex], ...updatedTask };
    }
};

const deleteTask = (id) => {
    tasks = tasks.filter((task) => task.id !== parseInt(id));
};

module.exports = { getTasks, createTask, updateTask, deleteTask };