import re

def normalize_text(text: str) -> str:
    """Removes excessive whitespace and common OCR noise."""
    if not text:
        return ""
    
    # Replace null bytes
    text = text.replace('\x00', '')
    # Replace 3 or more newlines with double newline (paragraph boundary)
    text = re.sub(r'\n{3,}', '\n\n', text)
    # Replace multiple spaces with a single space
    text = re.sub(r' {2,}', ' ', text)
    # Strip leading/trailing whitespace
    return text.strip()

def chunk_text(text: str, max_chunk_size: int = 1000, overlap: int = 150) -> list[str]:
    """
    Chunks text by paragraph, then sentence, falling back to character limits.
    """
    text = normalize_text(text)
    if not text:
        return []

    chunks = []
    current_chunk = ""

    # Split by paragraphs
    paragraphs = text.split('\n\n')

    for para in paragraphs:
        para = para.strip()
        if not para:
            continue
        
        # 1. Paragraph fits completely
        if len(current_chunk) + len(para) + 2 <= max_chunk_size:
            current_chunk = current_chunk + "\n\n" + para if current_chunk else para
            continue

        # 2. Paragraph doesn't fit, finalize current chunk if exists
        if current_chunk:
            chunks.append(current_chunk.strip())
            # Get overlap from the end of current_chunk, snapped to a space if possible
            overlap_text = current_chunk[-overlap:]
            space_idx = overlap_text.find(' ')
            if space_idx != -1:
                overlap_text = overlap_text[space_idx+1:]
            current_chunk = overlap_text

        # 3. Handle the new paragraph which might be huge itself
        # Try to split by sentences
        sentences = re.split(r'(?<=[.!?])\s+', para)
        
        for sentence in sentences:
            if not sentence:
                continue
                
            if len(current_chunk) + len(sentence) + 1 <= max_chunk_size:
                current_chunk = current_chunk + " " + sentence if current_chunk else sentence
            else:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                    
                    overlap_text = current_chunk[-overlap:]
                    space_idx = overlap_text.find(' ')
                    if space_idx != -1:
                        overlap_text = overlap_text[space_idx+1:]
                    current_chunk = overlap_text
                
                # If a single sentence is STILL larger than max_chunk_size, brute-force chop it
                while len(sentence) > max_chunk_size:
                    part = sentence[:max_chunk_size]
                    chunks.append((current_chunk + " " + part).strip())
                    
                    # Next iteration context
                    current_chunk = part[-overlap:]
                    space_idx = current_chunk.find(' ')
                    if space_idx != -1:
                        current_chunk = current_chunk[space_idx+1:]
                        
                    sentence = sentence[max_chunk_size:]
                
                if sentence:
                    current_chunk = current_chunk + " " + sentence if current_chunk else sentence

    if current_chunk:
        chunks.append(current_chunk.strip())

    return chunks
