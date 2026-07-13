"""
Heuristic P&ID Parser using OpenCV.
Extracts topology (circles as vessels/pumps, lines as pipes) from engineering drawings.
"""
import cv2
import numpy as np
import logging

logger = logging.getLogger(__name__)

def parse_pid_heuristic(file_bytes: bytes, filename: str) -> str:
    """
    Reads an image byte stream, uses OpenCV heuristics to find basic topology
    (circles connected by lines), and returns a JSON-like text summary.
    """
    try:
        # Load image from bytes
        nparr = np.frombuffer(file_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)
        
        if img is None:
            return "Error: Could not decode P&ID image for heuristic parsing."

        # Preprocessing
        blurred = cv2.GaussianBlur(img, (5, 5), 0)
        edges = cv2.Canny(blurred, 50, 150)

        # Detect circles (Valves / Pumps / Vessels)
        circles = cv2.HoughCircles(
            blurred, cv2.HOUGH_GRADIENT, dp=1.2, minDist=30,
            param1=50, param2=30, minRadius=10, maxRadius=100
        )

        detected_assets = []
        if circles is not None:
            circles = np.round(circles[0, :]).astype("int")
            for (x, y, r) in circles:
                detected_assets.append({"type": "Vessel/Pump", "x": x, "y": y, "radius": r})

        # Detect lines (Piping)
        lines = cv2.HoughLinesP(
            edges, 1, np.pi / 180, threshold=50,
            minLineLength=40, maxLineGap=10
        )

        detected_pipes = []
        if lines is not None:
            for line in lines:
                x1, y1, x2, y2 = line[0]
                detected_pipes.append({"start": [x1, y1], "end": [x2, y2]})

        # Simple heuristic topology output
        topology_summary = (
            f"Heuristic P&ID Extraction for {filename}:\n"
            f"- Detected {len(detected_assets)} major circular symbols (likely vessels/pumps/valves).\n"
            f"- Detected {len(detected_pipes)} linear pipe segments.\n"
            "Note: This is a heuristic topological extraction, not full symbolic CAD understanding."
        )
        return topology_summary

    except Exception as e:
        logger.error(f"[PIDParser] Failed to parse P&ID: {e}")
        return f"Error during P&ID heuristic extraction: {str(e)}"
