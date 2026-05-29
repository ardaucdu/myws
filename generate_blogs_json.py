import os
import json

blogs_dir = 'blogs'
json_path = 'blogs.json'
repo = 'ardaucdu/myws'

blogs = []
if os.path.exists(blogs_dir):
    for filename in os.listdir(blogs_dir):
        if filename.endswith('.md'):
            blogs.append({
                "name": filename,
                "download_url": f"https://raw.githubusercontent.com/{repo}/main/blogs/{filename}"
            })

with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(blogs, f, indent=2, ensure_ascii=False)
