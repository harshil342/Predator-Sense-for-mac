/**
 * PredatorSense for macOS — Client Application Controller
 * Applied Skills: design-taste-frontend, impeccable, ponytail
 */

// ponytail: single client controller with zero build steps or heavy dependencies

class PredatorSenseApp {
  constructor() {
    this.apiUrl = (typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin.startsWith('http'))
      ? window.location.origin
      : 'http://127.0.0.1:48800';
    this.debounceTimers = {};
    this.selectedZone = 'all'; // 'all' or 0, 1, 2, 3
    this.selectedEffect = 'static';
    this.currentColor = '#00E6FF';
    
    this.state = {
      mode: 'balanced',
      fanMode: 'auto',
      cpuTemp: 48,
      gpuTemp: 44,
      cpuFanRpm: 2150,
      gpuFanRpm: 2280,
      cpuFanTarget: 50,
      gpuFanTarget: 50,
      batteryLimit: 80,
      batteryPercent: 82,
      isAcConnected: true,
      cpuUsage: 14.5,
      ramUsage: 38.2,
      ramUsedGb: 12.2,
      ramTotalGb: 32.0,
      keyboard: {
        zones: [
          { r: 0, g: 230, b: 255 },
          { r: 0, g: 230, b: 255 },
          { r: 0, g: 230, b: 255 },
          { r: 0, g: 230, b: 255 }
        ],
        effect: 'static',
        brightness: 80,
        speed: 3
      }
    };

    this.initDom();
    this.bindEvents();
    this.connectDaemon();
  }

  initDom() {
    // Window Titlebar Controls
    this.lightClose = document.querySelector('.traffic-lights .light.close');
    this.lightMin = document.querySelector('.traffic-lights .light.min');
    this.lightMax = document.querySelector('.traffic-lights .light.max');

    // Navigation Tabs
    this.tabs = document.querySelectorAll('.nav-tab');
    this.panes = document.querySelectorAll('.tab-pane');

    // Mode Buttons
    this.modePills = document.querySelectorAll('.mode-pill');
    this.presetCards = document.querySelectorAll('.preset-card');

    // Fan elements
    this.fanModeBtns = document.querySelectorAll('.fan-mode-btn');
    this.cpuSlider = document.getElementById('cpuFanSlider');
    this.gpuSlider = document.getElementById('gpuFanSlider');
    this.cpuBlade = document.getElementById('cpuBlade');
    this.gpuBlade = document.getElementById('gpuBlade');
    this.cpuGaugeArc = document.getElementById('cpuGaugeArc');
    this.gpuGaugeArc = document.getElementById('gpuGaugeArc');

    // Keyboard elements
    this.kbZones = [
      document.getElementById('kbZone0'),
      document.getElementById('kbZone1'),
      document.getElementById('kbZone2'),
      document.getElementById('kbZone3')
    ];
    this.zoneTabBtns = document.querySelectorAll('.zone-tab-btn');
    this.fxPills = document.querySelectorAll('.fx-pill');
    this.colorDots = document.querySelectorAll('.color-dot');
    this.colorPicker = document.getElementById('customColorPicker');
    this.hexInput = document.getElementById('hexInput');
    this.kbBrightnessSlider = document.getElementById('kbBrightnessSlider');
    this.kbSpeedSlider = document.getElementById('kbSpeedSlider');
    this.applyLightingBtn = document.getElementById('applyLightingBtn');

    // Battery Cap Toggle
    this.batteryToggle = document.getElementById('batteryCapToggle');
  }

  showToast(msg, icon = '⚡') {
    const toast = document.getElementById('hudToast');
    const toastMsg = document.getElementById('hudToastMsg');
    const toastIcon = toast ? toast.querySelector('.hud-toast-icon') : null;
    if (!toast || !toastMsg) return;
    toastMsg.textContent = msg;
    if (toastIcon) toastIcon.textContent = icon;
    toast.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2200);
  }

  debounceControl(key, cmd, delay = 120) {
    clearTimeout(this.debounceTimers[key]);
    this.debounceTimers[key] = setTimeout(() => {
      this.sendControl(cmd);
    }, delay);
  }

  bindEvents() {
    // 0. Window Traffic Lights
    if (this.lightClose) {
      this.lightClose.addEventListener('click', () => {
        if (window.confirm('Close PredatorSense cockpit?')) {
          window.close();
        }
      });
    }
    if (this.lightMin) {
      this.lightMin.addEventListener('click', () => {
        document.body.classList.toggle('compact-view');
        this.showToast('TOGGLED COMPACT COCKPIT VIEW', '📐');
      });
    }
    if (this.lightMax) {
      this.lightMax.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      });
    }

    // 1. Navigation Tabs
    this.tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.tabs.forEach(t => t.classList.remove('active'));
        this.panes.forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        const targetPane = document.getElementById(`pane-${tab.dataset.tab}`);
        if (targetPane) targetPane.classList.add('active');
      });
    });

    // 2. Mode Pills & Cards
    const setMode = (mode) => {
      const modeIcons = { quiet: '🟢', balanced: '🔵', performance: '🟣', turbo: '🔥', eco: '🌱' };
      this.sendControl({ mode });
      this.showToast(`${mode.toUpperCase()} PROFILE ACTIVATED`, modeIcons[mode] || '⚡');
    };

    this.modePills.forEach(pill => {
      pill.addEventListener('click', () => setMode(pill.dataset.mode));
    });

    this.presetCards.forEach(card => {
      card.addEventListener('click', () => setMode(card.dataset.mode));
    });

    // 3. Fan Mode Buttons
    this.fanModeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.fanmode;
        this.sendControl({ fanMode: mode });
        this.showToast(`COOLBOOST: ${mode.toUpperCase()} FAN VELOCITY`, mode === 'max' ? '🌪️' : '🔄');
      });
    });

    // 4. Global Tactical Hotkeys
    window.addEventListener('keydown', (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      const key = e.key.toLowerCase();
      if (key === '1') setMode('quiet');
      else if (key === '2') setMode('balanced');
      else if (key === '3') setMode('performance');
      else if (key === '4' || key === 't') setMode('turbo');
      else if (key === '5') setMode('eco');
      else if (key === 'm') {
        this.sendControl({ fanMode: 'max' });
        this.showToast('COOLBOOST: MAX FANS (5,600 RPM)', '🌪️');
      } else if (key === 'a') {
        this.sendControl({ fanMode: 'auto' });
        this.showToast('COOLBOOST: AUTO ACOUSTIC CURVE', '🔄');
      }
    });

    // Fan Sliders with immediate UI response + debounced dispatch
    this.cpuSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      document.getElementById('cpuTargetPercent').textContent = `${val}%`;
      this.debounceControl('cpuFan', { fanMode: 'custom', cpuFanTarget: val });
    });

    this.gpuSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      document.getElementById('gpuTargetPercent').textContent = `${val}%`;
      this.debounceControl('gpuFan', { fanMode: 'custom', gpuFanTarget: val });
    });

    // 4. Keyboard Zone Selection
    this.zoneTabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.zoneTabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedZone = btn.dataset.selzone;
        this.highlightZones();
      });
    });

    this.kbZones.forEach((el, idx) => {
      el.addEventListener('click', () => {
        this.zoneTabBtns.forEach(b => b.classList.remove('active'));
        const matchingBtn = Array.from(this.zoneTabBtns).find(b => b.dataset.selzone === String(idx));
        if (matchingBtn) matchingBtn.classList.add('active');
        this.selectedZone = String(idx);
        this.highlightZones();
      });
    });

    // Effects
    this.fxPills.forEach(pill => {
      pill.addEventListener('click', () => {
        this.fxPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.selectedEffect = pill.dataset.effect;
        this.updateKeyboardEffectPreview();
      });
    });

    // Colors
    this.colorDots.forEach(dot => {
      dot.addEventListener('click', () => {
        this.colorDots.forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
        this.setColor(dot.dataset.color);
      });
    });

    this.colorPicker.addEventListener('input', (e) => {
      this.setColor(e.target.value);
    });

    this.hexInput.addEventListener('change', (e) => {
      let val = e.target.value.trim();
      if (!val.startsWith('#')) val = '#' + val;
      if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
        this.setColor(val);
      }
    });

    // Brightness & Speed sliders
    this.kbBrightnessSlider.addEventListener('input', (e) => {
      document.getElementById('kbBrightnessText').textContent = `${e.target.value}%`;
    });

    this.kbSpeedSlider.addEventListener('input', (e) => {
      document.getElementById('kbSpeedText').textContent = e.target.value;
    });

    // Apply Lighting Button
    this.applyLightingBtn.addEventListener('click', () => {
      this.dispatchLightingCommand();
      this.showToast(`SUNREX 4-ZONE RGB: ${this.selectedEffect.toUpperCase()} PROFILE APPLIED`, '🌈');
    });

    // Battery Cap Toggle
    this.batteryToggle.addEventListener('change', (e) => {
      const limit = e.target.checked ? 80 : 100;
      this.sendControl({ batteryLimit: limit });
      this.showToast(limit === 80 ? 'BATTERY HEALTH CARE: 80% LIMIT APPLIED' : 'BATTERY UNLOCKED: 100% MAXIMUM CHARGE', '🔋');
    });
  }

  setColor(hex) {
    this.currentColor = hex;
    this.colorPicker.value = hex;
    this.hexInput.value = hex.toUpperCase();

    const rgb = this.hexToRgb(hex);
    if (this.selectedZone === 'all') {
      for (let i = 0; i < 4; i++) {
        this.state.keyboard.zones[i] = { ...rgb };
      }
    } else {
      const idx = parseInt(this.selectedZone, 10);
      this.state.keyboard.zones[idx] = { ...rgb };
    }
    this.renderKeyboardGlows();
  }

  highlightZones() {
    this.kbZones.forEach((z, idx) => {
      if (this.selectedZone === 'all' || this.selectedZone === String(idx)) {
        z.classList.add('selected');
      } else {
        z.classList.remove('selected');
      }
    });
  }

  renderKeyboardGlows() {
    this.kbZones.forEach((z, idx) => {
      const c = this.state.keyboard.zones[idx];
      z.style.setProperty('--zone-color', `rgb(${c.r}, ${c.g}, ${c.b})`);
    });
  }

  updateKeyboardEffectPreview() {
    this.kbZones.forEach(z => {
      z.className = 'kb-zone' + (this.selectedZone === 'all' ? ' selected' : '');
      if (this.selectedEffect === 'breathing') z.classList.add('fx-breathing');
      if (this.selectedEffect === 'wave') z.classList.add('fx-wave');
    });
  }

  dispatchLightingCommand() {
    const brightness = parseInt(this.kbBrightnessSlider.value, 10);
    const speed = parseInt(this.kbSpeedSlider.value, 10);

    const payload = {
      keyboard: {
        zones: this.state.keyboard.zones,
        effect: this.selectedEffect,
        brightness,
        speed
      }
    };
    this.sendControl(payload);
  }

  hexToRgb(hex) {
    const clean = hex.replace('#', '');
    const num = parseInt(clean, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255
    };
  }

  connectDaemon() {
    try {
      const sse = new EventSource(`${this.apiUrl}/api/telemetry/stream`);
      sse.onopen = () => {
        const el = document.getElementById('daemonStatusText');
        if (el) el.textContent = 'HARDWARE DAEMON ONLINE • ' + this.apiUrl.replace(/^https?:\/\//, '');
      };
      sse.onmessage = (e) => {
        const data = JSON.parse(e.data);
        this.updateState(data);
      };
      sse.onerror = () => {
        const el = document.getElementById('daemonStatusText');
        if (el) el.textContent = 'STANDALONE MODE (HARDWARE SIMULATION)';
      };
    } catch (e) {
      const el = document.getElementById('daemonStatusText');
      if (el) el.textContent = 'STANDALONE MODE (HARDWARE SIMULATION)';
    }
  }

  async sendControl(cmd) {
    try {
      const res = await fetch(`${this.apiUrl}/api/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cmd)
      });
      if (res.ok) {
        const data = await res.json();
        this.updateState(data.state);
      }
    } catch (e) {
      // Local fallback in simulation
      Object.assign(this.state, cmd);
      this.render();
    }
  }

  updateState(newState) {
    this.state = { ...this.state, ...newState };
    this.render();
  }

  render() {
    // 1. Mode Buttons
    this.modePills.forEach(p => {
      p.classList.toggle('active', p.dataset.mode === this.state.mode);
    });
    this.presetCards.forEach(c => {
      c.classList.toggle('active', c.dataset.mode === this.state.mode);
    });

    // Hero title & desc
    const modeTitles = {
      quiet: { title: 'QUIET', pl1: '35W', pl2: '45W', desc: 'Acoustic priority with silenced AeroBlade fans.' },
      balanced: { title: 'BALANCED', pl1: '55W', pl2: '75W', desc: 'Dynamic fan curve and balanced TDP limits for optimal everyday responsiveness.' },
      performance: { title: 'PERFORMANCE', pl1: '75W', pl2: '95W', desc: 'Increased power limits and elevated fan velocity for sustained heavy compute.' },
      turbo: { title: 'TURBO', pl1: '95W', pl2: '115W', desc: 'Maximum unlocked TDP, full fan speed, extreme GPU clock boost.' },
      eco: { title: 'ECO', pl1: '25W', pl2: '35W', desc: 'Efficiency optimized profile conserving battery power.' }
    };
    const info = modeTitles[this.state.mode] || modeTitles.balanced;
    document.getElementById('heroModeTitle').textContent = info.title;
    document.getElementById('heroModeDesc').textContent = info.desc;
    document.getElementById('statPL1').textContent = info.pl1;
    document.getElementById('statPL2').textContent = info.pl2;

    // 2. Battery & AC Badges
    document.getElementById('battPercentText').textContent = `${this.state.batteryPercent}%`;
    document.getElementById('acStatusText').textContent = this.state.isAcConnected ? 'AC 330W' : 'BATTERY';
    this.batteryToggle.checked = (this.state.batteryLimit === 80);

    // 3. Glance Cards
    document.getElementById('cpuTempNum').textContent = this.state.cpuTemp;
    document.getElementById('cpuTempBadge').textContent = `${this.state.cpuTemp}°C`;
    document.getElementById('cpuTempBar').style.width = `${Math.min(100, this.state.cpuTemp)}%`;
    document.getElementById('cpuLoadText').textContent = `${this.state.cpuUsage}%`;

    document.getElementById('gpuTempNum').textContent = this.state.gpuTemp;
    document.getElementById('gpuTempBadge').textContent = `${this.state.gpuTemp}°C`;
    document.getElementById('gpuTempBar').style.width = `${Math.min(100, this.state.gpuTemp)}%`;

    document.getElementById('fanModeBadge').textContent = this.state.fanMode.toUpperCase();
    document.getElementById('glanceCpuRpm').textContent = this.state.cpuFanRpm.toLocaleString();
    document.getElementById('glanceGpuRpm').textContent = this.state.gpuFanRpm.toLocaleString();

    // 4. CoolBoost Fan Dials
    document.getElementById('dialCpuRpm').textContent = this.state.cpuFanRpm;
    document.getElementById('dialGpuRpm').textContent = this.state.gpuFanRpm;

    this.fanModeBtns.forEach(b => {
      b.classList.toggle('active', b.dataset.fanmode === this.state.fanMode);
    });

    // Radial gauge arcs calculation (max 5600 RPM = full circle)
    const circumference = 515;
    const cpuOffset = circumference - (Math.min(1, this.state.cpuFanRpm / 5600) * circumference);
    const gpuOffset = circumference - (Math.min(1, this.state.gpuFanRpm / 5600) * circumference);
    this.cpuGaugeArc.style.strokeDashoffset = cpuOffset;
    this.gpuGaugeArc.style.strokeDashoffset = gpuOffset;

    // Spin speed: RPM to animation duration (higher RPM = faster spin)
    const cpuDuration = Math.max(0.15, 60 / Math.max(500, this.state.cpuFanRpm));
    const gpuDuration = Math.max(0.15, 60 / Math.max(500, this.state.gpuFanRpm));
    this.cpuBlade.style.animationDuration = `${cpuDuration}s`;
    this.gpuBlade.style.animationDuration = `${gpuDuration}s`;

    // 5. Telemetry Page
    document.getElementById('telemCpuTemp').textContent = this.state.cpuTemp;
    document.getElementById('telemCpuUsage').textContent = `${this.state.cpuUsage}%`;
    document.getElementById('telemCpuBar').style.width = `${this.state.cpuUsage}%`;
    document.getElementById('telemCpuPower').textContent = info.pl1;

    document.getElementById('telemGpuTemp').textContent = this.state.gpuTemp;
    document.getElementById('telemGpuRpm').textContent = `${this.state.gpuFanRpm.toLocaleString()} RPM`;
    document.getElementById('telemGpuFanBar').style.width = `${(this.state.gpuFanRpm / 5600) * 100}%`;

    document.getElementById('telemRamUsed').textContent = this.state.ramUsedGb;
    document.getElementById('telemRamPercent').textContent = `${this.state.ramUsage}%`;
    document.getElementById('telemRamBar').style.width = `${this.state.ramUsage}%`;
    document.getElementById('telemRamAvail').textContent = `${(this.state.ramTotalGb - this.state.ramUsedGb).toFixed(1)} GB`;

    document.getElementById('telemB1cc').textContent = (this.state.batteryLimit === 80) ? '80% Cap Active' : '100% Uncapped';

    // 6. Keyboard Glows
    this.renderKeyboardGlows();
  }
}

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new PredatorSenseApp();
});
