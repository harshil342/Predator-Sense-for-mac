# PredatorSense for macOS — Installation Guide

This guide details how to install and configure **PredatorSense for macOS** on your **Acer Predator Helios Neo 16 (`PHN16-71`)** running macOS 11 Big Sur through macOS 15 Sequoia.

---

## Prerequisites

1. **Hardware**: Acer Predator Helios Neo 16 (`PHN16-71`, Intel i7-13700HX, RTX 4050, 4-zone RGB keyboard).
2. **Bootloader**: OpenCore (0.9.x through 1.0.x) with `VirtualSMC.kext`.
3. **Runtime**: Node.js (v18+) installed on your macOS system (`brew install node`).

---

## Installation Methods

### Method 1: Using the `.dmg` Disk Image (Recommended)

1. Download **`PredatorSense-5.0.1-macOS.dmg`** from the [GitHub Releases](https://github.com/harshil342/Predator-Sense-for-mac/releases) page.
2. Double-click `PredatorSense-5.0.1-macOS.dmg` to mount the virtual disk.
3. Drag **`PredatorSense.app`** into your **`Applications`** folder.
4. If macOS Gatekeeper displays an unverified developer warning, run:
   ```bash
   xattr -cr /Applications/PredatorSense.app
   ```
5. Launch `PredatorSense` from Applications or Spotlight.

---

### Method 2: OpenCore EFI Integration (Required for Full Hardware Control)

To enable kernel-level EC fan reading, power limit adjustments, and battery 80% charging threshold:

1. **Mount your EFI Partition**:
   ```bash
   # Identify EFI disk
   diskutil list
   # Mount EFI (replace disk0s1 with your EFI identifier)
   sudo diskutil mount /dev/disk0s1
   ```

2. **Copy SSDT-PREDATOR.aml**:
   ```bash
   cp SSDT-PREDATOR.aml /Volumes/EFI/EFI/OC/ACPI/
   ```

3. **Register in config.plist**:
   Open `/Volumes/EFI/EFI/OC/config.plist` using OpenCore Configurator, ProperTree, or a text editor.
   Add the following entry under `ACPI -> Add`:
   ```xml
   <dict>
       <key>Comment</key>
       <string>Acer Predator Helios Neo 16 Hardware Control Bridge</string>
       <key>Enabled</key>
       <true/>
       <key>Path</key>
       <string>SSDT-PREDATOR.aml</string>
   </dict>
   ```

4. **Reboot**:
   Reboot macOS to load the new ACPI table.

---

### Method 3: Running from Source / Terminal

If you prefer to run the hardware daemon and cockpit directly in your terminal:

1. Clone the repository:
   ```bash
   git clone https://github.com/harshil342/Predator-Sense-for-mac.git
   cd Predator-Sense-for-mac
   ```

2. Compile the Swift companions (optional, for native Menubar tray and USB HID):
   ```bash
   swiftc tools/predator-rgb.swift -o tools/predator-rgb
   swiftc tools/PredatorMenubar.swift -o tools/PredatorMenubar
   ```

3. Start the Hardware Daemon:
   ```bash
   node src/server/daemon.js
   ```

4. Open `http://127.0.0.1:48800` in Safari or Chrome.

---

## Verifying Hardware Functionality

Run the built-in 13-point test suite to confirm all drivers and endpoints:

```bash
node tests/verify_all.js
```

Expected output:
```
========================================================
  PREDATORSENSE FOR MACOS — END-TO-END VERIFICATION SUITE
  Target Laptop: Acer Predator Helios Neo 16 (PHN16-71)
========================================================

--- Phase 1: ACPI Hardware Control & SSDT-PREDATOR ---
[PASS] SSDT-PREDATOR.dsl source exists
[PASS] Compiled SSDT-PREDATOR.aml exists in EFI ACPI folder
[PASS] OpenCore config.plist includes SSDT-PREDATOR.aml enabled

--- Phase 2: Sunrex 4-Zone RGB Lighting Engine ---
[PASS] Sunrex keyboard driver module exists

--- Phase 3 & 4: Hardware Daemon & UI Application ---
[PASS] Daemon serves /api/state with laptop metadata
[PASS] Daemon accepts POST /api/control to set Turbo mode
[PASS] Daemon serves PredatorSense HTML UI at /index.html
[PASS] Daemon serves PredatorSense CSS at /style.css
[PASS] Daemon serves PredatorSense JS at /app.js

--- Phase 5: Menubar Companion & App Packaging ---
[PASS] Native Swift Menubar companion exists
[PASS] macOS PredatorSense.app bundle structure is complete
[PASS] macOS Disk Image (.dmg) installer exists and is verified
[PASS] macOS Portable ZIP archive exists

========================================================
  VERIFICATION RESULTS: 13 / 13 TESTS PASSED (100%)
========================================================
```

---

## Troubleshooting

### 1. App closes immediately on double-click
Ensure Node.js is installed on your Mac. You can install it via Homebrew:
```bash
brew install node
```

### 2. Fans not ramping to Max in Turbo Mode
Ensure `SSDT-PREDATOR.aml` is loaded in your EFI. Check using `ioreg`:
```bash
ioreg -l -p IODeviceTree | grep PRED
```
If `PRED0001` appears, the ACPI bridge is active.

### 3. Keyboard colors don't change
The keyboard requires USB access. Check that the Sunrex controller (`VID 0x05AF`) is detected:
```bash
ioreg -p IOUSB -l | grep -i "0x5af"
```
Ensure your user account has permission to interact with USB HID devices.

---

## Updating

To update, download the latest `.dmg` release from GitHub, mount it, and overwrite `/Applications/PredatorSense.app`.
