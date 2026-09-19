from typing import TypedDict
from app.rag import ask_rag
from langgraph.graph import StateGraph, START, END
from app.ai import (
    ask_match_ai_with_tools,
    synthesize_match_and_document,
)
from app.websearch import search_web


class ScoutAIState(TypedDict):
    fixture_id: int
    question: str
    history: list
    route: str
    answer: str

def router(state: ScoutAIState):
    question = state["question"].lower()

    document_keywords = [
        "document",
        "pdf",
        "paper",
        "report",
        "research",
        "uploaded",
        "according to",
    ]

    match_keywords = [
        "match",
        "game",
        "team",
        "player",
        "shots",
        "possession",
        "passes",
        "passing",
        "lineup",
        "formation",
        "goal",
        "goals",
        "statistics",
        "stats",
        "performance",
    ]

    web_keywords = [
        "latest",
        "recent",
        "news",
        "today",
        "currently",
        "current",
        "injury",
        "injuries",
        "transfer",
        "transfers",
        "rumour",
        "rumours",
        "reported",
    ]

    uses_document = any(
        keyword in question
        for keyword in document_keywords
    )

    uses_match = any(
        keyword in question
        for keyword in match_keywords
    )

    uses_web = any(keyword in question for keyword in web_keywords)

    if uses_document and uses_match:
        route = "both"
    elif uses_document:
        route = "rag"
    elif uses_web:
        route = "web"
    else:
        route = "match"

    print(f"Routing question: {state['question']}")
    print(f"Route selected: {route}")

    return {"route": route}

def match_agent(state: ScoutAIState):
    """
    Analyze a match using ScoutAI's existing Gemini tool-calling agent.
    """

    answer = ask_match_ai_with_tools(
        fixture_id=state["fixture_id"],
        question=state["question"],
        history=state.get("history", []),
    )

    return {
        "answer": answer,
    }

def rag_agent(state: ScoutAIState):
    """
    Answer questions using the uploaded football document.
    """

    print("Running RAG agent")

    answer = ask_rag(
        question=state["question"],
        history=state.get("history", []),
    )
    return {
        "answer": answer,
    }

def combined_agent(state: ScoutAIState):
    """
    Answer questions that need both match data
    and the uploaded football document.
    """

    print("Running combined match + RAG agent")

    match_answer = ask_match_ai_with_tools(
        fixture_id=state["fixture_id"],
        question=state["question"],
        history=state.get("history", []),
    )

    document_answer = ask_rag(
        question=state["question"],
        history=state.get("history", []),
    )

    answer = synthesize_match_and_document(
        question=state["question"],
        match_analysis=match_answer,
        document_analysis=document_answer,
    )

    return {
        "answer": answer,
    }

def web_agent(state: ScoutAIState):
    print("Running web research agent")

    answer = search_web(
        question=state["question"],
    )

    return {"answer": answer}

builder = StateGraph(ScoutAIState)

builder.add_node("router", router)
builder.add_node("match_agent", match_agent)
builder.add_node("rag_agent", rag_agent)
builder.add_node("combined_agent", combined_agent)
builder.add_node("web_agent", web_agent)

builder.add_edge(START, "router")

builder.add_conditional_edges(
    "router",
    lambda state: state["route"],
    {
        "match": "match_agent",
        "rag": "rag_agent",
        "both": "combined_agent",
        "web": "web_agent",
    },
)

builder.add_edge("match_agent", END)
builder.add_edge("rag_agent", END)
builder.add_edge("combined_agent", END)
builder.add_edge("web_agent", END)

scoutai_graph = builder.compile()