import os
import requests
from dotenv import load_dotenv
from app.cache import get_cached_data, save_cached_data
from datetime import datetime, timedelta

load_dotenv()

API_KEY = os.getenv("API_FOOTBALL_KEY")

BASE_URL = "https://v3.football.api-sports.io"

HEADERS = {
    "x-apisports-key": API_KEY
}

fixture_cache = {}
statistics_cache = {}
lineup_cache = {}
player_stats_cache = {}
event_cache = {}
team_matches_cache = {}

def api_key_loaded():
    return API_KEY is not None


def get_fixtures_for_date(match_date: str):
    if match_date in fixture_cache:
        print(f"Using cached fixtures for {match_date}")
        return fixture_cache[match_date]

    response = requests.get(
        f"{BASE_URL}/fixtures",
        headers=HEADERS,
        params={"date": match_date},
        timeout=10,
    )

    response.raise_for_status()

    data = response.json()

    fixtures = []

    for match in data["response"]:
        fixtures.append(
            {
                "fixture_id": match["fixture"]["id"],
                "date": match["fixture"]["date"],
                "status": match["fixture"]["status"]["short"],

                "competition": match["league"]["name"],
                "country": match["league"]["country"],
                "round": match["league"]["round"],

                "home_team": match["teams"]["home"]["name"],
                "home_logo": match["teams"]["home"]["logo"],

                "away_team": match["teams"]["away"]["name"],
                "away_logo": match["teams"]["away"]["logo"],

                "home_score": match["goals"]["home"],
                "away_score": match["goals"]["away"],
            }
        )

    result = {
        "date": match_date,
        "count": len(fixtures),
        "fixtures": fixtures,
    }

    fixture_cache[match_date] = result

    return result

def get_sidebar_fixtures(match_date: str):
    data = get_fixtures_for_date(match_date)

    preferred_competitions = {
        ("Premier League", "England"),
        ("La Liga", "Spain"),
        ("Serie A", "Italy"),
        ("Bundesliga", "Germany"),
        ("Ligue 1", "France"),
        ("UEFA Champions League", "World"),
    }

    filtered_fixtures = [
        fixture
        for fixture in data["fixtures"]
        if (fixture["competition"], fixture["country"]) in preferred_competitions
    ]

    return {
        "date": match_date,
        "count": len(filtered_fixtures),
        "fixtures": filtered_fixtures,
    }

def get_fixture_statistics(fixture_id: int):
    if fixture_id in statistics_cache:
        print(f"Using RAM cached statistics for fixture {fixture_id}")
        return statistics_cache[fixture_id]

    cache_key = f"statistics:{fixture_id}"
    cached_data = get_cached_data(cache_key)

    if cached_data is not None:
        print(f"Using SQLite cached statistics for fixture {fixture_id}")

        # Also restore it into RAM for faster future access
        statistics_cache[fixture_id] = cached_data

        return cached_data

    
    print(f"Fetching statistics from API-Football for fixture {fixture_id}")

    response = requests.get(
        f"{BASE_URL}/fixtures/statistics",
        headers=HEADERS,
        params={"fixture": fixture_id},
        timeout=10,
    )

    response.raise_for_status()
    data = response.json()

    result = {
        "fixture_id": fixture_id,
        "statistics": data["response"],
    }

    statistics_cache[fixture_id] = result
    save_cached_data(cache_key, result)

    return result


def get_fixture_lineups(fixture_id: int):
    if fixture_id in lineup_cache:
        print(f"Using RAM cached lineups for fixture {fixture_id}")
        return lineup_cache[fixture_id]

    cache_key = f"lineups:{fixture_id}"
    cached_data = get_cached_data(cache_key)

    if cached_data is not None:
        print(f"Using SQLite cached lineups for fixture {fixture_id}")
        lineup_cache[fixture_id] = cached_data
        return cached_data

    print(f"Fetching lineups from API-Football for fixture {fixture_id}")

    response = requests.get(
        f"{BASE_URL}/fixtures/lineups",
        headers=HEADERS,
        params={"fixture": fixture_id},
        timeout=10,
    )

    response.raise_for_status()
    data = response.json()

    result = {
        "fixture_id": fixture_id,
        "lineups": data["response"],
    }

    lineup_cache[fixture_id] = result
    save_cached_data(cache_key, result)

    return result

def get_fixture_players(fixture_id: int):
    if fixture_id in player_stats_cache:
        print(f"Using RAM cached player stats for fixture {fixture_id}")
        return player_stats_cache[fixture_id]

    cache_key = f"players:{fixture_id}"
    cached_data = get_cached_data(cache_key)

    if cached_data is not None:
        print(f"Using SQLite cached player stats for fixture {fixture_id}")
        player_stats_cache[fixture_id] = cached_data
        return cached_data

    print(f"Fetching player stats from API-Football for fixture {fixture_id}")

    response = requests.get(
        f"{BASE_URL}/fixtures/players",
        headers=HEADERS,
        params={"fixture": fixture_id},
        timeout=10,
    )

    response.raise_for_status()
    data = response.json()

    result = {
        "fixture_id": fixture_id,
        "players": data["response"],
    }

    # 4. Save to both caches
    player_stats_cache[fixture_id] = result
    save_cached_data(cache_key, result)

    return result

def get_fixture_events(fixture_id: int):
    if fixture_id in event_cache:
        print(f"Using RAM cached events for fixture {fixture_id}")
        return event_cache[fixture_id]

    cache_key = f"events:{fixture_id}"
    cached_data = get_cached_data(cache_key)

    if cached_data is not None:
        print(f"Using SQLite cached events for fixture {fixture_id}")
        event_cache[fixture_id] = cached_data
        return cached_data

    print(f"Fetching events from API-Football for fixture {fixture_id}")

    response = requests.get(
        f"{BASE_URL}/fixtures/events",
        headers=HEADERS,
        params={"fixture": fixture_id},
        timeout=10,
    )

    response.raise_for_status()
    data = response.json()

    result = {
        "fixture_id": fixture_id,
        "events": data["response"],
    }

    # 4. Save to both caches
    event_cache[fixture_id] = result
    save_cached_data(cache_key, result)

    return result

def find_team_matches(
    team_name: str,
    from_date: str,
    to_date: str,
):
    normalized_team = team_name.strip().lower()

    cache_key = (
        f"team_matches:{normalized_team}:"
        f"{from_date}:{to_date}"
    )

    if cache_key in team_matches_cache:
        print(f"Using RAM cached matches for {team_name}")
        return team_matches_cache[cache_key]

    cached_data = get_cached_data(cache_key)

    if cached_data is not None:
        print(f"Using SQLite cached matches for {team_name}")
        team_matches_cache[cache_key] = cached_data
        return cached_data

    print(f"Searching matches for {team_name}")

    start = datetime.strptime(from_date, "%Y-%m-%d")
    end = datetime.strptime(to_date, "%Y-%m-%d")

    matches = []
    current = start

    while current <= end:
        date_string = current.strftime("%Y-%m-%d")

        fixture_data = get_fixtures_for_date(date_string)

        for match in fixture_data["fixtures"]:
            home_team = match["home_team"]
            away_team = match["away_team"]

            if (
                normalized_team in home_team.lower()
                or normalized_team in away_team.lower()
            ):
                matches.append(match)

        current += timedelta(days=1)

    result = {
        "team": team_name,
        "from_date": from_date,
        "to_date": to_date,
        "count": len(matches),
        "matches": matches,
    }

    team_matches_cache[cache_key] = result
    save_cached_data(cache_key, result)

    return result