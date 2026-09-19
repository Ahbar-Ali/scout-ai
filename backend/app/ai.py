import os
from dotenv import load_dotenv
from google import genai
import json
from app.current_football import (
    get_fixture_statistics,
    get_fixture_lineups,
    get_fixture_players,
    get_fixture_events,
)
from app.tools import (
    get_match_statistics,
    get_match_lineups,
    get_match_players,
    get_match_events,
)


load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

client = genai.Client(api_key=GEMINI_API_KEY)

TOOL_FUNCTIONS = {
    "get_match_statistics": get_match_statistics,
    "get_match_lineups": get_match_lineups,
    "get_match_players": get_match_players,
    "get_match_events": get_match_events,
}

MATCH_TOOLS = [
    {
        "type": "function",
        "name": "get_match_statistics",
        "description": "Get team-level match statistics such as possession, shots, passes, corners, fouls and other team statistics.",
        "parameters": {
            "type": "object",
            "properties": {
                "fixture_id": {
                    "type": "integer",
                    "description": "The API-Football fixture ID."
                }
            },
            "required": ["fixture_id"],
        },
    },
    {
        "type": "function",
        "name": "get_match_lineups",
        "description": "Get the starting lineups, substitutes and formations for both teams in a match.",
        "parameters": {
            "type": "object",
            "properties": {
                "fixture_id": {
                    "type": "integer",
                    "description": "The API-Football fixture ID."
                }
            },
            "required": ["fixture_id"],
        },
    },
    {
        "type": "function",
        "name": "get_match_players",
        "description": "Get individual player statistics such as ratings, goals, assists, shots, passes and minutes played.",
        "parameters": {
            "type": "object",
            "properties": {
                "fixture_id": {
                    "type": "integer",
                    "description": "The API-Football fixture ID."
                }
            },
            "required": ["fixture_id"],
        },
    },
    {
        "type": "function",
        "name": "get_match_events",
        "description": "Get match events such as goals, substitutions, cards and VAR events.",
        "parameters": {
            "type": "object",
            "properties": {
                "fixture_id": {
                    "type": "integer",
                    "description": "The API-Football fixture ID."
                }
            },
            "required": ["fixture_id"],
        },
    },
]

def test_tool_choice(fixture_id: int, question: str):
    interaction = client.interactions.create(
        model="gemini-3.6-flash",
        input=f"""
    You are ScoutAI.

    The user is asking about football fixture {fixture_id}.

    Use the available tools when match data is needed to answer the question.

    Question:
    {question}
    """,
            tools=MATCH_TOOLS,
    )

    for step in interaction.steps:
        if step.type == "function_call":
            print("TOOL CHOSEN:", step.name)
            print("ARGUMENTS:", step.arguments)

    return interaction


def ask_match_ai_with_tools(fixture_id: int, question: str, history=None):
    history = history or []

    conversation_history = "\n".join(
        f"{message.role.upper()}: {message.content}"
        for message in history
    )

    interaction = client.interactions.create(
        model="gemini-3.6-flash",
        input=f"""
            You are ScoutAI, a football match analysis assistant.

            The user is asking about fixture {fixture_id}.

            Use the available match tools to retrieve the data needed to answer the question.

            Rules:
            - Use only the tools necessary to answer the question.
            - You may use multiple tools if the question requires multiple kinds of match data.
            - Do not invent match facts.
            - Only make factual match claims supported by tool results.
            - If the available tools cannot provide enough information, say so clearly.
            - Use the conversation history to understand follow-up references such as
              "he", "that player", "they", "that team", or "the previous goal".
            - Conversation history is context only and must not replace factual match data.
            - Give clear, football-focused answers.

            TACTICAL ANALYSIS RULES:
            When the user asks about tactics, strategy, managerial approach,
            formations, attacking style, defensive style, or why a team performed
            a certain way:

            - Use the available match tools to gather relevant evidence.
            - Use lineups to identify formations and starting personnel.
            - Use match statistics for possession, passing, shots and other
              available performance indicators.
            - Use events to understand goals, substitutions, cards and the
              progression of the match.
            - Use player statistics when individual roles or performances are relevant.
            - You may interpret tactical patterns from this evidence, but clearly
              distinguish observed match data from tactical interpretation.
            - Do not claim to know a manager's intentions unless the provided data
              explicitly establishes them.
            - Do not invent pressing intensity, defensive line height, passing
              networks, off-ball movement, or other unavailable information.
            - When comparing the two teams' tactical approaches, gather evidence
              for both teams before reaching a conclusion.

            CONVERSATION HISTORY:
            {conversation_history if conversation_history else "No previous conversation."}

            CURRENT USER QUESTION:
            {question}
            """,
        tools=MATCH_TOOLS,
    )
    for _ in range(5):
        function_calls = [
            step
            for step in interaction.steps
            if step.type == "function_call"
        ]

        if not function_calls:
            return interaction.output_text

        function_results = []

        for function_call in function_calls:
            tool_function = TOOL_FUNCTIONS.get(function_call.name)

            if tool_function is None:
                raise ValueError(
                    f"Unknown ScoutAI tool: {function_call.name}"
                )

            print(f"ScoutAI chose tool: {function_call.name}")
            print(f"Tool arguments: {function_call.arguments}")

            tool_result = tool_function(**function_call.arguments)

            function_results.append(
                {
                    "type": "function_result",
                    "name": function_call.name,
                    "call_id": function_call.id,
                    "result": [
                        {
                            "type": "text",
                            "text": json.dumps(tool_result),
                        }
                    ],
                }
            )

        interaction = client.interactions.create(
            model="gemini-3.6-flash",
            previous_interaction_id=interaction.id,
            input=function_results,
            tools=MATCH_TOOLS,
        )

    return (
        "ScoutAI could not complete the analysis "
        "within the allowed number of tool steps."
    )

def synthesize_match_and_document(
    question: str,
    match_analysis: str,
    document_analysis: str,
):
    prompt = f"""
        You are ScoutAI, a football intelligence assistant.

        The user asked a question that requires both:
        1. information about the selected football match
        2. information from an uploaded football document

        You have already received analysis from both sources.

        USER QUESTION:
        {question}

        MATCH EVIDENCE:
        {match_analysis}

        DOCUMENT EVIDENCE:
        {document_analysis}

        Create one clear, unified answer to the user's question.

        Rules:
        - Use only the evidence provided above.
        - Do not invent statistics, tactics, formations, or document claims.
        - Clearly distinguish match evidence from document evidence when necessary.
        - If the document does not contain information needed for a direct comparison, say so.
        - Do not claim the document is unavailable if document evidence is provided.
        - Do not force a comparison when the evidence does not support one.
        - Focus directly on the user's football question.
        """

    interaction = client.interactions.create(
        model="gemini-3.6-flash",
        input=prompt,
    )

    return interaction.output_text