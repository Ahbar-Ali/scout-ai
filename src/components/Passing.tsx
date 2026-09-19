type PassingPlayer = {
  id: number
  name: string
  number: number
  x: number
  y: number
  touches: number
}

type PassingConnection = {
  from: number
  to: number
  passes: number
}

type PassingNetworkProps = {
  teamName: string
  players: PassingPlayer[]
  connections: PassingConnection[]
}

function PassingNetwork({
  teamName,
  players,
  connections,
}: PassingNetworkProps) {
  const getPlayer = (id: number) =>
    players.find((player) => player.id === id)

  return (
    <div className="passing-network-card">

      <div className="passing-network-header">
        <div>
          <p className="card-label">PASSING NETWORK</p>
          <h3>{teamName}</h3>
        </div>

        <div className="passing-legend">
          <span>Line thickness = pass frequency</span>
        </div>
      </div>

      <div className="passing-pitch">

        <svg
          className="passing-lines"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {connections.map((connection, index) => {
            const from = getPlayer(connection.from)
            const to = getPlayer(connection.to)

            if (!from || !to) return null

            return (<line key={index} x1={from.x} y1={from.y}x2={to.x}
                y2={to.y} className="pass-connection"
                style={{ strokeWidth: Math.max(0.5,connection.passes / 8),
                }}
              />
            )
          })}
        </svg>

        <div className="passing-halfway"></div>
        <div className="passing-center-circle"></div>

        {players.map((player) => (
          <div
            key={player.id}
            className="passing-player"
            style={{
              left: `${player.x}%`,
              top: `${player.y}%`,
            }}
          >
            <div
              className="passing-player-marker"
              style={{
                width: `${28 + player.touches / 5}px`,
                height: `${28 + player.touches / 5}px`,
              }}
            >
              {player.number}
            </div>

            <span>{player.name}</span>
          </div>
        ))}

      </div>

    </div>
  )
}

export default PassingNetwork