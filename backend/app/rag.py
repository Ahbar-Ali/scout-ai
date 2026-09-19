from pathlib import Path
import os
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from dotenv import load_dotenv
from google import genai


DOCUMENTS_DIR = Path(__file__).resolve().parent.parent / "documents"

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

client = genai.Client(api_key=GEMINI_API_KEY)

EMBEDDING_MODEL = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)


def load_pdf(file_name: str):
    file_path = DOCUMENTS_DIR / file_name

    loader = PyPDFLoader(str(file_path))
    documents = loader.load()

    return documents


def chunk_documents(documents):
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
    )

    chunks = text_splitter.split_documents(documents)

    return chunks


def create_vector_store(chunks):
    vector_store = Chroma.from_documents(
        documents=chunks,
        embedding=EMBEDDING_MODEL,
    )

    return vector_store


def search_documents(vector_store, question: str, k: int = 3):
    results = vector_store.similarity_search(
        question,
        k=k,
    )

    return results

def ask_document(vector_store, question: str, history=None):
    history = history or []

    conversation_history = "\n".join(
        f"{message.role.upper()}: {message.content}"
        for message in history
    )
    
    relevant_chunks = search_documents(
        vector_store,
        question,
        k=3,
    )

    context = "\n\n---\n\n".join(
        chunk.page_content
        for chunk in relevant_chunks
    )

    prompt = f"""
        You are ScoutAI, a football analysis assistant.

        Answer the user's question using only the information
        from the retrieved document sections below.

        Use the conversation history to understand follow-up questions
        and references such as "that", "it", or "what about defensively".

        The conversation history is only context.
        Factual claims must still be supported by the retrieved document sections.

        Rules:
        - Do not invent information.
        - If the retrieved sections do not contain enough information, say so.
        - Give a clear football-focused answer.

        CONVERSATION HISTORY:

        {conversation_history}

        RETRIEVED DOCUMENT SECTIONS:

        {context}

        USER QUESTION:

        {question}
        """

    interaction = client.interactions.create(
        model="gemini-3.6-flash",
        input=prompt,
    )

    return interaction.output_text


_vector_store = None
_active_document = None


def index_document(file_name: str):
    global _vector_store, _active_document

    print(f"Indexing document: {file_name}")

    documents = load_pdf(file_name)
    chunks = chunk_documents(documents)

    if not chunks:
        raise ValueError("No readable text was found in this PDF.")

    _vector_store = create_vector_store(chunks)
    _active_document = file_name

    print(f"Vector store ready with {len(chunks)} chunks")

    return len(chunks)


def get_vector_store():
    if _vector_store is None:
        raise ValueError("No document has been uploaded yet.")

    return _vector_store


def ask_rag(question: str, history=None):
    vector_store = get_vector_store()

    return ask_document(
        vector_store=vector_store,
        question=question,
        history=history,
    )