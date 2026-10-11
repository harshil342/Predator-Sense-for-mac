const assert = require('assert');

// ponytail: direct JS translation of driver for fast testing without compiling TS
class SunrexKeyboardDriver {
  constructor() {
    this.currentProfile = {
      zones: [
        { r: 0, g: 230, b: 255 },
        { r: 0, g: 230, b: 255 },
        { r: 0, g: 230, b: 255 },
        { r: 0, g: 230, b: 255 }
      ],
      effect: 'static',
      brightness: 80,
      speed: 3
    };
    this.EFFECT_CODES = {
      static: 0x00,
      breathing: 0x01,
      wave: 0x02,
      zoom: 0x03,
      neon: 0x04,
      rain: 0x05,
      spectrum: 0x06
    };
  }

  buildZonePacket(zoneIndex, color, brightness) {
    const buf = Buffer.alloc(16, 0);
    buf[0] = 0x00;
    buf[1] = 0x02;
    buf[2] = zoneIndex & 0x03;
    buf[3] = Math.max(0, Math.min(255, color.r));
    buf[4] = Math.max(0, Math.min(255, color.g));
    buf[5] = Math.max(0, Math.min(255, color.b));
    buf[6] = Math.max(0, Math.min(100, brightness));
    buf[7] = 0xaa;
    return buf;
  }

  buildEffectPacket(effect, speed, brightness) {
    const buf = Buffer.alloc(16, 0);
    buf[0] = 0x00;
    buf[1] = 0x08;
    buf[2] = this.EFFECT_CODES[effect] ?? 0x00;
    buf[3] = Math.max(1, Math.min(5, speed));
    buf[4] = Math.max(0, Math.min(100, brightness));
    buf[5] = 0x55;
    return buf;
  }

  applyProfile(profile) {
    if (profile.zones) {
      for (let i = 0; i < 4; i++) {
        if (profile.zones[i]) this.currentProfile.zones[i] = { ...profile.zones[i] };
      }
    }
    if (profile.effect) this.currentProfile.effect = profile.effect;
    if (typeof profile.brightness === 'number') this.currentProfile.brightness = profile.brightness;
    if (typeof profile.speed === 'number') this.currentProfile.speed = profile.speed;
    return this.currentProfile;
  }
}

// Runnable test runner
console.log('--- Testing Sunrex Keyboard Driver ---');
const driver = new SunrexKeyboardDriver();

// 1. Test Zone Packet
const p0 = driver.buildZonePacket(0, { r: 255, g: 0, b: 128 }, 80);
assert.strictEqual(p0.length, 16);
assert.strictEqual(p0[0], 0x00);
assert.strictEqual(p0[1], 0x02);
assert.strictEqual(p0[2], 0);
assert.strictEqual(p0[3], 255);
assert.strictEqual(p0[4], 0);
assert.strictEqual(p0[5], 128);
assert.strictEqual(p0[6], 80);
assert.strictEqual(p0[7], 0xaa);
console.log('[PASS] Zone packet 0 formatted correctly');

// 2. Test Zone 3 (Numpad)
const p3 = driver.buildZonePacket(3, { r: 0, g: 255, b: 255 }, 100);
assert.strictEqual(p3[2], 3);
assert.strictEqual(p3[3], 0);
assert.strictEqual(p3[4], 255);
assert.strictEqual(p3[5], 255);
assert.strictEqual(p3[6], 100);
console.log('[PASS] Zone packet 3 formatted correctly');

// 3. Test Effect Packet
const ep = driver.buildEffectPacket('wave', 4, 90);
assert.strictEqual(ep.length, 16);
assert.strictEqual(ep[1], 0x08);
assert.strictEqual(ep[2], 0x02); // wave
assert.strictEqual(ep[3], 4);
assert.strictEqual(ep[4], 90);
assert.strictEqual(ep[5], 0x55);
console.log('[PASS] Effect packet formatted correctly');

// 4. Test Profile update
driver.applyProfile({
  zones: [
    { r: 255, g: 0, b: 0 },
    { r: 0, g: 255, b: 0 },
    { r: 0, g: 0, b: 255 },
    { r: 255, g: 255, b: 255 }
  ],
  effect: 'breathing',
  brightness: 50,
  speed: 2
});
assert.strictEqual(driver.currentProfile.effect, 'breathing');
assert.strictEqual(driver.currentProfile.brightness, 50);
assert.strictEqual(driver.currentProfile.zones[0].r, 255);
assert.strictEqual(driver.currentProfile.zones[1].g, 255);
assert.strictEqual(driver.currentProfile.zones[2].b, 255);
assert.strictEqual(driver.currentProfile.zones[3].r, 255);
console.log('[PASS] Profile applied successfully');

console.log('All Sunrex Keyboard driver tests passed!\n');
