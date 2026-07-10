import json
import urllib.request
import os

with open(r'C:\Users\darsh\.gemini\antigravity\brain\e42c63f4-bb24-46ff-832a-b770b79f7df8\.system_generated\steps\2260\output.txt', 'r', encoding='utf-8') as f:
    data = json.load(f)

for s in data['screens']:
    title = s.get('title', '')
    url = s.get('htmlCode', {}).get('downloadUrl')
    if 'Light Theme' in title and url:
        print(f"Downloading {title}...")
        safe_title = title.replace(' ', '_').replace(':', '')
        urllib.request.urlretrieve(url, f"frontend/{safe_title}.html")
