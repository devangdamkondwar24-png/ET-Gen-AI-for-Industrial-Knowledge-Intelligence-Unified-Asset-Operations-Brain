"""
Confidence Scoring — Determines high/medium/low confidence.
"""
from typing import List, Dict, Any

def calculate_confidence(context_files: List[Dict[str, Any]]) -> tuple[float, str]:
    """
    Calculates confidence based on the pinned thresholds:
    - High: >=3 source files found, at least 2 with FTS rank > 5.0, and >=1 cross-link followed
    - Medium: 1-2 source files found, or files found but weak FTS scores
    - Low: 0 relevant files found
    
    Returns (score: float, label: str)
    """
    num_files = len(context_files)
    if num_files == 0:
        return 0.1, "Low"
        
    strong_hits = sum(1 for cf in context_files if cf.get("rank_score", 0) > 5.0)
    linked_hits = sum(1 for cf in context_files if cf.get("rank_score", 0) == 0.0) # We set rank_score=0 for followed links
    
    if num_files >= 3 and strong_hits >= 2 and linked_hits >= 1:
        return 0.92, "High"
    elif num_files >= 1:
        return 0.65, "Medium"
    else:
        return 0.3, "Low"
