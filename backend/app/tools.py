from app.current_football import (
    get_fixture_statistics,
    get_fixture_lineups,
    get_fixture_players,
    get_fixture_events,
)


def get_match_statistics(fixture_id: int):
    """Get team-level statistics for a football match."""
    return get_fixture_statistics(fixture_id)


def get_match_lineups(fixture_id: int):
    """Get starting lineups and formations for a football match."""
    return get_fixture_lineups(fixture_id)


def get_match_players(fixture_id: int):
    """Get individual player statistics for a football match."""
    return get_fixture_players(fixture_id)


def get_match_events(fixture_id: int):
    """Get match events such as goals, substitutions, cards and VAR events."""
    return get_fixture_events(fixture_id)