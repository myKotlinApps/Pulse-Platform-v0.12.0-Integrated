from pathlib import Path
from urllib.request import urlopen
root=Path(__file__).resolve().parents[1]
items={
 root/'android/app/src/main/assets/fonts/vazirmatn_regular.ttf':'https://raw.githubusercontent.com/rastikerdar/vazirmatn/master/fonts/ttf/Vazirmatn-Regular.ttf',
 root/'android/app/src/main/assets/fonts/vazirmatn_medium.ttf':'https://raw.githubusercontent.com/rastikerdar/vazirmatn/master/fonts/ttf/Vazirmatn-Medium.ttf',
 root/'android/app/src/main/assets/fonts/vazirmatn_bold.ttf':'https://raw.githubusercontent.com/rastikerdar/vazirmatn/master/fonts/ttf/Vazirmatn-Bold.ttf',
 root/'web/assets/fonts/vazirmatn_regular.woff2':'https://raw.githubusercontent.com/rastikerdar/vazirmatn/master/fonts/webfonts/Vazirmatn-Regular.woff2',
 root/'web/assets/fonts/vazirmatn_bold.woff2':'https://raw.githubusercontent.com/rastikerdar/vazirmatn/master/fonts/webfonts/Vazirmatn-Bold.woff2'}
for path,url in items.items():
 path.parent.mkdir(parents=True,exist_ok=True)
 if not path.exists():
  print('Downloading',path.name);path.write_bytes(urlopen(url,timeout=30).read())
print('Vazirmatn ready.')
