const { spawn } = require('child_process');
const path = require('path');

function runInTerminal(command, cwd) {
  spawn('start', ['powershell', '-NoExit', '-Command', `cd '${cwd}'; ${command}`], {
    shell: true,
    stdio: 'ignore',
    detached: true
  });
}

runInTerminal('python src/main.py', path.join(__dirname, 'monorepo-root', 'ozon-api'));
runInTerminal('npm run start:dev', path.join(__dirname, 'monorepo-root', 'wb-api'));