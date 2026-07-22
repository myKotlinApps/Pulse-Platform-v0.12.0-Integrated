from pathlib import Path
import re
import subprocess
import sys


ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / "app.html").read_text(encoding="utf-8")
CSS = (ROOT / "assets/adminkit/css/ecu-pulse-rtl.css").read_text(encoding="utf-8")
failures = []


def check(name: str, condition: bool) -> None:
    print(f"{'PASS' if condition else 'FAIL'}: {name}")
    if not condition:
        failures.append(name)


check("AdminKit is the initial document theme", 'data-theme="adminkit"' in HTML)
check("AdminKit is the only runtime theme", "const APP_THEME='adminkit';" in HTML)
check("legacy theme selector is absent", 'id="themeSelect"' not in HTML)
check("legacy theme cycle button is absent", 'id="themeBtn"' not in HTML)
check("mobile bottom navigation is absent", '<nav class="bottom"' not in HTML)
check("RTL AdminKit stylesheet is loaded", './assets/adminkit/css/ecu-pulse-rtl.css' in HTML)
check("RTL stylesheet is scoped to AdminKit", 'html[data-theme="adminkit"]' in CSS)
check("logos do not depend on a GitHub branch", "raw.githubusercontent.com" not in HTML)
check("sidebar toggle has one owner", "js-sidebar-toggle" not in HTML)

local_assets = [
    "assets/adminkit/css/app.css",
    "assets/adminkit/css/ecu-pulse-rtl.css",
    "assets/adminkit/js/app.js",
    "shared/demo-profile.json",
    "shared/data/core-data.json",
    "shared/product-tiers.json",
    "shared/data/brand-logos.json",
]
for relative in local_assets:
    check(f"local asset exists: {relative}", (ROOT / relative).is_file())

scripts = re.findall(r"<script(?:\s[^>]*)?>(.*?)</script>", HTML, flags=re.DOTALL)
inline_script = scripts[-1] if scripts else ""
result = subprocess.run(
    ["node", "--check", "-"],
    input=inline_script,
    text=True,
    capture_output=True,
    check=False,
)
check("inline application JavaScript parses", result.returncode == 0)
if result.returncode:
    print(result.stderr)

print(f"SUMMARY: {len(failures)} failure(s)")
sys.exit(1 if failures else 0)
