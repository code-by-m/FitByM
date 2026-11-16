import { preview } from 'vite';
import { spawn } from 'node:child_process';
import process from 'node:process';

// Own the server directly: Windows process-tree teardown may be unavailable in a sandbox.
const server = await preview({
  preview: { host: '127.0.0.1', port: 4173, strictPort: true },
});
try {
  process.exitCode = await new Promise((resolve, reject) => {
    const runner = spawn(
      process.execPath,
      ['node_modules/@playwright/test/cli.js', 'test', ...process.argv.slice(2)],
      { stdio: 'inherit', env: process.env },
    );
    runner.on('error', reject);
    runner.on('exit', (code) => resolve(code ?? 1));
  });
} finally {
  server.httpServer.closeAllConnections();
  await new Promise((resolve) => server.httpServer.close(resolve));
}
