import os
import requests

class DocumentParser:
    def __init__(self):
        # Default to the local docker container we will spin up
        self.tika_url = os.environ.get("TIKA_URL", os.environ.get("TIKA_SERVER_URL", "http://localhost:9998"))

    def parse_document(self, file_bytes: bytes, filename: str) -> dict:
        """
        Sends document to Tika Server for parsing.
        Extracts raw text and metadata.
        """
        try:
            # 1. Get Text
            # Note: Tika's default /tika endpoint gives full text.
            # To get true page-level output we normally use the /rmeta/text endpoint
            # which returns a JSON array of metadata/text chunks per page/part.
            headers = {
                "Accept": "application/json"
            }
            response = requests.put(
                f"{self.tika_url}/rmeta/text",
                data=file_bytes,
                headers=headers
            )
            response.raise_for_status()
            
            # rmeta returns a list of dictionaries (one per embedded resource/page usually)
            rmeta_data = response.json()
            
            full_text = ""
            pages = []
            
            for index, part in enumerate(rmeta_data):
                content = part.get("X-TIKA:content", "").strip()
                if content:
                    full_text += content + "\n\n"
                    pages.append({
                        "part_num": index + 1,
                        "text": content,
                        "metadata": {k: v for k, v in part.items() if not k.startswith("X-TIKA:content")}
                    })
                    
            # Fallback metadata from the first block (main document)
            main_meta = rmeta_data[0] if rmeta_data else {}
            
            return {
                "full_text": full_text.strip(),
                "pages": pages,
                "page_count": len(pages),
                "author": main_meta.get("dc:creator", "Unknown"),
                "creation_date": main_meta.get("dcterms:created", ""),
                "content_type": main_meta.get("Content-Type", ""),
            }
            
        except Exception as e:
            print(f"[Parser] Tika extraction failed: {e}")
            raise
