import { useState } from 'react'
import { useEffect} from 'react'
import './styles/App.css'
import './styles/statistics.css'
import './styles/shots.css'
import './styles/passing.css'
import './styles/players.css'
import './styles/ai-anlaysis.css'
import FormationPitch from './components/Formation.tsx'
import PlayerDetails from './components/PlayerDetails.tsx'
import ReactMarkdown from 'react-markdown'
import Reports from './components/Report'
import remarkGfm from 'remark-gfm'


type CurrentFixture = {
  fixture_id: number
  date: string
  status: string
  competition: string
  country: string
  round: string
  home_team: string
  home_logo: string
  away_team: string
  away_logo: string
  home_score: number | null
  away_score: number | null
}

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}


const API_URL = import.meta.env.VITE_API_URL

function App() {
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedPlayer, setSelectedPlayer] = useState<any | null>(null)
  const [backendStatus, setBackendStatus] = useState('Checking...')
  const [currentFixtures, setCurrentFixtures] = useState<CurrentFixture[]>([])
  const [selectedFixture, setSelectedFixture] = useState<CurrentFixture | null>(null)
  const [fixtureStats, setFixtureStats] = useState<any[]>([])
  const [selectedDate, setSelectedDate] = useState('2026-09-18')
  const [statsLoading, setStatsLoading] = useState(false)
  const [fixtureLineups, setFixtureLineups] = useState<any[]>([])
  const [lineupsLoading, setLineupsLoading] = useState(false)
  const [fixturePlayers, setFixturePlayers] = useState<any[]>([])
  const [playersLoading, setPlayersLoading] = useState(false) 
  const [fixtureEvents, setFixtureEvents] = useState<any[]>([])
  const [aiQuestion, setAiQuestion] = useState('')
  const [aiMessages, setAiMessages] = useState<ChatMessage[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [activePage, setActivePage] = useState<'matches' | 'players' | 'reports'>('matches')
  const [aiDocument, setAiDocument] = useState<string | null>(null)
  const [documentUploading, setDocumentUploading] = useState(false)
  const [documentError, setDocumentError] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    fetch(`${API_URL}/api/health`)
      .then((response) => response.json())
      .then((data) => {
        setBackendStatus(data.status)
      })
      .catch((error) => {
        console.error('Backend connection failed:', error)
        setBackendStatus('offline')
      })
  }, [])


  useEffect(() => {
    if (!selectedFixture) {
      setFixtureStats([])
      return
    }

    setFixtureStats([])
    setStatsLoading(true)

    fetch(
      `${API_URL}/api/current/fixtures/${selectedFixture.fixture_id}/statistics`
    )

      .then((response) => response.json())
      .then((data) => {
        setFixtureStats(data.statistics)
      })
      .catch((error) => {
        console.error('Failed to load match statistics:', error)
        setFixtureStats([])
      })
      .finally(() => {
        setStatsLoading(false)
      })
  }, [selectedFixture])

  useEffect(() => {
      fetch(`${API_URL}/api/current/sidebar/${selectedDate}`)
      .then((response) => response.json())
      .then((data) => {
        console.log('FIXTURES:', data.fixtures)
        setCurrentFixtures(data.fixtures)

        if (data.fixtures.length > 0) {
          setSelectedFixture(data.fixtures[0])
        } else {
          setSelectedFixture(null)
        }
      })
      .catch((error) => {
        console.error('Failed to load current fixtures:', error)
      })
  }, [selectedDate])

  useEffect(() => {
    if (!selectedFixture) {
      setFixtureLineups([])
      return
    }

    setFixtureLineups([])
    setLineupsLoading(true)

    fetch(
      `${API_URL}/api/current/fixtures/${selectedFixture.fixture_id}/lineups`
    )
      .then((response) => response.json())
      .then((data) => {
        console.log('MATCH LINEUPS:', data.lineups)
        setFixtureLineups(data.lineups)
      })
      .catch((error) => {
        console.error('Failed to load match lineups:', error)
        setFixtureLineups([])
      })
      .finally(() => {
        setLineupsLoading(false)
      })
  }, [selectedFixture])

  useEffect(() => {
    if (!selectedFixture) {
      setFixturePlayers([])
      return
    }

    setFixturePlayers([])
    setPlayersLoading(true)
    fetch(
      `${API_URL}/api/current/fixtures/${selectedFixture.fixture_id}/players`
    )
      .then((response) => response.json())
      .then((data) => {
        console.log('MATCH PLAYERS:', data.players)
        setFixturePlayers(data.players)
      })
      .catch((error) => {
        console.error('Failed to load player statistics:', error)
        setFixturePlayers([])
      })
      .finally(() => {
        setPlayersLoading(false)
      })
  }, [selectedFixture])

  useEffect(() => {
    if (!selectedFixture) {
      setFixtureEvents([])
      return
    }

    setFixtureEvents([])

    fetch(
      `${API_URL}/api/current/fixtures/${selectedFixture.fixture_id}/events`
    )
      .then((response) => response.json())
      .then((data) => {
        console.log('MATCH EVENTS:', data.events)
        setFixtureEvents(data.events)
      })
      .catch((error) => {
        console.error('Failed to load match events:', error)
        setFixtureEvents([])
      })
  }, [selectedFixture])

  useEffect(() => {
    setAiMessages([])
    setAiQuestion('')
    setAiError('')
  }, [selectedFixture?.fixture_id])


    const getStat = (
    teamStats: any,
    statName: string
  ) => {
    return (
      teamStats?.statistics?.find(
        (stat: any) => stat.type === statName
      )?.value ?? '—'
    )
  }

  const getNumericStat = (teamStats: any, statName: string) => {
    const value = getStat(teamStats, statName)

    if (value === '—' || value === null) {
      return 0
    }

    if (typeof value === 'string') {
      return Number(value.replace('%', '')) || 0
    }

    return Number(value) || 0
  }

  
  const homeStats = fixtureStats.find(
    (team) => team.team.name === selectedFixture?.home_team
  )

  const awayStats = fixtureStats.find(
    (team) => team.team.name === selectedFixture?.away_team
  )

  const convertApiPlayers = (startXI: any[]) => {
    if (!startXI) return []

    return startXI.map((item) => {
      const player = item.player

      const [row, column] = player.grid
        .split(':')
        .map(Number)

      const playersInRow = startXI.filter(
        (p) => Number(p.player.grid.split(':')[0]) === row
      ).length

      const x = (column / (playersInRow + 1)) * 100
      const maxRow = Math.max(
        ...startXI.map((p) =>
          Number(p.player.grid.split(':')[0])
        )
      )

      const y = ((row - 1) / Math.max(maxRow - 1, 1)) * 80 + 10

      return {
        name: player.name,
        number: player.number,
        position: player.pos,
        x,
        y,
      }
    })
  }

  const convertApiSubs = (substitutes: any[]) => {
      if (!substitutes) return []

      return substitutes.map((item) => ({
        name: item.player.name,
        number: item.player.number,
      }))
    }


      const goalEvents = fixtureEvents.filter(
      (event) => event.type === 'Goal'
    )

    const homeGoals = goalEvents.filter(
      (event) => event.team.name === selectedFixture?.home_team
    )

    const awayGoals = goalEvents.filter(
      (event) => event.team.name === selectedFixture?.away_team
    )


    const askScoutAI = async () => {
      const question = aiQuestion.trim()

      if (!selectedFixture || !question || aiLoading) return

      setAiMessages((previous) => [
        ...previous,
        {
          role: 'user',
          content: question,
        },
      ])

      setAiQuestion('')
      setAiLoading(true)
      setAiError('')

      try {
        const response = await fetch(`${API_URL}/api/ai/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fixture_id: selectedFixture.fixture_id,
            question: question,
            history: aiMessages,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to get ScoutAI response')
        }

        const data = await response.json()

        setAiMessages((previous) => [
          ...previous,
          {
            role: 'assistant',
            content: data.answer,
          },
        ])
      } catch (error) {
        console.error('ScoutAI error:', error)
        setAiError('ScoutAI could not analyze this match.')
      } finally {
        setAiLoading(false)
      }
    }

    const uploadAiDocument = async (
      event: React.ChangeEvent<HTMLInputElement>
    ) => {
      const file = event.target.files?.[0]

      if (!file) return

      if (file.type !== 'application/pdf') {
        setDocumentError('Please upload a PDF.')
        return
      }

      setDocumentUploading(true)
      setDocumentError('')

      try {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch(
          `${API_URL}/api/documents/upload`,
          {
            method: 'POST',
            body: formData,
          }
        )

        if (!response.ok) {
          throw new Error('Failed to upload document')
        }

        const data = await response.json()

        setAiDocument(data.filename)
      } catch (error) {
        console.error('Document upload error:', error)
        setDocumentError('Could not upload this PDF.')
      } finally {
        setDocumentUploading(false)
      }
    }

  const homeShotsOnTarget = getNumericStat(homeStats, 'Shots on Goal')
  const awayShotsOnTarget = getNumericStat(awayStats, 'Shots on Goal')

  const homeShotsOffTarget = getNumericStat(homeStats, 'Shots off Goal')
  const awayShotsOffTarget = getNumericStat(awayStats, 'Shots off Goal')

  const homeShotsInsideBox = getNumericStat(homeStats, 'Shots insidebox')
  const awayShotsInsideBox = getNumericStat(awayStats, 'Shots insidebox')

  const homeShotsOutsideBox = getNumericStat(homeStats, 'Shots outsidebox')
  const awayShotsOutsideBox = getNumericStat(awayStats, 'Shots outsidebox')

  const homeTotalShots = getNumericStat(homeStats, 'Total Shots')
  const awayTotalShots = getNumericStat(awayStats, 'Total Shots')

  const homeTotalPasses = getNumericStat(homeStats, 'Total passes')
  const awayTotalPasses = getNumericStat(awayStats, 'Total passes')

  const homeAccuratePasses = getNumericStat(homeStats, 'Passes accurate')
  const awayAccuratePasses = getNumericStat(awayStats, 'Passes accurate')

  const calculatePercentage = (value: number, total: number) => {
    if (total === 0) return 0

    return Math.round((value / total) * 100)
  }

  const homeShotAccuracy = calculatePercentage(
    homeShotsOnTarget,
    homeTotalShots
  )

  const awayShotAccuracy = calculatePercentage(
    awayShotsOnTarget,
    awayTotalShots
  )

  const homeInsideBoxPercentage = calculatePercentage(
    homeShotsInsideBox,
    homeTotalShots
  )

  const awayInsideBoxPercentage = calculatePercentage(
    awayShotsInsideBox,
    awayTotalShots
  )

  const homeOutsideBoxPercentage = calculatePercentage(
    homeShotsOutsideBox,
    homeTotalShots
  )

  const awayOutsideBoxPercentage = calculatePercentage(
    awayShotsOutsideBox,
    awayTotalShots
  )


  const homePassAccuracy = calculatePercentage(
    homeAccuratePasses,
    homeTotalPasses
  )

  const awayPassAccuracy = calculatePercentage(
    awayAccuratePasses,
    awayTotalPasses
  )


  return (
    <div className="app">
      <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="brand">
          <div className="brand-icon">S</div>

          <div>
            <h2>ScoutAI</h2>
            <span>Football Intelligence</span>
          </div>
        </div>

        <nav className="navigation">
          <button
            className={`nav-item ${activePage === 'matches' ? 'active' : ''}`}
            onClick={() => {
              setActivePage('matches')
              setMobileMenuOpen(false)
            }}
          >
            Matches
          </button>

          <button
            className={`nav-item ${activePage === 'reports' ? 'active' : ''}`}
            onClick={() => {
              setActivePage('reports')
              setMobileMenuOpen(false)
            }}
          >
            Document Intelligence
          </button>
        </nav>


       <div className="sidebar-section">
          <p className="section-label">CURRENT MATCHES</p>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="match-date-picker"
          />

          {currentFixtures.map((fixture) => (
            <button
              key={fixture.fixture_id}
              className={`match-item ${
                selectedFixture?.fixture_id === fixture.fixture_id ? 'selected' : ''
              }`}

              onClick={() => {
                setSelectedFixture(fixture)
                setActiveTab('overview')
                setMobileMenuOpen(false)
              }}
            >
              <strong>
                {fixture.home_team} vs {fixture.away_team}
              </strong>

              <span>{fixture.competition}</span>
            </button>
          ))}
        </div>
      </aside>

      <div className="mobile-header">
        <button
          className="mobile-menu-button"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open navigation"
        >
          ☰
        </button>

        <div className="mobile-brand">
          <strong>ScoutAI</strong>
          <span>Football Intelligence</span>
        </div>
      </div>

      <main className="dashboard">

        {activePage === 'matches' && (
          <>
            <div className="topbar">
              <div>
                <p className="eyebrow">MATCH ANALYSIS</p>
                <h1>
                  {selectedFixture
                    ? `${selectedFixture.home_team} vs ${selectedFixture.away_team}`
                    : 'Select a match'}
                </h1>
              </div>

          <div className="ai-status">
            <span className="status-dot"></span>
            ScoutAI {backendStatus === 'ok' ? 'Ready' : backendStatus}
          </div>
        </div>

      <section className="match-content">
        <div className="match-heading">
          <div>
            {selectedFixture && (
                <>
                  <p className="competition">
                    {selectedFixture.competition} · {selectedFixture.round}
                  </p>

                  <h2>
                    {selectedFixture.home_team}
                    <span>
                      {selectedFixture.home_score ?? '—'} — {selectedFixture.away_score ?? '—'}
                    </span>
                    {selectedFixture.away_team}
                  </h2>

                  {goalEvents.length > 0 && (
                    <div className="match-scorers">

                      <div className="home-scorers">
                        {homeGoals.map((goal, index) => (
                          <span key={`${goal.player.id}-${goal.time.elapsed}-${index}`}>
                            {goal.player.name} {goal.time.elapsed}'
                            {goal.time.extra ? `+${goal.time.extra}` : ''}
                          </span>
                        ))}
                      </div>

                      <div className="away-scorers">
                        {awayGoals.map((goal, index) => (
                          <span key={`${goal.player.id}-${goal.time.elapsed}-${index}`}>
                            {goal.player.name} {goal.time.elapsed}'
                            {goal.time.extra ? `+${goal.time.extra}` : ''}
                          </span>
                        ))}
                      </div>

                    </div>
                  )}
                    </>
                  )}
              </div>

          <span className="status-badge">
            {selectedFixture?.status === 'NS'
              ? 'UPCOMING'
              : selectedFixture?.status === '1H' ||
                selectedFixture?.status === '2H'
              ? 'LIVE'
              : selectedFixture?.status === 'HT'
              ? 'HALF TIME'
              : selectedFixture?.status === 'FT'
              ? 'FULL TIME'
              : selectedFixture?.status}
          </span>
        </div>

        <div className="match-tabs">
          {['overview', 'shots', 'passing', 'players', 'ai analysis'].map((tab) => (
            <button
              key={tab}
              className={`tab-button ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'ai analysis'
                ? 'AI Analysis'
                : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
        
        <div className="stats-grid">
          <div className="stat-card">
            <p>EXPECTED GOALS</p>
            <div className="stat-values">
              <strong>1.82</strong>
              <span>xG</span>
              <strong>0.91</strong>
            </div>
            <div className="stat-bar">
              <div className="stat-fill xg-fill"></div>
            </div>
          </div>

          <div className="stat-card">
            <p>SHOTS</p>
            <div className="stat-values">
              <span>{getStat(homeStats, 'Total Shots')}</span>
              <span>Shots</span>
              <span>{getStat(awayStats, 'Total Shots')}</span>
            </div>
            <div className="stat-bar">
              <div className="stat-fill shots-fill"></div>
            </div>
          </div>

          <div className="stat-card">
            <p>POSSESSION</p>
            <div className="stat-values">
            <span>{getStat(homeStats, 'Ball Possession')}</span>
             <span>Possession</span>
             <span>{getStat(awayStats, 'Ball Possession')}</span>
            </div>
            <div className="stat-bar">
              <div className="stat-fill possession-fill"></div>
            </div>
          </div>

          <div className="stat-card">
            <p>PASSES</p>
            <div className="stat-values">
              <span>{getStat(homeStats, 'Total passes')}</span>
              <span>Passes</span>
              <span>{getStat(awayStats, 'Total passes')}</span>
            </div>
            <div className="stat-bar">
              <div className="stat-fill passes-fill"></div>
            </div>
          </div>
        </div>

      {activeTab === 'overview' && (
        <div className="lineups-section">
          <p className="card-label">MATCH OVERVIEW</p>

        {statsLoading && (
          <div className="stats-loading">
            Loading match statistics...
          </div>
        )}

          {!statsLoading && homeStats && awayStats && (
            <section className="detailed-stats">
              <h3>Match Statistics</h3>

              <div className="stats-team-header">
                <strong>{selectedFixture?.home_team}</strong>
                <span>STAT</span>
                <strong>{selectedFixture?.away_team}</strong>
              </div>

              {[
                { api: 'Shots on Goal', label: 'Shots on Target' },
                { api: 'Shots off Goal', label: 'Shots off Target' },
                { api: 'Shots insidebox', label: 'Shots Inside Box' },
                { api: 'Shots outsidebox', label: 'Shots Outside Box' },
                { api: 'Corner Kicks', label: 'Corners' },
                { api: 'Offsides', label: 'Offsides' },
                { api: 'Fouls', label: 'Fouls' },
                { api: 'Yellow Cards', label: 'Yellow Cards' },
                { api: 'Red Cards', label: 'Red Cards' },
                { api: 'Total passes', label: 'Total Passes' },
                { api: 'Passes accurate', label: 'Accurate Passes' },
              ].map((stat) => (
                <div className="stat-row" key={stat.api}>
                  <strong>{getStat(homeStats, stat.api)}</strong>
                  <span>{stat.label}</span>
                  <strong>{getStat(awayStats, stat.api)}</strong>
                </div>
              ))}
            </section>
          )}

          <div className="lineups-title">
            <div>
              <h3>Starting Lineups</h3>
            </div>

            <span className="illustrative-label">
              Illustrative data
            </span>
          </div>

          {lineupsLoading && (
            <div className="lineups-loading">
              Loading starting lineups...
            </div>
          )}


        {!lineupsLoading && fixtureLineups.length === 0 && (
          <div className="lineups-unavailable">
            Starting lineups are not available yet.
          </div>
        )}

          {!lineupsLoading && fixtureLineups.length === 2 && (
            <div className="lineups-grid">
              {fixtureLineups.map((lineup) => (
                <FormationPitch
                  key={lineup.team.id}
                  teamName={lineup.team.name}
                  formation={lineup.formation ?? '—'}
                  players={convertApiPlayers(lineup.startXI)}
                  manager={lineup.coach?.name ?? 'Unknown'}
                  substitutes={convertApiSubs(lineup.substitutes)}
                />
              ))}
            </div>
          )}
        </div>
      )}




      {activeTab === 'shots' && (
        <div className="analysis-grid">

          {statsLoading && (
            <div className="stats-loading">
              Loading shot data...
            </div>
          )}

        {!statsLoading && homeStats && awayStats && (
              <div className="shot-summary-card">

                <div className="card-header">
                  <div>
                    <p className="card-label">SHOT ANALYSIS</p>
                    <h3>Shot Breakdown</h3>
                  </div>
                </div>

                <div className="shot-team-header">
                  <strong>{selectedFixture?.home_team}</strong>
                  <span>STAT</span>
                  <strong>{selectedFixture?.away_team}</strong>
                </div>

                {[
                  {
                    label: 'Total Shots',
                    home: homeTotalShots,
                    away: awayTotalShots,
                  },
                  {
                    label: 'On Target',
                    home: homeShotsOnTarget,
                    away: awayShotsOnTarget,
                  },
                  {
                    label: 'Off Target',
                    home: homeShotsOffTarget,
                    away: awayShotsOffTarget,
                  },
                  {
                    label: 'Inside Box',
                    home: homeShotsInsideBox,
                    away: awayShotsInsideBox,
                  },
                  {
                    label: 'Outside Box',
                    home: homeShotsOutsideBox,
                    away: awayShotsOutsideBox,
                  },
                ].map((stat) => (
                  <div className="shot-stat-row" key={stat.label}>
                    <strong>{stat.home}</strong>

                    <div className="shot-stat-middle">
                      <span>{stat.label}</span>

                      <div className="shot-comparison-bar">
                        <div
                          className="shot-bar-home"
                          style={{
                            width: `${
                              stat.home + stat.away === 0
                                ? 50
                                : (stat.home / (stat.home + stat.away)) * 100
                            }%`,
                          }}
                        />

                        <div
                          className="shot-bar-away"
                          style={{
                            width: `${
                              stat.home + stat.away === 0
                                ? 50
                                : (stat.away / (stat.home + stat.away)) * 100
                            }%`,
                          }}
                        />
                      </div>
                    </div>

                    <strong>{stat.away}</strong>
                  </div>
                ))}

              </div>
            )}

          {!statsLoading && homeStats && awayStats && (
            <div className="shot-profile-card">

              <div className="card-header">
                <div>
                  <p className="card-label">EFFICIENCY</p>
                  <h3>Shot Profile</h3>
                </div>
              </div>

              <div className="shot-profile-header">
                <strong>{selectedFixture?.home_team}</strong>
                <span>METRIC</span>
                <strong>{selectedFixture?.away_team}</strong>
              </div>

              {[
                {
                  label: 'Shot Accuracy',
                  home: homeShotAccuracy,
                  away: awayShotAccuracy,
                },
                {
                  label: 'Inside Box',
                  home: homeInsideBoxPercentage,
                  away: awayInsideBoxPercentage,
                },
                {
                  label: 'Outside Box',
                  home: homeOutsideBoxPercentage,
                  away: awayOutsideBoxPercentage,
                },
              ].map((metric) => (
                <div className="shot-profile-row" key={metric.label}>

                  <div className="profile-value">
                    <strong>{metric.home}%</strong>

                    <div className="profile-track">
                      <div
                        className="profile-fill home"
                        style={{ width: `${metric.home}%` }}
                      />
                    </div>
                  </div>

                  <span className="profile-label">
                    {metric.label}
                  </span>

                  <div className="profile-value away">
                    <strong>{metric.away}%</strong>

                    <div className="profile-track">
                      <div
                        className="profile-fill away"
                        style={{ width: `${metric.away}%` }}
                      />
                    </div>
                  </div>

                </div>
              ))}

            </div>
          )}

        </div>
      )}



    {activeTab === 'passing' && (
      <div className="passing-section">

        {statsLoading && (
          <div className="stats-loading">
            Loading passing data...
          </div>
        )}

        {!statsLoading && homeStats && awayStats && (
          <div className="passing-card">

            <div className="card-header">
              <div>
                <p className="card-label">PASSING</p>
                <h3>Passing Breakdown</h3>
              </div>
            </div>

            <div className="passing-team-header">
              <strong>{selectedFixture?.home_team}</strong>
              <span>STAT</span>
              <strong>{selectedFixture?.away_team}</strong>
            </div>

            {[
              {
                label: 'Total Passes',
                home: homeTotalPasses,
                away: awayTotalPasses,
              },
              {
                label: 'Accurate Passes',
                home: homeAccuratePasses,
                away: awayAccuratePasses,
              },
            ].map((stat) => (
              <div className="passing-stat-row" key={stat.label}>
                <strong>{stat.home}</strong>

                <div className="passing-stat-middle">
                  <span>{stat.label}</span>

                  <div className="passing-comparison-bar">
                    <div
                      className="passing-bar-home"
                      style={{
                        width: `${
                          stat.home + stat.away === 0
                            ? 50
                            : (stat.home / (stat.home + stat.away)) * 100
                        }%`,
                      }}
                    />

                    <div
                      className="passing-bar-away"
                      style={{
                        width: `${
                          stat.home + stat.away === 0
                            ? 50
                            : (stat.away / (stat.home + stat.away)) * 100
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <strong>{stat.away}</strong>
              </div>
            ))}

            <div className="passing-accuracy">
              <div>
                <span>PASS ACCURACY</span>
                <strong>{homePassAccuracy}%</strong>
                <small>{selectedFixture?.home_team}</small>
              </div>

              <div>
                <span>PASS ACCURACY</span>
                <strong>{awayPassAccuracy}%</strong>
                <small>{selectedFixture?.away_team}</small>
              </div>
            </div>

          </div>
        )}

      </div>
    )}



   {activeTab === 'players' && (
      <div className="players-section">
        <div className="players-title">
          <div>
            <p className="card-label">PLAYER PERFORMANCE</p>
            <h3>Match Players</h3>
            <p className="players-instruction">
              Click a player to display their match statistics
            </p>
          </div>
        </div>

        {playersLoading && (
          <div className="stats-loading">
            Loading player statistics...
          </div>
        )}

        {!playersLoading && fixturePlayers.length === 0 && (
          <div className="stats-loading">
            Player statistics are unavailable for this match.
          </div>
        )}

        {!playersLoading && fixturePlayers.length > 0 && (
          <div className="player-teams-grid">
            {fixturePlayers.map((teamData) => (
              <div
                className="player-team"
                key={teamData.team.id}
              >
                <div className="player-team-header">
                  <img
                    src={teamData.team.logo}
                    alt={teamData.team.name}
                  />

                  <h4>{teamData.team.name}</h4>
                </div>

                <div className="player-list">
                  {teamData.players.map((playerData: any) => {
                    const player = playerData.player
                    const stats = playerData.statistics?.[0]

                    return (
                      <button
                        className="player-row"
                        key={player.id}
                        onClick={() =>
                          setSelectedPlayer({
                            ...player,
                            stats,
                          })
                        }
                      >
                        <div className="player-row-info">
                          <img
                            src={player.photo}
                            alt={player.name}
                            className="player-photo"
                          />

                          <div>
                            <strong>{player.name}</strong>
                            <span>
                              {stats?.games?.position ?? '—'}
                            </span>
                          </div>
                        </div>

                        <div className="player-row-rating">
                          <span>RATING</span>
                          <strong>
                            {stats?.games?.rating ?? '—'}
                          </strong>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

    {selectedPlayer && (
      <div className="player-modal-overlay">
        <div className="player-modal">
          <button
            className="player-modal-close"
            onClick={() => setSelectedPlayer(null)}
            aria-label="Close player details"
          >
            ×
          </button>

          <PlayerDetails player={selectedPlayer} />
        </div>
      </div>
    )}
  </div>
)}

  {activeTab === 'ai analysis' && (
      <div className="ai-analysis-section">
        <div className="ai-analysis-header">
          <p className="card-label">
            SCOUTAI INTELLIGENCE
          </p>
          <h3>Ask ScoutAI</h3>
          <p>
            Ask questions about{' '}
            <strong>
              {selectedFixture?.home_team} vs{' '}
              {selectedFixture?.away_team}
            </strong>
          </p>
        </div>
        <div className="ai-document">
          <div className="ai-document-info">

            <span className="ai-document-label">
              TACTICAL REPORT
            </span>

            {aiDocument ? (
              <span className="ai-document-name">
                ✓ {aiDocument}
              </span>
            ) : (
              <span className="ai-document-empty">
                Add a PDF for document-grounded analysis
              </span>
            )}

          </div>

          <label className="ai-document-button">
            {documentUploading
              ? 'Uploading...'
              : '+ Add PDF'}

            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={uploadAiDocument}
              disabled={documentUploading}
              hidden
            />
          </label>
        </div>

        {documentError && (
          <p className="ai-document-error">
            {documentError}
          </p>
        )}
        <div className="ai-chat">

          {aiMessages.length === 0 && !aiLoading && (
            <div className="ai-welcome">

              <div className="ai-icon">
                AI
              </div>

              <h3>Match Intelligence</h3>

              <p>
                ScoutAI uses match statistics,
                player performances, lineups and events
                to analyze this match.
              </p>

              {aiDocument && (
                <p>
                  You can also ask questions about the
                  uploaded report or compare it with this match.
                </p>
              )}

            </div>
          )}
          {aiMessages.map((message, index) => (
            <div
              key={index}
              className={`chat-message ${
                message.role === 'user'
                  ? 'user-message'
                  : 'scout-message'
              }`}
            >

              <span className="message-label">
                {message.role === 'user'
                  ? 'YOU'
                  : 'SCOUTAI'}
              </span>

              <div className="message-content">
               <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
              </div>

            </div>
          ))}

          {aiLoading && (
            <div className="chat-message scout-message">

              <span className="message-label">
                SCOUTAI
              </span>

              <p>Analyzing...</p>

            </div>
          )}

          {aiError && (
            <div className="ai-error">
              {aiError}
            </div>
          )}

        </div>
        <div className="ai-input-container">

          <input
            type="text"
            value={aiQuestion}
            onChange={(e) =>
              setAiQuestion(e.target.value)
            }
            placeholder={
              aiDocument
                ? 'Ask about the match or uploaded report...'
                : 'Ask ScoutAI about this match...'
            }
            disabled={aiLoading}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                askScoutAI()
              }
            }}
          />

          <button
            onClick={askScoutAI}
            disabled={
              aiLoading || !aiQuestion.trim()
            }
          >
            {aiLoading
              ? 'Analyzing...'
              : 'Ask ScoutAI'}
          </button>

        </div>

      </div>
    )}

 </section>
 </>
)}
    {activePage === 'reports' && (
    <Reports />
  )}

    </main>
  </div>
  )
}

export default App