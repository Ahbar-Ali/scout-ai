type Player = {
  name: string
  number: number
  position: string
  x: number
  y: number
}

type Substitute = {
  name: string
  number: number
}

type FormationPitchProps = {
  teamName: string
  formation: string
  players: Player[]
  manager: string
  substitutes: Substitute[]
}

function FormationPitch({
  teamName,
  formation,
  players,
  manager,
  substitutes,
}: FormationPitchProps) {
  return (
    <div className="team-formation">

      <div className="team-formation-header">
        <div>
          <p className="team-name">{teamName}</p>
          <span>Starting XI</span>
        </div>

        <span className="formation">
          {formation}
        </span>
      </div>

      <div className="formation-pitch">
        <div className="pitch-halfway"></div>
        <div className="pitch-center-circle"></div>

        <div className="penalty-box top-box"></div>
        <div className="penalty-box bottom-box"></div>

        {players.map((player) => (
          <div
            className="formation-player"
            key={player.number}
            style={{
              left: `${player.x}%`,
              top: `${player.y}%`,
            }}
          >
            <div className="player-marker">
              {player.number}
            </div>

            <span>{player.name}</span>
          </div>
        ))}
      </div>

      <div className="team-details">

     <div className="manager-row">
        <div>
        <p className="detail-label">MANAGER</p>
        <strong>{manager}</strong>
        </div>
     </div>

     <div className="bench-section">
        <p className="detail-label">SUBSTITUTES</p>
        <div className="substitutes-grid">
        {substitutes.map((player) => (
            <div
            className="substitute"
            key={player.number}
            >
            <span className="sub-number">
                {player.number}
            </span>

            <span>{player.name}</span>
            </div>
        ))}
        </div>
     </div>
    </div>
 </div>
 
  )
}

export default FormationPitch