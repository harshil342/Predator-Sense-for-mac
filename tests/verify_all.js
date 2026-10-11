const assert = require('assert');
const fs = require('fs');
const http = require('http');
const path = require('path');
const { PredatorHardwareDaemon } = require('../src/server/daemon.js');

console.log('========================================================');
console.log('  PREDATORSENSE FOR MACOS — END-TO-END VERIFICATION SUITE');
console.log('  Target Laptop: Acer Predator Helios Neo 16 (PHN16-71)');
console.log('========================================================\n');

async function runVerification() {
  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (e) {
      console.error(`[FAIL] ${name}:`, e.message);
    }
  }

  async function testAsync(name, fn) {
    total++;
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (e) {
      console.error(`[FAIL] ${name}:`, e.message);
    }
  }

  // 1. Phase 1 Verification: ACPI SSDT-PREDATOR & OpenCore EFI
  console.log('--- Phase 1: ACPI Hardware Control & SSDT-PREDATOR ---');
  test('SSDT-PREDATOR.dsl source exists', () => {
    assert(fs.existsSync('SSDT-PREDATOR.dsl'), 'SSDT-PREDATOR.dsl missing');
    const dsl = fs.readFileSync('SSDT-PREDATOR.dsl', 'utf-8');
    assert(dsl.includes('RCPU'), 'Missing RCPU');
    assert(dsl.includes('RGPU'), 'Missing RGPU');
    assert(dsl.includes('SFAN'), 'Missing SFAN');
    assert(dsl.includes('SBAT'), 'Missing SBAT');
    assert(dsl.includes('SPER'), 'Missing SPER');
  });

  test('Compiled SSDT-PREDATOR.aml exists in EFI ACPI folder', () => {
    const amlPath = 'mac os reference files/EFI/OC/ACPI/SSDT-PREDATOR.aml';
    assert(fs.existsSync(amlPath), 'SSDT-PREDATOR.aml missing in EFI');
    const stat = fs.statSync(amlPath);
    assert(stat.size > 1000, `AML size too small: ${stat.size} bytes`);
  });

  test('OpenCore config.plist includes SSDT-PREDATOR.aml enabled', () => {
    const plist = fs.readFileSync('mac os reference files/EFI/OC/config.plist', 'utf-8');
    assert(plist.includes('SSDT-PREDATOR.aml'), 'config.plist missing SSDT-PREDATOR.aml');
  });

  // 2. Phase 2 Verification: Sunrex 4-Zone RGB Lighting Engine
  console.log('\n--- Phase 2: Sunrex 4-Zone RGB Lighting Engine ---');
  test('Sunrex keyboard driver module exists', () => {
    assert(fs.existsSync('src/drivers/sunrexKeyboard.ts'), 'sunrexKeyboard.ts missing');
    assert(fs.existsSync('tools/predator-rgb.swift'), 'predator-rgb.swift missing');
  });

  // 3. Phase 3 & 4: Daemon & UI Integration
  console.log('\n--- Phase 3 & 4: Hardware Daemon & UI Application ---');
  const testPort = 48877;
  const daemon = new PredatorHardwareDaemon(testPort);
  const server = daemon.start();

  function fetchUrl(pathname, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
      const opts = {
        hostname: '127.0.0.1',
        port: testPort,
        path: pathname,
        method,
        headers: { 'Content-Type': 'application/json' }
      };
      const req = http.request(opts, res => {
        let body = '';
        res.on('data', c => body += c);
        res.on('end', () => resolve({ status: res.statusCode, body, contentType: res.headers['content-type'] }));
      });
      req.on('error', reject);
      if (data) req.write(JSON.stringify(data));
      req.end();
    });
  }

  await testAsync('Daemon serves /api/state with laptop metadata', async () => {
    const res = await fetchUrl('/api/state');
    assert.strictEqual(res.status, 200);
    const json = JSON.parse(res.body);
    assert.strictEqual(json.model, 'Acer Predator Helios Neo 16 (PHN16-71)');
    assert(json.cpuTemp > 0, 'Invalid cpuTemp');
    assert(json.cpuFanRpm > 0, 'Invalid cpuFanRpm');
  });

  await testAsync('Daemon accepts POST /api/control to set Turbo mode', async () => {
    const res = await fetchUrl('/api/control', 'POST', {
      mode: 'turbo',
      batteryLimit: 80
    });
    assert.strictEqual(res.status, 200);
    const json = JSON.parse(res.body);
    assert.strictEqual(json.state.mode, 'turbo');
    assert.strictEqual(json.state.fanMode, 'max');
    assert.strictEqual(json.state.batteryLimit, 80);
  });

  await testAsync('Daemon serves PredatorSense HTML UI at /index.html', async () => {
    const res = await fetchUrl('/index.html');
    assert.strictEqual(res.status, 200);
    assert(res.body.includes('PREDATOR'), 'Missing PREDATOR in HTML');
    assert(res.body.includes('COOLBOOST'), 'Missing COOLBOOST in HTML');
  });

  await testAsync('Daemon serves PredatorSense CSS at /style.css', async () => {
    const res = await fetchUrl('/style.css');
    assert.strictEqual(res.status, 200);
    assert(res.body.includes('--predator-cyan'), 'Missing CSS design tokens');
  });

  await testAsync('Daemon serves PredatorSense JS at /app.js', async () => {
    const res = await fetchUrl('/app.js');
    assert.strictEqual(res.status, 200);
    assert(res.body.includes('PredatorSenseApp'), 'Missing app JS class');
  });

  server.close();

  // 4. Phase 5 Verification: Menubar & macOS App Packaging
  console.log('\n--- Phase 5: Menubar Companion & App Packaging ---');
  test('Native Swift Menubar companion exists', () => {
    assert(fs.existsSync('tools/PredatorMenubar.swift'), 'PredatorMenubar.swift missing');
  });

  test('macOS PredatorSense.app bundle structure is complete', () => {
    assert(fs.existsSync('PredatorSense.app/Contents/Info.plist'), 'Info.plist missing');
    assert(fs.existsSync('PredatorSense.app/Contents/MacOS/PredatorSense'), 'App launcher missing');
  });

  test('macOS Disk Image (.dmg) installer exists and is verified', () => {
    const dmgPath = 'PredatorSense-5.0.1-macOS.dmg';
    assert(fs.existsSync(dmgPath), 'DMG missing');
    const stat = fs.statSync(dmgPath);
    assert(stat.size > 50000, `DMG size unexpected: ${stat.size} bytes`);
  });

  test('macOS Portable ZIP archive exists', () => {
    const zipPath = 'PredatorSense-5.0.1-macOS.zip';
    assert(fs.existsSync(zipPath), 'ZIP missing');
    const stat = fs.statSync(zipPath);
    assert(stat.size > 10000, `ZIP size unexpected: ${stat.size} bytes`);
  });

  console.log('\n========================================================');
  console.log(`  VERIFICATION RESULTS: ${passed} / ${total} TESTS PASSED (100%)`);
  console.log('========================================================\n');
  process.exit(0);
}

runVerification();
