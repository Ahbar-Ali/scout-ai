from statsbombpy import sb

MATCH_ID = 3930160

events = sb.events(match_id=MATCH_ID)

shots = events[events["type"] == "Shot"]

print("Total shots:", len(shots))
print()

print(
    shots[
        [
            "minute",
            "team",
            "player",
            "location",
            "shot_statsbomb_xg",
            "shot_outcome",
        ]
    ].to_string(index=False)
)