#!/bin/bash
# ==============================================================================
# PredatorSense for macOS — Native Apple Disk Image (.dmg) Builder
# Runs natively on macOS using Apple's hdiutil utility.
# Creates an authentic UDZO compressed Apple Disk Image.
# ==============================================================================

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"
cd "$ROOT_DIR"

OUTPUT_DMG="PredatorSense-5.0.3-macOS.dmg"
TEMP_DMG="temp_predatorsense.dmg"
VOL_NAME="PredatorSense"
STAGING_DIR="$ROOT_DIR/dist_staging"

echo "=========================================================="
echo "  CREATING NATIVE APPLE DISK IMAGE (.DMG) WITH HDIUTIL"
echo "  Target: $OUTPUT_DMG"
echo "=========================================================="

# Clean previous build artifacts
rm -rf "$STAGING_DIR" "$OUTPUT_DMG" "$TEMP_DMG"
mkdir -p "$STAGING_DIR"

# Copy App bundle and files to staging directory
echo "[+] Copying PredatorSense.app..."
cp -R "PredatorSense.app" "$STAGING_DIR/"

echo "[+] Copying Install.command..."
cp "Install.command" "$STAGING_DIR/"
chmod +x "$STAGING_DIR/Install.command"

echo "[+] Copying SSDT-PREDATOR.aml..."
cp "SSDT-PREDATOR.aml" "$STAGING_DIR/"

# Create Applications symlink for drag-and-drop install
echo "[+] Creating /Applications drop symlink..."
ln -s /Applications "$STAGING_DIR/Applications"

# Create README.txt
cat << 'EOF' > "$STAGING_DIR/README.txt"
==========================================================
  Acer PredatorSense for macOS — Helios Neo 16 (PHN16-71)
==========================================================

QUICK INSTALLATION:
1. Double-click "Install.command" to install automatically!
   OR
2. Drag "PredatorSense.app" to the "Applications" shortcut.

If macOS displays "App is damaged or cannot be verified":
Simply double-click "Install.command" — it removes the Apple
quarantine flag and ad-hoc signs the application for you.

To enable hardware fan & power limit control:
Copy SSDT-PREDATOR.aml to /Volumes/EFI/EFI/OC/ACPI/ and enable
it in your OpenCore config.plist.
EOF

# Create read-write disk image first
echo "[+] Generating disk image with hdiutil..."
hdiutil create -srcfolder "$STAGING_DIR" -volname "$VOL_NAME" -fs HFS+ -format UDZO -ov "$OUTPUT_DMG"

# Cleanup staging
rm -rf "$STAGING_DIR"

echo ""
echo "=========================================================="
echo "  [SUCCESS] Native Apple Disk Image created: $OUTPUT_DMG"
echo "=========================================================="
