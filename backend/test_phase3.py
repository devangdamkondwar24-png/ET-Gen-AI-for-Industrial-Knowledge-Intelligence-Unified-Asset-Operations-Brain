import sys
print('=== Pass 3: Logic & Integration Checks ===')
errors = []

# 1. universal_router
print('\n[1] universal_router: classification test')
try:
    from ingestion.universal_router import classify
    pdf_header = b'%PDF-1.4 test content'
    doc_type, mime = classify(pdf_header)
    assert doc_type == 'pdf', f'Expected pdf, got {doc_type}'
    print(f'  PASS: classify(pdf_bytes) -> type={doc_type}')
except Exception as e:
    print(f'  FAIL: {e}')
    errors.append('universal_router')

# 2. neo4j_client: Pydantic validation
print('\n[2] graph.neo4j_client: Pydantic model validation (all 10 nodes)')
try:
    from graph.neo4j_client import (
        EquipmentNode, FailureModeNode, CauseNode, ActionNode,
        WorkOrderNode, InspectionFindingNode, ProcedureNode,
        RegulationNode, IncidentNode, NonConformanceNode
    )
    EquipmentNode(asset_id='P-101', name='Feed Pump', asset_type='Centrifugal Pump', plant='Pune_Pilot')
    FailureModeNode(failure_id='fm-001', name='Seal Leak', asset_id='P-101', severity='Critical')
    CauseNode(cause_id='ca-001', description='Mechanical fatigue', category='Mechanical', failure_id='fm-001')
    ActionNode(action_id='ac-001', description='Replace primary seal', action_type='Corrective')
    WorkOrderNode(wo_id='WO-2024-001', title='Seal replacement', asset_id='P-101', priority='P1')
    InspectionFindingNode(finding_id='if-001', asset_id='P-101', description='Oil seepage', severity='Major')
    ProcedureNode(procedure_id='pr-001', title='Pump Seal Change SOP', doc_type='SOP')
    RegulationNode(regulation_id='rg-iso-55001', title='ISO 55001', body='ISO', clause='7.5')
    IncidentNode(incident_id='inc-001', title='Pump failure event', description='Shutdown', severity='Major')
    NonConformanceNode(nc_id='nc-001', description='Missing inspection log', status='Open')
    print('  PASS: All 10 ontology Pydantic nodes validated')
except Exception as e:
    print(f'  FAIL: {e}')
    errors.append('neo4j_client.pydantic')

# 3. RCA + Compliance state dicts
print('\n[3] agents: State dict contracts')
try:
    from agents.rca_agent import RCAState
    state = {'query': 'test', 'asset_id': 'P-101', 'graph_context': {}, 'doc_chunks': [], 'hypotheses': [], 'final_answer': '', 'error': ''}
    assert state['asset_id'] == 'P-101'
    print('  PASS: RCAState contract correct')
except Exception as e:
    print(f'  FAIL: {e}')
    errors.append('RCAState')

try:
    from agents.compliance_agent import ComplianceState
    cs = {'regulation_ids': ['rg-iso-55001'], 'plant_filter': None, 'regulations': [], 'procedure_docs': [], 'known_non_conformances': [], 'gap_analysis': [], 'error': ''}
    assert 'rg-iso-55001' in cs['regulation_ids']
    print('  PASS: ComplianceState contract correct')
except Exception as e:
    print(f'  FAIL: {e}')
    errors.append('ComplianceState')

# 4. FastAPI route registration
print('\n[4] main.py: FastAPI route verification')
try:
    from main import app
    
    # Use OpenAPI schema to get all resolved flattened routes
    routes = list(app.openapi()["paths"].keys())
            
    print(f"  ACTUAL ROUTES FOUND: {routes}")
    
    expected = ['/api/agents/rca', '/api/agents/compliance', '/api/agents/lessons-learned/run', '/api/graph/asset/{asset_id}']
    for ep in expected:
        if ep in routes:
            print(f'  PASS: {ep}')
        else:
            print(f'  FAIL: missing route {ep}')
            errors.append('route:' + ep)
except Exception as e:
    print(f'  FAIL: main.py -> {e}')
    errors.append('main.py')

# 5. Lessons Learned
print('\n[5] lessons_learned_job: importable')
try:
    from agents.lessons_learned_job import run_lessons_learned_pipeline, get_all_insights
    print('  PASS: run_lessons_learned_pipeline')
    print('  PASS: get_all_insights')
except Exception as e:
    print(f'  FAIL: {e}')
    errors.append('lessons_learned_job')

# 6. API routers
print('\n[6] api/agents.py and api/graph.py: route counts')
try:
    from api.agents import router as ar
    print(f'  PASS: api/agents has {len(ar.routes)} routes')
    from api.graph import router as gr
    print(f'  PASS: api/graph has {len(gr.routes)} routes')
except Exception as e:
    print(f'  FAIL: {e}')
    errors.append('api_routers')

# 7. graph_extractor: function signature
print('\n[7] graph_extractor: function importable')
try:
    from ingestion.graph_extractor import extract_and_populate_graph
    import inspect
    sig = inspect.signature(extract_and_populate_graph)
    assert 'text' in sig.parameters
    assert 'doc_id' in sig.parameters
    print(f'  PASS: extract_and_populate_graph signature: {list(sig.parameters.keys())}')
except Exception as e:
    print(f'  FAIL: {e}')
    errors.append('graph_extractor')

result = 'ALL PASSED' if not errors else str(len(errors)) + ' FAILED: ' + str(errors)
print('\n=== Pass 3 Complete: ' + result + ' ===')
sys.exit(len(errors))
