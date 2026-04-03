import requests
import os
from dotenv import load_dotenv

load_dotenv()

CLIENT_ID     = os.getenv('STRAVA_CLIENT_ID')
CLIENT_SECRET = os.getenv('STRAVA_CLIENT_SECRET')

# Krok 1 – otwórz ten link w przeglądarce
auth_url = (
    f"https://www.strava.com/oauth/authorize"
    f"?client_id={CLIENT_ID}"
    f"&redirect_uri=http://localhost"
    f"&response_type=code"
    f"&scope=activity:read_all"
)
print("\nOtwórz ten link w przeglądarce:\n")
print(auth_url)
print("\nPo autoryzacji skopiuj kod z URL (parametr 'code=...')")
code = input("\nWklej kod tutaj: ").strip()

# Krok 2 – zamień kod na tokeny
res = requests.post('https://www.strava.com/oauth/token', data={
    'client_id':     CLIENT_ID,
    'client_secret': CLIENT_SECRET,
    'code':          code,
    'grant_type':    'authorization_code',
})

data = res.json()
print("\n✓ Refresh token:")
print(data.get('refresh_token'))
print("\nSkopiuj go do pliku .env jako STRAVA_REFRESH_TOKEN=...")