from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from datetime import date, datetime
from io import BytesIO
import pandas as pd

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable

from app.core.security import get_current_user
from app.core.data_store import ds
from app.services.social_proof_service import get_social_proof
from app.services.nature_service import get_nature_equivalents
from app.services.goal_service import get_goal_status

router = APIRouter()

GREEN       = colors.HexColor("#2E7D32")
LIGHT_GREEN = colors.HexColor("#E8F5E9")
GREY        = colors.HexColor("#757575")


def build_report(current_user: dict) -> BytesIO:
    uid    = int(current_user["user_id"])
    period = date.today().strftime("%Y-%m")
    year   = date.today().year
    month  = date.today().month

    # Emissions breakdown
    df = ds.daily_emissions.copy()
    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    df = df[(df["user_id"] == uid) & (df["date"].dt.year == year) & (df["date"].dt.month == month)]
    breakdown  = df.groupby("resource_type").agg(co2=("co2_emission","sum"), qty=("quantity","sum")).reset_index()
    total_co2  = float(breakdown["co2"].sum())

    social    = get_social_proof(current_user, period)
    peer_avg  = social["peer_avg_co2"] if social else total_co2
    nature    = get_nature_equivalents(total_co2, peer_avg)
    goal      = get_goal_status(uid)
    recs      = ds.recommendations[ds.recommendations["user_id"] == uid].head(5).to_dict(orient="records")
    inc_row   = ds.incentives[ds.incentives["user_id"] == uid]
    incentive = inc_row.iloc[0].to_dict() if not inc_row.empty else {}

    buf    = BytesIO()
    doc    = SimpleDocTemplate(buf, pagesize=A4, topMargin=2*cm, bottomMargin=2*cm, leftMargin=2*cm, rightMargin=2*cm)
    styles = getSampleStyleSheet()
    story  = []

    title_s = ParagraphStyle("T", parent=styles["Title"], textColor=GREEN, fontSize=20, spaceAfter=4)
    h2_s    = ParagraphStyle("H2", parent=styles["Heading2"], textColor=GREEN, fontSize=13, spaceBefore=14, spaceAfter=6)
    body    = styles["Normal"]
    small   = ParagraphStyle("sm", parent=body, textColor=GREY, fontSize=8)

    cell_style = [
        ("BACKGROUND",    (0, 0), (-1, 0), GREEN),
        ("TEXTCOLOR",     (0, 0), (-1, 0), colors.white),
        ("FONTNAME",      (0, 0), (-1, 0), "Helvetica-Bold"),
        ("GRID",          (0, 0), (-1, -1), 0.5, colors.lightgrey),
        ("LEFTPADDING",   (0, 0), (-1, -1), 8),
        ("TOPPADDING",    (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("ROWBACKGROUNDS",(0, 1), (-1, -1), [colors.white, LIGHT_GREEN]),
    ]

    story.append(Paragraph("🌿 Carbon Footprint Monthly Report", title_s))
    story.append(Paragraph(
        f"{current_user.get('full_name','')}  ·  {current_user.get('city','')}  ·  "
        f"Household: {current_user.get('household_size',1)}  ·  {date.today().strftime('%B %Y')}",
        body
    ))
    story.append(HRFlowable(width="100%", thickness=1.5, color=GREEN, spaceAfter=10))

    # Summary table
    vs_text = ""
    if social:
        diff = round(total_co2 - peer_avg, 1)
        vs_text = f"+{diff} kg above city peers" if diff > 0 else f"{abs(diff)} kg below city peers 🌱"
    rows = [
        ["Total CO₂ This Month",  f"{round(total_co2,1)} kg"],
        ["City Peer Average",     f"{round(peer_avg,1)} kg"],
        ["Your Standing",         vs_text or "—"],
        ["Eco-Points",            str(int(incentive.get("eco_points", 0)))],
        ["Community Rank",        f"#{int(incentive.get('rank', 0)) if incentive.get('rank') else '—'}"],
    ]
    if goal:
        rows += [["Monthly Budget", f"{goal['monthly_budget_kg']} kg"],
                 ["Budget Status",  goal["status"]]]
    t = Table(rows, colWidths=[9*cm, 8*cm])
    t.setStyle(TableStyle(cell_style))
    story.append(t)
    story.append(Spacer(1, 0.5*cm))

    # Breakdown
    story.append(Paragraph("Emissions Breakdown", h2_s))
    bd = [["Resource", "CO₂ (kg)", "Quantity"]]
    for _, r in breakdown.iterrows():
        bd.append([r["resource_type"], round(r["co2"], 2), round(r["qty"], 2)])
    t2 = Table(bd, colWidths=[8*cm, 5.5*cm, 3.5*cm])
    t2.setStyle(TableStyle(cell_style))
    story.append(t2)

    # Nature
    story.append(Paragraph("Nature Equivalents", h2_s))
    if nature["excess_kg"] > 0:
        story.append(Paragraph(f"Your excess needs <b>{nature['trees_to_offset']} teak trees</b> to offset.", body))
    if nature["saved_kg"] > 0:
        story.append(Paragraph(f"You saved the equivalent of <b>{nature['smartphone_hours_saved']:,} hours</b> of smartphone use. 📱", body))

    # Social proof
    if social:
        story.append(Paragraph("Peer Comparison", h2_s))
        story.append(Paragraph(social["message"], body))
        story.append(Paragraph(
            f"Based on {social['peer_count']} similar households ({social['household_bucket']} members) in {social['city']}. "
            f"You emit less than {social['user_percentile']}% of your peers.", body))

    # Goal
    if goal:
        story.append(Paragraph("Carbon Budget", h2_s))
        story.append(Paragraph(goal["alert_message"], body))

    # Recommendations
    if recs:
        story.append(Paragraph("Personalised Recommendations", h2_s))
        rd = [["#", "Category", "Recommendation", "Severity"]]
        for i, r in enumerate(recs, 1):
            rd.append([i, r["category"], Paragraph(r["message"], body), r["severity"]])
        t3 = Table(rd, colWidths=[1*cm, 3*cm, 11*cm, 2*cm])
        t3.setStyle(TableStyle(cell_style + [("VALIGN", (0,0), (-1,-1), "MIDDLE")]))
        story.append(t3)

    story.append(Spacer(1, 1*cm))
    story.append(HRFlowable(width="100%", thickness=1, color=GREEN))
    story.append(Paragraph(f"Generated by CarbonTrack  ·  {datetime.now().strftime('%d %b %Y, %H:%M')}", small))

    doc.build(story)
    buf.seek(0)
    return buf


@router.get("/monthly")
def monthly_report(current_user: dict = Depends(get_current_user)):
    pdf      = build_report(current_user)
    filename = f"carbon_report_{current_user['user_id']}_{date.today().strftime('%Y-%m')}.pdf"
    return StreamingResponse(pdf, media_type="application/pdf",
                             headers={"Content-Disposition": f"attachment; filename={filename}"})
