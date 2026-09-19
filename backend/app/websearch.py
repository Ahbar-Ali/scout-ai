import os

from dotenv import load_dotenv
from google import genai


load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

client = genai.Client(api_key=GEMINI_API_KEY)


def search_web(question: str):
    interaction = client.interactions.create(
        model="gemini-3.6-flash",
        input=f"""
        You are ScoutAI's football web research assistant.

        Search the web for up-to-date information needed to answer
        the user's question.

        USER QUESTION:
        {question}

        Rules:
        - Focus on football-related information.
        - Use current web information when relevant.
        - Do not invent facts.
        - Prefer reliable and primary sources when available.
        - Clearly distinguish reported facts from interpretation.
        - Give a concise, useful answer.
        """,
        tools=[
            {"type": "google_search"}
        ],
    )

    answer = interaction.output_text
    sources = []

    for step in interaction.steps:
        if step.type == "model_output":
            for content_block in step.content:
                if content_block.type == "text" and content_block.annotations:
                    for annotation in content_block.annotations:
                        if annotation.type == "url_citation":
                            source = {
                                "title": annotation.title,
                                "url": annotation.url,
                            }

                            if source not in sources:
                                sources.append(source)

    if sources:
        answer += "\n\n### Sources\n"

        for index, source in enumerate(sources[:5], start=1):
            answer += (
                f"\n{index}. "
                f"[{source['title']}]({source['url']})"
            )

    return answer