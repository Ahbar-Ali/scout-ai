type Player = {
  id: number
  name: string
  number: number
  position: string
  touches: number
  passAccuracy: number
  progressivePasses: number
  recoveries: number
  shots: number
  chancesCreated: number
}

type PlayerListProps = {
  teamName: string
  players: Player[]
  selectedPlayerId?: number
  onSelectPlayer: (player: Player) => void
}

function PlayerList({
  teamName,
  players,
  selectedPlayerId,
  onSelectPlayer,
}: PlayerListProps) {
  return (
    <div className="player-list-card">
      <div className="player-list-header">
        <h3>{teamName}</h3>
        <span>Starting XI</span>
      </div>

      <div className="player-list">
        {players.map((player) => (
          <button
            key={player.id}
            className={`player-row ${
              selectedPlayerId === player.id ? 'selected' : ''
            }`}
            onClick={() => onSelectPlayer(player)}
          >
            <div className="player-avatar">
              {player.number}
            </div>

            <div className="player-name">
              <strong>{player.name}</strong>
              <span>{player.position}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

export default PlayerList