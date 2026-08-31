import requests
import json

url = 'http://localhost:8000/analyze-image'
image_path = r'c:\Users\Rashmalai\Desktop\Web dev\Project Gen Ai Social\backend\uploads\387535e0f2ff4bfda46f1e7912e08d8d.png'

with open(image_path, 'rb') as f:
    files = {'file': ('test.png', f, 'image/png')}
    response = requests.post(url, files=files)

print("Status:", response.status_code)
try:
    print("Response:", json.dumps(response.json(), indent=2))
except:
    print("Response Text:", response.text)
