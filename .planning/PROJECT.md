# PredatorSense for macOS

## What This Is

A native, high-performance hardware control and monitoring suite for Acer Predator laptops running macOS (specifically Acer Predator Helios Neo 16 PHN16-71 on macOS 15 Sequoia). It brings full control over dual AeroBlade 3D fans, operating performance modes (Quiet, Balanced, Performance, Turbo, ECO), 4-zone RGB keyboard lighting, battery charging thresholds, and real-time hardware telemetry.

## Core Value

Enable complete, reliable hardware control (fans, thermal performance modes, and 4-zone RGB lighting) on Acer Predator laptops running macOS with a premium gaming UI.

## Requirements

### Active

- [ ] **REQ-01 (ACPI SSDT Engine)**: Create `SSDT-PREDATOR.dsl` implementing read/write methods for Embedded Controller registers (`CPUF` 0x1C, `GPUF` 0x06, `FANT` 0x13, `CTMP` 0x18, `GTMP` 0x19, `B1CC` 0x40).
- [ ] **REQ-02 (OpenCore EFI Integration)**: Compile and integrate `SSDT-PREDATOR.aml` into the OpenCore EFI (`OC/ACPI/` and `config.plist`).
- [ ] **REQ-03 (4-Zone RGB Lighting Driver)**: Implement Sunrex USB HID driver (`VID 0x05AF`, UsagePage `0xFF02`) for Zone 1–4 RGB lighting, brightness, and animations (Static, Breathing, Wave).
- [ ] **REQ-04 (Hardware Bridge Daemon)**: Build a local background service (`predator-sensed`) that interacts with ACPI/IOHID and serves real-time sensor streams and control endpoints.
- [ ] **REQ-05 (PredatorSense macOS App)**: Build an Electron/macOS native app with dark-tech Predator aesthetic, dual fan dials, mode picker, 4-zone lighting visualizer, and telemetry graphs.
- [ ] **REQ-06 (Menubar Tray Companion)**: Implement a lightweight macOS menubar widget showing real-time CPU/GPU temperatures and quick performance mode switching.

### Out of Scope

- Overclocking mobile GPU beyond factory VBIOS limits.
- Proprietary Acer Cloud / Planet9 account synchronization.

## Context

- Target Laptop: Acer Predator Helios Neo 16 (`PHN16-71`)
- CPU: Intel Core i7-13700HX (Raptor Lake-HX, 16 Cores, 24 Threads)
- GPU: NVIDIA GeForce RTX 4050 Laptop GPU (driven by NullMoth driver on macOS 15)
- OpenCore: Active OpenCore configuration in `mac os reference files/EFI` with `DSDT.aml`
- Reverse-engineered PredatorSense protocols from Windows application package (`5.0.1463`) using `morluto/rea`.

## Key Decisions

| Decision | Rationale | Outcome |
| :--- | :--- | :--- |
| **Direct EC Registers in ACPI** | DSDT analysis revealed exact offsets (`CPUF` 0x1C, `GPUF` 0x06, `FANT` 0x13); avoids fragile reverse-engineering of Windows driver internals. | Verified |
| **USB HID for 4-Zone RGB** | Sunrex keyboard RGB microcontroller connects over USB HID (`VID 0x05AF`, UsagePage `0xFF02`); controllable from user space without kernel extensions. | Verified |
| **Unified Electron/Web Desktop App** | Matches the visual fidelity of PredatorSense while running natively on macOS with low resource footprint. | In Progress |
