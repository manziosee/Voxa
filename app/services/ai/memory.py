"""
Customer memory layer backed by ChromaDB (local) or Pinecone (production).
Stores and retrieves per-customer history: calls, preferences, complaints.
"""
import uuid
import json
from datetime import datetime
from app.config import get_settings

settings = get_settings()


class CustomerMemoryService:

    def __init__(self):
        self._collection_name = "customer_memory"

    def _get_chroma_collection(self):
        import chromadb
        client = chromadb.HttpClient(host=settings.chroma_host, port=settings.chroma_port)
        return client.get_or_create_collection(self._collection_name)

    async def save_interaction(
        self,
        customer_id: uuid.UUID,
        business_id: uuid.UUID,
        interaction_type: str,
        content: str,
        metadata: dict | None = None,
    ) -> str:
        memory_id = str(uuid.uuid4())
        doc_meta = {
            "customer_id": str(customer_id),
            "business_id": str(business_id),
            "type": interaction_type,
            "timestamp": datetime.utcnow().isoformat(),
            **(metadata or {}),
        }
        collection = self._get_chroma_collection()
        collection.add(
            documents=[content],
            metadatas=[doc_meta],
            ids=[memory_id],
        )
        return memory_id

    async def retrieve_memories(
        self,
        customer_id: uuid.UUID,
        business_id: uuid.UUID,
        query: str,
        n_results: int = 5,
    ) -> list[dict]:
        collection = self._get_chroma_collection()
        results = collection.query(
            query_texts=[query],
            n_results=n_results,
            where={"customer_id": str(customer_id)},
        )
        memories = []
        for doc, meta, dist in zip(
            results["documents"][0],
            results["metadatas"][0],
            results["distances"][0],
        ):
            memories.append({"content": doc, "metadata": meta, "relevance": 1 - dist})
        return memories

    async def get_customer_summary(self, customer_id: uuid.UUID, business_id: uuid.UUID) -> str:
        """Build a natural-language summary of customer history for LLM context injection."""
        memories = await self.retrieve_memories(
            customer_id=customer_id,
            business_id=business_id,
            query="customer history preferences complaints",
            n_results=10,
        )
        if not memories:
            return "No previous interaction history."
        lines = []
        for m in memories:
            ts = m["metadata"].get("timestamp", "")
            interaction_type = m["metadata"].get("type", "interaction")
            lines.append(f"[{ts[:10]}] {interaction_type}: {m['content']}")
        return "\n".join(lines)
