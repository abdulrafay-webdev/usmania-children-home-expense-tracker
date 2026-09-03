import io
from datetime import datetime
from typing import List
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
)
from reportlab.pdfgen import canvas
from app.models import Person, Entry

class NumberedCanvas(canvas.Canvas):
    """Two-pass canvas to dynamically add page numbers and running footer."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count: int):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        
        # Bottom rule
        self.setStrokeColor(colors.HexColor("#e2e8f0"))
        self.setLineWidth(0.75)
        self.line(40, 45, 572, 45)
        
        footer_text = "Usmania Children Home • Balance Statement • Official Record"
        self.drawString(40, 32, footer_text)
        
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(572, 32, page_str)
        self.restoreState()


def format_currency(amount: float) -> str:
    return f"Rs. {amount:,.2f}"


def generate_person_pdf(person: Person, entries: List[Entry]) -> io.BytesIO:
    buffer = io.BytesIO()
    # Letter size: 612 x 792 pt. Margins 40 left & right => 532 pt usable width.
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=40,
        rightMargin=40,
        topMargin=40,
        bottomMargin=55,
    )

    styles = getSampleStyleSheet()

    # Custom typography styles
    title_style = ParagraphStyle(
        name="OrgTitle",
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#0f766e"), # Deep Emerald
    )
    subtitle_style = ParagraphStyle(
        name="OrgSubtitle",
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=15,
        textColor=colors.HexColor("#334155"),
    )
    meta_style = ParagraphStyle(
        name="OrgMeta",
        fontName="Helvetica",
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#64748b"),
        alignment=2, # Right-aligned
    )
    card_label_style = ParagraphStyle(
        name="CardLabel",
        fontName="Helvetica-Bold",
        fontSize=7.5,
        leading=9.5,
        textColor=colors.HexColor("#475569"),
    )
    card_val_style = ParagraphStyle(
        name="CardVal",
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=14,
        textColor=colors.HexColor("#0f172a"),
    )
    card_val_balance = ParagraphStyle(
        name="CardValBalance",
        fontName="Helvetica-Bold",
        fontSize=11.5,
        leading=14.5,
        textColor=colors.HexColor("#047857"),
    )
    card_val_balance_neg = ParagraphStyle(
        name="CardValBalanceNeg",
        fontName="Helvetica-Bold",
        fontSize=11.5,
        leading=14.5,
        textColor=colors.HexColor("#b91c1c"),
    )
    table_header_style = ParagraphStyle(
        name="TableHeader",
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=11,
        textColor=colors.white,
    )
    table_header_right = ParagraphStyle(
        name="TableHeaderRight",
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=11,
        textColor=colors.white,
        alignment=2,
    )
    table_cell_style = ParagraphStyle(
        name="TableCell",
        fontName="Helvetica",
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#1e293b"),
    )
    table_cell_bold = ParagraphStyle(
        name="TableCellBold",
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#1e293b"),
    )
    table_cell_right = ParagraphStyle(
        name="TableCellRight",
        fontName="Helvetica",
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#1e293b"),
        alignment=2,
    )
    table_cell_right_bold = ParagraphStyle(
        name="TableCellRightBold",
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#1e293b"),
        alignment=2,
    )
    total_label_style = ParagraphStyle(
        name="TotalLabelStyle",
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#0f766e"),
    )
    total_amount_style = ParagraphStyle(
        name="TotalAmountStyle",
        fontName="Helvetica-Bold",
        fontSize=9.5,
        leading=12.5,
        textColor=colors.HexColor("#0f766e"),
        alignment=2,
    )
    table_cell_muted = ParagraphStyle(
        name="TableCellMuted",
        fontName="Helvetica-Oblique",
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#64748b"),
    )

    story = []

    # 1. Header Section (2 columns: Org branding left, statement meta right)
    now_str = datetime.now().strftime("%B %d, %Y - %I:%M %p")
    header_left = [
        Paragraph("USMANIA CHILDREN HOME", title_style),
        Spacer(1, 3),
        Paragraph("BALANCE STATEMENT", subtitle_style),
    ]
    header_right = [
        Paragraph(f"<b>Date:</b> {now_str}", meta_style),
        Paragraph(f"<b>Person ID:</b> #{person.id}", meta_style),
        Paragraph("<b>Status:</b> Active Account", meta_style),
    ]
    header_table = Table(
        [[header_left, header_right]],
        colWidths=[330, 202]
    )
    header_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0f766e"), spaceAfter=14))

    # 2. Person Summary & Financial Overview Cards (Total available width: 532)
    total_spent = sum(entry.quantity * entry.price for entry in entries)
    remaining_balance = person.total_amount_given - total_spent

    person_created_str = person.created_at.strftime("%b %d, %Y") if person.created_at else "N/A"
    contact_str = person.contact if person.contact else "Not provided"

    person_info = [
        Paragraph(f"<b>Person Name:</b> {person.name}", card_val_style),
        Paragraph(f"<b>Contact / Phone:</b> {contact_str}", card_label_style),
        Paragraph(f"<b>Record Created:</b> {person_created_str}", card_label_style),
    ]

    # Ample width given to numbers so they never wrap into multiple lines:
    # 172 + 120 + 120 + 120 = 532 pt
    card_data = [
        [
            person_info,
            [
                Paragraph("TOTAL GIVEN", card_label_style),
                Spacer(1, 2),
                Paragraph(format_currency(person.total_amount_given), card_val_style),
            ],
            [
                Paragraph("TOTAL SPENT", card_label_style),
                Spacer(1, 2),
                Paragraph(format_currency(total_spent), card_val_style),
            ],
            [
                Paragraph("REMAINING BALANCE", card_label_style),
                Spacer(1, 2),
                Paragraph(
                    format_currency(remaining_balance),
                    card_val_balance if remaining_balance >= 0 else card_val_balance_neg
                ),
            ],
        ]
    ]

    summary_table = Table(card_data, colWidths=[172, 120, 120, 120])
    summary_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, 0), colors.HexColor("#f8fafc")),
        ("BACKGROUND", (1, 0), (1, 0), colors.HexColor("#eff6ff")), # light blue
        ("BACKGROUND", (2, 0), (2, 0), colors.HexColor("#fff7ed")), # light amber
        ("BACKGROUND", (3, 0), (3, 0), colors.HexColor("#f0fdf4") if remaining_balance >= 0 else colors.HexColor("#fef2f2")),
        ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#cbd5e1")),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 16))

    # 3. Expense Entries Section
    story.append(Paragraph("<b>ITEMIZED EXPENSE ENTRIES</b>", subtitle_style))
    story.append(Spacer(1, 6))

    table_data = [
        [
            Paragraph("<b>#</b>", table_header_style),
            Paragraph("<b>Item Name</b>", table_header_style),
            Paragraph("<b>Quality</b>", table_header_style),
            Paragraph("<b>Qty</b>", table_header_right),
            Paragraph("<b>Unit Price</b>", table_header_right),
            Paragraph("<b>Line Total</b>", table_header_right),
            Paragraph("<b>Date</b>", table_header_style),
            Paragraph("<b>Note</b>", table_header_style),
        ]
    ]

    # Adjusted column widths so Line Total column has 95pt width (never wraps across 3 lines)
    # Sum: 22 + 125 + 55 + 35 + 70 + 95 + 65 + 65 = 532 pt
    col_widths = [22, 125, 55, 35, 70, 95, 65, 65]

    if not entries:
        empty_cell = Paragraph("No expense entries recorded for this person yet.", table_cell_muted)
        table_data.append([empty_cell] + [""] * 7)
    else:
        for idx, item in enumerate(entries, start=1):
            line_tot = item.quantity * item.price
            date_str = item.created_at.strftime("%b %d, %y") if item.created_at else "N/A"
            table_data.append([
                Paragraph(str(idx), table_cell_style),
                Paragraph(item.item_name, table_cell_bold),
                Paragraph(item.item_quality or "—", table_cell_style),
                Paragraph(f"{item.quantity:g}", table_cell_right),
                Paragraph(format_currency(item.price), table_cell_right),
                Paragraph(format_currency(line_tot), table_cell_right_bold),
                Paragraph(date_str, table_cell_style),
                Paragraph(item.note or "—", table_cell_muted),
            ])

    # Total row: Span columns 0 to 4 for clean one-line label, column 5 for amount, 6-7 empty
    table_data.append([
        Paragraph(f"<b>Total Spent ({len(entries)} items recorded)</b>", total_label_style),
        "",
        "",
        "",
        "",
        Paragraph(f"<b>{format_currency(total_spent)}</b>", total_amount_style),
        "",
        ""
    ])

    entries_table = Table(table_data, colWidths=col_widths, repeatRows=1)

    t_style = [
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0f766e")),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("GRID", (0, 0), (-1, -2), 0.5, colors.HexColor("#e2e8f0")),
        ("LINEBELOW", (0, -1), (-1, -1), 1.5, colors.HexColor("#0f766e")),
        ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#f1f5f9")),
        ("SPAN", (0, -1), (4, -1)),
        ("SPAN", (6, -1), (7, -1)),
    ]

    # Alternating row colors
    for i in range(1, len(table_data) - 1):
        if i % 2 == 0:
            t_style.append(("BACKGROUND", (0, i), (-1, i), colors.HexColor("#f8fafc")))

    entries_table.setStyle(TableStyle(t_style))
    story.append(entries_table)

    story.append(Spacer(1, 20))

    # 4. Sign-off / Confirmation Box
    signoff_data = [
        [
            Paragraph("<b>Prepared By:</b> Administrator", card_label_style),
            Paragraph("<b>Verified By:</b> Account Dept / Incharge", card_label_style),
            Paragraph(f"<b>Balance Available:</b> {format_currency(remaining_balance)}", card_label_style),
        ]
    ]
    signoff_table = Table(signoff_data, colWidths=[177, 177, 178])
    signoff_table.setStyle(TableStyle([
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("LINEABOVE", (0, 0), (-1, 0), 0.75, colors.HexColor("#cbd5e1")),
    ]))
    story.append(signoff_table)

    # Build document with NumberedCanvas
    doc.build(story, canvasmaker=NumberedCanvas)
    buffer.seek(0)
    return buffer
