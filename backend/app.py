from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
import requests
import os

load_dotenv()

app = Flask(__name__)
CORS(app)

CLIENT_ID     = os.getenv('STRAVA_CLIENT_ID')
CLIENT_SECRET = os.getenv('STRAVA_CLIENT_SECRET')
REFRESH_TOKEN = os.getenv('STRAVA_REFRESH_TOKEN')

def get_access_token():
    res = requests.post('https://www.strava.com/oauth/token', data={
        'client_id':     CLIENT_ID,
        'client_secret': CLIENT_SECRET,
        'refresh_token': REFRESH_TOKEN,
        'grant_type':    'refresh_token',
    })
    return res.json().get('access_token')

@app.route('/api/activities')
def activities():
    token = get_access_token()
    if not token:
        return jsonify({'error': 'Brak tokenu'}), 401

    per_page = request.args.get('per_page', 10)
    res = requests.get(
        'https://www.strava.com/api/v3/athlete/activities',
        headers={'Authorization': f'Bearer {token}'},
        params={'per_page': per_page}
    )
    data = res.json()

    # Zwróć tylko potrzebne pola
    activities = []
    for a in data:
        activities.append({
            'id':          a.get('id'),
            'name':        a.get('name'),
            'type':        a.get('sport_type'),
            'date':        a.get('start_date_local'),
            'distance':    round(a.get('distance', 0) / 1000, 2),
            'moving_time': a.get('moving_time'),
            'elevation':   round(a.get('total_elevation_gain', 0)),
            'pace':        calc_pace(a.get('moving_time', 0), a.get('distance', 0)),
            'map_url':     a.get('map', {}).get('summary_polyline'),
            'kudos':       a.get('kudos_count', 0),
        })

    return jsonify(activities)

def calc_pace(moving_time, distance):
    if not distance or distance == 0:
        return None
    pace_secs = moving_time / (distance / 1000)
    mins = int(pace_secs // 60)
    secs = int(pace_secs % 60)
    return f'{mins}:{str(secs).padStart(2, "0")}' if False else f'{mins}:{secs:02d}'

@app.route('/api/stats')
def stats():
    token = get_access_token()
    if not token:
        return jsonify({'error': 'Brak tokenu'}), 401

    # Pobierz ID zawodnika
    athlete = requests.get(
        'https://www.strava.com/api/v3/athlete',
        headers={'Authorization': f'Bearer {token}'}
    ).json()

    athlete_id = athlete.get('id')
    res = requests.get(
        f'https://www.strava.com/api/v3/athletes/{athlete_id}/stats',
        headers={'Authorization': f'Bearer {token}'}
    ).json()

    return jsonify({
        'ytd_runs':      res.get('ytd_run_totals', {}).get('count', 0),
        'ytd_distance':  round(res.get('ytd_run_totals', {}).get('distance', 0) / 1000, 1),
        'ytd_elevation': round(res.get('ytd_run_totals', {}).get('elevation_gain', 0)),
        'all_distance':  round(res.get('all_run_totals', {}).get('distance', 0) / 1000, 1),
    })

if __name__ == '__main__':
    app.run(debug=True, port=5001)