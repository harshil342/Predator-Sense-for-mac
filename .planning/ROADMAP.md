# Roadmap: PredatorSense for macOS

## Overview

A 5-phase engineering roadmap to deliver full hardware control and a native PredatorSense suite on macOS 15 Sequoia for the Acer Predator Helios Neo 16 (`PHN16-71`).

## Phases

- [ ] **Phase 1: ACPI Hardware Control & SSDT-PREDATOR** - Author, compile, and configure the OpenCore ACPI SSDT table interfacing directly with the Insyde Embedded Controller registers.
- [ ] **Phase 2: Sunrex 4-Zone RGB Lighting Engine** - Implement the USB HID communication library for the 4-zone RGB keyboard (`VID 0x05AF`, UsagePage `0xFF02`).
- [ ] **Phase 3: Hardware Daemon & Sensor Telemetry Bridge** - Build the local service bridge (`predator-sensed`) linking ACPI/SMC sensors, fan control, and lighting protocols to application endpoints.
- [ ] **Phase 4: PredatorSense macOS GUI Application** - Build the authentic, premium dark-tech gaming application (Performance Modes, Dual Fan Dials, 4-Zone RGB Visualizer, Live Telemetry Gauges, Battery Limiter).
- [ ] **Phase 5: Menubar Companion, Packaging & EFI Finalization** - Integrate macOS menubar tray app, package macOS `.app` bundle, update OpenCore EFI, and run end-to-end verification.

## Phase Details

### Phase 1: ACPI Hardware Control & SSDT-PREDATOR
**Goal**: Deliver a verified `SSDT-PREDATOR.aml` ACPI patch and integrate it into the OpenCore EFI.
**Requirements**: REQ-01, REQ-02, REQ-03, REQ-04, REQ-05
**Success Criteria**:
  1. `SSDT-PREDATOR.dsl` compiles cleanly without AML errors.
  2. Implements methods: `RCPU` (Read CPU Fan RPM), `RGPU` (Read GPU Fan RPM), `SFAN` (Set Fan Mode), `RTMP` (Read CPU/GPU Temps), `SBAT` (Set Battery Charge Threshold).
  3. `SSDT-PREDATOR.aml` is copied to `mac os reference files/EFI/OC/ACPI/` and registered in `config.plist`.

### Phase 2: Sunrex 4-Zone RGB Lighting Engine
**Goal**: Deliver a driver module that sets 4-zone RGB colors and effects on the Sunrex USB keyboard.
**Requirements**: REQ-06, REQ-07, REQ-08, REQ-09
**Success Criteria**:
  1. Driver detects `VID 0x05AF` USB HID keyboard device.
  2. Sends individual RGB packets to Zones 1, 2, 3, and 4.
  3. Supports Static, Breathing, Wave, and Zoom effects with brightness and speed parameters.

### Phase 3: Hardware Daemon & Sensor Telemetry Bridge
**Goal**: Deliver a background service (`predator-sensed`) that handles telemetry streaming and hardware execution.
**Requirements**: REQ-01, REQ-02, REQ-03, REQ-06
**Success Criteria**:
  1. Telemetry loop queries CPU/GPU temperatures, fan RPMs, and power status.
  2. Exposes clean local endpoints (WebSocket/HTTP/IPC) for front-end control.
  3. Includes mock/simulation capability for headless testing and instant feedback.

### Phase 4: PredatorSense macOS GUI Application
**Goal**: Build the full PredatorSense desktop interface matching the authentic Predator aesthetic.
**Requirements**: REQ-10, REQ-11, REQ-12, REQ-13, REQ-14
**Success Criteria**:
  1. Dashboard displays dark-tech Predator aesthetic with neon cyan/teal accents.
  2. Mode Selector toggles Quiet, Balanced, Performance, Turbo, ECO.
  3. Dual AeroBlade 3D Fan Dials display live RPM, Auto/Max buttons, and custom sliders.
  4. Interactive 4-Zone Keyboard visualizer allows picking zone colors and animations.
  5. Live Telemetry displays CPU core frequencies, GPU stats, memory load, and thermal gauges.

### Phase 5: Menubar Companion, Packaging & EFI Finalization
**Goal**: Package the app into a macOS application bundle with Menubar tray companion and EFI patch verification.
**Requirements**: REQ-15
**Success Criteria**:
  1. Menubar item shows live temperature and one-click performance mode switching.
  2. Application is packaged as a ready-to-run macOS app.
  3. Verification tests pass for all features.

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. ACPI SSDT-PREDATOR | 1/1 | Completed | 2026-10-11 |
| 2. 4-Zone RGB Engine | 1/1 | Completed | 2026-10-11 |
| 3. Hardware Daemon Bridge | 1/1 | Completed | 2026-10-11 |
| 4. PredatorSense macOS App | 1/1 | Completed | 2026-10-11 |
| 5. Menubar & Packaging | 1/1 | Completed | 2026-10-11 |
