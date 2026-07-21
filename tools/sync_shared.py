from pathlib import Path
import shutil

root=Path(__file__).resolve().parents[1]

def copy(src, dst):
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dst)

copy(root/'shared/data/core-data.json', root/'web/data/core-data.json')
copy(root/'shared/data/core-data.json', root/'web/data/core-data.pretty.json')
copy(root/'shared/data/core-data.json', root/'android/app/src/main/assets/data/core-data.json')
copy(root/'shared/data/brand-logos.json', root/'web/data/brand-logos.json')
copy(root/'shared/data/brand-logos.json', root/'android/app/src/main/assets/data/brand-logos.json')
copy(root/'shared/demo-profile.json', root/'web/data/demo-profile.json')
copy(root/'shared/demo-profile.json', root/'android/app/src/main/assets/data/demo-profile.json')
copy(root/'shared/product-tiers.json', root/'web/data/product-tiers.json')
copy(root/'shared/data/elm327-protocol-profiles.json', root/'web/data/elm327-protocol-profiles.json')
copy(root/'shared/data/elm327-protocol-profiles.json', root/'android/app/src/main/assets/data/elm327-protocol-profiles.json')
copy(root/'shared/data/ecu-console-commands.json', root/'web/data/ecu-console-commands.json')
copy(root/'shared/data/ecu-console-commands.json', root/'android/app/src/main/assets/data/ecu-console-commands.json')

for source_name, targets in {
    'logos': [root/'web/assets/logos', root/'android/app/src/main/assets/logos'],
    'gauges': [root/'web/assets/gauges', root/'android/app/src/main/assets/gauges'],
    'icons': [root/'web/assets/icons', root/'android/app/src/main/assets/icons'],
}.items():
    source=root/'shared'/source_name
    for target in targets:
        target.mkdir(parents=True,exist_ok=True)
        for f in source.rglob('*'):
            if f.is_file():
                rel=f.relative_to(source)
                (target/rel).parent.mkdir(parents=True,exist_ok=True)
                shutil.copy2(f,target/rel)
print('Shared data, demo, logos and gauges synced.')
