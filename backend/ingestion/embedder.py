import logging
from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)

class Embedder:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(Embedder, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance
        
    def _initialize(self):
        # We use a lightweight, fast model that works well for English sentences and paragraphs.
        # all-MiniLM-L6-v2 outputs a 384-dimensional dense vector.
        self.model_name = "all-MiniLM-L6-v2"
        logger.info(f"Loading embedding model {self.model_name}...")
        try:
            self.model = SentenceTransformer(self.model_name)
            logger.info("Embedding model loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load embedding model: {e}")
            self.model = None

    def embed_text(self, text: str) -> list[float]:
        """
        Generates a dense vector embedding for the given text.
        """
        if not self.model or not text.strip():
            return []
            
        try:
            # The model encodes text to a numpy array; we convert it to a flat list of floats.
            vector = self.model.encode(text)
            return vector.tolist()
        except Exception as e:
            logger.error(f"Error embedding text: {e}")
            return []

# Singleton instance to be imported by other modules
document_embedder = Embedder()
