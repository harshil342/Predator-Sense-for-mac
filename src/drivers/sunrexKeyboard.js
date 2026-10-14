/**
 * Sunrex 4-Zone RGB Keyboard Driver for Acer Predator Helios Neo 16 (PHN16-71)
 * Hardware Vendor ID: 0x05AF (Sunrex Technology Corp)
 * Usage Page: 0xFF02 (Vendor Specific Keyboard RGB Controller)
 * 
 * Supports:
 * - 4 Independent RGB zones (Zone 1: QWE/WASD, Zone 2: UI/Center, Zone 3: Navigation, Zone 4: Numpad)
 * - Effects: Static, Breathing, Wave, Zoom, Neon, Rain, Spectrum
 * - Global Brightness (0-100%) and Animation Speed (1-5)
 * - Seamless fallback to simulation when hardware is not detected
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

const SUNREX_CONSTANTS = {
  VID: 0x05af,
  USAGE_PAGE: 0xff02,
  EFFECT_CODES: {
    static: 0x00,
    breathing: 0x01,
    wave: 0x02,
    zoom: 0x03,
    neon: 0x04,
    rain: 0x05,
    spectrum: 0x06
  }
};

class SunrexKeyboardDriver {
  constructor(options = {}) {
    this.toolsDir = options.toolsDir || path.resolve(__dirname, '../../tools');
    this.currentProfile = {
      zones: [
        { r: 0, g: 230, b: 255 },  // Zone 1: Predator Cyan
        { r: 0, g: 230, b: 255 },  // Zone 2: Predator Cyan
        { r: 0, g: 230, b: 255 },  // Zone 3: Predator Cyan
        { r: 0, g: 230, b: 255 }   // Zone 4: Predator Cyan
      ],
      effect: 'static',
      brightness: 80,
      speed: 3,
      direction: 'right'
    };

    this.isConnected = false;
    this.isSimulation = true;
    this.detectHardware();
  }

  detectHardware() {
    if (process.platform === 'darwin') {
      try {
        const output = execSync('ioreg -r -c IOHIDDevice -l 2>/dev/null', { encoding: 'utf-8', timeout: 3000 });
        if (output.includes('0x5af') || output.includes('1455') || output.includes('Sunrex')) {
          this.isConnected = true;
          this.isSimulation = false;
          return true;
        }
      } catch (err) {}
    }
    this.isConnected = false;
    this.isSimulation = true;
    return false;
  }

  buildZonePacket(zoneIndex, color, brightness) {
    const buf = Buffer.alloc(16, 0);
    buf[0] = 0x00;                           // Report ID
    buf[1] = 0x02;                           // Command: Set Zone Color
    buf[2] = zoneIndex & 0x03;               // Zone index (0, 1, 2, 3)
    buf[3] = Math.max(0, Math.min(255, Math.round((color && color.r) || 0)));
    buf[4] = Math.max(0, Math.min(255, Math.round((color && color.g) || 0)));
    buf[5] = Math.max(0, Math.min(255, Math.round((color && color.b) || 0)));
    buf[6] = Math.max(0, Math.min(100, Math.round(brightness !== undefined ? brightness : 80)));
    buf[7] = 0xaa;                           // Header magic terminator
    return buf;
  }

  buildEffectPacket(effect, speed, brightness) {
    const buf = Buffer.alloc(16, 0);
    buf[0] = 0x00;                           // Report ID
    buf[1] = 0x08;                           // Command: Set Effect Mode
    buf[2] = SUNREX_CONSTANTS.EFFECT_CODES[effect] !== undefined ? SUNREX_CONSTANTS.EFFECT_CODES[effect] : 0x00;
    buf[3] = Math.max(1, Math.min(5, Math.round(speed || 3)));
    buf[4] = Math.max(0, Math.min(100, Math.round(brightness !== undefined ? brightness : 80)));
    buf[5] = 0x55;                           // Effect sync terminator
    return buf;
  }

  sendRawReport(buffer) {
    if (this.isSimulation || process.platform !== 'darwin') {
      return { success: true, simulated: true };
    }

    const hex = buffer.toString('hex');
    const binPath = path.join(this.toolsDir, 'predator-rgb');
    const swiftPath = path.join(this.toolsDir, 'predator-rgb.swift');

    try {
      if (fs.existsSync(binPath)) {
        const res = spawnSync(binPath, [hex], { timeout: 1000 });
        return { success: res.status === 0, simulated: false };
      } else if (fs.existsSync(swiftPath)) {
        const res = spawnSync('swift', [swiftPath, hex], { timeout: 2000 });
        return { success: res.status === 0, simulated: false };
      }
    } catch (e) {}

    return { success: false, simulated: true };
  }

  applyProfile(profile = {}) {
    if (profile.zones && Array.isArray(profile.zones)) {
      for (let i = 0; i < 4; i++) {
        if (profile.zones[i]) {
          this.currentProfile.zones[i] = {
            r: profile.zones[i].r ?? 0,
            g: profile.zones[i].g ?? 230,
            b: profile.zones[i].b ?? 255
          };
        }
      }
    }

    if (profile.effect && SUNREX_CONSTANTS.EFFECT_CODES[profile.effect] !== undefined) {
      this.currentProfile.effect = profile.effect;
    }
    if (typeof profile.brightness === 'number') {
      this.currentProfile.brightness = Math.max(0, Math.min(100, Math.round(profile.brightness)));
    }
    if (typeof profile.speed === 'number') {
      this.currentProfile.speed = Math.max(1, Math.min(5, Math.round(profile.speed)));
    }
    if (profile.direction) {
      this.currentProfile.direction = profile.direction;
    }

    // Transmit packets for each of the 4 zones
    for (let zone = 0; zone < 4; zone++) {
      const zonePkt = this.buildZonePacket(zone, this.currentProfile.zones[zone], this.currentProfile.brightness);
      this.sendRawReport(zonePkt);
    }

    // Transmit animation effect packet
    const effectPkt = this.buildEffectPacket(
      this.currentProfile.effect,
      this.currentProfile.speed,
      this.currentProfile.brightness
    );
    this.sendRawReport(effectPkt);

    return JSON.parse(JSON.stringify(this.currentProfile));
  }

  setZoneColor(zoneIndex, color) {
    if (zoneIndex < 0 || zoneIndex > 3) return;
    this.currentProfile.zones[zoneIndex] = { ...color };
    const pkt = this.buildZonePacket(zoneIndex, color, this.currentProfile.brightness);
    this.sendRawReport(pkt);
  }

  setBrightness(brightness) {
    this.currentProfile.brightness = Math.max(0, Math.min(100, Math.round(brightness)));
    this.applyProfile(this.currentProfile);
  }

  getProfile() {
    return JSON.parse(JSON.stringify(this.currentProfile));
  }

  getStatus() {
    return {
      connected: this.isConnected,
      simulation: this.isSimulation,
      vendorId: '0x05AF',
      usagePage: '0xFF02',
      zones: 4,
      currentProfile: this.getProfile()
    };
  }
}

module.exports = {
  SunrexKeyboardDriver,
  SUNREX_CONSTANTS
};
