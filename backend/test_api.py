import requests

# Test using a valid image if possible, or just upload a small dummy file
url = 'http://localhost:8000/analyze-image'
files = {'file': ('dummy.png', b'dummy content', 'image/png')}
response = requests.post(url, files=files)
print(response.status_code)
print(response.text)
