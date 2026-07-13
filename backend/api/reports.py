import io
from datetime import datetime
from typing import List
from fastapi import APIRouter, Query, Response
from agents.compliance_agent import run_compliance_check

try:
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib import colors
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False

router = APIRouter(prefix="/api/compliance")

@router.get("/report")
def generate_compliance_report(
    regulation_ids: List[str] = Query(..., description="List of regulation IDs to audit"),
    plant_filter: str = Query(None, description="Optional plant filter")
):
    """
    Auto-generate a compliance evidence package (PDF) for audits.
    """
    if not REPORTLAB_AVAILABLE:
        return Response(content="ReportLab not installed", status_code=500)

    # Run the compliance agent
    result = run_compliance_check(regulation_ids, plant_filter)
    
    if result.get("status") == "error":
        return Response(content=f"Error generating report: {result.get('message')}", status_code=500)

    gaps = result.get("gaps", [])

    # Build the PDF
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=30, leftMargin=30, topMargin=30, bottomMargin=30)
    styles = getSampleStyleSheet()
    
    # Custom Styles
    title_style = styles['Heading1']
    title_style.alignment = 1 # Center
    
    subtitle_style = styles['Heading2']
    normal_style = styles['Normal']
    
    elements = []
    
    # Header
    elements.append(Paragraph("Industrial Knowledge Intelligence", title_style))
    elements.append(Paragraph("Compliance Evidence Package", title_style))
    elements.append(Spacer(1, 12))
    
    # Meta Info
    elements.append(Paragraph(f"<b>Date Generated:</b> {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC", normal_style))
    elements.append(Paragraph(f"<b>Plant Filter:</b> {plant_filter or 'All Plants'}", normal_style))
    elements.append(Paragraph(f"<b>Regulations Audited:</b> {', '.join(regulation_ids)}", normal_style))
    elements.append(Spacer(1, 24))
    
    # Findings Summary Table
    elements.append(Paragraph("<b>Audit Summary</b>", subtitle_style))
    
    table_data = [["Regulation", "Status", "Severity", "Confidence", "Evidence Docs"]]
    
    for gap in gaps:
        reg_title = gap.get("regulation_title", gap.get("regulation_id", ""))
        status = gap.get("status", "UNKNOWN")
        severity = gap.get("severity", "None")
        confidence = f"{gap.get('confidence_score', 0.0) * 100:.0f}%"
        docs = ", ".join(gap.get("evidence_doc_ids", [])) or "None"
        
        table_data.append([
            Paragraph(reg_title, normal_style),
            status,
            severity,
            confidence,
            Paragraph(docs, normal_style)
        ])
        
    t = Table(table_data, colWidths=[150, 80, 80, 70, 150])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('VALIGN', (0, 0), (-1, -1), 'TOP')
    ]))
    
    elements.append(t)
    elements.append(Spacer(1, 24))
    
    # Detailed Findings
    elements.append(Paragraph("<b>Detailed Findings</b>", subtitle_style))
    for gap in gaps:
        reg_title = gap.get("regulation_title", gap.get("regulation_id", ""))
        elements.append(Paragraph(f"<b>{reg_title}</b>", styles['Heading3']))
        elements.append(Paragraph(f"<b>Requirement:</b> {gap.get('requirement_summary', '')}", normal_style))
        elements.append(Paragraph(f"<b>Status:</b> {gap.get('status', '')}", normal_style))
        elements.append(Paragraph(f"<b>Gap Description:</b> {gap.get('gap_description', '')}", normal_style))
        elements.append(Paragraph(f"<b>Recommended Action:</b> {gap.get('recommended_action', '')}", normal_style))
        elements.append(Spacer(1, 12))
        
    doc.build(elements)
    
    pdf_bytes = buffer.getvalue()
    buffer.close()
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=Compliance_Audit_{datetime.utcnow().strftime('%Y%m%d')}.pdf"}
    )
