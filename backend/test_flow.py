import requests

BASE_URL = 'http://127.0.0.1:8000'
email = 'admin@hepatoai.com'
password = 'TestPassword123!'

print('1. Requesting OTP...')
res = requests.post(f'{BASE_URL}/api/forgot-password', json={'email': email})
print(res.status_code, res.text)

print('2. Getting OTP from backend log (I will need to check the uvicorn terminal for this...)')
# Wait, I cannot read the uvicorn terminal easily.
