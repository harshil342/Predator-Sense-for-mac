#!/usr/bin/env python3
"""
PredatorSense for macOS — Disk Image Builder
Generates a mountable disk image containing PredatorSense.app,
the one-click Install.command automated installer, SSDT-PREDATOR.aml,
and a drop-target symlink to /Applications.
Produces both PredatorSense-5.0.1-macOS.dmg and PredatorSense-5.0.1-macOS.iso.
Compatible with macOS 11 Big Sur through macOS 15 Sequoia.
"""

import os, sys, shutil, pycdlib

def build_predatorsense_dmg(app_source_dir="PredatorSense.app", output_dmg="PredatorSense-5.0.3-macOS.dmg", output_iso="PredatorSense-5.0.3-macOS.iso"):
    print("==========================================================")
    print("  BUILDING PREDATORSENSE FOR MACOS DISK IMAGE")
    print(f"  Source: {app_source_dir}")
    print(f"  Target DMG: {output_dmg}")
    print(f"  Target ISO: {output_iso}")
    print("==========================================================\n")

    if not os.path.exists(app_source_dir):
        raise FileNotFoundError(f"Source app directory not found: {app_source_dir}")

    # Ensure app launcher has executable line endings & permissions
    launcher_path = os.path.join(app_source_dir, "Contents", "MacOS", "PredatorSense")
    if os.path.exists(launcher_path):
        with open(launcher_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read().replace('\r\n', '\n')
        with open(launcher_path, "w", encoding="utf-8", newline='\n') as f:
            f.write(content)

    # Temporary readme
    readme_path = "scratch_readme.txt"
    with open(readme_path, "w", encoding="utf-8", newline="\n") as f:
        f.write(
            "==========================================================\n"
            "  Acer PredatorSense for macOS — Helios Neo 16 (PHN16-71)\n"
            "==========================================================\n\n"
            "QUICK INSTALLATION:\n"
            "1. Double-click 'Install.command' to install automatically!\n"
            "   - It copies PredatorSense.app to /Applications\n"
            "   - Removes Gatekeeper quarantine flags\n"
            "   - Ad-hoc signs the application bundle\n"
            "   - Configures executable permissions\n"
            "   - Optionally installs SSDT-PREDATOR.aml to OpenCore EFI\n\n"
            "MANUAL INSTALLATION:\n"
            "1. Drag 'PredatorSense.app' to your 'Applications' folder.\n"
            "2. If macOS reports 'App is damaged' or 'unidentified developer', run:\n"
            "   xattr -cr /Applications/PredatorSense.app\n"
            "   codesign --force --deep -s - /Applications/PredatorSense.app\n"
            "3. Double-click PredatorSense in Applications to start.\n\n"
            "Hardware & Models Supported:\n"
            "- Acer Predator Helios Neo (PHN16-71/72, PHN18-71)\n"
            "- Acer Predator Helios 16 / 18 (PH16-71/72, PH18-71/72)\n"
            "- Acer Predator Helios 300 (PH315-53/54/55, PH317-53/54/55)\n"
            "- Acer Predator Triton (PT314/315/515/516, PT14/16/17)\n"
            "- Acer Nitro 5 / 16 / 17 (AN515-55/57/58, AN16-51, AN17-51)\n"
        )

    iso = pycdlib.PyCdlib()
    iso.new(rock_ridge='1.09', joliet=3, vol_ident='PREDATORSENSE')

    # Mapping: rel_dir -> (iso_dir_path, joliet_dir_path)
    dir_map = {}
    dir_map[""] = ("/", "/")

    dir_seq = 0
    file_seq = 0

    # 1. Walk app_source_dir and create directory hierarchy
    for root, dirs, files in os.walk(app_source_dir):
        dirs.sort()
        files.sort()
        
        rel_root = os.path.relpath(root, os.path.dirname(app_source_dir)) if os.path.dirname(app_source_dir) else root
        rel_root = rel_root.replace('\\', '/')
        
        # Parent rel path
        parent_rel = os.path.dirname(rel_root).replace('\\', '/')
        if parent_rel == rel_root or parent_rel == '.':
            parent_rel = ""

        # Current dir name
        dir_name = os.path.basename(rel_root)

        # Get parent paths
        parent_iso, parent_joliet = dir_map[parent_rel]

        # Allocate ISO name (max 8 uppercase alphanumeric chars)
        dir_seq += 1
        iso_seg = f"D{dir_seq:04d}"
        iso_dir_path = (parent_iso.rstrip('/') + '/' + iso_seg)
        joliet_dir_path = (parent_joliet.rstrip('/') + '/' + dir_name)

        dir_map[rel_root] = (iso_dir_path, joliet_dir_path)

        # Add directory
        iso.add_directory(
            iso_path=iso_dir_path,
            rr_name=dir_name,
            joliet_path=joliet_dir_path,
            file_mode=0o755
        )

        # Add files in this directory
        for f in files:
            file_seq += 1
            local_file_path = os.path.join(root, f)
            iso_file_seg = f"F{file_seq:04d}.DAT;1"
            iso_file_path = iso_dir_path + '/' + iso_file_seg
            joliet_file_path = joliet_dir_path + '/' + f
            
            # Check if executable
            is_exec = (f == "PredatorSense" or f.endswith(".sh") or f.endswith(".command") or f.endswith(".swift"))
            mode = 0o755 if is_exec else 0o644

            iso.add_file(
                filename=local_file_path,
                iso_path=iso_file_path,
                rr_name=f,
                joliet_path=joliet_file_path,
                file_mode=mode
            )

    # 2. Add Install.command at root of disk image
    if os.path.exists("Install.command"):
        file_seq += 1
        iso.add_file(
            filename="Install.command",
            iso_path="/INSTALL.CMD;1",
            rr_name="Install.command",
            joliet_path="/Install.command",
            file_mode=0o755
        )
        print("[+] Added Install.command automated installer")

    # 3. Add SSDT-PREDATOR.aml at root of disk image
    if os.path.exists("SSDT-PREDATOR.aml"):
        file_seq += 1
        iso.add_file(
            filename="SSDT-PREDATOR.aml",
            iso_path="/SSDT_PRE.AML;1",
            rr_name="SSDT-PREDATOR.aml",
            joliet_path="/SSDT-PREDATOR.aml",
            file_mode=0o644
        )
        print("[+] Added SSDT-PREDATOR.aml ACPI bridge")

    # 4. Add /Applications symlink at root of disk image
    try:
        iso.add_symlink(
            symlink_path='/Applications',
            rr_path='/APPS;1',
            rr_symlink_name='Applications',
            joliet_path='/Applications'
        )
        print("[+] Added /Applications drop target symlink")
    except Exception as e:
        print(f"[!] Warning: Symlink skipped ({e})")

    # 5. Add README.txt at root of disk image
    file_seq += 1
    iso.add_file(
        filename=readme_path,
        iso_path="/README.TXT;1",
        rr_name="README.txt",
        joliet_path="/README.txt",
        file_mode=0o644
    )
    print("[+] Added README.txt installation notes")

    # 6. Write image files
    if os.path.exists(output_dmg):
        os.remove(output_dmg)
    if os.path.exists(output_iso):
        os.remove(output_iso)
    
    print(f"[+] Writing {output_iso} and {output_dmg} with Rock Ridge & Joliet extensions...")
    iso.write(output_iso)
    iso.close()

    # Create matching .dmg copy for compatibility
    shutil.copyfile(output_iso, output_dmg)

    # Clean scratch file
    if os.path.exists(readme_path):
        os.remove(readme_path)

    size_mb = os.path.getsize(output_dmg) / (1024 * 1024)
    print(f"\n[SUCCESS] Generated macOS Disk Images:\n  - {output_dmg} ({size_mb:.2f} MB)\n  - {output_iso} ({size_mb:.2f} MB)")
    return output_dmg

if __name__ == '__main__':
    build_predatorsense_dmg()
