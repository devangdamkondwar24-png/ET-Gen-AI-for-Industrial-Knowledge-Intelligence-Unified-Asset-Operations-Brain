"""
Seed Neo4j graph with Indian Regulatory Frameworks (Factory Act, OISD, PESO).
Run this to populate the Compliance ontology.
"""
import os
import logging
from graph.neo4j_client import get_neo4j_client, RegulationNode

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

INDIAN_REGS = [
    RegulationNode(
        regulation_id="rg-factory-act-1948",
        title="Factories Act, 1948",
        body="Ministry of Labour and Employment",
        clause="Chapter IV: Safety"
    ),
    RegulationNode(
        regulation_id="rg-oisd-117",
        title="OISD-STD-117",
        body="Oil Industry Safety Directorate",
        clause="Fire Protection Facilities"
    ),
    RegulationNode(
        regulation_id="rg-peso-smpv",
        title="PESO SMPV Rules",
        body="Petroleum and Explosives Safety Organisation",
        clause="Static and Mobile Pressure Vessels"
    )
]

def seed_regulations():
    client = get_neo4j_client()
    for reg in INDIAN_REGS:
        client.upsert_regulation(reg)
        logger.info(f"Seeded Regulation: {reg.title}")
    
if __name__ == "__main__":
    logger.info("Seeding Indian regulatory frameworks...")
    seed_regulations()
    logger.info("Done.")
