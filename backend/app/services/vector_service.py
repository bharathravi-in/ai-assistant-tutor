"""
Vector Service - Qdrant integration for semantic search
"""
import os
from typing import List, Optional, Dict, Any
from qdrant_client import QdrantClient
from qdrant_client.http import models
from qdrant_client.http.models import Distance, VectorParams, PointStruct
import hashlib

# Configuration
QDRANT_HOST = os.getenv("QDRANT_HOST", "qdrant")
QDRANT_PORT = int(os.getenv("QDRANT_PORT", 6333))
COLLECTION_NAME = "teacher_content"
VECTOR_SIZE = 384  # For all-MiniLM-L6-v2 model


class VectorService:
    """Service for managing vector embeddings in Qdrant."""
    
    def __init__(self):
        self._client: Optional[QdrantClient] = None
        self._model = None
        self._initialized = False
    
    @property
    def client(self) -> QdrantClient:
        """Lazy-load Qdrant client."""
        if self._client is None:
            try:
                self._client = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)
                self._ensure_collection()
            except Exception as e:
                print(f"⚠️ Qdrant connection failed: {e}")
                raise
        return self._client
    
    def _get_embedding_model(self):
        """Lazy-load sentence transformer model."""
        if self._model is None:
            try:
                from sentence_transformers import SentenceTransformer
                self._model = SentenceTransformer('all-MiniLM-L6-v2')
                print("✅ Sentence transformer model loaded")
            except Exception as e:
                print(f"⚠️ Failed to load embedding model: {e}")
                raise
        return self._model
    
    def _ensure_collection(self):
        """Create collection if it doesn't exist."""
        try:
            collections = self.client.get_collections()
            collection_names = [c.name for c in collections.collections]
            
            if COLLECTION_NAME not in collection_names:
                self.client.create_collection(
                    collection_name=COLLECTION_NAME,
                    vectors_config=VectorParams(
                        size=VECTOR_SIZE,
                        distance=Distance.COSINE
                    )
                )
                print(f"✅ Created Qdrant collection: {COLLECTION_NAME}")
            else:
                print(f"✅ Qdrant collection exists: {COLLECTION_NAME}")
            
            self._initialized = True
        except Exception as e:
            print(f"⚠️ Collection setup failed: {e}")
            self._initialized = False
    
    def _generate_point_id(self, content_id: int) -> str:
        """Generate stable point ID from content ID."""
        return hashlib.md5(f"content_{content_id}".encode()).hexdigest()
    
    def _create_embedding(self, text: str) -> List[float]:
        """Generate embedding from text."""
        model = self._get_embedding_model()
        embedding = model.encode(text, convert_to_numpy=True)
        return embedding.tolist()
    
    async def index_content(
        self,
        content_id: int,
        title: str,
        description: str,
        content_type: str,
        grade: Optional[int] = None,
        subject: Optional[str] = None,
        topic: Optional[str] = None,
        tags: Optional[List[str]] = None
    ) -> str:
        """
        Index content in Qdrant for semantic search.
        
        Returns:
            qdrant_id: The point ID in Qdrant
        """
        # Combine text for embedding
        text_parts = [title, description]
        if topic:
            text_parts.append(topic)
        if subject:
            text_parts.append(subject)
        if tags:
            text_parts.extend(tags)
        
        combined_text = " ".join(filter(None, text_parts))
        
        # Generate embedding
        embedding = self._create_embedding(combined_text)
        
        # Create point ID
        point_id = self._generate_point_id(content_id)
        
        # Upsert to Qdrant
        self.client.upsert(
            collection_name=COLLECTION_NAME,
            points=[
                PointStruct(
                    id=point_id,
                    vector=embedding,
                    payload={
                        "content_id": content_id,
                        "title": title,
                        "content_type": content_type,
                        "grade": grade,
                        "subject": subject,
                        "topic": topic,
                        "tags": tags or []
                    }
                )
            ]
        )
        
        print(f"✅ Indexed content {content_id} in Qdrant")
        return point_id
    
    async def search_content(
        self,
        query: str,
        content_type: Optional[str] = None,
        grade: Optional[int] = None,
        subject: Optional[str] = None,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Semantic search for content.
        
        Returns:
            List of dicts with content_id and score
        """
        try:
            # Generate query embedding
            query_embedding = self._create_embedding(query)
            
            # Build filter conditions
            filter_conditions = []
            if content_type:
                filter_conditions.append(
                    models.FieldCondition(
                        key="content_type",
                        match=models.MatchValue(value=content_type)
                    )
                )
            if grade:
                filter_conditions.append(
                    models.FieldCondition(
                        key="grade",
                        match=models.MatchValue(value=grade)
                    )
                )
            if subject:
                filter_conditions.append(
                    models.FieldCondition(
                        key="subject",
                        match=models.MatchValue(value=subject)
                    )
                )
            
            # Create filter
            query_filter = None
            if filter_conditions:
                query_filter = models.Filter(must=filter_conditions)
            
            # Search
            results = self.client.search(
                collection_name=COLLECTION_NAME,
                query_vector=query_embedding,
                query_filter=query_filter,
                limit=limit
            )
            
            return [
                {
                    "content_id": hit.payload["content_id"],
                    "title": hit.payload.get("title"),
                    "score": hit.score
                }
                for hit in results
            ]
            
        except Exception as e:
            print(f"⚠️ Search failed: {e}")
            return []
    
    async def search_similar(
        self,
        query_text: str,
        limit: int = 5,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Search for similar content with full payload.
        
        Args:
            query_text: Search query
            limit: Max results
            filters: Optional filters (grade, subject, etc.)
        
        Returns:
            List of dicts with score and full payload
        """
        try:
            # Generate query embedding
            query_embedding = self._create_embedding(query_text)
            
            # Build filter conditions from dict
            filter_conditions = []
            if filters:
                for key, value in filters.items():
                    if value is not None:
                        filter_conditions.append(
                            models.FieldCondition(
                                key=key,
                                match=models.MatchValue(value=value)
                            )
                        )
            
            # Create filter
            query_filter = None
            if filter_conditions:
                query_filter = models.Filter(must=filter_conditions)
            
            # Search
            results = self.client.search(
                collection_name=COLLECTION_NAME,
                query_vector=query_embedding,
                query_filter=query_filter,
                limit=limit
            )
            
            return [
                {
                    "id": hit.id,
                    "score": hit.score,
                    "payload": hit.payload
                }
                for hit in results
            ]
            
        except Exception as e:
            print(f"⚠️ RAG search failed: {e}")
            return []
    
    async def delete_content(self, content_id: int) -> bool:
        """Remove content from Qdrant index."""
        try:
            point_id = self._generate_point_id(content_id)
            self.client.delete(
                collection_name=COLLECTION_NAME,
                points_selector=models.PointIdsList(points=[point_id])
            )
            print(f"✅ Deleted content {content_id} from Qdrant")
            return True
        except Exception as e:
            print(f"⚠️ Delete failed: {e}")
            return False
    
    def is_available(self) -> bool:
        """Check if Qdrant is available."""
        try:
            self.client.get_collections()
            return True
        except:
            return False


# Singleton instance
vector_service = VectorService()
