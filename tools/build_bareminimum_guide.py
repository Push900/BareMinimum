from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor


OUT = r"D:\BareMinimum\docs\BareMinimum Technical Guide and Viva Questions.docx"
NAVY = "11221C"
GREEN = "138A63"
MINT = "DDF5EA"
GOLD = "F0B844"
INK = "17211C"
MUTED = "58665E"
PALE = "F3F7F4"
LINE = "DCE5DF"
CODE = "F2F5F4"
WHITE = "FFFFFF"


def shade(cell, fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = tc_pr.find(qn("w:shd"))
    if shd is None:
        shd = OxmlElement("w:shd")
        tc_pr.append(shd)
    shd.set(qn("w:fill"), fill)


def set_cell_margins(cell, top=90, start=110, bottom=90, end=110):
    tc = cell._tc
    tc_pr = tc.get_or_add_tcPr()
    margins = tc_pr.first_child_found_in("w:tcMar")
    if margins is None:
        margins = OxmlElement("w:tcMar")
        tc_pr.append(margins)
    for edge, value in (("top", top), ("start", start), ("bottom", bottom), ("end", end)):
        node = margins.find(qn(f"w:{edge}"))
        if node is None:
            node = OxmlElement(f"w:{edge}")
            margins.append(node)
        node.set(qn("w:w"), str(value))
        node.set(qn("w:type"), "dxa")


def set_repeat_table_header(row):
    tr_pr = row._tr.get_or_add_trPr()
    repeat = OxmlElement("w:tblHeader")
    repeat.set(qn("w:val"), "true")
    tr_pr.append(repeat)


def prevent_row_split(row):
    tr_pr = row._tr.get_or_add_trPr()
    tr_pr.append(OxmlElement("w:cantSplit"))


def set_run_font(run, name="Aptos", size=10, color=INK, bold=False, italic=False):
    run.font.name = name
    run._element.get_or_add_rPr().rFonts.set(qn("w:ascii"), name)
    run._element.get_or_add_rPr().rFonts.set(qn("w:hAnsi"), name)
    run.font.size = Pt(size)
    run.font.color.rgb = RGBColor.from_string(color)
    run.bold = bold
    run.italic = italic


def add_page_field(paragraph):
    run = paragraph.add_run()
    begin = OxmlElement("w:fldChar")
    begin.set(qn("w:fldCharType"), "begin")
    instr = OxmlElement("w:instrText")
    instr.set(qn("xml:space"), "preserve")
    instr.text = " PAGE "
    sep = OxmlElement("w:fldChar")
    sep.set(qn("w:fldCharType"), "separate")
    text = OxmlElement("w:t")
    text.text = "1"
    end = OxmlElement("w:fldChar")
    end.set(qn("w:fldCharType"), "end")
    for item in (begin, instr, sep, text, end):
        run._r.append(item)
    set_run_font(run, size=8, color=MUTED)


def add_para(doc, text, style=None, before=0, after=5, size=9.6, color=INK, bold=False, italic=False, keep=False):
    p = doc.add_paragraph(style=style)
    p.paragraph_format.space_before = Pt(before)
    p.paragraph_format.space_after = Pt(after)
    p.paragraph_format.line_spacing = 1.08
    if keep:
        p.paragraph_format.keep_with_next = True
    r = p.add_run(text)
    set_run_font(r, size=size, color=color, bold=bold, italic=italic)
    return p


def add_rich_para(doc, parts, before=0, after=5, size=9.5):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(before)
    p.paragraph_format.space_after = Pt(after)
    p.paragraph_format.line_spacing = 1.08
    for text, bold, color in parts:
        r = p.add_run(text)
        set_run_font(r, size=size, color=color or INK, bold=bold)
    return p


def add_heading(doc, text, level=1):
    p = doc.add_paragraph(style=f"Heading {level}")
    p.paragraph_format.keep_with_next = True
    p.paragraph_format.space_before = Pt(8 if level == 1 else 5)
    p.paragraph_format.space_after = Pt(4)
    r = p.add_run(text)
    set_run_font(r, name="Aptos Display", size=16 if level == 1 else 11.5, color=GREEN if level == 1 else NAVY, bold=True)
    return p


def add_bullet(doc, text, level=0):
    p = doc.add_paragraph(style="List Bullet" if level == 0 else "List Bullet 2")
    p.paragraph_format.left_indent = Inches(0.22 + 0.18 * level)
    p.paragraph_format.first_line_indent = Inches(-0.12)
    p.paragraph_format.space_after = Pt(2.4)
    p.paragraph_format.line_spacing = 1.05
    r = p.add_run(text)
    set_run_font(r, size=9.2, color=INK)
    return p


def add_callout(doc, label, text, fill=MINT, accent=GREEN):
    table = doc.add_table(rows=1, cols=1)
    table.autofit = False
    table.columns[0].width = Inches(6.95)
    cell = table.cell(0, 0)
    shade(cell, fill)
    set_cell_margins(cell, top=130, start=170, bottom=130, end=170)
    p = cell.paragraphs[0]
    p.paragraph_format.space_after = Pt(3)
    r = p.add_run(label.upper())
    set_run_font(r, size=8, color=accent, bold=True)
    p2 = cell.add_paragraph()
    p2.paragraph_format.space_after = Pt(0)
    p2.paragraph_format.line_spacing = 1.08
    r2 = p2.add_run(text)
    set_run_font(r2, size=9.2, color=INK)
    doc.add_paragraph().paragraph_format.space_after = Pt(1)


def add_code(doc, label, code, source):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(3)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.keep_with_next = True
    r = p.add_run(label)
    set_run_font(r, size=9, color=GREEN, bold=True)
    block = doc.add_paragraph()
    block.paragraph_format.left_indent = Inches(0.08)
    block.paragraph_format.right_indent = Inches(0.06)
    block.paragraph_format.space_before = Pt(2)
    block.paragraph_format.space_after = Pt(2)
    block.paragraph_format.line_spacing = 1.0
    block.paragraph_format.keep_together = True
    ppr = block._p.get_or_add_pPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:fill"), CODE)
    ppr.append(shd)
    ind = OxmlElement("w:ind")
    ind.set(qn("w:left"), "120")
    ind.set(qn("w:right"), "100")
    ppr.append(ind)
    r = block.add_run(code)
    set_run_font(r, name="Cascadia Code", size=7.8, color="22332B")
    src = doc.add_paragraph()
    src.paragraph_format.space_after = Pt(4)
    r = src.add_run(f"Source: {source}")
    set_run_font(r, size=7.5, color=MUTED, italic=True)


def add_table(doc, headers, rows, widths=None, font_size=8.2):
    table = doc.add_table(rows=1, cols=len(headers))
    table.autofit = False
    table.style = "Table Grid"
    if widths:
        for col, width in zip(table.columns, widths):
            col.width = Inches(width)
    for i, label in enumerate(headers):
        cell = table.rows[0].cells[i]
        cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
        shade(cell, NAVY)
        set_cell_margins(cell, top=90, start=95, bottom=90, end=95)
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        r = p.add_run(label)
        set_run_font(r, size=8.1, color=WHITE, bold=True)
    set_repeat_table_header(table.rows[0])
    prevent_row_split(table.rows[0])
    for row_idx, row in enumerate(rows):
        cells = table.add_row().cells
        prevent_row_split(table.rows[-1])
        for col_idx, value in enumerate(row):
            cells[col_idx].vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            set_cell_margins(cells[col_idx], top=78, start=95, bottom=78, end=95)
            if row_idx % 2 == 1:
                shade(cells[col_idx], PALE)
            p = cells[col_idx].paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.line_spacing = 1.0
            r = p.add_run(str(value))
            set_run_font(r, size=font_size, color=INK, bold=(col_idx == 0))
    doc.add_paragraph().paragraph_format.space_after = Pt(1)
    return table


def add_qa(doc, question, answer):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(3)
    p.paragraph_format.space_after = Pt(1)
    p.paragraph_format.keep_with_next = True
    r = p.add_run(question)
    set_run_font(r, size=9.1, color=NAVY, bold=True)
    p2 = doc.add_paragraph()
    p2.paragraph_format.left_indent = Inches(0.16)
    p2.paragraph_format.space_after = Pt(4)
    p2.paragraph_format.line_spacing = 1.05
    r2 = p2.add_run(answer)
    set_run_font(r2, size=8.8, color=INK)


doc = Document()
sec = doc.sections[0]
sec.page_width = Inches(8.27)
sec.page_height = Inches(11.69)
sec.top_margin = Inches(0.62)
sec.bottom_margin = Inches(0.62)
sec.left_margin = Inches(0.7)
sec.right_margin = Inches(0.7)
sec.header_distance = Inches(0.3)
sec.footer_distance = Inches(0.3)
sec.different_first_page_header_footer = True

styles = doc.styles
normal = styles["Normal"]
normal.font.name = "Aptos"
normal._element.rPr.rFonts.set(qn("w:ascii"), "Aptos")
normal._element.rPr.rFonts.set(qn("w:hAnsi"), "Aptos")
normal.font.size = Pt(9.5)
normal.font.color.rgb = RGBColor.from_string(INK)
normal.paragraph_format.space_after = Pt(5)
for name, size in (("Heading 1", 16), ("Heading 2", 11.5), ("Heading 3", 10)):
    style = styles[name]
    style.font.name = "Aptos Display"
    style._element.rPr.rFonts.set(qn("w:ascii"), "Aptos Display")
    style._element.rPr.rFonts.set(qn("w:hAnsi"), "Aptos Display")
    style.font.size = Pt(size)
    style.font.bold = True
    style.font.color.rgb = RGBColor.from_string(GREEN if name == "Heading 1" else NAVY)

header = sec.header.paragraphs[0]
header.alignment = WD_ALIGN_PARAGRAPH.RIGHT
r = header.add_run("BAREMINIMUM  /  TECHNICAL GUIDE")
set_run_font(r, size=7.5, color=MUTED, bold=True)
footer = sec.footer.paragraphs[0]
footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = footer.add_run("Project guide  |  November 2026  |  Page ")
set_run_font(r, size=8, color=MUTED)
add_page_field(footer)

doc.core_properties.title = "BareMinimum Technical Guide and Viva Questions"
doc.core_properties.subject = "Code walkthrough, library rationale, product purpose, and technical viva preparation"
doc.core_properties.keywords = "BareMinimum, React, MongoDB, Express, accessibility, SDG, viva"

# Page 1: cover and quick pitch
p = doc.add_paragraph(style="Title")
p.paragraph_format.space_before = Pt(72)
p.paragraph_format.space_after = Pt(9)
r = p.add_run("BareMinimum Technical Guide")
set_run_font(r, name="Aptos Display", size=30, color=NAVY, bold=True)
p = doc.add_paragraph()
p.paragraph_format.space_after = Pt(20)
r = p.add_run("Code walkthrough, library rationale, and viva preparation")
set_run_font(r, size=15, color=GREEN)
add_para(doc, "A clear guide to what the application is for, how its React and Express code works, where MongoDB fits, and how to explain the main design choices in a project review.", after=16, size=11, color=MUTED)
add_callout(doc, "Project in one sentence", "BareMinimum turns small daily choices about well-being, sustainable work, and lower-waste behavior into understandable personal and shared impact signals.")
add_heading(doc, "A 30 second project explanation", 1)
add_para(doc, "BareMinimum is a wellness and sustainability dashboard for modern professionals. It organizes small actions around UN Sustainable Development Goals 3, 8, and 12 instead of treating steps or calories as the whole story. The React interface presents an impact overview, an adaptive deep-work boundary, an activity stack, and configurable widgets. An Express server exposes dashboard endpoints, and the MongoDB Node driver stores a dashboard snapshot. If the server or database cannot be reached, the browser keeps a local preview copy.", size=10.2, after=12)
add_heading(doc, "What this guide contains", 2)
for item in [
    "Product purpose, audience, and the three SDG connections",
    "The application architecture and why its libraries are used",
    "Annotated code excerpts from the actual project",
    "How to run the app, follow a save, and explain current limitations",
    "Technical and product-focused questions with concise answers",
]:
    add_bullet(doc, item)
add_callout(doc, "Key distinction", "The product brief recommends Next.js, PostgreSQL, Prisma, and Redis. The implemented app instead uses Vite, React with TypeScript/TSX, Express, and MongoDB. Framer Motion is installed in the starter dependencies, but the dashboard currently uses CSS transitions and keyframes.", fill="FFF5DE", accent="9A6811")

# Page 2: product purpose
doc.add_page_break()
add_heading(doc, "1  Product purpose and experience", 1)
add_para(doc, "BareMinimum is designed around low-friction habits. It helps people notice whether the way they work and live is supporting their health, their long-term capacity to work, and more responsible consumption. The interface favors a small number of legible signals over a dense collection of vanity metrics.", size=9.8)
add_heading(doc, "Who it is for", 2)
add_para(doc, "Modern professionals, impact-driven organizations, and people who want a practical wellness ecosystem without a rigid fitness-tracker experience. The product is meant to encourage useful routines, not to rank people or reward overwork.")
add_heading(doc, "How the SDGs shape the product", 2)
add_table(doc, ["Goal", "Product theme", "Examples shown in the app"], [
    ("Goal 3: Good Health and Well-being", "Cognitive ergonomics and recovery", "Sleep average, posture resets, micro-breaks, stress-aware pacing"),
    ("Goal 8: Decent Work and Economic Growth", "Sustainable work habits", "Deep-work duration, focus boundaries, burnout prevention"),
    ("Goal 12: Responsible Consumption and Production", "Lower-waste choices", "Paperless receipts, digital clutter reduction, carbon avoided"),
], widths=[1.85, 2.0, 3.1], font_size=8.4)
add_heading(doc, "Design principles", 2)
for item in [
    "Dark-mode-first surfaces and a high-contrast emerald, blue, and gold accent system.",
    "A bento-style dashboard gives each signal a clear place without forcing a long, linear report.",
    "Short feedback text explains what a boundary value means instead of presenting a raw number alone.",
    "Keyboard operation, visible focus, semantic sections, ARIA labels, live announcements, and reduced-motion handling are part of interaction design.",
]:
    add_bullet(doc, item)
add_heading(doc, "What a successful session looks like", 2)
add_para(doc, "A person scans the daily signal, adjusts a work boundary, logs or completes a small action, and sees the activity and impact values update. The product should leave the person with one useful next step, not a demand to optimize every metric.")
add_callout(doc, "Talking point", "The name BareMinimum refers to making meaningful progress with manageable, repeatable actions. It is a product philosophy about lowering friction, not lowering care.")

# Page 3: architecture and libraries
doc.add_page_break()
add_heading(doc, "2  Architecture and library choices", 1)
add_para(doc, "The current app is a single-page React dashboard served by an Express process. Vite provides the development server and client build. The dashboard data path uses JSON REST endpoints and the MongoDB Node driver; the project also retains a tRPC and Drizzle/MySQL layer from its starter template.", after=7)
add_callout(doc, "Request and save path", "Browser React state -> GET /api/dashboard -> Express route -> MongoDB dashboardSnapshots. A user action updates React state -> PUT /api/dashboard -> MongoDB upsert. Browser localStorage supplies the preview fallback.", fill=PALE, accent=GREEN)
add_table(doc, ["Library or tool", "How this code uses it", "Why it is here"], [
    ("React 19 and React DOM", "Home and reusable components render the interface; hooks manage local state and effects.", "Component reuse and targeted updates when a metric or interaction changes."),
    ("TypeScript and TSX", "Typed dashboard models, component props, and React markup; Vite emits browser JavaScript.", "Catches mismatched data and prop shapes during development. The repo is not plain JavaScript-only."),
    ("Vite and the React plugin", "Runs the development server, transforms TSX, and bundles the production client.", "Fast local feedback and a small build setup for the existing React app."),
    ("Express", "Hosts /api/dashboard, /api/health, tRPC, and the Vite or production static files.", "A straightforward Node HTTP layer for the client and persistence routes."),
    ("mongodb Node driver", "MongoClient connects to the configured database; findOne and updateOne read and save snapshots.", "Uses MongoDB directly without Mongoose or Prisma."),
    ("Wouter", "Switch and Route select Home or the Not Found page.", "Lightweight client-side routing for the small route set."),
    ("TanStack Query, tRPC, SuperJSON", "The app root configures the tRPC client and query provider for starter auth/system procedures.", "Typed remote procedure support remains available; dashboard snapshot calls currently use fetch instead."),
    ("Radix Dialog", "The dashboard action dialog supplies accessible modal behavior and focus handling.", "Keyboard-friendly dialogs without building focus management from scratch."),
    ("Tailwind CSS and custom CSS", "Tailwind is loaded through Vite; the dashboard visual system is primarily in index.css.", "Utility styling is available; CSS variables and component rules preserve the custom visual design."),
    ("Lucide React", "Components import icons such as HeartPulse, Target, Search, and ChevronDown.", "Consistent SVG icons that work with button labels and responsive sizing."),
    ("dotenv", "The server imports dotenv/config before reading environment variables.", "Loads Mongo and platform configuration from the local environment file."),
    ("Drizzle ORM and mysql2", "server/db.ts uses them for the starter user table and OAuth user upsert.", "Legacy starter authentication persistence; dashboard snapshots use MongoDB instead."),
    ("Framer Motion", "Present in package.json, but no dashboard component imports it today.", "The current visible motion is done with CSS transitions/keyframes and reduced-motion CSS."),
], widths=[1.45, 2.8, 2.7], font_size=7.55)

# Page 4: React app and model
doc.add_page_break()
add_heading(doc, "3  React entry point and dashboard data", 1)
add_heading(doc, "App composition", 2)
add_code(doc, "Routes and shared providers", '''<ErrorBoundary>
  <ThemeProvider defaultTheme="dark" switchable>
    <TooltipProvider>
      <Toaster />
      <Router />
    </TooltipProvider>
  </ThemeProvider>
</ErrorBoundary>''', "client/src/App.tsx")
add_para(doc, "The error boundary prevents a render failure from blanking the whole app. The theme provider owns the dark/light selection. TooltipProvider and Toaster support shared UI behavior. Wouter maps the root path to Home and unknown routes to NotFound.")
add_heading(doc, "Shared dashboard shape", 2)
add_code(doc, "Snapshot model", '''export interface DashboardSnapshot {
  profile: BareMinimumProfile;
  metrics: SdgMetric[];
  activities: ActivityItem[];
  summary: {
    impactScore: number;
    streak: number;
    deepWork: string;
    carbonSaved: string;
  };
}''', "client/src/app/models/dashboard.ts")
add_para(doc, "The model defines the object that Home renders and the server stores: a profile, three SDG metrics, an activity list, and summary values. Sharing a single shape makes the UI and API easier to reason about. The seed object in the same file provides the first-run preview.")
add_heading(doc, "Loading from the API", 2)
add_code(doc, "Fetch remote state, then keep a preview if unavailable", '''useEffect(() => {
  let active = true;
  fetch("/api/dashboard")
    .then((response) => {
      if (!response.ok) throw new Error("MongoDB unavailable");
      return response.json();
    })
    .then((result) => {
      if (active && result.snapshot) setSnapshot(result.snapshot);
    })
    .catch(() => { if (active) setSyncStatus("local"); })
    .finally(() => { if (active) setStorageReady(true); });
  return () => { active = false; };
}, []);''', "client/src/pages/Home.tsx")
add_para(doc, "The active flag prevents a response from updating an unmounted component. A failed request leaves the seeded or cached snapshot usable, while the sync badge distinguishes local preview from MongoDB sync.")

# Page 5: persistence and API
doc.add_page_break()
add_heading(doc, "4  Express and MongoDB persistence", 1)
add_heading(doc, "Connection is created only when needed", 2)
add_code(doc, "Mongo client and database selection", '''async function getDatabase() {
  if (!uri) throw new Error("MONGODB_URI is not configured");
  if (!database) {
    client ??= new MongoClient(uri, {
      serverSelectionTimeoutMS: 2500,
    });
    await client.connect();
    database = client.db(databaseName);
  }
  return database;
}''', "server/mongo.ts")
add_para(doc, "Lazy connection means the server can start even when the database is temporarily down. The Mongo URI and database name come from environment variables, not from browser code. The client and database objects are reused after a successful connection.")
add_heading(doc, "Read and upsert one snapshot", 2)
add_code(doc, "MongoDB read and write", '''const document = await db
  .collection<DashboardDocument>("dashboardSnapshots")
  .findOne({ _id: "default" });
return document?.snapshot ?? null;

await collection.updateOne(
  { _id: "default" },
  { $set: { snapshot, updatedAt: new Date() } },
  { upsert: true },
);''', "server/mongo.ts")
add_para(doc, "The stable _id makes the prototype a single shared dashboard document. updateOne with upsert inserts the document the first time and replaces the snapshot fields on later saves. The API checks that profile, metrics, activities, and summary exist before writing.")
add_heading(doc, "Express endpoints", 2)
add_code(doc, "Small REST boundary", '''app.get("/api/dashboard", async (_req, res) => {
  try {
    res.json({ snapshot: await getDashboard() });
  } catch {
    res.status(503).json({ error: "Dashboard storage unavailable" });
  }
});

app.put("/api/dashboard", async (req, res) => {
  try {
    await saveDashboard(req.body?.snapshot);
    res.json({ success: true });
  } catch {
    res.status(503).json({ error: "Dashboard storage unavailable" });
  }
});''', "server/_core/index.ts")
add_para(doc, "GET loads the saved snapshot. PUT accepts the updated snapshot as JSON. A 503 lets the client show a local-preview state rather than pretending the database save succeeded. In production, this endpoint needs user authentication, authorization, stronger schema validation, and per-user document IDs before it is suitable for multiple users.")

# Page 6: interactive components
doc.add_page_break()
add_heading(doc, "5  Main interactions and accessibility", 1)
add_heading(doc, "Adaptive boundary slider", 2)
add_code(doc, "Severity-aware feedback", '''const feedback = value <= 4
  ? { label: "Gentle pace", tone: "low" }
  : value <= 6
    ? { label: "Healthy stretch", tone: "balanced" }
    : { label: "High output", tone: "high" };''', "client/src/app/components/AdaptiveSlider.tsx")
add_para(doc, "The selected deep-work boundary changes the label, explanatory text, and CSS gradient. The native range input supports keyboard adjustments and exposes aria-label, aria-describedby, and aria-valuetext so assistive technology can announce both the number and its meaning.")
add_heading(doc, "DemoStack widgets", 2)
add_code(doc, "Store layout preferences and reorder widgets", '''useEffect(() => {
  localStorage.setItem(ORDER_KEY, JSON.stringify(order));
  localStorage.setItem(PINNED_KEY, JSON.stringify(pinned));
}, [order, pinned]);

const moveActive = (direction: -1 | 1) => {
  const next = [...order];
  [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
  setOrder(next);
};''', "client/src/app/components/DemoStack.tsx")
add_para(doc, "The widget tabs switch between deep work, posture resets, and signal quality. Pin and move controls update the local layout. The focus widget runs a one-second interval while active; the posture widget increments its reset count. This layout preference is browser-local, while dashboard activities and metrics use the server snapshot flow.")
add_heading(doc, "Activity and action dialogs", 2)
for item in [
    "ActivityStack pages through stacked actions and marks an unfinished suggestion complete. Home then updates the selected activity, category progress, and impact score.",
    "DashboardActionDialog provides Quick Find, notifications, help, settings, privacy, signal details, community signals, SDG details, and integration status panels.",
    "Radix Dialog supplies focus management and Escape handling. Home and the activity/widget stacks use aria-live regions for dynamic status announcements.",
    "The CSS includes a prefers-reduced-motion rule. Quiet motion mode further shortens animations for people who prefer less movement.",
]:
    add_bullet(doc, item)
add_callout(doc, "Do not overclaim", "The community feed and some profile connections are sample data. Real GitHub, Linear, calendar, Apple Health, Google Fit, or Oura synchronization needs provider OAuth apps, redirect URLs, protected token storage, and server-side sync jobs.", fill="FFF5DE", accent="9A6811")

# Page 7: runtime and limits
doc.add_page_break()
add_heading(doc, "6  Run the app and explain the data flow", 1)
add_heading(doc, "Local development", 2)
add_code(doc, "Commands", '''pnpm install
# Set MONGODB_URI and MONGODB_DB_NAME in .env
pnpm dev
# Open http://localhost:3000
# If that port is occupied:
PORT=3001 pnpm dev

pnpm check
pnpm build''', "package.json and README.md")
add_para(doc, "The server loads environment values, starts Express, mounts the dashboard and tRPC endpoints, then attaches Vite in development or static files in production. The port is read from PORT and defaults to 3000. In this project session, port 3000 was occupied, so the working local page was served on port 3001.")
add_heading(doc, "What currently persists", 2)
add_table(doc, ["Data", "Current storage", "Scope"], [
    ("Dashboard profile, metrics, activities, summary", "MongoDB dashboardSnapshots; localStorage fallback", "One default document in this prototype"),
    ("DemoStack pin and order", "Browser localStorage", "This browser/device"),
    ("Theme", "Browser localStorage", "This browser/device"),
    ("Some profile preferences and slider value", "React state for the current app session", "Not yet synced to MongoDB"),
], widths=[2.25, 2.55, 2.75], font_size=8.1)
add_heading(doc, "Current limits to explain honestly", 2)
for item in [
    "The UI is React with TypeScript/TSX, not plain JavaScript files, although it compiles to browser JavaScript.",
    "Dashboard persistence is a single Mongo snapshot. It is not yet a multi-user schema with per-user ownership or activity collections.",
    "The starter retains Drizzle/MySQL auth persistence, separate from dashboard Mongo storage.",
    "OAuth provider syncing is not active without provider credentials. The current integration rows are sample connection states.",
    "The metrics and community activity are demonstration values unless a real provider or user-entered event updates them.",
]:
    add_bullet(doc, item)
add_callout(doc, "Production next steps", "Add sign-in and ownership checks to dashboard endpoints, validate inputs with a schema, store per-user snapshots or normalized collections, implement provider OAuth and encrypted token storage, and add tests for API and UI state transitions.", fill=PALE)

# Page 8: technical viva
doc.add_page_break()
add_heading(doc, "7  Technical viva questions", 1)
technical = [
    ("1. What is the frontend/backend split?", "React renders the dashboard in the browser. Express handles API requests and sends JSON responses. The browser never connects directly to MongoDB."),
    ("2. How does a dashboard save work?", "A UI event updates React state. Home sends the new snapshot in a PUT request to /api/dashboard. Express validates its basic shape and asks the Mongo driver to upsert it."),
    ("3. Why MongoDB for this app?", "The dashboard is naturally represented as a nested snapshot containing profile, metrics, activities, and summary data. MongoDB stores that document without first mapping it to multiple relational tables."),
    ("4. What does upsert mean?", "Update an existing matching document; if no match exists, insert a new one. Here the stable _id is default."),
    ("5. Why is the database connection lazy?", "It avoids blocking server startup on database availability. The first dashboard request establishes the connection; later calls reuse it."),
    ("6. What happens when MongoDB is offline?", "The API returns a service error. The UI keeps its cached or seed snapshot and labels the state Local preview instead of reporting a successful sync."),
    ("7. Why use React state?", "State is the current UI source of truth. When an activity or metric changes, React renders the affected view from the updated snapshot."),
    ("8. Why TypeScript?", "Types describe dashboard objects and component props, catching shape mismatches before runtime. TSX is compiled to JavaScript by Vite."),
    ("9. What does Vite do?", "It serves the client during development and transforms and bundles the React/TSX application for production."),
    ("10. Why Express?", "It provides a small Node server for REST endpoints, the existing tRPC middleware, and Vite/static file hosting."),
    ("11. What is tRPC doing if dashboard uses fetch?", "The starter configures tRPC for auth/system procedures and shared types. The new dashboard snapshot endpoints are plain REST calls with fetch."),
    ("12. Why Wouter?", "It handles the small client-side route set without a larger router dependency."),
    ("13. How is the slider accessible?", "It is a native range input with a label, described-by feedback, and a value-text string. It supports keyboard adjustment and communicates severity."),
    ("14. How are animations made accessible?", "CSS honors prefers-reduced-motion, and Quiet motion shortens transitions. Dynamic changes are also announced through polite live regions."),
    ("15. Is the app production-safe for multiple accounts?", "Not yet. The snapshot uses one default ID and the dashboard API lacks user authorization. Production needs per-user identity, access control, validation, and protected provider tokens."),
]
for q, a in technical:
    add_qa(doc, q, a)

# Page 9: product viva and close
doc.add_page_break()
add_heading(doc, "8  Product and purpose viva questions", 1)
product = [
    ("1. What problem does BareMinimum address?", "Many trackers collect numbers without showing why they matter. BareMinimum connects small behavior changes to personal well-being, sustainable work, and responsible consumption."),
    ("2. Who is the target audience?", "Modern professionals, impact-driven teams, and conscious individuals who want a practical, low-pressure habit system."),
    ("3. Why these three UN goals?", "They connect individual behavior to health and well-being (Goal 3), fair and sustainable work (Goal 8), and responsible production and consumption (Goal 12)."),
    ("4. How is this different from a typical fitness tracker?", "It emphasizes cognitive ergonomics, recovery, focus boundaries, paperless choices, and reduced digital waste rather than steps and calorie burn alone."),
    ("5. Why use a bento dashboard?", "The modular layout lets people scan several related signals quickly while keeping each card focused and independently understandable."),
    ("6. Why does the app have an adaptive slider?", "A single number is hard to interpret. The slider changes its feedback based on the selected boundary and encourages a sustainable balance between output and recovery."),
    ("7. What is the purpose of the activity stack?", "It gives small actions a visible record and makes suggested actions completable without turning the experience into a competitive score chase."),
    ("8. What does the impact score mean?", "In this prototype it is a demonstration summary that rises when actions are logged or completed. A production score needs a documented, validated calculation and should avoid overstating real-world impact."),
    ("9. Why include a local preview?", "It makes the UI usable for demos and development when MongoDB is unavailable. The sync status keeps local-only data distinct from a successful server save."),
    ("10. Why is a sample community feed shown?", "It demonstrates the intended social context and activity layout. It must be replaced with consent-based, permissioned real data before being presented as live community activity."),
    ("11. How does the design reduce cognitive load?", "It prioritizes a few meaningful signals, concise feedback, consistent color roles, and low-friction actions rather than a large table of raw metrics."),
    ("12. What would you add next?", "Authentication and per-user Mongo data, a validated impact model, real integrations, user-controlled privacy settings, and automated accessibility/API tests."),
]
for q, a in product:
    add_qa(doc, q, a)
add_heading(doc, "Source files to open during a code review", 2)
add_table(doc, ["Topic", "Project file"], [
    ("Application routes and providers", "client/src/App.tsx"),
    ("React bootstrap and tRPC client", "client/src/main.tsx"),
    ("Dashboard interactions and persistence", "client/src/pages/Home.tsx"),
    ("Snapshot types and sample data", "client/src/app/models/dashboard.ts"),
    ("Browser cache fallback", "client/src/app/lib/dashboardStore.ts"),
    ("MongoDB implementation", "server/mongo.ts"),
    ("Express server and dashboard routes", "server/_core/index.ts"),
    ("Slider, widgets, activity, dialogs", "client/src/app/components/"),
], widths=[2.55, 4.95], font_size=8.3)
add_para(doc, "Use these answers as a starting point. Be explicit about what is a working interaction, what is sample data, and what needs server credentials before describing it as a live integration.", before=7, size=9, color=MUTED, italic=True)

doc.save(OUT)
print(OUT)
