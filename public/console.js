function warningMessage() {
    console.log(`
            =============================
                Noah Pombas's Website
            =============================
        WARNING: Do not paste any code here!

    [================================================================]
    You could give scammers access to your ToDo List!!
    You could give scammers access to your ToDo List!!
    You could give scammers access to your ToDo List!!
    You could give scammers access to your ToDo List!!
    You could give scammers access to your ToDo List!!
    [================================================================]
    `);
}

async function start() {
    window.console.clear();
    warningMessage();
}

setInterval(() => {
    start();
}, 5000);

window.console.clear();
warningMessage();