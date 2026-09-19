from statsbombpy import sb


def get_match_shots(match_id: int):
    events = sb.events(match_id=match_id)

    shots = events[events["type"] == "Shot"]

    shot_list = []

    for _, shot in shots.iterrows():
        location = shot["location"]

        shot_list.append(
            {
                "player": shot["player"],
                "team": shot["team"],
                "minute": int(shot["minute"]),
                "x": float(location[0]),
                "y": float(location[1]),
                "xg": float(shot["shot_statsbomb_xg"]),
                "outcome": shot["shot_outcome"],
            }
        )

    team_xg = (
        shots.groupby("team")["shot_statsbomb_xg"]
        .sum()
        .to_dict()
    )

    team_xg = {
        team: float(xg)
        for team, xg in team_xg.items()
    }

    return {
        "match_id": match_id,
        "shots": shot_list,
        "team_xg": team_xg,
    }

def get_shot_map(match_id: int):
    events = sb.events(match_id=match_id)

    shots = events[events["type"] == "Shot"]

    shot_data = []

    for _, shot in shots.iterrows():
        location = shot["location"]

        if not isinstance(location, list) or len(location) < 2:
            continue

        shot_data.append({
            "player": shot["player"],
            "team": shot["team"],
            "minute": int(shot["minute"]),
            "x": float(location[0]),
            "y": float(location[1]),
            "xg": float(shot["shot_statsbomb_xg"]),
            "outcome": shot["shot_outcome"],
        })

    return shot_data