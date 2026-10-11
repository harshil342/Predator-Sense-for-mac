# Requirements: PredatorSense for macOS

## User Stories & Functional Requirements

### 1. Hardware Control & Sensors (ACPI / EC)
- **REQ-01**: The system must provide ACPI methods to read CPU fan RPM (`CPUF` at `0x1C`) and GPU fan RPM (`GPUF` at `0x06`).
- **REQ-02**: The system must provide ACPI methods to read CPU temperature (`CTMP` at `0x18`) and GPU temperature (`GTMP` at `0x19`).
- **REQ-03**: The system must provide ACPI methods to set the operating fan profile (`FANT` at `0x13`), selecting between Auto, Max (Turbo), and Custom speeds.
- **REQ-04**: The system must provide an ACPI method to set the battery charging limit threshold (`B1CC` at `0x40`) to 80% to protect battery longevity.
- **REQ-05**: The OpenCore `config.plist` in `EFI/OC` must have `SSDT-PREDATOR.aml` loaded and enabled.

### 2. 4-Zone RGB Keyboard Lighting
- **REQ-06**: The system must communicate with the internal Sunrex USB keyboard controller (`VID 0x05AF`, UsagePage `0xFF02`).
- **REQ-07**: Users must be able to customize each of the 4 keyboard zones independently with full 24-bit RGB hex colors.
- **REQ-08**: Users must be able to adjust overall keyboard brightness (levels 0 to 5) and effect animation speed (1 to 9).
- **REQ-09**: Users must be able to switch lighting effects: Static, Breathing, Wave, and Zoom.

### 3. Application UI & Experience
- **REQ-10**: The app must present a dark-tech, authentic PredatorSense gaming interface with neon teal/cyan accents and smooth animations.
- **REQ-11**: The app must feature **Performance Mode Selector** allowing one-click switching between:
  - Quiet (Silent fans, power saving)
  - Balanced / Default
  - Performance / Extreme
  - Turbo (100% fans, unrestricted clocks)
  - ECO
- **REQ-12**: The app must feature **Dual AeroBlade Fan Dials** displaying live RPM and speed toggles:
  - Auto
  - Max Turbo (100%)
  - Custom Sliders (0% – 100% independently for CPU and GPU fans)
- **REQ-13**: The app must feature an **Interactive 4-Zone Keyboard Graphic** reflecting chosen colors in real time.
- **REQ-14**: The app must display **Live Telemetry & Gauges**:
  - CPU & GPU temperatures with color-coded warning thresholds
  - Fan speeds (RPM and percentage)
  - CPU usage and memory load
- **REQ-15**: The app must support a macOS **Menubar Status Bar Item** for quick glance temperature and mode switching.
