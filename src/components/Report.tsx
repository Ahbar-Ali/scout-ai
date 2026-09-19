import {useRef, useState } from 'react'

import '../styles/reports.css'
import ReactMarkdown from 'react-markdown'

const API_URL = import.meta.env.VITE_API_URL


type ReportMessage = {
  role: 'user' | 'assistant'
  content: string
}

function Reports() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState<ReportMessage[]>([])
  const [asking, setAsking] = useState(false)
  const [questionError, setQuestionError] = useState('')
 


  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]

    if (!file) return

    if (file.type !== 'application/pdf') {
      setError('Please select a PDF file.')
      return
    }

    setUploading(true)
    setError('')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch(
        `${API_URL}/api/documents/upload`,
        {
          method: 'POST',
          body: formData,
        }
      )

      if (!response.ok) {
        throw new Error('Failed to upload PDF')
      }

      const data = await response.json()

      setUploadedFile(data.filename)
      setQuestion('')
      setMessages([])
      setQuestionError('')

    } catch (error) {
      console.error('PDF upload error:', error)
      setError('ScoutAI could not process this PDF.')
    } finally {
      setUploading(false)
    }
  }

  const askReport = async () => {
    const trimmedQuestion = question.trim()

    if (!trimmedQuestion || asking) return

    setMessages((previous) => [
        ...previous,
        {
        role: 'user',
        content: trimmedQuestion,
        },
    ])

    setQuestion('')
    setAsking(true)
    setQuestionError('')

    try {
        const response = await fetch(
        `${API_URL}/api/documents/ask`,
        {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            },
            body: JSON.stringify({
            question: trimmedQuestion,
            history: messages,
            }),
        }
        )

        if (!response.ok) {
        throw new Error('Failed to analyze document')
        }

        const data = await response.json()

        setMessages((previous) => [
        ...previous,
        {
            role: 'assistant',
            content: data.answer,
        },
        ])
    } catch (error) {
        console.error('Document question error:', error)
        setQuestionError('ScoutAI could not analyze this document.')
    } finally {
        setAsking(false)
    }
    }

  return (
    <div className="reports-page">

      <div className="reports-header">
        <span className="reports-label">
          DOCUMENT INTELLIGENCE
        </span>

        <h1>Reports</h1>

        <p>
          Upload scouting, tactical, or match reports and analyze them
          with ScoutAI.
        </p>
      </div>

      <div className="reports-upload-card">

        <div className="upload-icon">↑</div>

        <h2>Upload Match Report</h2>

        <p>
          Upload a PDF to make it available to ScoutAI.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileUpload}
          hidden
        />

        <button
          className="upload-button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? 'Processing...' : 'Choose PDF'}
        </button>

        <span className="upload-hint">
          PDF files only
        </span>

        {uploadedFile && (
          <div className="upload-success">
            <strong>✓ {uploadedFile}</strong>
            <span>Ready for ScoutAI</span>
          </div>
        )}

        {error && (
          <div className="upload-error">
            {error}
          </div>
        )}

      </div>

      {uploadedFile && (
  <div className="report-analysis-card">

    <div className="report-analysis-header">
      <span className="reports-label">
        SCOUTAI DOCUMENT ANALYSIS
      </span>

      <h2>Ask about this report</h2>

      <p>
        ScoutAI will answer using information retrieved
        from {uploadedFile}.
      </p>
    </div>

    
    <div className="report-conversation">
                {messages.map((message, index) => (
                    <div
                    key={index}
                    className={`report-answer ${
                        message.role === 'user' ? 'report-user-message' : ''
                    }`}
                    >
                    <span>
                        {message.role === 'user' ? 'YOU' : 'SCOUTAI'}
                    </span>

                    <div className="report-answer-content">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                    </div>
                ))}

                {asking && (
                    <div className="report-answer">
                    <span>SCOUTAI</span>

                    <div className="report-answer-content">
                        <p>Analyzing document...</p>
                    </div>
                    </div>
                )}
                </div>

                <div className="report-question-input">
                <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Ask ScoutAI about this report..."
                    disabled={asking}
                    onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        askReport()
                    }
                    }}
                />

                <button
                    onClick={askReport}
                    disabled={asking || !question.trim()}
                >
                    {asking ? 'Analyzing...' : 'Ask ScoutAI'}
                </button>
                </div>

            {questionError && (
            <div className="upload-error">
                {questionError}
            </div>
            )}

        </div>
        )}

    </div>
  )
}

export default Reports