import os
import logging
from elasticsearch import Elasticsearch
from elasticsearch.exceptions import ConnectionError

logger = logging.getLogger(__name__)

class DocumentIndexer:
    def __init__(self):
        # Default to local ES in docker, or what's defined in ENV
        es_host = os.environ.get("ELASTICSEARCH_URL", "http://localhost:9200")
        self.es = Elasticsearch(es_host)
        self.index_name = "etgen_documents_v2"
        self._ensure_index()

    def _ensure_index(self):
        """Creates the Elasticsearch index and mapping if it doesn't exist."""
        try:
            if not self.es.indices.exists(index=self.index_name):
                mapping = {
                    "mappings": {
                        "properties": {
                            "chunk_id": {"type": "keyword"},
                            "doc_id": {"type": "keyword"},
                            "plant": {"type": "keyword"},
                            "asset_tag": {"type": "keyword"},
                            "page_number": {"type": "integer"},
                            "chunk_index": {"type": "integer"},
                            "content": {"type": "text"},
                            "source_system": {"type": "keyword"},
                            "chunk_vector": {
                                "type": "dense_vector",
                                "dims": 384,
                                "index": True,
                                "similarity": "cosine"
                            }
                        }
                    }
                }
                self.es.indices.create(index=self.index_name, mappings=mapping["mappings"])
                logger.info(f"Created Elasticsearch index: {self.index_name}")
        except ConnectionError as e:
            logger.warning(f"Could not connect to Elasticsearch at startup: {e}")
        except Exception as e:
            logger.error(f"Error creating index: {e}")

    def index_chunk(self, doc_id: str, plant: str, asset_tag: str, source_system: str, page_number: int, chunk_index: int, content: str, chunk_vector: list[float] = None) -> bool:
        """
        Indexes a single chunk of text into Elasticsearch, optionally with a dense vector.
        """
        if not content or not content.strip():
            return False
            
        chunk_id = f"{doc_id}_chunk_{chunk_index}"
            
        doc = {
            "chunk_id": chunk_id,
            "doc_id": doc_id,
            "plant": plant,
            "asset_tag": asset_tag,
            "source_system": source_system,
            "page_number": page_number,
            "chunk_index": chunk_index,
            "content": content
        }
        
        if chunk_vector:
            doc["chunk_vector"] = chunk_vector
        
        # Use a deterministic ID so re-indexing overwrites rather than duplicates
        try:
            self.es.index(index=self.index_name, id=chunk_id, document=doc)
            return True
        except Exception as e:
            logger.error(f"Failed to index {chunk_id}: {e}")
            return False
