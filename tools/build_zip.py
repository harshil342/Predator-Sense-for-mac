#!/usr/bin/env python3
"""
PredatorSense for macOS — Standalone ZIP Archive Builder
Packages PredatorSense.app, the automated Install.command helper,
SSDT-PREDATOR.aml ACPI table, and documentation into a universal distribution archive.
Preserves UNIX permissions (0o755 for executables/scripts, 0o644 for assets).
"""

import os, zipfile

zip_name = "PredatorSense-5.0.3-macOS.zip"
print(f"[+] Creating macOS ZIP distribution package: {zip_name}...")

def add_file_with_unix_perms(zf, file_path, arcname, is_executable=False):
    perm = 0o755 if is_executable else 0o644
    zinfo = zipfile.ZipInfo(arcname)
    zinfo.date_time = (2026, 10, 11, 7, 0, 0)
    zinfo.compress_type = zipfile.ZIP_DEFLATED
    # UNIX file mode in external_attr (upper 16 bits)
    zinfo.external_attr = (0o100000 | perm) << 16
    with open(file_path, 'rb') as fp:
        zf.writestr(zinfo, fp.read())

with zipfile.ZipFile(zip_name, 'w', zipfile.ZIP_DEFLATED) as zf:
    # 1. Package PredatorSense.app bundle
    for root, dirs, files in os.walk("PredatorSense.app"):
        for f in files:
            path = os.path.join(root, f)
            arcname = path.replace('\\', '/')
            is_exec = (f == "PredatorSense" or f.endswith(".sh") or f.endswith(".command") or f.endswith(".swift"))
            add_file_with_unix_perms(zf, path, arcname, is_exec)

    # 2. Package one-click Install.command helper at root of archive
    if os.path.exists("Install.command"):
        print("[+] Bundling Install.command one-click installer")
        add_file_with_unix_perms(zf, "Install.command", "Install.command", is_executable=True)

    if os.path.exists("install.sh"):
        add_file_with_unix_perms(zf, "install.sh", "install.sh", is_executable=True)

    # 3. Package SSDT-PREDATOR.aml and DSL
    if os.path.exists("SSDT-PREDATOR.aml"):
        print("[+] Bundling SSDT-PREDATOR.aml for OpenCore EFI ACPI")
        add_file_with_unix_perms(zf, "SSDT-PREDATOR.aml", "SSDT-PREDATOR.aml", is_executable=False)

    if os.path.exists("SSDT-PREDATOR.dsl"):
        add_file_with_unix_perms(zf, "SSDT-PREDATOR.dsl", "SSDT-PREDATOR.dsl", is_executable=False)

print(f"[SUCCESS] Created {zip_name} ({os.path.getsize(zip_name) / 1024:.1f} KB) with UNIX permissions.")
