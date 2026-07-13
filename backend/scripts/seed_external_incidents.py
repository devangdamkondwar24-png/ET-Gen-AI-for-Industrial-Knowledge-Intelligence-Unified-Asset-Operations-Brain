"""
Seed offline external incidents into Elasticsearch.
"""
import os
import json
import logging
import httpx

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

ES_URL = os.environ.get("ELASTICSEARCH_URL", "http://localhost:9200")
ES_INDEX = "external_incidents"

def seed_external_incidents():
    # Load dataset
    dataset_path = os.path.join(os.path.dirname(__file__), "..", "dataset", "external_incidents.json")
    if not os.path.exists(dataset_path):
        logger.error(f"Dataset not found at {dataset_path}")
        return

    with open(dataset_path, "r") as f:
        incidents = json.load(f)

    # Ensure index exists
    try:
        resp = httpx.put(f"{ES_URL}/{ES_INDEX}", json={
            "settings": {"number_of_shards": 1, "number_of_replicas": 0},
            "mappings": {
                "properties": {
                    "id": {"type": "keyword"},
                    "source": {"type": "keyword"},
                    "title": {"type": "text"},
                    "description": {"type": "text"},
                    "root_cause_hypothesis": {"type": "text"},
                    "preventive_actions": {"type": "text"}
                }
            }
        })
        if resp.status_code in [200, 201]:
            logger.info(f"Created index {ES_INDEX}")
        elif "resource_already_exists_exception" not in resp.text:
            logger.warning(f"Index creation response: {resp.text}")
    except Exception as e:
        logger.error(f"Failed to create index: {e}")
        return

    # Index documents
    for inc in incidents:
        try:
            httpx.post(f"{ES_URL}/{ES_INDEX}/_doc/{inc['id']}", json=inc)
            logger.info(f"Indexed incident {inc['id']}")
        except Exception as e:
            logger.error(f"Failed to index {inc['id']}: {e}")

if __name__ == "__main__":
    logger.info("Seeding external incidents into Elasticsearch...")
    seed_external_incidents()
    logger.info("Done.")
