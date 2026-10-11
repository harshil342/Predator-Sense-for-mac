const assert = require('assert');
const http = require('http');
const { PredatorHardwareDaemon } = require('../src/server/daemon.js');

console.log('--- Testing PredatorSense Hardware Daemon ---');
const testPort = 48899;
const daemon = new PredatorHardwareDaemon(testPort);
const server = daemon.start();

function request(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: '127.0.0.1',
      port: testPort,
      path,
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    const req = http.request(opts, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(body) }));
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

(async () => {
  try {
    // 1. Test GET /api/state
    const stateRes = await request('/api/state');
    assert.strictEqual(stateRes.status, 200);
    assert.strictEqual(stateRes.data.model, 'Acer Predator Helios Neo 16 (PHN16-71)');
    console.log('[PASS] GET /api/state returns valid system model');

    // 2. Test POST /api/control (Set Turbo mode)
    const ctrlRes = await request('/api/control', 'POST', {
      mode: 'turbo',
      batteryLimit: 80,
      keyboard: {
        effect: 'wave',
        brightness: 90
      }
    });
    assert.strictEqual(ctrlRes.status, 200);
    assert.strictEqual(ctrlRes.data.state.mode, 'turbo');
    assert.strictEqual(ctrlRes.data.state.fanMode, 'max');
    assert.strictEqual(ctrlRes.data.state.keyboard.effect, 'wave');
    console.log('[PASS] POST /api/control updates performance profile and keyboard effect');

    server.close(() => {
      console.log('All Daemon tests passed successfully!\n');
      process.exit(0);
    });
  } catch (err) {
    console.error('Test failed:', err);
    server.close(() => process.exit(1));
  }
})();
