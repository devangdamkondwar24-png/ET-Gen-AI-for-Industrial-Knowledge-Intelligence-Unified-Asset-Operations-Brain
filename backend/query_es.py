import urllib.request, json

url = "http://localhost:9200/etgen_documents_v2/_search?q=content:P-101+downtime+hours&size=10"
with urllib.request.urlopen(url) as resp:
    data = json.loads(resp.read())

hits = data["hits"]["hits"]
print(f"Total hits: {data['hits']['total']['value']}")
print("="*60)
for h in hits:
    src = h["_source"]
    print(f"DOC: {src.get('doc_id','?')} | page {src.get('page_number','?')}")
    print(src.get("content","")[:600])
    print("-"*60)
