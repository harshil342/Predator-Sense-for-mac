#!/bin/bash
# ==============================================================================
# PredatorSense for macOS — Automated One-Click Installer
# Target Laptop: Acer Predator Helios Neo 16 (PHN16-71) & Predator/Nitro Series
# Supports: macOS 11 Big Sur through macOS 15 Sequoia
# ==============================================================================

set -e

# Color definitions
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

clear 2>/dev/null || true

echo -e "${CYAN}================================================================${NC}"
echo -e "${CYAN}  ACER PREDATORSENSE FOR MACOS — AUTOMATED INSTALLER${NC}"
echo -e "${CYAN}  Hardware: Acer Predator Helios / Helios Neo / Triton / Nitro${NC}"
echo -e "${CYAN}================================================================${NC}\n"

# 1. Resolve source directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SOURCE_APP="$SCRIPT_DIR/PredatorSense.app"
DEST_APP="/Applications/PredatorSense.app"

if [ ! -d "$SOURCE_APP" ]; then
    # Check parent directory in case run from tools/
    if [ -d "$SCRIPT_DIR/../PredatorSense.app" ]; then
        SOURCE_APP="$SCRIPT_DIR/../PredatorSense.app"
    else
        echo -e "${RED}[ERROR] PredatorSense.app bundle not found in $SCRIPT_DIR${NC}"
        echo "Please make sure Install.command is in the same folder as PredatorSense.app"
        read -p "Press Enter to exit..."
        exit 1
    fi
fi

# 2. Check & Install to /Applications
echo -e "${CYAN}[1/5] Installing application bundle to /Applications...${NC}"
if [ -d "$DEST_APP" ]; then
    echo -e "${YELLOW}      Replacing existing installation at $DEST_APP...${NC}"
    rm -rf "$DEST_APP"
fi

cp -R "$SOURCE_APP" "$DEST_APP"
echo -e "${GREEN}      Successfully copied PredatorSense.app to /Applications!${NC}"

# 3. Permissions & Executable Attributes
echo -e "${CYAN}[2/5] Configuring executable permissions & native bridges...${NC}"
chmod +x "$DEST_APP/Contents/MacOS/PredatorSense"

# Compile native Swift helpers if swiftc is available
if command -v swiftc >/dev/null 2>&1; then
    echo "      Compiling native Swift helpers with swiftc..."
    if [ -f "$DEST_APP/Contents/Resources/app/tools/predator-rgb.swift" ]; then
        swiftc -O "$DEST_APP/Contents/Resources/app/tools/predator-rgb.swift" -o "$DEST_APP/Contents/Resources/app/tools/predator-rgb" 2>/dev/null || true
    fi
    if [ -f "$DEST_APP/Contents/Resources/app/tools/PredatorMenubar.swift" ]; then
        swiftc -O "$DEST_APP/Contents/Resources/app/tools/PredatorMenubar.swift" -o "$DEST_APP/Contents/Resources/app/tools/PredatorMenubar" 2>/dev/null || true
    fi
fi

if [ -f "$DEST_APP/Contents/Resources/app/tools/predator-rgb" ]; then
    chmod +x "$DEST_APP/Contents/Resources/app/tools/predator-rgb"
fi
if [ -f "$DEST_APP/Contents/Resources/app/tools/PredatorMenubar" ]; then
    chmod +x "$DEST_APP/Contents/Resources/app/tools/PredatorMenubar"
fi
echo -e "${GREEN}      All launcher and tool permissions configured!${NC}"

# 4. Gatekeeper & Quarantine Removal + Ad-hoc Code Signing
echo -e "${CYAN}[3/5] Resolving Gatekeeper quarantine and signing bundle...${NC}"
# Remove Apple Quarantine attributes recursively (prevents "App is damaged" error)
xattr -cr "$DEST_APP" 2>/dev/null || true
echo -e "${GREEN}      Removed com.apple.quarantine security flags.${NC}"

# Ad-hoc code sign bundle (prevents macOS Sequoia/Sonoma verification blocks)
if command -v codesign >/dev/null 2>&1; then
    codesign --force --deep --sign - "$DEST_APP" 2>/dev/null || true
    echo -e "${GREEN}      Applied local ad-hoc code signature successfully.${NC}"
fi

# 5. Check Node.js Dependency
echo -e "${CYAN}[4/5] Checking Node.js runtime environment...${NC}"
NODE_FOUND=0
# Augment path to check common locations
export PATH="/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/local/sbin:/opt/local/bin:$HOME/.nvm/current/bin:$HOME/.volta/bin:$HOME/.asdf/shims:$PATH"

if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}      Found Node.js runtime: ${NODE_VERSION}${NC}"
    NODE_FOUND=1
else
    echo -e "${YELLOW}      [NOTICE] Node.js is not yet installed in your system PATH.${NC}"
    echo "      PredatorSense requires Node.js v18+ to communicate with hardware."
    
    if command -v brew >/dev/null 2>&1; then
        read -p "      Would you like to install Node.js automatically via Homebrew? (y/N): " INSTALL_BREW_NODE
        if [[ "$INSTALL_BREW_NODE" =~ ^[Yy]$ ]]; then
            echo "      Installing Node.js via Homebrew..."
            brew install node
            NODE_FOUND=1
        fi
    else
        echo -e "${YELLOW}      You can download and install Node.js from https://nodejs.org/${NC}"
    fi
fi

# 6. Optional: OpenCore ACPI SSDT-PREDATOR.aml integration
echo -e "\n${CYAN}[5/5] OpenCore ACPI Hardware Integration (Optional)...${NC}"
SSDT_SOURCE="$DEST_APP/Contents/Resources/app/SSDT-PREDATOR.aml"
if [ ! -f "$SSDT_SOURCE" ]; then
    SSDT_SOURCE="$SCRIPT_DIR/SSDT-PREDATOR.aml"
fi

if [ -f "$SSDT_SOURCE" ]; then
    if [ -d "/Volumes/EFI/EFI/OC/ACPI" ]; then
        echo -e "${GREEN}      Detected mounted OpenCore EFI partition at /Volumes/EFI!${NC}"
        read -p "      Would you like to copy SSDT-PREDATOR.aml to EFI/OC/ACPI/? (y/N): " COPY_SSDT
        if [[ "$COPY_SSDT" =~ ^[Yy]$ ]]; then
            cp "$SSDT_SOURCE" "/Volumes/EFI/EFI/OC/ACPI/SSDT-PREDATOR.aml"
            echo -e "${GREEN}      Copied SSDT-PREDATOR.aml to /Volumes/EFI/EFI/OC/ACPI/${NC}"
            echo -e "${YELLOW}      Remember to add SSDT-PREDATOR.aml under ACPI -> Add in config.plist!${NC}"
        fi
    else
        echo "      EFI partition is not currently mounted."
        echo "      To enable EC Fan & Power Limits, copy SSDT-PREDATOR.aml to EFI/OC/ACPI/ later."
    fi
fi

# 7. Launch confirmation
echo -e "\n${GREEN}================================================================${NC}"
echo -e "${GREEN}  INSTALLATION SUCCESSFUL!${NC}"
echo -e "${GREEN}  PredatorSense is now installed in /Applications/PredatorSense.app${NC}"
echo -e "${GREEN}================================================================${NC}\n"

read -p "Would you like to launch PredatorSense now? (Y/n): " LAUNCH_APP
if [[ ! "$LAUNCH_APP" =~ ^[Nn]$ ]]; then
    echo "Launching PredatorSense..."
    open "$DEST_APP"
fi

echo -e "\nDone! You can launch PredatorSense anytime from Launchpad, Spotlight, or /Applications."
