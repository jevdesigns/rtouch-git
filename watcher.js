const chokidar = require('chokidar');
const { spawn } = require('child_process');

let server = null;

function startServer() {
    if (server) server.kill();
    console.log('🚀 (Re)Starting Server...');
    server = spawn('node', ['server.js'], { stdio: 'inherit' });
}

// Watch for file changes sent via Samba
chokidar.watch('./client/build', { ignoreInitial: true }).on('all', () => {
    console.log(`Update detected in build folder. Reloading...`);
    startServer();
});

startServer();
