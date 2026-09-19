type PlayerDetailsProps = {
  player: any
}

function PlayerDetails({ player }: PlayerDetailsProps) {
  const stats = player.stats

  if (!stats) {
    return (
      <div className="player-details">
        <h2>{player.name}</h2>
        <p>No match statistics available.</p>
      </div>
    )
  }

  return (
    <div className="player-details">

      <div className="player-details-header">
        <img
          src={player.photo}
          alt={player.name}
          className="player-details-photo"
        />

        <div>
          <p className="card-label">PLAYER PERFORMANCE</p>
          <h2>{player.name}</h2>

          <div className="player-details-meta">
            <span>
              Position: {stats.games?.position ?? '—'}
            </span>

            <span>
              Minutes: {stats.games?.minutes ?? '—'}
            </span>
          </div>
        </div>

        <div className="player-details-rating">
          <span>RATING</span>
          <strong>{stats.games?.rating ?? '—'}</strong>
        </div>
      </div>

      <div className="player-details-grid">

        <div className="player-detail-stat">
          <span>Goals</span>
          <strong>{stats.goals?.total ?? 0}</strong>
        </div>

        <div className="player-detail-stat">
          <span>Assists</span>
          <strong>{stats.goals?.assists ?? 0}</strong>
        </div>

        <div className="player-detail-stat">
          <span>Total Shots</span>
          <strong>{stats.shots?.total ?? 0}</strong>
        </div>

        <div className="player-detail-stat">
          <span>Shots on Target</span>
          <strong>{stats.shots?.on ?? 0}</strong>
        </div>

        <div className="player-detail-stat">
          <span>Passes</span>
          <strong>{stats.passes?.total ?? 0}</strong>
        </div>

        <div className="player-detail-stat">
          <span>Key Passes</span>
          <strong>{stats.passes?.key ?? 0}</strong>
        </div>

        <div className="player-detail-stat">
          <span>Tackles</span>
          <strong>{stats.tackles?.total ?? 0}</strong>
        </div>

        <div className="player-detail-stat">
          <span>Interceptions</span>
          <strong>{stats.tackles?.interceptions ?? 0}</strong>
        </div>

        <div className="player-detail-stat">
          <span>Duels</span>
          <strong>{stats.duels?.total ?? 0}</strong>
        </div>

        <div className="player-detail-stat">
          <span>Duels Won</span>
          <strong>{stats.duels?.won ?? 0}</strong>
        </div>

        <div className="player-detail-stat">
          <span>Successful Dribbles</span>
          <strong>{stats.dribbles?.success ?? 0}</strong>
        </div>

        <div className="player-detail-stat">
          <span>Yellow Cards</span>
          <strong>{stats.cards?.yellow ?? 0}</strong>
        </div>

      </div>
    </div>
  )
}

export default PlayerDetails