import subprocess
import time

with open("seed_mega_na_clubs.sql", "r") as f:
    sql_lines = [line.strip() for line in f.readlines() if line.strip() and not line.startswith("--")]

print(f"Total SQL insert statements to execute: {len(sql_lines)}")

# Execute in chunks of 25 statements
chunk_size = 25
for i in range(0, len(sql_lines), chunk_size):
    chunk = sql_lines[i:i + chunk_size]
    batch_sql = "\n".join(chunk)
    print(f"Executing batch {i // chunk_size + 1} ({len(chunk)} statements)...")
    
    cmd = [
        "npx", "wrangler", "d1", "execute", "pictide", "--remote",
        f"--command={batch_sql}"
    ]
    res = subprocess.run(cmd, cwd="worker", capture_output=True, text=True)
    if res.returncode != 0:
        print(f"Batch {i // chunk_size + 1} error: {res.stderr[:200]}")
    else:
        print(f"Batch {i // chunk_size + 1} success!")
    time.sleep(0.5)

print("Batch execution complete!")
