from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.football_data import get_match_shots, get_shot_map
from app.current_football import (
    api_key_loaded,
    get_fixtures_for_date,
    get_sidebar_fixtures,
    get_fixture_statistics,
    get_fixture_lineups,
    get_fixture_players,
    get_fixture_events,
    find_team_matches,
    )
from app.ai import ask_match_ai_with_tools
from pydantic import BaseModel
from app.cache import init_cache
from app.graph import scoutai_graph
from fastapi import UploadFile, File, HTTPException
from pathlib import Path
from app.rag import index_document
from app.rag import  ask_rag

class ChatMessage(BaseModel):
    role: str
    content: str


class MatchAIRequest(BaseModel):
    fixture_id: int
    question: str
    history: list[ChatMessage] = []

class DocumentMessage(BaseModel):
    role: str
    content: str


class DocumentQuestionRequest(BaseModel):
    question: str
    history: list[DocumentMessage] = []



app = FastAPI(
    title="ScoutAI API",
    description="Backend API for the ScoutAI football intelligence platform",
    version="0.1.0",
)

init_cache()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "message": "ScoutAI API is running"
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "ok"
    }

@app.get("/api/matches/{match_id}/shots")
def match_shots(match_id: int):
    return get_match_shots(match_id)

@app.get("/api/football/status")
def football_api_status():
    return {
        "api_football_key_loaded": api_key_loaded()
    }

@app.get("/api/current/fixtures/{match_date}")
def current_fixtures(match_date: str):
    return get_fixtures_for_date(match_date)

@app.get("/api/current/sidebar/{match_date}")
def current_sidebar_fixtures(match_date: str):
    return get_sidebar_fixtures(match_date)


@app.get("/api/current/fixtures/{fixture_id}/statistics")
def current_fixture_statistics(fixture_id: int):
    return get_fixture_statistics(fixture_id)

@app.get("/api/current/fixtures/{fixture_id}/lineups")
def current_fixture_lineups(fixture_id: int):
    return get_fixture_lineups(fixture_id)

@app.get("/api/current/fixtures/{fixture_id}/players")
def current_fixture_players(fixture_id: int):
    return get_fixture_players(fixture_id)

@app.get("/api/current/fixtures/{fixture_id}/events")
def current_fixture_events(fixture_id: int):
    return get_fixture_events(fixture_id)

@app.get("/api/current/team-matches")
def current_team_matches(
    team: str,
    from_date: str,
    to_date: str,
):
    return find_team_matches(
        team_name=team,
        from_date=from_date,
        to_date=to_date,
    )

@app.post("/api/ai/chat")
def match_ai(request: MatchAIRequest):
    result = scoutai_graph.invoke(
        {
            "fixture_id": request.fixture_id,
            "question": request.question,
            "history": request.history,
            "route": "",
            "answer": "",
        }
    )

    return {
        "answer": result["answer"],
    }


DOCUMENTS_DIR = Path(__file__).resolve().parent.parent / "documents"


@app.post("/api/documents/upload")
async def upload_document(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported.",
        )

    file_path = DOCUMENTS_DIR / file.filename

    contents = await file.read()
    file_path.write_bytes(contents)

    try:
        chunk_count = index_document(file.filename)
    except Exception as error:
        if file_path.exists():
            file_path.unlink()

        raise HTTPException(
            status_code=400,
            detail=f"Could not process PDF: {str(error)}",
        )

    return {
        "filename": file.filename,
        "chunks": chunk_count,
        "message": "Document uploaded and indexed successfully.",
    }

@app.post("/api/documents/ask")
def ask_document(request: DocumentQuestionRequest):
    try:
        answer = ask_rag(
            question=request.question,
            history=request.history,
        )

        return {
            "answer": answer
        }

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

@app.get("/api/deep/{match_id}/shots")
def deep_shots(match_id: int):
    shots = get_shot_map(match_id)

    return {
        "match_id": match_id,
        "shots": shots,
    }