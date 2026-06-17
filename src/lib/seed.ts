/* Seed script: realistic sample data for the Service Physics Client Hub prototype.
   Run with: npm run seed */
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "hub.db");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (fs.existsSync(DB_PATH)) fs.rmSync(DB_PATH);
for (const ext of ["-wal", "-shm"]) {
  const p = DB_PATH + ext;
  if (fs.existsSync(p)) fs.rmSync(p);
}

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

db.exec(fs.readFileSync(path.join(process.cwd(), "src/lib/schema.sql"), "utf-8"));

const daysAgo = (n: number, hour = 9, min = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, min, 0, 0);
  return d.toISOString().replace("T", " ").slice(0, 19);
};

const companies = [
  { name: "Harbor Light Coffee", industry: "Coffee / QSR", website: "harborlightcoffee.com", status: "active", notes: "32-unit drive-thru coffee chain, PNW. Throughput engagement in flight.",
    founded: 2012, hq: "Seattle, WA", employees: "~620", units: "32", ownership: "30 company-owned / 2 franchise", revenue: "$48M", focus: "Drive-thru coffee", competitors: "Dutch Bros, Starbucks, Black Rock" },
  { name: "Bluestone Burgers", industry: "Fast Casual", website: "bluestoneburgers.com", status: "active", notes: "Regional burger group, 18 units. Kitchen line redesign pilot.",
    founded: 2009, hq: "Portland, OR", employees: "~410", units: "18", ownership: "All company-owned", revenue: "$31M", focus: "Better-burger", competitors: "Shake Shack, Five Guys, Habit" },
  { name: "Cascade Hospitality Group", industry: "Full Service / Hotels", website: "cascadehg.com", status: "prospect", notes: "Operates 6 hotel F&B programs. Intro via referral from Dana.",
    founded: 1998, hq: "Bellevue, WA", employees: "~1,200", units: "6 hotels / 14 outlets", ownership: "Owner-operated", revenue: "$120M", focus: "Hotel F&B", competitors: "Sage Hospitality, Columbia Hospitality" },
  { name: "Sunrise Bakehouse", industry: "Bakery Cafe", website: "sunrisebakehouse.com", status: "prospect", notes: "Fast-growing bakery cafe, 11 units, CA. Interested in labor model.",
    founded: 2016, hq: "Oakland, CA", employees: "~240", units: "11", ownership: "All company-owned", revenue: "$19M", focus: "Bakery cafe", competitors: "La Boulangerie, Tartine, Panera" },
  { name: "Pacific Bowl Co.", industry: "Fast Casual", website: "pacificbowl.co", status: "active", notes: "Poke/bowl concept, 24 units. Service model assessment complete, phase 2 scoping.",
    founded: 2014, hq: "Honolulu, HI", employees: "~380", units: "24", ownership: "18 company-owned / 6 franchise", revenue: "$27M", focus: "Poke / bowls", competitors: "Poke Bros, Sweetgreen, Cava" },
  { name: "Timberline Taphouse", industry: "Casual Dining", website: "timberlinetaphouse.com", status: "past", notes: "Completed FOH service blueprint 2025. Good reference client.",
    founded: 2007, hq: "Bend, OR", employees: "~300", units: "9", ownership: "All company-owned", revenue: "$22M", focus: "Gastropub", competitors: "Yard House, BJ's, Deschutes" },
  { name: "Mesa Verde Cantina", industry: "Fast Casual", website: "mesaverdecantina.com", status: "prospect", notes: "TX-based, 40 units. Evaluating drive-thru addition.",
    founded: 2005, hq: "Austin, TX", employees: "~950", units: "40", ownership: "25 company-owned / 15 franchise", revenue: "$72M", focus: "Tex-Mex fast casual", competitors: "Chipotle, Qdoba, Torchy's" },
  { name: "Northgate Markets Deli", industry: "Grocery Foodservice", website: "northgatemarkets.com", status: "past", notes: "Deli counter flow study, wrapped Q4 2025.",
    founded: 1980, hq: "Anaheim, CA", employees: "~6,500", units: "41 stores", ownership: "Family-owned", revenue: "$1.1B", focus: "Hispanic grocery deli", competitors: "Vallarta, El Super, Cardenas" },
];
const insCompany = db.prepare("INSERT INTO companies (name, industry, website, status, notes, created_at) VALUES (?,?,?,?,?,?)");
const updateProfile = db.prepare("UPDATE companies SET year_founded=?, headquarters=?, employees=?, units=?, ownership=?, annual_revenue=?, focus_brand=?, competitors=? WHERE id=?");
companies.forEach((c, i) => {
  const id = Number(insCompany.run(c.name, c.industry, c.website, c.status, c.notes, daysAgo(300 - i * 20)).lastInsertRowid);
  updateProfile.run(c.founded, c.hq, c.employees, c.units, c.ownership, c.revenue, c.focus, c.competitors, id);
});

const contacts = [
  // [company_id, name, title, email, phone]
  [1, "Maya Lindqvist", "VP Operations", "maya@harborlightcoffee.com", "(206) 555-0142"],
  [1, "Tom Okafor", "Director of Training", "tom.okafor@harborlightcoffee.com", "(206) 555-0177"],
  [1, "Jess Param", "CFO", "jess@harborlightcoffee.com", "(206) 555-0119"],
  [2, "Carlos Mendoza", "COO", "carlos@bluestoneburgers.com", "(503) 555-0163"],
  [2, "Aimee Strand", "Sr. Ops Manager", "aimee@bluestoneburgers.com", "(503) 555-0128"],
  [3, "Dana Whitfield", "VP Food & Beverage", "dwhitfield@cascadehg.com", "(425) 555-0190"],
  [3, "Priya Raman", "Director of Outlets", "praman@cascadehg.com", "(425) 555-0144"],
  [4, "Ben Carver", "Founder / CEO", "ben@sunrisebakehouse.com", "(415) 555-0151"],
  [4, "Lucia Ortiz", "Head of People", "lucia@sunrisebakehouse.com", "(415) 555-0186"],
  [5, "Kai Nakamura", "CEO", "kai@pacificbowl.co", "(808) 555-0122"],
  [5, "Sophie Tran", "VP Ops", "sophie@pacificbowl.co", "(808) 555-0167"],
  [5, "Marcus Hill", "Regional Director", "marcus@pacificbowl.co", "(808) 555-0139"],
  [6, "Erin Doyle", "GM Operations", "erin@timberlinetaphouse.com", "(971) 555-0115"],
  [7, "Rafael Soto", "Chief Development Officer", "rsoto@mesaverdecantina.com", "(512) 555-0171"],
  [7, "Hannah Kim", "VP Operations", "hkim@mesaverdecantina.com", "(512) 555-0148"],
  [8, "Gloria Ibarra", "Foodservice Director", "gibarra@northgatemarkets.com", "(714) 555-0133"],
  [1, "Ravi Patel", "Director of Development", "ravi@harborlightcoffee.com", "(206) 555-0158"],
  [2, "Nate Bishop", "Franchise Ops Lead", "nate@bluestoneburgers.com", "(503) 555-0192"],
  [4, "Olivia Marsh", "Ops Analyst", "olivia@sunrisebakehouse.com", "(415) 555-0174"],
  [6, "Pete Lawson", "Owner", "pete@timberlinetaphouse.com", "(971) 555-0107"],
] as const;
const insContact = db.prepare("INSERT INTO contacts (company_id, name, title, email, phone, created_at) VALUES (?,?,?,?,?,?)");
contacts.forEach((c, i) => insContact.run(c[0], c[1], c[2], c[3], c[4], daysAgo(280 - i * 10)));

const engagements = [
  // [company_id, name, stage, value, owner, start, close, clickup]
  [1, "Drive-Thru Throughput Improvement", "won", 145000, "Steve", daysAgo(60), null, "CU-86dt1"],
  [1, "Barista Deployment Model Phase 2", "fee_proposal", 95000, "Steve", null, null, null],
  [2, "Kitchen Line Redesign Pilot", "won", 120000, "Jordan", daysAgo(45), null, "CU-86kl4"],
  [2, "Franchise Ops Playbook", "intro", 80000, "Jordan", null, null, null],
  [3, "Hotel F&B Service Model Assessment", "fee_proposal", 110000, "Steve", null, null, null],
  [4, "Labor Model Design", "pitch", 75000, "Tim", null, null, null],
  [5, "Service Model Assessment", "won", 90000, "Tim", daysAgo(180), daysAgo(95), "CU-86sm2"],
  [5, "Phase 2: Deployment & Training System", "no_fee_proposal", 160000, "Tim", null, null, null],
  [6, "FOH Service Blueprint", "won", 85000, "Jordan", daysAgo(400), daysAgo(310), null],
  [7, "Drive-Thru Feasibility Study", "intro", 65000, "Steve", null, null, null],
  [8, "Deli Counter Flow Study", "won", 55000, "Tim", daysAgo(250), daysAgo(180), null],
  [3, "Banquet Operations Diagnostic", "pitch", 70000, "Jordan", null, null, null],
] as const;
const insEng = db.prepare("INSERT INTO engagements (company_id, name, stage, value, owner, start_date, close_date, clickup_task_id) VALUES (?,?,?,?,?,?,?,?)");
engagements.forEach((e) => insEng.run(...e));

const emails = [
  // [contact_id, company_id, subject, snippet, direction, days_ago, hour]
  [1, 1, "Week 8 throughput numbers", "Maya - attached are the week 8 line-time results. Peak window cars/hour up 14% at the three pilot stores...", "out", 1, 16],
  [1, 1, "RE: Week 8 throughput numbers", "This is fantastic. Jess wants to walk through the ROI math before the board meeting on the 24th. Can you join Tuesday?", "in", 0, 8],
  [2, 1, "Training cascade for new deployment model", "Tom - here's the draft trainer guide for the deployment model. Flagging the order sequencing section for your review.", "out", 4, 10],
  [3, 1, "ROI summary for board deck", "Jess - quick summary ahead of Tuesday: pilot stores are annualizing +$212K incremental revenue on the throughput gains...", "out", 2, 14],
  [17, 1, "New store openings Q3", "Ravi - congrats on the Tacoma signing. Worth discussing how the new layout standards apply before permitting.", "out", 9, 11],
  [4, 2, "Pilot kitchen photos + observations", "Carlos - photos from yesterday's observation attached. The expo handoff point is still the bottleneck; 3 specific fixes below.", "out", 3, 17],
  [4, 2, "RE: Pilot kitchen photos + observations", "Agreed on all three. Aimee will schedule the line rebuild for Sunday night. Can your team be on site Monday?", "in", 2, 9],
  [5, 2, "Monday on-site confirmed", "Aimee - confirming Jordan and crew on site Monday 6am for the post-rebuild shakedown shift.", "out", 2, 12],
  [18, 2, "Franchise playbook scope question", "Nate - good question on whether the playbook covers new-store openings. Short answer: yes, as an appendix module...", "out", 12, 15],
  [6, 3, "Great meeting you at the Lodge", "Dana - really enjoyed the conversation about your outlet concepts. Sketching a diagnostic approach; proposal to you by Friday.", "out", 14, 13],
  [6, 3, "Proposal: Hotel F&B Service Model Assessment", "Dana - proposal attached. We structured it as a 6-week diagnostic across your three highest-volume outlets...", "out", 7, 10],
  [6, 3, "RE: Proposal: Hotel F&B Service Model Assessment", "Thanks Tim. Reviewing with Priya this week. One question on the banquet add-on scope - call Thursday?", "in", 5, 16],
  [7, 3, "Banquet diagnostic scope", "Priya - following up on Dana's note. The banquet diagnostic can run parallel to the outlet work; outline attached.", "out", 4, 9],
  [8, 4, "Labor model conversation", "Ben - great intro call. The 11-unit stage is exactly when a deliberate labor model pays off. Sample deliverables attached.", "out", 21, 11],
  [8, 4, "RE: Labor model conversation", "This resonates. Our labor % swings 4 points between stores with identical volume. Let's talk after our offsite next week.", "in", 18, 14],
  [9, 4, "Scheduling follow-up", "Lucia - Ben suggested we connect on the people side of the labor model. Free Thursday or Friday?", "out", 10, 10],
  [10, 5, "Phase 2 proposal", "Kai - Phase 2 proposal attached: deployment system design plus a train-the-trainer program across all 24 units.", "out", 6, 15],
  [10, 5, "RE: Phase 2 proposal", "Sophie and I read it on the flight back. Strong direction. Board reviews capex on the 15th; expect a decision right after.", "in", 3, 19],
  [11, 5, "Assessment final readout deck", "Sophie - final readout deck from the assessment attached, plus the appendix with store-level detail you asked for.", "out", 95, 13],
  [12, 5, "Regional rollout sequencing", "Marcus - draft sequencing puts your region first given manager tenure. Flag any store-level concerns by Friday.", "out", 8, 12],
  [13, 6, "Checking in + a case study", "Erin - it's been a few months since the blueprint rollout. How are the service scores trending? Case study draft attached.", "out", 30, 10],
  [13, 6, "RE: Checking in + a case study", "Scores holding strong - 4.6 average since launch. Case study looks great, Pete signed off. Happy to be a reference anytime.", "in", 27, 15],
  [14, 7, "Drive-thru feasibility - intro materials", "Rafael - following our call, here's how we'd approach feasibility across your 40 units: site screens, throughput model, capex bands.", "out", 11, 14],
  [14, 7, "RE: Drive-thru feasibility - intro materials", "Helpful framing. Hannah will pull the site data you listed. We're comparing this against an internal study - more in two weeks.", "in", 9, 10],
  [15, 7, "Site data checklist", "Hannah - checklist of the 9 data points we need per site. Happy to work directly with your real estate analyst.", "out", 8, 16],
  [16, 8, "Flow study results - final", "Gloria - final deli counter flow study attached. Wait-time reduction held at 31% across all measured dayparts.", "out", 180, 11],
  [16, 8, "RE: Flow study results - final", "Thank you - leadership was impressed. We'll reach out when budget opens for the hot bar project next fiscal year.", "in", 175, 9],
  [2, 1, "RE: Training cascade for new deployment model", "Reviewed - two edits on sequencing, otherwise ready. Can we print 40 copies for the trainer summit?", "in", 3, 8],
  [5, 2, "Shakedown shift results", "Aimee - Monday's shakedown went well. Ticket times down 22% vs. pre-rebuild baseline. Full notes attached.", "out", 1, 18],
  [11, 5, "Train-the-trainer candidates", "Sophie - for Phase 2 planning, we'd want 6-8 trainer candidates. Criteria list attached for your shortlist.", "out", 2, 11],
  [9, 4, "RE: Scheduling follow-up", "Friday 10am works. I'll bring our current scheduling templates so you can see the mess we're working with :)", "in", 9, 12],
  [12, 5, "RE: Regional rollout sequencing", "Two concerns: Kona store is mid-remodel, and the Hilo GM is new. Suggest swapping them to wave 3.", "in", 7, 9],
  [7, 3, "RE: Banquet diagnostic scope", "Outline looks right. If the board approves the outlet assessment, we'd want banquets to start within 30 days after.", "in", 2, 13],
  [19, 4, "Data request for labor analysis", "Olivia - ahead of Friday, could you pull 8 weeks of POS half-hourly sales and the matching schedules for 3 stores?", "out", 5, 14],
  [20, 6, "Reference call for a prospect", "Pete - would you be open to a 20-min reference call with a hotel group evaluating similar work? They asked specifically about results.", "out", 6, 10],
  [20, 6, "RE: Reference call for a prospect", "Of course. Tuesdays or Wednesdays after 2pm are best. Happy to share what the blueprint did for our covers per labor hour.", "in", 5, 11],
  [1, 1, "Board meeting prep call", "Maya - agenda for Tuesday's prep: ROI walkthrough, expansion-store assumptions, and the Phase 2 proposal timing.", "out", 1, 9],
  [10, 5, "Quick check-in before the 15th", "Kai - anything else the board needs from us before the capex review? Happy to do a 15-min Q&A with the finance team.", "out", 1, 12],
  [3, 1, "RE: ROI summary for board deck", "Perfect, exactly what I needed. One follow-up: can you split the labor savings from the revenue lift in the annualized number?", "in", 1, 15],
  [8, 4, "Offsite takeaways + next steps", "Ben - heard the offsite went well. Ready to pick the labor model conversation back up whenever you are.", "out", 2, 16],
] as const;
const insEmail = db.prepare("INSERT INTO emails (contact_id, company_id, subject, snippet, body, direction, sent_at, outlook_id) VALUES (?,?,?,?,?,?,?,?)");
emails.forEach((e, i) => {
  const [contactId, companyId, subject, snippet, direction, days, hour] = e;
  insEmail.run(contactId, companyId, subject, snippet, snippet + "\n\n(Full message body would sync from Outlook via Microsoft Graph.)", direction, daysAgo(days as number, hour as number, (i * 7) % 60), `AAMkAD-stub-${i + 1}`);
});

const documents = [
  [1, 1, "Harbor Light - Throughput Pilot Readout.pptx", "deck", "sharepoint", 2],
  [1, 1, "Drive-Thru Time Study Data.xlsx", "report", "sharepoint", 5],
  [1, 2, "Phase 2 Proposal - Barista Deployment.docx", "proposal", "onedrive", 6],
  [2, 3, "Bluestone Kitchen Line Redesign Plan.pptx", "deck", "sharepoint", 3],
  [2, 3, "Pilot Store Observation Notes.docx", "report", "onedrive", 4],
  [3, 5, "Cascade HG - F&B Assessment Proposal.docx", "proposal", "onedrive", 7],
  [3, 5, "Cascade HG - MSA Draft.docx", "contract", "sharepoint", 7],
  [4, 6, "Sunrise Bakehouse - Labor Model One-Pager.pptx", "deck", "onedrive", 10],
  [5, 7, "Pacific Bowl - Assessment Final Readout.pptx", "deck", "sharepoint", 95],
  [5, 8, "Phase 2 Proposal - Deployment & Training.docx", "proposal", "onedrive", 6],
  [5, 8, "Trainer Candidate Criteria.docx", "report", "onedrive", 2],
  [6, 9, "Timberline - FOH Service Blueprint (Final).pdf", "report", "sharepoint", 310],
  [6, 9, "Timberline Case Study Draft.docx", "report", "onedrive", 30],
  [7, 10, "Mesa Verde - Drive-Thru Feasibility Approach.pptx", "deck", "sharepoint", 11],
  [8, 11, "Northgate - Deli Flow Study Final.pdf", "report", "sharepoint", 180],
  [1, null, "Harbor Light - SOW Amendment 2.pdf", "contract", "sharepoint", 20],
] as const;
const insDoc = db.prepare("INSERT INTO documents (company_id, engagement_id, name, type, source, url, updated_at) VALUES (?,?,?,?,?,?,?)");
documents.forEach((d, i) => {
  const [companyId, engId, name, type, source, days] = d;
  const host = source === "sharepoint" ? "servicephysics.sharepoint.com/sites/clients" : "1drv.ms/f";
  insDoc.run(companyId, engId, name, type, source, `https://${host}/doc-stub-${i + 1}`, daysAgo(days as number, 12));
});

const tasks = [
  // [engagement_id, company_id, title, status, assignee, due_in_days, clickup, synced]
  [1, 1, "Prep board meeting ROI walkthrough", "in_progress", "Steve", 2, "CU-901", true],
  [1, 1, "Finalize week 9 time study schedule", "todo", "Jordan", 4, "CU-902", true],
  [1, 1, "Update trainer guide with Tom's edits", "review", "Tim", 1, "CU-903", true],
  [2, 1, "Send Phase 2 proposal revision", "todo", "Steve", 3, null, false],
  [3, 2, "Compile shakedown shift report", "done", "Jordan", -1, "CU-904", true],
  [3, 2, "Design expo handoff fix package", "in_progress", "Jordan", 5, "CU-905", true],
  [3, 2, "Schedule week 4 observation visit", "todo", "Jordan", 7, null, false],
  [5, 3, "Prep Thursday banquet scope call", "in_progress", "Tim", 0, "CU-906", true],
  [5, 3, "Revise proposal with banquet add-on", "todo", "Tim", 6, null, false],
  [6, 4, "Build labor data request template", "done", "Tim", -3, "CU-907", true],
  [6, 4, "Friday session prep - Lucia + Olivia", "in_progress", "Tim", 1, null, false],
  [8, 5, "Draft train-the-trainer curriculum outline", "todo", "Steve", 9, "CU-908", true],
  [8, 5, "Finance team Q&A availability", "review", "Tim", 2, null, false],
  [10, 7, "Review Mesa Verde site data submission", "todo", "Steve", 12, null, false],
  [null, 6, "Schedule Pete reference call with Cascade", "in_progress", "Jordan", 1, "CU-909", true],
  [null, null, "Q3 pipeline review - partner meeting", "todo", "Steve", 8, "CU-910", true],
  [9, 6, "Publish Timberline case study to site", "review", "Jordan", 5, null, false],
  [null, 1, "Renew Harbor Light MSA before Aug 1", "todo", "Tim", 30, null, false],
  [4, 2, "Outline franchise playbook modules", "todo", "Jordan", 14, null, false],
  [11, 8, "Northgate hot bar follow-up (next FY)", "todo", "Tim", 60, null, false],
] as const;
const insTask = db.prepare("INSERT INTO tasks (engagement_id, company_id, title, status, assignee, due_date, clickup_task_id, synced_at) VALUES (?,?,?,?,?,?,?,?)");
tasks.forEach((t) => {
  const [engId, companyId, title, status, assignee, dueIn, clickup, synced] = t;
  insTask.run(engId, companyId, title, status, assignee, daysAgo(-(dueIn as number), 17).slice(0, 10), clickup, synced ? daysAgo(0, 7) : null);
});

const activities = [
  // [company_id, contact_id, kind, body, days_ago]
  [1, 1, "meeting", "On-site week 8 review with Maya and store managers. Pilot stores exceeding throughput targets.", 1],
  [1, 3, "note", "Jess wants labor savings split from revenue lift in ROI math. Update model before Tuesday.", 1],
  [1, 1, "stage_change", "Drive-Thru Throughput Improvement moved to Active.", 60],
  [1, 2, "email", "Sent trainer guide draft to Tom for review.", 4],
  [2, 4, "meeting", "Pilot kitchen observation with Carlos. Expo handoff still the bottleneck; rebuild scheduled Sunday.", 3],
  [2, 5, "email", "Confirmed Monday 6am on-site for shakedown shift.", 2],
  [2, 4, "note", "Carlos hinted at board interest in a system-wide rollout if pilot ticket times hold under 6:30.", 2],
  [3, 6, "meeting", "Intro meeting with Dana at the Lodge. Three outlet concepts, banquets a possible second phase.", 14],
  [3, 6, "email", "Sent 6-week diagnostic proposal.", 7],
  [3, 7, "note", "Priya is the operational decision-maker; Dana owns budget. Keep both on every thread.", 4],
  [4, 8, "email", "Intro call follow-up with sample labor model deliverables.", 21],
  [4, 9, "meeting", "Scheduled Friday 10am working session with Lucia and Olivia on scheduling data.", 9],
  [4, 8, "note", "Ben's labor % swings 4 points between identical-volume stores. Strong hook for the proposal.", 18],
  [5, 10, "email", "Sent Phase 2 proposal: deployment system + train-the-trainer across 24 units.", 6],
  [5, 10, "note", "Capex decision expected right after board review on the 15th. Offer finance Q&A before then.", 3],
  [5, 12, "email", "Marcus flagged Kona remodel and new Hilo GM; swap both stores to wave 3.", 7],
  [5, 11, "stage_change", "Service Model Assessment closed won; final readout delivered.", 95],
  [6, 13, "email", "Erin confirmed 4.6 service score average since blueprint launch. Case study approved.", 27],
  [6, 20, "task", "Pete agreed to reference call for Cascade. Schedule Tue/Wed after 2pm.", 5],
  [7, 14, "email", "Sent drive-thru feasibility approach. Competing against an internal study; decision in ~2 weeks.", 11],
  [7, 15, "note", "Hannah pulling site data per our 9-point checklist. Real estate analyst is the working contact.", 8],
  [8, 16, "email", "Gloria: leadership impressed with flow study, hot bar project possible next fiscal year.", 175],
  [1, 17, "note", "Tacoma store signed. New layout standards should inform permitting set - raise on next call.", 9],
  [2, 18, "email", "Answered Nate's playbook scope question: new-store openings covered as appendix module.", 12],
  [5, 11, "email", "Sent trainer candidate criteria for Sophie's shortlist (6-8 people).", 2],
  [3, 7, "email", "Priya: if board approves outlets, banquets start within 30 days after.", 2],
  [1, 1, "task", "Board prep call scheduled for Tuesday: ROI, expansion assumptions, Phase 2 timing.", 1],
  [4, 19, "email", "Requested 8 weeks of POS half-hourly sales + schedules for 3 stores from Olivia.", 5],
  [6, 13, "stage_change", "FOH Service Blueprint closed won.", 310],
  [8, 16, "stage_change", "Deli Counter Flow Study closed won.", 180],
] as const;
const insAct = db.prepare("INSERT INTO activities (company_id, contact_id, kind, body, created_at) VALUES (?,?,?,?,?)");
activities.forEach((a, i) => insAct.run(a[0], a[1], a[2], a[3], daysAgo(a[4] as number, 9 + (i % 8))));

const meetings = [
  // [company_id, contact_id, title, source, days_ago, hour, duration, summary, action_items[]]
  [1, 1, "Harbor Light: Week 8 Pilot Review", "zoom", 1, 14, 45,
    "Reviewed week 8 throughput results with Maya and store managers. Pilot stores at +14% cars/hour in peak window. Jess (CFO) wants ROI math split into labor savings vs revenue lift before the board meeting on the 24th. Team aligned on expanding time studies to 3 more stores in week 9.",
    ["Split ROI model into labor vs revenue components (Steve, before Tue)", "Schedule week 9 time studies at Ballard, Fremont, Tacoma", "Send board-ready one-pager to Jess by Monday EOD"]],
  [2, 4, "Bluestone: Post-Rebuild Shakedown Debrief", "granola", 1, 10, 30,
    "Monday's shakedown shift after the Sunday line rebuild went well: ticket times down 22% vs baseline. Expo handoff fix working. Carlos hinted the board wants a system-wide rollout case if times hold under 6:30 for two more weeks.",
    ["Compile shakedown report with photos (Jordan)", "Track ticket times daily for 2 weeks", "Draft system-wide rollout business case outline"]],
  [3, 6, "Cascade HG: Proposal Walkthrough", "zoom", 5, 16, 60,
    "Walked Dana and Priya through the 6-week outlet diagnostic. Strong reception; main question was banquet add-on sequencing. Priya confirmed banquets should start within 30 days of outlet work if approved. Board review expected next week.",
    ["Revise proposal with banquet add-on as phase 1b", "Send updated timeline to Dana by Thursday", "Prep finance Q&A doc for their board review"]],
  [4, 8, "Sunrise Bakehouse: Intro Working Session", "otter", 9, 10, 50,
    "Ben walked through unit economics: labor swings 4 points between identical-volume stores. Lucia raised scheduling consistency concerns; current templates are store-manager improvised. Olivia can pull 8 weeks of POS half-hourly data.",
    ["Send data request template to Olivia", "Prep Friday session agenda with Lucia", "Draft labor model proposal skeleton"]],
  [5, 10, "Pacific Bowl: Phase 2 Scope Alignment", "zoom", 3, 11, 40,
    "Kai and Sophie aligned on Phase 2 scope: deployment system plus train-the-trainer across 24 units. Board capex review on the 15th; decision expected immediately after. Marcus flagged Kona remodel and new Hilo GM, so those stores move to wave 3.",
    ["Offer 15-min finance Q&A before the 15th", "Update rollout sequencing: Kona + Hilo to wave 3", "Shortlist 6-8 trainer candidates with Sophie"]],
  [1, 2, "Trainer Guide Working Session", "granola", 4, 13, 35,
    "Walked Tom through the draft trainer guide. Two sequencing edits agreed; otherwise approved. Tom wants 40 printed copies for the trainer summit and asked about a quick-reference card version.",
    ["Apply Tom's two sequencing edits", "Arrange 40 print copies for summit", "Scope a pocket quick-reference card"]],
  [7, 14, "Mesa Verde: Feasibility Kickoff Call", "otter", 11, 15, 45,
    "Rafael outlined the internal drive-thru study they're comparing against. Our approach differs on throughput modeling and capex banding. Hannah owns the site data pull; their real estate analyst will work from our 9-point checklist.",
    ["Send site data checklist to Hannah", "Position differentiation memo vs internal study", "Follow up in 2 weeks on decision timeline"]],
  [6, 13, "Timberline: Case Study Review", "zoom", 27, 14, 25,
    "Erin confirmed service scores holding at 4.6 since blueprint launch. Pete signed off on the case study. Both open to reference calls for prospects.",
    ["Finalize case study for website", "Add Timberline to reference list"]],
  [5, 11, "Trainer Criteria Sync", "granola", 2, 9, 20,
    "Quick sync with Sophie on trainer candidate criteria. Agreed on 6-8 candidates, mix of tenure and store performance. Sophie shortlisting by Friday.",
    ["Review Sophie's shortlist Friday", "Draft trainer assessment rubric"]],
  [1, 3, "Board Prep: ROI Walkthrough", "zoom", 0, 9, 30,
    "Prepped Jess for the board meeting: walked through annualized +$212K incremental revenue, split labor savings line item as requested. Jess comfortable presenting; wants us on standby for the Phase 2 timing discussion.",
    ["Be available during board meeting on the 24th", "Send final deck PDF to Jess today"]],
] as const;
const insMeeting = db.prepare("INSERT INTO meetings (company_id, contact_id, title, source, occurred_at, duration_min, summary, action_items, external_id) VALUES (?,?,?,?,?,?,?,?,?)");
meetings.forEach((m, i) => {
  const [companyId, contactId, title, source, days, hour, dur, summary, items] = m;
  insMeeting.run(companyId, contactId, title, source, daysAgo(days as number, hour as number), dur, summary, JSON.stringify(items), `${source}-stub-${i + 1}`);
});

// Dormant past clients (no touch in 6+ months) to drive the re-engagement alert.
const dormant = [
  {
    name: "Lakeside Grill Group", industry: "Casual Dining", website: "lakesidegrill.com",
    notes: "FOH service blueprint delivered 2025. Went quiet after handoff.",
    contact: ["Marisol Reyes", "VP Operations", "marisol@lakesidegrill.com", "(312) 555-0148"],
    engagement: ["FOH Service Blueprint", 95000, 430, 395],
    lastTouchDays: 395,
    email: ["Final blueprint delivered + 90-day check-in offer", "Marisol - final FOH blueprint attached. Happy to run a 90-day check-in once it's bedded in."],
    activity: "Closed out FOH blueprint engagement. Flagged for a re-engagement check-in.",
  },
  {
    name: "Cedar & Sage Catering", industry: "Catering / Events", website: "cedarandsage.co",
    notes: "Event-ops throughput study wrapped early 2026. No follow-on scoped.",
    contact: ["Daniel Fitch", "Owner", "daniel@cedarandsage.co", "(503) 555-0162"],
    engagement: ["Event Ops Throughput Study", 60000, 300, 250],
    lastTouchDays: 245,
    email: ["Throughput study results + next steps", "Daniel - results attached. Worth revisiting staffing model before next event season."],
    activity: "Delivered event-ops study. Potential seasonal follow-on to revisit.",
  },
] as const;
dormant.forEach((d) => {
  const companyId = Number(insCompany.run(d.name, d.industry, d.website, "past", d.notes, daysAgo(760)).lastInsertRowid);
  const contactId = Number(insContact.run(companyId, d.contact[0], d.contact[1], d.contact[2], d.contact[3], daysAgo(740)).lastInsertRowid);
  insEng.run(companyId, d.engagement[0], "won", d.engagement[1], "Jordan", daysAgo(d.engagement[2]), daysAgo(d.engagement[3]), null);
  insEmail.run(contactId, companyId, d.email[0], d.email[1], d.email[1], "out", daysAgo(d.lastTouchDays, 11), `AAMkAD-dormant-${companyId}`);
  insAct.run(companyId, contactId, "note", d.activity, daysAgo(d.lastTouchDays, 12));
});

// Forward-looking 2027 planning items so the year filter has data across 2025-2027.
const future = (n: number) => daysAgo(-n, 12); // negative days = future dates
insEng.run(1, "Harbor Light 2027 Regional Expansion", "intro", 180000, "Steve", future(210), future(560), null);
insEng.run(5, "Pacific Bowl Annual Optimization Retainer", "fee_proposal", 220000, "Tim", future(230), future(500), null);
insEng.run(3, "Cascade HG 2027 Multi-Property Rollout", "pitch", 260000, "Jordan", future(260), future(540), null);

insTask.run(null, 1, "Kick off Harbor Light 2027 expansion scoping", "todo", "Steve", "2027-01-15", null, null);
insTask.run(null, 5, "Prep Pacific Bowl 2027 retainer SOW", "todo", "Tim", "2027-02-02", null, null);
insTask.run(null, 3, "Cascade 2027 annual planning workshop", "todo", "Jordan", "2027-03-10", null, null);
insTask.run(null, 1, "Harbor Light Q1 2027 throughput re-baseline", "todo", "Jordan", "2027-04-05", null, null);

// Inbound website leads (Contact Us submissions) -> prospect profile + activity + task.
const insLead = db.prepare("INSERT INTO leads (name, email, company, phone, message, source, status, company_id, contact_id, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)");
const leads = [
  {
    name: "Priya Anand", email: "priya@coastalgreens.com", company: "Coastal Greens", phone: "(619) 555-0188",
    message: "We run 14 fast-casual salad locations and are struggling with throughput at lunch. Saw your drive-thru work, can we talk?",
    industry: "Fast Casual", days: 1,
  },
  {
    name: "Marcus Webb", email: "mwebb@stonefirepizza.com", company: "Stonefire Pizza Co.", phone: "(480) 555-0133",
    message: "Interested in a kitchen line assessment across our 9 units before we expand. What does engagement look like?",
    industry: "Fast Casual", days: 0,
  },
];
leads.forEach((l) => {
  const cid = Number(insCompany.run(l.company, l.industry, l.email.split("@")[1], "prospect", "Created from a website contact-form submission.", daysAgo(l.days, 9)).lastInsertRowid);
  const ctid = Number(insContact.run(cid, l.name, "Website inquiry", l.email, l.phone, daysAgo(l.days, 9)).lastInsertRowid);
  insAct.run(cid, ctid, "lead", `Website inquiry from ${l.name} (${l.email}): ${l.message}`, daysAgo(l.days, 9));
  insLead.run(l.name, l.email, l.company, l.phone, l.message, "website", "new", cid, ctid, daysAgo(l.days, 9));
  insTask.run(null, cid, `Follow up: ${l.name} (${l.company}), website inquiry`, "todo", "Steve", daysAgo(-2, 17).slice(0, 10), null, null);
});

// Team access levels (used once Microsoft sign-in is enabled).
const insUser = db.prepare("INSERT INTO users (email, name, role) VALUES (?,?,?)");
[
  ["tim@servicephysics.com", "Tim Cashman", "admin"],
  ["steve@servicephysics.com", "Steve Macias", "member"],
  ["jordan@servicephysics.com", "Jordan Pratt", "member"],
  ["dana@servicephysics.com", "Dana Whitfield", "contributor"],
  ["alex@servicephysics.com", "Alex Romero", "observer"],
].forEach((u) => insUser.run(u[0], u[1], u[2]));

// Real client roster imported from the ClickUp Client Database doc (28qcm-10410).
// Status mapped from the doc bucket; original bucket kept in notes. Profile fields
// left blank (not fabricated), enrich per-client from ClickUp on request.
const realClients: { bucket: string; status: string; names: string[] }[] = [
  { bucket: "Active Funnel", status: "prospect", names: [
    "AOSN (Percheron)", "Highlands Coffee", "Starbucks", "Counter Service", "Montucky Cold Snack (EJ Gallo)",
    "Bagel Brands", "BJs Restaurants", "Cava", "Habit Burger", "Veritas Veterinary", "Goddard Schools",
    "Blaze Pizza", "Cartier", "GSP", "JSX", "Casey's", "Whataburger", "Wonder", "Smalls Sliders",
    "Insomnia Cookies", "Panera Bread", "Vail Resorts", "Great Harvest Bakery and Cafe", "Smashburger",
    "DaVita Hospital Services", "Roark Capital", "Restaurant Brands International (RBI)", "Subway",
    "Sweetgreen", "Swish", "Wendy's", "Golden West Food", "HAWKERS",
  ] },
  { bucket: "Funnel", status: "prospect", names: [
    "Millburn Deli", "Dutch Brothers", "Seattle Bouldering Project", "Wingstop", "Sasse Server (Liz Moscow)",
    "Mass Bay Brewing Company (MBBC)", "Washington State Energy", "Island Grill Jamaica", "WoodStone",
  ] },
  { bucket: "Active", status: "active", names: ["Peet's Coffee", "NomadGo", "Panda Express", "DaVita Kidney Care"] },
  { bucket: "Past", status: "past", names: [
    "Dave's Hot Chicken", "Brinker (Chili's)", "Fuzzy's Taco Shop", "Hometown Healthcare", "Compass",
    "MOD Pizza", "Dine Brands", "Pernod Ricard", "IHOP", "Bar Taco", "Sesame", "Candy Kingdom", "Melt Shop",
    "People's", "Willo", "Fields Good Chicken", "First Watch", "The Little Beet", "Delaware North", "On Ramp",
    "Top Golf", "Le Pain Quotidien",
  ] },
  { bucket: "Lost", status: "past", names: [
    "CorePower Yoga", "Pizza Hut", "DaVita IKC", "Take 5 Oil", "Highlands Coffee (Vietnam)", "Blue Cardinal",
    "Killer Burger", "Pizza Hut - Yum Brands", "BB & Cross/Abbott", "Cilantro Cafe", "Caliber Car Wash",
    "Nicola Wealth", "Tommy Bahama", "Andersen Windows & Doors", "Northgate", "El Moro", "SPB Hospitality",
  ] },
];
// Real profiles parsed from the ClickUp client pages (only clients with real data).
const clientProfiles: Record<string, {
  website?: string; industry?: string; year_founded?: number; headquarters?: string;
  employees?: string; units?: string; ownership?: string; annual_revenue?: string;
  focus_brand?: string; competitors?: string; summary?: string;
}> = JSON.parse(fs.readFileSync(path.join(process.cwd(), "src/lib/client-profiles.json"), "utf-8"));

const enrich = db.prepare(
  "UPDATE companies SET industry=?, website=?, notes=?, year_founded=?, headquarters=?, employees=?, units=?, ownership=?, annual_revenue=?, focus_brand=?, competitors=? WHERE id=?"
);

let realCount = 0, enrichedCount = 0;
realClients.forEach((group) => {
  group.names.forEach((name, i) => {
    const id = Number(
      insCompany.run(name, null, null, group.status, `Imported from ClickUp Client Database · ${group.bucket}`, daysAgo(120 + i * 3)).lastInsertRowid
    );
    realCount++;
    const p = clientProfiles[name];
    if (p) {
      const notes = `ClickUp · ${group.bucket}${p.summary ? ` · ${p.summary}` : ""}`;
      enrich.run(
        p.industry ?? null, p.website ?? null, notes, p.year_founded ?? null, p.headquarters ?? null,
        p.employees ?? null, p.units ?? null, p.ownership ?? null, p.annual_revenue ?? null,
        p.focus_brand ?? null, p.competitors ?? null, id
      );
      enrichedCount++;
    }
  });
});
console.log(`Imported ${realCount} real clients from ClickUp (${enrichedCount} enriched with profile data).`);

db.prepare("INSERT INTO settings (key, value) VALUES ('seeded_at', datetime('now'))").run();

const counts = ["companies", "contacts", "engagements", "emails", "documents", "tasks", "activities", "meetings"]
  .map((t) => `${t}: ${(db.prepare(`SELECT COUNT(*) c FROM ${t}`).get() as { c: number }).c}`)
  .join(", ");
console.log("Seeded -", counts);
db.close();
