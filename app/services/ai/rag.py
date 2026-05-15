"""
RAG (Retrieval-Augmented Generation) service.
Indexes business knowledge bases and retrieves relevant context for the AI agent.
"""
import uuid
from app.config import get_settings

settings = get_settings()


class RAGService:
    """Backed by ChromaDB (local) for development, Pinecone in production."""

    def __init__(self):
        self._collection_prefix = "business_kb_"

    def _collection_name(self, business_id: uuid.UUID) -> str:
        return f"{self._collection_prefix}{str(business_id).replace('-', '_')}"

    def _get_collection(self, business_id: uuid.UUID):
        import chromadb
        client = chromadb.HttpClient(host=settings.chroma_host, port=settings.chroma_port)
        return client.get_or_create_collection(self._collection_name(business_id))

    async def index_document(
        self,
        business_id: uuid.UUID,
        document_id: str,
        content: str,
        metadata: dict | None = None,
    ) -> None:
        collection = self._get_collection(business_id)
        collection.upsert(
            documents=[content],
            metadatas=[{"business_id": str(business_id), **(metadata or {})}],
            ids=[document_id],
        )

    async def retrieve_context(
        self,
        business_id: uuid.UUID,
        query: str,
        n_results: int = 3,
    ) -> str:
        collection = self._get_collection(business_id)
        results = collection.query(query_texts=[query], n_results=n_results)
        docs = results.get("documents", [[]])[0]
        if not docs:
            return ""
        return "\n\n".join(docs)

    async def delete_document(self, business_id: uuid.UUID, document_id: str) -> None:
        collection = self._get_collection(business_id)
        collection.delete(ids=[document_id])

    async def list_documents(self, business_id: uuid.UUID) -> list[dict]:
        collection = self._get_collection(business_id)
        result = collection.get()
        docs = []
        for doc_id, doc, meta in zip(result["ids"], result["documents"], result["metadatas"]):
            docs.append({"id": doc_id, "content": doc[:200], "metadata": meta})
        return docs
