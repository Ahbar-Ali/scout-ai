# ⚽ ScoutAI — Agentic Football Intelligence Platform

ScoutAI is a full-stack AI-powered football analytics platform that combines match data, tactical analysis, document retrieval, and agentic AI to provide intelligent insights about football matches.

The platform allows users to explore match statistics and visualizations, upload football reports for retrieval-based analysis, and ask ScoutAI questions that are dynamically routed to the appropriate data or AI tool.

## Features

- Interactive football match dashboard
- Match statistics including xG, shots, possession, and passing
- Shot-map and tactical visualizations
- Player and match analysis
- AI-powered match Q&A
- Agentic query routing with LangGraph
- Retrieval-Augmented Generation (RAG) over uploaded football reports
- Semantic document retrieval using vector embeddings
- LLM tool calling for structured match data and document retrieval
- Web research for questions requiring external information
- Caching for repeated AI queries and retrieval results

## AI Architecture

ScoutAI uses a LangGraph workflow to determine how a user's question should be answered.

Depending on the query, the agent can route requests to:

1. **Match Data Tools** — retrieves structured statistics and match information
2. **Document RAG** — searches uploaded football reports using semantic retrieval
3. **Web Research** — retrieves external information when local data is insufficient
4. **LLM Analysis** — combines retrieved context to generate the final response

### RAG Pipeline

Uploaded documents are processed through:

PDF Upload  
→ Text Extraction  
→ Document Chunking  
→ Gemini Embeddings  
→ ChromaDB  
→ Vector Similarity Search  
→ Relevant Context Retrieval  
→ LLM Response

## Tech Stack

### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS

### AI / Backend
- Python
- LangGraph
- LangChain
- Gemini API
- Gemini Embeddings
- ChromaDB

### AI Concepts
- Retrieval-Augmented Generation (RAG)
- Vector Search
- Semantic Retrieval
- LLM Tool Calling
- Conditional Agent Routing
- Prompt Engineering

## Running Locally

### Frontend

```bash
cd frontend
npm install
npm run dev
