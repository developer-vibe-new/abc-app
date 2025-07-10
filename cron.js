const { spawn } = require('child_process');

function startApp() {
    const process = spawn('node', ['cron_start.js'], { stdio: 'inherit' });

    process.on('close', (code) => {
        if (code !== 0) {
            console.log(`Process exited with code ${code}. Restarting...`);
            startApp();
        }
    });
}

startApp();
