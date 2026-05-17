import { useState, useEffect, useCallback, useRef } from "react";

/* ─── Constants ──────────────────────────────────────────── */
const TABS = [
  { id:"dashboard", label:"Dashboard",      icon:"⚡" },
  { id:"irs",       label:"IRS Updates",    icon:"🏛️" },
  { id:"laws",      label:"Law Changes",    icon:"⚖️" },
  { id:"rates",     label:"Exchange Rates", icon:"💱" },
  { id:"calendar",  label:"Tax Calendar",   icon:"📅" },
  { id:"ask",       label:"Ask LexLive",    icon:"🔍" },
];

const CURRENCIES = [
  { code:"EUR", name:"Euro",               flag:"🇪🇺", country:"Eurozone" },
  { code:"GBP", name:"British Pound",      flag:"🇬🇧", country:"United Kingdom" },
  { code:"JPY", name:"Japanese Yen",       flag:"🇯🇵", country:"Japan" },
  { code:"CAD", name:"Canadian Dollar",    flag:"🇨🇦", country:"Canada" },
  { code:"AUD", name:"Australian Dollar",  flag:"🇦🇺", country:"Australia" },
  { code:"CHF", name:"Swiss Franc",        flag:"🇨🇭", country:"Switzerland" },
  { code:"CNY", name:"Chinese Yuan",       flag:"🇨🇳", country:"China" },
  { code:"INR", name:"Indian Rupee",       flag:"🇮🇳", country:"India" },
  { code:"PKR", name:"Pakistani Rupee",    flag:"🇵🇰", country:"Pakistan" },
  { code:"SAR", name:"Saudi Riyal",        flag:"🇸🇦", country:"Saudi Arabia" },
  { code:"AED", name:"UAE Dirham",         flag:"🇦🇪", country:"UAE" },
  { code:"MXN", name:"Mexican Peso",       flag:"🇲🇽", country:"Mexico" },
  { code:"BRL", name:"Brazilian Real",     flag:"🇧🇷", country:"Brazil" },
  { code:"SGD", name:"Singapore Dollar",   flag:"🇸🇬", country:"Singapore" },
  { code:"HKD", name:"Hong Kong Dollar",   flag:"🇭🇰", country:"Hong Kong" },
  { code:"KRW", name:"South Korean Won",   flag:"🇰🇷", country:"South Korea" },
  { code:"SEK", name:"Swedish Krona",      flag:"🇸🇪", country:"Sweden" },
  { code:"NOK", name:"Norwegian Krone",    flag:"🇳🇴", country:"Norway" },
  { code:"ZAR", name:"South African Rand", flag:"🇿🇦", country:"South Africa" },
  { code:"TRY", name:"Turkish Lira",       flag:"🇹🇷", country:"Turkey" },
  { code:"NZD", name:"New Zealand Dollar", flag:"🇳🇿", country:"New Zealand" },
  { code:"THB", name:"Thai Baht",          flag:"🇹🇭", country:"Thailand" },
  { code:"MYR", name:"Malaysian Ringgit",  flag:"🇲🇾", country:"Malaysia" },
  { code:"IDR", name:"Indonesian Rupiah",  flag:"🇮🇩", country:"Indonesia" },
  { code:"PHP", name:"Philippine Peso",    flag:"🇵🇭", country:"Philippines" },
  { code:"EGP", name:"Egyptian Pound",     flag:"🇪🇬", country:"Egypt" },
  { code:"KWD", name:"Kuwaiti Dinar",      flag:"🇰🇼", country:"Kuwait" },
  { code:"QAR", name:"Qatari Riyal",       flag:"🇶🇦", country:"Qatar" },
  { code:"BDT", name:"Bangladeshi Taka",   flag:"🇧🇩", country:"Bangladesh" },
];
const ALL_CURRENCIES = [{ code:"USD", name:"US Dollar", flag:"🇺🇸", country:"United States" }, ...CURRENCIES];

const DEADLINES = [
  { month:0,  day:15, label:"Q4 Estimated Tax Payment",              tag:"Quarterly",     urgent:false, form:"1040-ES",    desc:"Pay 4th quarter estimated taxes to avoid underpayment penalties." },
  { month:0,  day:31, label:"W-2 & 1099 Forms Issued to Recipients", tag:"Employer",      urgent:false, form:"W-2/1099",   desc:"Employers must send W-2s and 1099s to recipients by this date." },
  { month:2,  day:15, label:"S-Corp & Partnership Returns Due",      tag:"Business",      urgent:false, form:"1065/1120-S",desc:"Pass-through entities must file or request a 6-month extension." },
  { month:3,  day:15, label:"Individual Income Tax Return Due",      tag:"Individual",    urgent:true,  form:"1040",       desc:"File your federal return or Form 4868 for an automatic 6-month extension." },
  { month:3,  day:15, label:"Q1 Estimated Tax Payment",              tag:"Quarterly",     urgent:true,  form:"1040-ES",    desc:"First quarter estimated payment for self-employed and investors." },
  { month:3,  day:15, label:"IRA & HSA Contribution Deadline",       tag:"Retirement",    urgent:false, form:"IRA/HSA",    desc:"Last chance to make prior-year IRA and HSA contributions." },
  { month:4,  day:15, label:"FBAR Filing Deadline",                  tag:"International", urgent:false, form:"FinCEN 114", desc:"Required if foreign accounts exceeded $10,000 at any point during the year." },
  { month:5,  day:16, label:"Q2 Estimated Tax Payment",              tag:"Quarterly",     urgent:false, form:"1040-ES",    desc:"Second quarter estimated payment due." },
  { month:5,  day:15, label:"Non-Profit Returns Due",                tag:"Non-Profit",    urgent:false, form:"990",        desc:"Tax-exempt organizations file their annual information returns." },
  { month:8,  day:15, label:"Q3 Estimated Tax Payment",              tag:"Quarterly",     urgent:false, form:"1040-ES",    desc:"Third quarter estimated payment due." },
  { month:9,  day:15, label:"Extended Individual Return Deadline",   tag:"Individual",    urgent:false, form:"1040",       desc:"Final deadline if you filed Form 4868 in April." },
  { month:11, day:31, label:"Year-End Tax Planning Deadline",        tag:"Planning",      urgent:false, form:"Various",    desc:"Last day for tax-loss harvesting, Roth conversions, and charitable gifts." },
  { month:11, day:31, label:"Required Minimum Distributions",        tag:"Retirement",    urgent:false, form:"RMD",        desc:"Taxpayers over 73 must take their RMD from traditional IRAs and 401(k)s." },
];

const MONTHS       = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/* ─── API helpers ────────────────────────────────────────── */

// IRS news via RSS→JSON proxy (free, no key needed)
async function fetchIRS() {
  const RSS = "https://www.irs.gov/rss-feeds/news-releases-for-current-month";
  const url = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(RSS)}&count=12`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("IRS fetch failed");
  const data = await res.json();
  if (data.status !== "ok") throw new Error("IRS RSS error");
  return (data.items || []).map(item => ({
    title:    item.title || "",
    date:     item.pubDate ? new Date(item.pubDate).toLocaleDateString("en-US",{ month:"short", day:"numeric", year:"numeric" }) : "",
    summary:  (item.description || "").replace(/<[^>]+>/g,"").slice(0, 220).trim() + "…",
    link:     item.link || "",
    category: guessIRSCategory(item.title || ""),
  })).filter(i => i.title);
}

function guessIRSCategory(title) {
  const t = title.toLowerCase();
  if (t.includes("relief") || t.includes("disaster")) return "Tax Relief";
  if (t.includes("credit")) return "Credits";
  if (t.includes("penalty") || t.includes("fine")) return "Penalty";
  if (t.includes("rate") || t.includes("interest")) return "Rates";
  if (t.includes("filing") || t.includes("deadline") || t.includes("extension")) return "Filing";
  if (t.includes("international") || t.includes("foreign") || t.includes("offshore")) return "International";
  if (t.includes("enforcement") || t.includes("audit") || t.includes("fraud") || t.includes("criminal")) return "Enforcement";
  return "Guidance";
}

// Recently enacted US laws via GovTrack API (free, no key needed)
async function fetchLaws() {
  const url = "https://www.govtrack.us/api/v2/bill?congress=119&current_status=enacted_signed&order_by=-current_status_date&limit=10&fields=title,current_status_date,bill_type,number,display_number,introduced_date,sponsor,committees,link";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Laws fetch failed");
  const data = await res.json();
  return (data.objects || []).map(bill => ({
    name:    bill.display_number ? `${bill.display_number}: ${bill.title}` : bill.title,
    date:    bill.current_status_date ? new Date(bill.current_status_date).toLocaleDateString("en-US",{ month:"short", day:"numeric", year:"numeric" }) : "",
    status:  "Signed into Law",
    link:    bill.link ? `https://www.govtrack.us${bill.link}` : "",
    area:    guessBillArea(bill.title || ""),
  })).filter(b => b.name);
}

function guessBillArea(title) {
  const t = title.toLowerCase();
  if (t.includes("tax") || t.includes("revenue") || t.includes("irs")) return "Tax";
  if (t.includes("health") || t.includes("medicare") || t.includes("medicaid")) return "Healthcare";
  if (t.includes("immigration") || t.includes("border") || t.includes("visa")) return "Immigration";
  if (t.includes("defense") || t.includes("military") || t.includes("army") || t.includes("veteran")) return "Defense";
  if (t.includes("environment") || t.includes("climate") || t.includes("energy")) return "Environment";
  if (t.includes("housing") || t.includes("rent") || t.includes("mortgage")) return "Housing";
  if (t.includes("labor") || t.includes("worker") || t.includes("wage") || t.includes("employ")) return "Labor";
  if (t.includes("tech") || t.includes("cyber") || t.includes("digital") || t.includes("ai")) return "Tech";
  if (t.includes("bank") || t.includes("financ") || t.includes("securit")) return "Finance";
  return "Business";
}

// Exchange rates via Frankfurter (European Central Bank, free)
async function fetchRates(base = "USD") {
  const codes = CURRENCIES.map(c => c.code).join(",");
  const res = await fetch(`https://api.frankfurter.app/latest?from=${base}&to=${codes}`);
  if (!res.ok) throw new Error("Rate fetch failed");
  return res.json();
}

// Claude — only for Ask tab
async function askClaude(prompt) {
  const res = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) throw new Error("Claude API error");
  const data = await res.json();
  return data.text || "";
}

/* ─── UI atoms ───────────────────────────────────────────── */
function Spinner({ size = 18 }) {
  return <div className="spinner" style={{ width:size, height:size }} />;
}
function Tag({ label, color = "gray" }) {
  return <span className={`tag tag-${color}`}>{label}</span>;
}
function SectionHeader({ icon, title, children }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, flexWrap:"wrap", gap:10 }}>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <span style={{ fontSize:22 }}>{icon}</span>
        <h2 className="section-title">{title}</h2>
      </div>
      {children}
    </div>
  );
}

const CAT_COLORS  = { "Tax Relief":"green","Filing":"blue","Guidance":"purple","Enforcement":"red","Rates":"amber","Penalty":"red","Credits":"green","International":"teal","Notice":"gray" };
const AREA_COLORS = { Tax:"amber",Healthcare:"green",Finance:"blue",Immigration:"purple",Business:"gray",Environment:"teal",Tech:"blue",Labor:"red",Housing:"teal",Defense:"red" };
const TAG_COLORS  = { Quarterly:"amber",Employer:"blue",Business:"purple",Individual:"green","Non-Profit":"teal",International:"blue",Planning:"gray",Retirement:"amber" };

/* ═══════════════════════════════════════
   IRS TAB — reads IRS.gov RSS feed
═══════════════════════════════════════ */
function IRSTab() {
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [expanded, setExpanded] = useState(null);
  const [ts, setTs]             = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError(""); setItems([]);
    try {
      const data = await fetchIRS();
      setItems(data);
      setTs(new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }));
    } catch(e) { setError("Could not load IRS feed. Try again."); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="fade-up">
      <SectionHeader icon="🏛️" title="IRS News & Guidance">
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span className="live-dot" />
          {ts && <span style={{ fontSize:12, color:"#475569" }}>Fetched {ts}</span>}
          <button className="btn-ghost" onClick={load} disabled={loading}>{loading ? <Spinner size={13}/> : "↺"} Refresh</button>
        </div>
      </SectionHeader>

      {error && <div className="err-box">{error} <button className="btn-ghost" onClick={load} style={{ marginLeft:8 }}>Retry</button></div>}

      {loading && [...Array(6)].map((_,i) => (
        <div key={i} className="card" style={{ marginBottom:10 }}>
          <div className="skeleton" style={{ height:13, width:"55%", marginBottom:10 }} />
          <div className="skeleton" style={{ height:11, width:"100%", marginBottom:6 }} />
          <div className="skeleton" style={{ height:11, width:"70%" }} />
        </div>
      ))}

      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {items.map((item, i) => (
          <div key={i} className="card" style={{ cursor:"pointer" }} onClick={() => setExpanded(expanded===i?null:i)}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 }}>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:8 }}>
                  <Tag label={item.category} color={CAT_COLORS[item.category]||"gray"} />
                  <span style={{ fontSize:11, color:"#475569" }}>{item.date}</span>
                </div>
                <h3 style={{ fontSize:15, fontWeight:600, color:"#e2e8f0", lineHeight:1.45 }}>{item.title}</h3>
                {expanded===i && (
                  <>
                    <p style={{ fontSize:13, color:"#94a3b8", lineHeight:1.65, marginTop:10 }}>{item.summary}</p>
                    {item.link && (
                      <a href={item.link} target="_blank" rel="noopener noreferrer"
                        style={{ display:"inline-flex", alignItems:"center", gap:4, marginTop:10, fontSize:13, color:"#38bdf8" }}
                        onClick={e => e.stopPropagation()}>
                        Read full release on IRS.gov ↗
                      </a>
                    )}
                  </>
                )}
              </div>
              <span style={{ color:"#334155", fontSize:14, flexShrink:0 }}>{expanded===i?"▲":"▼"}</span>
            </div>
          </div>
        ))}
      </div>
      {!loading && !error && items.length === 0 && (
        <div className="card" style={{ textAlign:"center", padding:40, color:"#475569" }}>
          No news loaded. <button className="btn-ghost" onClick={load} style={{ marginLeft:8 }}>Retry</button>
        </div>
      )}
      <p style={{ fontSize:12, color:"#1e293b", marginTop:16 }}>Direct feed from IRS.gov · Updates when IRS publishes · Not tax advice</p>
    </div>
  );
}

/* ═══════════════════════════════════════
   LAW CHANGES TAB — GovTrack API
═══════════════════════════════════════ */
function LawsTab() {
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [expanded, setExpanded] = useState(null);
  const [ts, setTs]             = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError(""); setItems([]);
    try {
      const data = await fetchLaws();
      setItems(data);
      setTs(new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }));
    } catch(e) { setError("Could not load legislation data. Try again."); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="fade-up">
      <SectionHeader icon="⚖️" title="Recently Enacted US Laws">
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span className="live-dot" />
          {ts && <span style={{ fontSize:12, color:"#475569" }}>Fetched {ts}</span>}
          <button className="btn-ghost" onClick={load} disabled={loading}>{loading ? <Spinner size={13}/> : "↺"} Refresh</button>
        </div>
      </SectionHeader>

      <div style={{ padding:"10px 14px", background:"#0c1a2e", borderRadius:8, border:"1px solid #1e3a5f", marginBottom:20, fontSize:13, color:"#64748b" }}>
        Bills signed into law by the President — 119th Congress (2025–2026) · Source: GovTrack.us
      </div>

      {error && <div className="err-box">{error} <button className="btn-ghost" onClick={load} style={{ marginLeft:8 }}>Retry</button></div>}

      {loading && [...Array(6)].map((_,i) => (
        <div key={i} className="card" style={{ marginBottom:10 }}>
          <div className="skeleton" style={{ height:13, width:"60%", marginBottom:10 }} />
          <div className="skeleton" style={{ height:11, width:"100%", marginBottom:6 }} />
          <div className="skeleton" style={{ height:11, width:"80%" }} />
        </div>
      ))}

      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {items.map((item, i) => (
          <div key={i} className="card" style={{ cursor:"pointer" }} onClick={() => setExpanded(expanded===i?null:i)}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 }}>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:8 }}>
                  <Tag label={item.area} color={AREA_COLORS[item.area]||"gray"} />
                  <Tag label="Enacted" color="green" />
                  <span style={{ fontSize:11, color:"#475569" }}>{item.date}</span>
                </div>
                <h3 style={{ fontSize:14, fontWeight:600, color:"#e2e8f0", lineHeight:1.45 }}>{item.name}</h3>
                {expanded===i && item.link && (
                  <a href={item.link} target="_blank" rel="noopener noreferrer"
                    style={{ display:"inline-flex", alignItems:"center", gap:4, marginTop:10, fontSize:13, color:"#38bdf8" }}
                    onClick={e => e.stopPropagation()}>
                    View full bill on GovTrack.us ↗
                  </a>
                )}
              </div>
              <span style={{ color:"#334155", fontSize:14, flexShrink:0 }}>{expanded===i?"▲":"▼"}</span>
            </div>
          </div>
        ))}
      </div>
      {!loading && !error && items.length === 0 && (
        <div className="card" style={{ textAlign:"center", padding:40, color:"#475569" }}>
          No bills found. <button className="btn-ghost" onClick={load} style={{ marginLeft:8 }}>Retry</button>
        </div>
      )}
      <p style={{ fontSize:12, color:"#1e293b", marginTop:16 }}>Source: GovTrack.us · 119th Congress · For informational purposes only</p>
    </div>
  );
}

/* ═══════════════════════════════════════
   EXCHANGE RATES TAB
═══════════════════════════════════════ */
function RatesTab() {
  const [rates, setRates]         = useState({});
  const [base, setBase]           = useState("USD");
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [ts, setTs]               = useState("");
  const [search, setSearch]       = useState("");
  const [fromCur, setFromCur]     = useState("USD");
  const [toCur, setToCur]         = useState("PKR");
  const [amount, setAmount]       = useState("100");

  const load = useCallback(async (b) => {
    setLoading(true); setError("");
    try {
      const data = await fetchRates(b);
      setRates(data.rates || {});
      setTs(new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }));
    } catch(e) { setError("Could not load exchange rates. Check your connection."); }
    setLoading(false);
  }, []);

  useEffect(() => { load(base); }, [base, load]);

  const isLarge = code => ["JPY","KRW","IDR","VND"].includes(code);
  const fmt = (code, val) => isNaN(val)||!isFinite(val) ? "—" : val.toFixed(isLarge(code)?2:4);

  const getRate = (from, to) => {
    if (from === to) return 1;
    if (from === base) return rates[to] || 0;
    if (to === base) return rates[from] ? 1/rates[from] : 0;
    const a = rates[from] ? 1/rates[from] : 0;
    return a * (rates[to] || 0);
  };

  const rate = getRate(fromCur, toCur);
  const num  = parseFloat(amount) || 0;
  const converted = (num * rate).toLocaleString("en-US", { maximumFractionDigits: isLarge(toCur)?0:2 });
  const rev  = rate > 0 ? 1/rate : 0;
  const ci   = code => ALL_CURRENCIES.find(c => c.code===code) || { flag:"💱", name:code };

  const displayed = CURRENCIES.filter(c => {
    if (!rates[c.code]) return false;
    const q = search.toLowerCase();
    return !q || c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q);
  });

  return (
    <div className="fade-up">
      <SectionHeader icon="💱" title="Live Exchange Rates">
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span className="live-dot" />
          <span style={{ fontSize:12, color:"#64748b" }}>{loading?"Loading…":`Updated ${ts} · ECB`}</span>
          <button className="btn-ghost" onClick={() => load(base)} disabled={loading} style={{ padding:"5px 10px" }}>↺</button>
        </div>
      </SectionHeader>

      {error && <div className="err-box">{error}</div>}

      {/* Converter */}
      <div className="card" style={{ marginBottom:24, background:"linear-gradient(145deg,#0c1a2e,#0f172a)", border:"1px solid #1e3a5f" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
          <span style={{ fontSize:18 }}>🔄</span>
          <h3 style={{ fontSize:16, fontWeight:700, color:"#f1f5f9" }}>Currency Converter</h3>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr auto 1fr", gap:10, alignItems:"end" }}>
          <div>
            <label style={{ fontSize:11, color:"#64748b", display:"block", marginBottom:5, textTransform:"uppercase", letterSpacing:".06em" }}>From</label>
            <select className="select-dark" value={fromCur} onChange={e => setFromCur(e.target.value)} style={{ marginBottom:8 }}>
              {ALL_CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code} — {c.name}</option>)}
            </select>
            <input className="input-dark" type="number" value={amount} onChange={e => setAmount(e.target.value)}
              placeholder="Amount" style={{ fontSize:20, fontWeight:700, color:"#38bdf8", padding:"11px 14px" }} />
          </div>
          <button onClick={() => { setFromCur(toCur); setToCur(fromCur); }} style={{
            background:"#1e293b", border:"1px solid #334155", color:"#94a3b8",
            width:42, height:42, borderRadius:"50%", fontSize:20,
            display:"flex", alignItems:"center", justifyContent:"center", marginBottom:3,
          }}>⇄</button>
          <div>
            <label style={{ fontSize:11, color:"#64748b", display:"block", marginBottom:5, textTransform:"uppercase", letterSpacing:".06em" }}>To</label>
            <select className="select-dark" value={toCur} onChange={e => setToCur(e.target.value)} style={{ marginBottom:8 }}>
              {ALL_CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code} — {c.name}</option>)}
            </select>
            <div style={{ background:"#020617", border:"1px solid #1e3a5f", borderRadius:10, padding:"11px 14px", fontSize:20, fontWeight:700, color:"#22c55e", minHeight:50, display:"flex", alignItems:"center" }}>
              {loading ? <Spinner size={20}/> : (converted || "0")}
            </div>
          </div>
        </div>
        {!loading && rate > 0 && (
          <div style={{ marginTop:14, padding:"12px 14px", background:"#020617", borderRadius:8, border:"1px solid #0f2744", display:"flex", flexWrap:"wrap", gap:12, justifyContent:"space-between" }}>
            <span style={{ fontSize:14, color:"#94a3b8" }}>
              1 {ci(fromCur).flag} <b style={{ color:"#e2e8f0" }}>{fromCur}</b> = <b style={{ color:"#38bdf8" }}>{fmt(toCur,rate)} {ci(toCur).flag} {toCur}</b>
            </span>
            <span style={{ fontSize:14, color:"#94a3b8" }}>
              1 {ci(toCur).flag} <b style={{ color:"#e2e8f0" }}>{toCur}</b> = <b style={{ color:"#38bdf8" }}>{fmt(fromCur,rev)} {ci(fromCur).flag} {fromCur}</b>
            </span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{ display:"flex", gap:12, marginBottom:14, flexWrap:"wrap", alignItems:"flex-end" }}>
        <div>
          <label style={{ fontSize:11, color:"#64748b", display:"block", marginBottom:4, textTransform:"uppercase", letterSpacing:".05em" }}>Base</label>
          <select className="select-dark" value={base} onChange={e => setBase(e.target.value)} style={{ width:"auto", minWidth:170 }}>
            {ALL_CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code} — {c.name}</option>)}
          </select>
        </div>
        <div style={{ flex:1, minWidth:160 }}>
          <label style={{ fontSize:11, color:"#64748b", display:"block", marginBottom:4, textTransform:"uppercase", letterSpacing:".05em" }}>Search</label>
          <input className="input-dark" placeholder="🔍 Currency or country…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <p style={{ fontSize:13, color:"#64748b", marginBottom:14 }}>
        1 {ci(base).flag} <b style={{ color:"#94a3b8" }}>{base}</b> equals the amounts shown · Tap any card to convert
      </p>

      {loading ? (
        <div style={{ display:"flex", justifyContent:"center", padding:50 }}><Spinner size={36}/></div>
      ) : (
        <div className="grid-rates">
          {displayed.map(cur => {
            const r = rates[cur.code];
            if (!r) return null;
            return (
              <div key={cur.code} className="card-sm" style={{ cursor:"pointer" }}
                onClick={() => { setFromCur(base); setToCur(cur.code); window.scrollTo({ top:0, behavior:"smooth" }); }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:24 }}>{cur.flag}</span>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color:"#f1f5f9" }}>{cur.code}</div>
                      <div style={{ fontSize:11, color:"#475569" }}>{cur.country}</div>
                    </div>
                  </div>
                  <span style={{ fontSize:10, color:"#334155", border:"1px solid #1e293b", padding:"2px 5px", borderRadius:4 }}>convert</span>
                </div>
                <div style={{ borderTop:"1px solid #1e293b", paddingTop:10 }}>
                  <div style={{ fontSize:11, color:"#64748b", marginBottom:3 }}>1 {ci(base).flag} {base} =</div>
                  <div style={{ fontSize:r>=10000?15:r>=1000?17:r>=100?20:22, fontWeight:800, color:"#f1f5f9", fontFamily:"'Playfair Display',serif", lineHeight:1.1 }}>
                    {r.toFixed(isLarge(cur.code)?2:4)}
                  </div>
                  <div style={{ fontSize:12, color:"#64748b", marginTop:2 }}>{cur.name}</div>
                </div>
                <div style={{ marginTop:8, padding:"6px 10px", background:"#020617", borderRadius:6 }}>
                  <div style={{ fontSize:11, color:"#475569" }}>1 {cur.flag} {cur.code} =</div>
                  <div style={{ fontSize:12, color:"#94a3b8", fontWeight:700 }}>{fmt(base, 1/r)} {ci(base).flag} {base}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {!loading && !error && displayed.length === 0 && (
        <div className="card" style={{ textAlign:"center", padding:40, color:"#475569" }}>No currencies match "{search}"</div>
      )}
      <p style={{ fontSize:12, color:"#1e293b", marginTop:16, textAlign:"center" }}>
        European Central Bank (ECB) via Frankfurter · Updated daily · For reference only
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════
   TAX CALENDAR TAB
═══════════════════════════════════════ */
function CalendarTab() {
  const today = new Date();
  const [sel, setSel] = useState(today.getMonth());
  const monthItems  = DEADLINES.filter(d => d.month === sel);
  const nextDl      = DEADLINES.find(d => new Date(today.getFullYear(), d.month, d.day) >= today);

  return (
    <div className="fade-up">
      <SectionHeader icon="📅" title="Tax Calendar & Deadlines" />
      {nextDl && (
        <div className="card" style={{ marginBottom:22, borderLeft:"3px solid #38bdf8", background:"linear-gradient(135deg,#0c1a2e,#0f172a)" }}>
          <div style={{ fontSize:12, color:"#38bdf8", textTransform:"uppercase", letterSpacing:".07em", marginBottom:6 }}>Next Deadline</div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:8 }}>
            <div>
              <div style={{ fontSize:16, fontWeight:600, color:"#e2e8f0", marginBottom:4 }}>{nextDl.label}</div>
              <div style={{ fontSize:13, color:"#64748b" }}>Form: {nextDl.form}</div>
            </div>
            <div style={{ background:"#1e293b", borderRadius:10, padding:"10px 18px", textAlign:"center", flexShrink:0 }}>
              <div style={{ fontSize:11, color:"#64748b", textTransform:"uppercase" }}>{MONTHS_SHORT[nextDl.month]}</div>
              <div style={{ fontSize:26, fontWeight:800, color:"#f1f5f9", fontFamily:"'Playfair Display',serif", lineHeight:1 }}>{nextDl.day}</div>
            </div>
          </div>
        </div>
      )}
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:22 }}>
        {MONTHS_SHORT.map((m,i) => {
          const has = DEADLINES.some(d => d.month===i);
          return (
            <button key={m} onClick={() => setSel(i)} style={{
              background:sel===i?"#0ea5e9":"transparent",
              border:`1px solid ${sel===i?"#0ea5e9":has?"#1e3a5f":"#0f172a"}`,
              color:sel===i?"#fff":has?"#94a3b8":"#334155",
              padding:"6px 12px", borderRadius:8, fontSize:13, fontWeight:sel===i?700:400, position:"relative",
            }}>
              {m}
              {has && sel!==i && <span style={{ position:"absolute",top:3,right:3,width:4,height:4,background:"#0ea5e9",borderRadius:"50%" }} />}
            </button>
          );
        })}
      </div>
      {monthItems.length === 0 ? (
        <div className="card" style={{ textAlign:"center", padding:36, color:"#334155" }}>No major deadlines in {MONTHS[sel]}.</div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {monthItems.map((d,i) => (
            <div key={i} className="card" style={{ borderLeft:`3px solid ${d.urgent?"#ef4444":"#1e293b"}` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12 }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:8 }}>
                    {d.urgent && <Tag label="Urgent" color="red" />}
                    <Tag label={d.tag} color={TAG_COLORS[d.tag]||"gray"} />
                    <span style={{ fontSize:11, color:"#475569" }}>Form: {d.form}</span>
                  </div>
                  <div style={{ fontSize:15, fontWeight:600, color:"#e2e8f0", marginBottom:6 }}>{d.label}</div>
                  <div style={{ fontSize:13, color:"#64748b", lineHeight:1.55 }}>{d.desc}</div>
                </div>
                <div style={{ background:"#1e293b", borderRadius:10, padding:"10px 16px", textAlign:"center", flexShrink:0 }}>
                  <div style={{ fontSize:10, color:"#64748b", textTransform:"uppercase" }}>{MONTHS_SHORT[d.month]}</div>
                  <div style={{ fontSize:24, fontWeight:800, color:"#f1f5f9", fontFamily:"'Playfair Display',serif", lineHeight:1 }}>{d.day}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   ASK TAB — Claude AI chat
═══════════════════════════════════════ */
function AskTab() {
  const [msgs, setMsgs]     = useState([]);
  const [input, setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef           = useRef(null);

  const SUGGESTIONS = [
    "What is the 2025 standard deduction?",
    "How do I get a tax extension?",
    "What are 2025 capital gains tax rates?",
    "Do I need to file an FBAR?",
    "What is the child tax credit in 2025?",
    "How does the IRS calculate penalties?",
  ];

  const send = async (text) => {
    const q = (text || input).trim();
    if (!q || loading) return;
    setInput("");
    setMsgs(m => [...m, { role:"user", text:q }]);
    setLoading(true);
    try {
      const ans = await askClaude(
        `You are LexLive, a helpful US tax and law assistant with deep knowledge through 2025.
Answer this question clearly and concisely in plain English: "${q}"
Use bullet points where helpful. Keep it under 250 words. Note if they should consult a tax professional for their specific situation.`
      );
      setMsgs(m => [...m, { role:"assistant", text:ans }]);
    } catch {
      setMsgs(m => [...m, { role:"assistant", text:"Sorry, couldn't get an answer right now. Please try again." }]);
    }
    setLoading(false);
  };

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [msgs, loading]);

  return (
    <div className="fade-up">
      <SectionHeader icon="🔍" title="Ask LexLive" />
      <p style={{ fontSize:14, color:"#64748b", marginBottom:20 }}>Powered by Claude AI — ask anything about US taxes, IRS rules, or laws.</p>

      {msgs.length === 0 && (
        <div style={{ marginBottom:24 }}>
          <p style={{ fontSize:13, color:"#475569", marginBottom:10 }}>Try:</p>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {SUGGESTIONS.map((s,i) => (
              <button key={i} onClick={() => send(s)} style={{ background:"#0f172a", border:"1px solid #1e293b", color:"#94a3b8", padding:"7px 12px", borderRadius:8, fontSize:13 }}>{s}</button>
            ))}
          </div>
        </div>
      )}

      <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:16 }}>
        {msgs.map((m,i) => (
          <div key={i} style={{ display:"flex", justifyContent:m.role==="user"?"flex-end":"flex-start" }}>
            <div style={{
              maxWidth:"85%", padding:"12px 16px", fontSize:14, lineHeight:1.65, whiteSpace:"pre-wrap",
              background:m.role==="user"?"linear-gradient(135deg,#0ea5e9,#6366f1)":"#0f172a",
              border:m.role==="assistant"?"1px solid #1e293b":"none",
              borderRadius:m.role==="user"?"14px 14px 4px 14px":"14px 14px 14px 4px",
              color:m.role==="user"?"#fff":"#cbd5e1",
            }}>{m.text}</div>
          </div>
        ))}
        {loading && <div style={{ display:"flex", alignItems:"center", gap:8, color:"#475569", fontSize:14 }}><Spinner size={16}/> Thinking…</div>}
        <div ref={bottomRef} />
      </div>

      <div style={{ display:"flex", gap:10 }}>
        <input className="input-dark" value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if(e.key==="Enter"&&!e.shiftKey){ e.preventDefault(); send(); } }}
          placeholder="Ask about taxes, IRS, laws…" disabled={loading} />
        <button className="btn-primary" onClick={() => send()} disabled={loading||!input.trim()} style={{ flexShrink:0 }}>
          {loading ? <Spinner size={16}/> : "Send →"}
        </button>
      </div>
      <p style={{ fontSize:12, color:"#1e293b", marginTop:8 }}>For informational purposes only · Not legal or tax advice</p>
    </div>
  );
}

/* ═══════════════════════════════════════
   DASHBOARD TAB
═══════════════════════════════════════ */
function DashboardTab({ onNavigate }) {
  const [rates, setRates]   = useState({});
  const [irsItems, setIRS]  = useState([]);
  const [lawItems, setLaws] = useState([]);
  const [loadR, setLoadR]   = useState(true);
  const [loadI, setLoadI]   = useState(true);
  const [loadL, setLoadL]   = useState(true);
  const today = new Date();
  const SPOT  = ["EUR","GBP","JPY","PKR","AED","CAD"];

  useEffect(() => {
    fetchRates("USD").then(d => { setRates(d.rates||{}); setLoadR(false); }).catch(() => setLoadR(false));
    fetchIRS().then(d => { setIRS(d.slice(0,2)); setLoadI(false); }).catch(() => setLoadI(false));
    fetchLaws().then(d => { setLaws(d.slice(0,2)); setLoadL(false); }).catch(() => setLoadL(false));
  }, []);

  const upcoming = DEADLINES.filter(d => new Date(today.getFullYear(),d.month,d.day) >= today).slice(0,3);
  const ci = code => ALL_CURRENCIES.find(c=>c.code===code)||{ flag:"💱" };

  return (
    <div className="fade-up">
      {/* Hero */}
      <div style={{ background:"linear-gradient(135deg,#0369a1 0%,#4f46e5 100%)", borderRadius:16, padding:"30px 32px", marginBottom:26, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute",top:-40,right:-40,width:200,height:200,borderRadius:"50%",background:"rgba(255,255,255,.05)" }} />
        <p style={{ margin:"0 0 4px", fontSize:13, color:"rgba(255,255,255,.6)" }}>
          {today.toLocaleDateString("en-US",{ weekday:"long",year:"numeric",month:"long",day:"numeric" })}
        </p>
        <h1 style={{ margin:"0 0 6px", fontSize:30, fontWeight:800, color:"#fff", fontFamily:"'Playfair Display',serif", letterSpacing:"-.03em" }}>LexLive</h1>
        <p style={{ margin:0, fontSize:15, color:"rgba(255,255,255,.75)" }}>US Tax & Law Intelligence — free for everyone</p>
      </div>

      {/* Spot rates */}
      <div style={{ marginBottom:24 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <h2 style={{ fontSize:15, fontWeight:600, color:"#94a3b8" }}>Live USD Rates</h2>
          <button className="btn-ghost" onClick={() => onNavigate("rates")} style={{ fontSize:13 }}>All rates & converter →</button>
        </div>
        {loadR ? <div style={{ display:"flex", justifyContent:"center", padding:20 }}><Spinner size={26}/></div> : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))", gap:10 }}>
            {SPOT.filter(c => rates[c]).map(code => {
              const r = rates[code];
              const big = ["JPY","KRW","IDR"].includes(code);
              return (
                <div key={code} className="card-sm" style={{ cursor:"pointer" }} onClick={() => onNavigate("rates")}>
                  <div style={{ fontSize:11, color:"#475569", marginBottom:4 }}>{ci(code).flag} 1 USD =</div>
                  <div style={{ fontSize:big?15:18, fontWeight:800, color:"#f1f5f9", fontFamily:"'Playfair Display',serif", lineHeight:1.1 }}>
                    {r.toFixed(big?2:4)}
                  </div>
                  <div style={{ fontSize:11, color:"#64748b", marginTop:2 }}>{code}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Latest IRS + Laws side by side */}
      <div className="grid-2" style={{ marginBottom:22 }}>
        <div className="card">
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
            <Tag label="IRS News" color="amber" />
            <button className="btn-ghost" onClick={() => onNavigate("irs")} style={{ fontSize:12, padding:"3px 8px" }}>All →</button>
          </div>
          {loadI ? <div style={{ display:"flex", gap:8, alignItems:"center", color:"#475569", fontSize:13 }}><Spinner size={14}/>Loading…</div> : (
            irsItems.length > 0 ? irsItems.map((item,i) => (
              <div key={i} style={{ borderTop:i>0?"1px solid #1e293b":"none", paddingTop:i>0?10:0, marginTop:i>0?10:0 }}>
                <Tag label={item.category} color={CAT_COLORS[item.category]||"gray"} />
                <div style={{ fontSize:13, fontWeight:600, color:"#e2e8f0", lineHeight:1.4, marginTop:6 }}>{item.title}</div>
                <div style={{ fontSize:11, color:"#475569", marginTop:3 }}>{item.date}</div>
              </div>
            )) : <p style={{ fontSize:13, color:"#475569" }}>Could not load IRS news.</p>
          )}
        </div>

        <div className="card">
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
            <Tag label="New Laws" color="purple" />
            <button className="btn-ghost" onClick={() => onNavigate("laws")} style={{ fontSize:12, padding:"3px 8px" }}>All →</button>
          </div>
          {loadL ? <div style={{ display:"flex", gap:8, alignItems:"center", color:"#475569", fontSize:13 }}><Spinner size={14}/>Loading…</div> : (
            lawItems.length > 0 ? lawItems.map((item,i) => (
              <div key={i} style={{ borderTop:i>0?"1px solid #1e293b":"none", paddingTop:i>0?10:0, marginTop:i>0?10:0 }}>
                <Tag label={item.area} color={AREA_COLORS[item.area]||"gray"} />
                <div style={{ fontSize:13, fontWeight:600, color:"#e2e8f0", lineHeight:1.4, marginTop:6 }}>{item.name}</div>
                <div style={{ fontSize:11, color:"#475569", marginTop:3 }}>{item.date}</div>
              </div>
            )) : <p style={{ fontSize:13, color:"#475569" }}>Could not load legislation.</p>
          )}
        </div>
      </div>

      {/* Upcoming deadlines */}
      <div className="card">
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <h3 style={{ fontSize:15, fontWeight:600, color:"#e2e8f0" }}>Upcoming Tax Deadlines</h3>
          <button onClick={() => onNavigate("calendar")} className="btn-ghost" style={{ fontSize:13 }}>Full calendar →</button>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {upcoming.map((d,i) => (
            <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px", background:"#020617", borderRadius:8, gap:12 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, flex:1, flexWrap:"wrap" }}>
                {d.urgent && <Tag label="Urgent" color="red" />}
                <span style={{ fontSize:14, color:"#cbd5e1" }}>{d.label}</span>
              </div>
              <span style={{ fontSize:12, fontWeight:700, color:"#64748b", flexShrink:0 }}>{MONTHS_SHORT[d.month]} {d.day}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop:20, padding:"12px 16px", background:"#0c1a2e", borderRadius:10, border:"1px solid #1e3a5f" }}>
        <p style={{ fontSize:13, color:"#475569", lineHeight:1.6, margin:0 }}>
          <b style={{ color:"#38bdf8" }}>LexLive</b> is free for everyone.
          IRS data from IRS.gov · Laws from GovTrack.us · Exchange rates from European Central Bank.
          For informational purposes only.
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   ROOT APP
═══════════════════════════════════════ */
export default function App() {
  const [tab, setTab] = useState("dashboard");
  return (
    <div style={{ minHeight:"100vh", background:"#020617" }}>
      <header style={{ position:"sticky", top:0, zIndex:100, background:"rgba(2,6,23,.97)", backdropFilter:"blur(12px)", borderBottom:"1px solid #0f172a" }}>
        <div style={{ maxWidth:980, margin:"0 auto", padding:"0 20px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, paddingTop:12, paddingBottom:2 }}>
            <span style={{ fontSize:21, fontWeight:800, fontFamily:"'Playfair Display',serif", letterSpacing:"-.02em",
              background:"linear-gradient(90deg,#38bdf8,#818cf8)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>LexLive</span>
            <span style={{ fontSize:10, color:"#334155", letterSpacing:".1em", textTransform:"uppercase", fontWeight:600 }}>US Intel</span>
            <div style={{ flex:1 }} />
            <span className="live-dot" />
            <span style={{ fontSize:11, color:"#334155", fontWeight:600 }}>LIVE</span>
          </div>
          <nav style={{ display:"flex", overflowX:"auto" }}>
            {TABS.map(t => (
              <button key={t.id} className={`tab-btn ${tab===t.id?"active":""}`} onClick={() => setTab(t.id)}>
                {t.icon} <span className="hide-mobile">{t.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>
      <main style={{ maxWidth:980, margin:"0 auto", padding:"28px 20px 80px" }}>
        {tab==="dashboard" && <DashboardTab onNavigate={setTab} />}
        {tab==="irs"       && <IRSTab />}
        {tab==="laws"      && <LawsTab />}
        {tab==="rates"     && <RatesTab />}
        {tab==="calendar"  && <CalendarTab />}
        {tab==="ask"       && <AskTab />}
      </main>
      <footer style={{ borderTop:"1px solid #0f172a", padding:"16px 20px", textAlign:"center" }}>
        <p style={{ fontSize:12, color:"#1e293b" }}>LexLive · IRS.gov · GovTrack.us · ECB rates · Free for everyone · Not legal or tax advice</p>
      </footer>
    </div>
  );
}
