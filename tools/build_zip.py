import os, zipfile

zip_name = "PredatorSense-5.0.1-macOS.zip"
print(f"[+] Creating macOS ZIP archive: {zip_name}...")

with zipfile.ZipFile(zip_name, 'w', zipfile.ZIP_DEFLATED) as zf:
    for root, dirs, files in os.walk("PredatorSense.app"):
        for f in files:
            path = os.path.join(root, f)
            arcname = path.replace('\\', '/')
            is_exec = (f == "PredatorSense" or f.endswith(".sh") or f.endswith(".swift"))
            
            zinfo = zipfile.ZipInfo(arcname)
            zinfo.date_time = (2026, 10, 11, 7, 0, 0)
            zinfo.compress_type = zipfile.ZIP_DEFLATED
            # Set UNIX permissions (0o755 for exec, 0o644 for regular files)
            perm = 0o755 if is_exec else 0o644
            zinfo.external_attr = (0o100000 | perm) << 16
            
            with open(path, 'rb') as fp:
                zf.writestr(zinfo, fp.read())

print(f"[SUCCESS] Created {zip_name} ({os.path.getsize(zip_name) / 1024:.1f} KB)")
