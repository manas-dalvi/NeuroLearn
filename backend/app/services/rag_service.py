# backend/app/services/rag_service.py
import os
import logging
import chromadb
from typing import List, Dict, Any
from app.core.config import settings

logger = logging.getLogger(__name__)


class RagService:
    _instance = None
    _model = None
    _chroma_client = None

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(RagService, cls).__new__(cls, *args, **kwargs)
        return cls._instance

    def __init__(self):
        # Prevent re-initialization if already initialized
        if self._chroma_client is not None:
            return
            
        logger.info("Initializing RAG Service (ChromaDB & Embeddings)...")
        # Ensure ChromaDB persist directory exists
        os.makedirs(settings.CHROMA_DB_PATH, exist_ok=True)
        
        # Initialize persistent ChromaDB client
        self._chroma_client = chromadb.PersistentClient(path=settings.CHROMA_DB_PATH)
        self.collection = self._chroma_client.get_or_create_collection(name="neurolearn_documents")
        logger.info("ChromaDB persistent collection 'neurolearn_documents' initialized.")

    @property
    def model(self):
        if self.__class__._model is None:
            try:
                logger.info(f"Loading embedding model '{settings.EMBEDDING_MODEL}' into memory...")
                from sentence_transformers import SentenceTransformer
                self.__class__._model = SentenceTransformer(settings.EMBEDDING_MODEL)
                logger.info("Embedding model loaded successfully.")
            except Exception as e:
                logger.error(f"Failed to load embedding model '{settings.EMBEDDING_MODEL}': {e}", exc_info=True)
                self.__class__._model = None
        return self.__class__._model

    def add_document(self, session_id: str, chunks: List[Dict[str, Any]]):
        """
        Embed and index chunks belonging to a document/session.
        
        Each chunk is expected to be a dict containing:
        - "id": unique string chunk ID
        - "simplified_text": simplified text content of the chunk
        - "chunk_index": integer index of the chunk
        - "level": reading level string
        """
        if not chunks:
            logger.warning(f"No chunks provided to index for session_id: {session_id}")
            return

        model = self.model
        if model is None:
            logger.error(f"Cannot index document: embedding model is not loaded/available for session {session_id}")
            return

        ids = []
        documents = []
        metadatas = []

        for chunk in chunks:
            chunk_id = chunk["id"]
            text = chunk.get("simplified_text") or chunk.get("original_text") or ""
            if not text.strip():
                continue
            
            ids.append(chunk_id)
            documents.append(text)
            metadatas.append({
                "session_id": session_id,
                "chunk_index": chunk.get("chunk_index", 0),
                "level": chunk.get("level", "intermediate")
            })

        if not ids:
            logger.warning(f"No valid text content found to index for session_id: {session_id}")
            return

        # Generate embeddings using the lazy-loaded model
        logger.info(f"Generating embeddings for {len(documents)} chunks in session {session_id}...")
        try:
            embeddings = model.encode(documents).tolist()
        except Exception as e:
            logger.error(f"Failed to generate embeddings in add_document: {e}", exc_info=True)
            return

        # Add to ChromaDB collection
        self.collection.add(
            ids=ids,
            embeddings=embeddings,
            documents=documents,
            metadatas=metadatas
        )
        logger.info(f"RAG_SERVICE: document indexed. session_id: {session_id}, number of chunks stored: {len(documents)}")

    def query_document(self, session_id: str, query_text: str, n_results: int = 3) -> List[Dict[str, Any]]:
        """
        Query ChromaDB for relevant chunks matching query_text, scoped to a specific session_id.
        """
        if not query_text or not query_text.strip():
            logger.warning(f"Empty or whitespace query provided to query_document for session {session_id}")
            return []

        model = self.model
        if model is None:
            logger.error(f"Cannot query document: embedding model is not loaded/available for session {session_id}")
            return []

        logger.info(f"Querying document context for session {session_id}: '{query_text}'")
        try:
            query_embedding = model.encode([query_text]).tolist()[0]
        except Exception as e:
            logger.error(f"Failed to generate query embedding in query_document: {e}", exc_info=True)
            return []

        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results,
            where={"session_id": session_id}
        )

        output = []
        if results and "documents" in results and results["documents"]:
            docs = results["documents"][0]
            ids = results["ids"][0]
            metas = results["metadatas"][0] if "metadatas" in results and results["metadatas"] else [None] * len(docs)
            distances = results["distances"][0] if "distances" in results and results["distances"] else [None] * len(docs)
            
            for doc, cid, meta, dist in zip(docs, ids, metas, distances):
                output.append({
                    "id": cid,
                    "text": doc,
                    "metadata": meta,
                    "distance": dist
                })
        return output

    def retrieve_context(self, session_id: str, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Retrieve relevant document segments matching the user's query, scoped to the session.
        
        Returns a list of dicts with:
        - "id": the chunk unique ID
        - "text": the chunk document text
        - "score": similarity score (derived from L2 distance)
        - "metadata": the chunk metadata
        """
        if not query or not query.strip():
            logger.warning(f"Empty or whitespace query provided to retrieve_context for session {session_id}")
            return []

        model = self.model
        if model is None:
            logger.error(f"Cannot retrieve context: embedding model is not loaded/available for session {session_id}")
            return []

        logger.info(f"Retrieving context for session {session_id}: '{query}' (top_k={top_k})")
        print(f"RAG_SERVICE: retrieve_context() executed for session {session_id} with query: '{query}' (top_k={top_k})", flush=True)
        try:
            query_embedding = model.encode([query]).tolist()[0]
            logger.info(f"RAG_SERVICE: query embedding created. Query: '{query}'")
        except Exception as e:
            logger.error(f"Failed to generate query embedding in retrieve_context: {e}", exc_info=True)
            return []
        
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            where={"session_id": session_id}
        )
        
        output = []
        if results and "documents" in results and results["documents"]:
            docs = results["documents"][0]
            ids = results["ids"][0]
            metas = results["metadatas"][0] if "metadatas" in results and results["metadatas"] else [None] * len(docs)
            distances = results["distances"][0] if "distances" in results and results["distances"] else [None] * len(docs)
            
            for doc, cid, meta, dist in zip(docs, ids, metas, distances):
                # Convert L2 distance to a similarity score: 1 / (1 + dist)
                score = 1.0 / (1.0 + dist) if dist is not None else 0.0
                output.append({
                    "id": cid,
                    "text": doc,
                    "metadata": meta,
                    "score": score,
                    "distance": dist
                })
        
        # Log retrieved chunk details
        retrieved_ids = [item["id"] for item in output]
        retrieved_scores = [item["score"] for item in output]
        logger.info(f"RAG_SERVICE: retrieved chunk IDs: {retrieved_ids}, similarity scores: {retrieved_scores}")
        return output

    async def generate_rag_response(self, session_id: str, question: str) -> Dict[str, Any]:
        """
        Perform RAG: Retrieve context from ChromaDB, format prompt, query Groq, and return the grounded answer.
        """
        # Validate query
        if not question or not question.strip():
            return {
                "answer": "Please provide a valid question.",
                "retrieved_chunks": [],
                "context_block": "",
                "prompt_sent": ""
            }

        # 1. Retrieve relevant chunks (top 3)
        retrieved_chunks = self.retrieve_context(session_id, question, top_k=3)
        
        # 2. Check if context is found
        if not retrieved_chunks:
            return {
                "answer": "I cannot find the answer in the provided document.",
                "retrieved_chunks": [],
                "context_block": "",
                "prompt_sent": ""
            }

        # 3. Build context block
        context_parts = []
        for idx, chunk in enumerate(retrieved_chunks):
            chunk_idx = chunk['metadata'].get('chunk_index', 'N/A') if chunk.get('metadata') else 'N/A'
            context_parts.append(f"[Context Chunk #{idx + 1} (Source Index {chunk_idx})]:\n{chunk['text']}")
        context_block = "\n\n---\n\n".join(context_parts)

        # 4. Construct prompts
        system_prompt = (
            "You are an expert educational tutor helping a student understand their reading material.\n"
            "Answer the user's question based strictly on the provided document context.\n"
            "If the answer cannot be found or inferred from the context, respond exactly with:\n"
            "\"I cannot find the answer in the provided document.\"\n"
            "Do not use outside knowledge. Keep the explanation simple, clear, and grounded only in the context."
        )
        
        user_prompt = (
            f"Document Context:\n{context_block}\n\n"
            f"Student Question: {question}\n\n"
            f"Provide a grounded answer:"
        )

        prompt_sent = f"SYSTEM: {system_prompt}\n\nUSER: {user_prompt}"

        # 5. Generate answer using Groq or Gemini AIService
        from app.services.ai.factory import get_ai_service
        from app.services.ai.groq import GroqAIService
        from app.services.ai.gemini import GeminiAIService

        ai_service = get_ai_service()
        answer = ""

        # Make sure the provider is Groq/Gemini and has client
        if isinstance(ai_service, GroqAIService) and ai_service.has_client:
            print(f"RAG_SERVICE: Generating RAG response via Groq API (model: {ai_service.model})", flush=True)
            try:
                response = await ai_service.client.chat.completions.create(
                    model=ai_service.model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    temperature=0.1,  # Low temperature for deterministic grounded answers
                )
                answer = response.choices[0].message.content.strip()
            except Exception as e:
                logger.error(f"Error generating RAG response via Groq API: {e}", exc_info=True)
                answer = "Error: Failed to generate response from AI provider."
        elif isinstance(ai_service, GeminiAIService) and ai_service.has_client:
            print("RAG_SERVICE: Generating RAG response via Gemini API", flush=True)
            try:
                import asyncio
                loop = asyncio.get_event_loop()
                full_gemini_prompt = f"{system_prompt}\n\n{user_prompt}"
                response = await loop.run_in_executor(
                    None,
                    lambda: ai_service.model.generate_content(full_gemini_prompt)
                )
                answer = response.text.strip()
            except Exception as e:
                logger.error(f"Error generating RAG response via Gemini API: {e}", exc_info=True)
                answer = "Error: Failed to generate response from AI provider."
        else:
            # Fallback/Mock mode if AI client is unconfigured
            print("RAG_SERVICE: Generating RAG response via Mock/Fallback mode", flush=True)
            logger.warning("No active AI service client configured or active. Using mock generator.")
            # If mock, check if the question mentions any words in the context
            matched = False
            for chunk in retrieved_chunks:
                words = [w.lower().strip(",.?!") for w in question.split()]
                if any(w in chunk['text'].lower() for w in words if len(w) > 3):
                    matched = True
                    break
            
            if matched:
                answer = f"[Mock RAG Answer based on {len(retrieved_chunks)} context chunks]"
            else:
                answer = "I cannot find the answer in the provided document."

        return {
            "answer": answer,
            "retrieved_chunks": retrieved_chunks,
            "context_block": context_block,
            "prompt_sent": prompt_sent
        }


