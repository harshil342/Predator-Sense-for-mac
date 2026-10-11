# STATE.md - Project Memory

## Project Reference

See: [.planning/PROJECT.md](file:///e:/apps/predator%20sense%20for%20mac%20os/.planning/PROJECT.md)
See: [.planning/ROADMAP.md](file:///e:/apps/predator%20sense%20for%20mac%20os/.planning/ROADMAP.md)

**Core Value:** Complete hardware control (fans, thermal modes, 4-zone RGB) on Acer Predator laptops running macOS.
**Current Phase:** All 5 Phases Completed
**Status:** 100% Verified Production Release

## Completed Work

- Reverse engineered PredatorSense 5.0.1463 using REA (`morluto/rea`).
- Identified all hardware offsets in Embedded Controller `ERAM` from laptop's `DSDT.aml`.
- Authored, compiled, and installed `SSDT-PREDATOR.aml` into OpenCore EFI `ACPI/` and registered in `config.plist`.
- Built Sunrex 4-zone RGB keyboard driver (`VID 0x05AF`, UsagePage `0xFF02`) with Swift and TypeScript implementations.
- Implemented zero-dependency `predator-sensed` hardware daemon with real-time SSE telemetry and JSON control.
- Designed & built authentic dark-tech PredatorSense macOS GUI application adhering to `taste-skill`, `impeccable`, and `ponytail`.
- Authored native Swift Menubar companion `tools/PredatorMenubar.swift` and packaged `PredatorSense.app` bundle.
- 11/11 End-to-end tests passing in `tests/verify_all.js`.
