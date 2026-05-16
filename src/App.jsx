import { useState, useEffect, useCallback, useRef } from "react";

/* ── Data ─────────────────────────────────────────── */

const TABS = [
  { id: "dashboard",  label: "Dashboard",     icon: "⚡" },
  { id: "irs",        label: "IRS Updates",   icon: "🏛️" },
  { id: "laws",       label: "Law Changes",   icon: "⚖️" },
  { id: "rates",      label: "Exchange Rates",icon: "💱" },
  { id: "calendar",   label: "Tax Calendar",  icon: "📅" },
  { id: "ask",        label: "Ask LexLive",   icon: "🔍" },
];

const CURRENCIES = [
  { code: "EUR", name: "Euro",                  flag: "🇪🇺", country: "Eurozone" },
  { code: "GBP", name: "British Pound",         flag: "🇬🇧", country: "United Kingdom" },
  { code: "JPY", name: "Japanese Yen",          flag: "🇯🇵", country: "Japan" },
  { code: "CAD", name: "Canadian Dollar",       flag: "🇨🇦", country: "Canada" },
  { code: "AUD", name: "Australian Dollar",     flag: "🇦🇺", country: "Australia" },
  { code: "CHF", name: "Swiss Franc",           flag: "🇨🇭", country: "Switzerland" },
  { code: "CNY", name: "Chinese Yuan",          flag: "🇨🇳", country: "China" },
  { code: "INR", name: "Indian Rupee",          flag: "🇮🇳", country: "India" },
  { code: "PKR", name: "Pakistani Rupee",       flag: "🇵🇰", country: "Pakistan" },
  { code: "SAR", name: "Saudi Riyal",           flag: "🇸🇦", country: "Saudi Arabia" },
  { code: "AED", name: "UAE Dirham",            flag: "🇦🇪", country: "UAE" },
  { code: "MXN", name: "Mexican Peso",          flag: "🇲🇽", country: "Mexico" },
  { code: "BRL", name: "Brazilian Real",        flag: "🇧🇷", country: "Brazil" },
  { code: "SGD", name: "Singapore Dollar",      flag: "🇸🇬", country: "Singapore" },
  { code: "HKD", name: "Hong Kong Dollar",      flag: "🇭🇰", country: "Hong Kong" },
  { code: "KRW", name: "South Korean Won",      flag: "🇰🇷", country: "South Korea" },
  { code: "SEK", name: "Swedish Krona",         flag: "🇸🇪", country: "Sweden" },
  { code: "NOK", name: "Norwegian Krone",       flag: "🇳🇴", country: "Norway" },
  { code: "ZAR", name: "South African Rand",    flag: "🇿🇦", country: "South Africa" },
  { code: "TRY", name: "Turkish Lira",          flag: "🇹🇷", country: "Turkey" },
  { code: "NZD", name: "New Zealand Dollar",    flag: "🇳🇿", country: "New Zealand" },
  { code: "THB", name: "Thai Baht",             flag: "🇹🇭", country: "Thailand" },
  { code: "MYR", name: "Malaysian Ringgit",     flag: "🇲🇾", country: "Malaysia" },
  { code: "IDR", name: "Indonesian Rupiah",     flag: "🇮🇩", country: "Indonesia" },
  { code: "PHP", name: "Philippine Peso",       flag: "🇵🇭", country: "Philippines" },
  { code: "EGP", name: "Egyptian Pound",        flag: "🇪🇬", country: "Egypt" },
  { code: "NGN", name: "Nigerian Naira",        flag: "🇳🇬", country: "Nigeria" },
  { code: "KWD", name: "Kuwaiti Dinar",         flag: "🇰🇼", country: "Kuwait" },
  { code: "QAR", name: "Qatari Riyal",          flag: "🇶🇦", country: "Qatar" },
  { code: "BDT", name: "Bangladeshi Taka",      flag: "🇧🇩", country: "Bangladesh" },
];

const ALL_CURRENCIES = [{ code: "USD", name: "US Dollar", flag: "🇺🇸", country: "United States" }, ...CURRENCIES];

const DEADLINES = [
  { month:0,  day:15,  label:"Q4 Estimated Tax Payment",              tag:"Quarterly", urgent:false, form:"1040-ES", desc:"Pay your 4th quarter estimated taxes to avoid underpayment penalties." },
  { month:0,  day:31,  label:"W-2 & 1099 Forms Issued to Recipients", tag:"Employer",  urgent:false, form:"W-2 / 1099", desc:"Employers must provide W-2s; payers must provide 1099s to recipients." },
  { month:2,  day:15,  label:"S-Corp & Partnership Tax Returns Due",   tag:"Business",  urgent:false, form:"1065 / 1120-S", desc:"Pass-through entities file their returns or request a 6-month extension." },
  { month:2,  day:15,  label:"Elect S-Corporation Status",             tag:"Business",  urgent:false, form:"Form 2553", desc:"Deadline to elect S-Corp treatment for the current tax year." },
  { month:3,  day:15,  label:"Individual Income Tax Return Due",       tag:"Individual",urgent:true,  form:"1040", desc:"File your federal income tax return or Form 4868 to get a 6-month extension." },
  { month:3,  day:15,  label:"Q1 Estimated Tax Payment",               tag:"Quarterly", urgent:true,  form:"1040-ES", desc:"First quarter estimated payment for self-employed and those with non-wage income." },
  { month:3,  day:15,  label:"IRA & HSA Contribution Deadline",        tag:"Individual",urgent:false, form:"IRA / HSA", desc:"Last day to make prior-year IRA and HSA contributions." },
  { month:4,  day:15,  label:"FBAR Filing Deadline (Foreign Accounts)", tag:"International",urgent:false, form:"FinCEN 114", desc:"Report foreign financial accounts if total value exceeded $10,000 at any point." },
  { month:5,  day:16,  label:"Q2 Estimated Tax Payment",               tag:"Quarterly", urgent:false, form:"1040-ES", desc:"Second quarter estimated payment due." },
  { month:5,  day:15,  label:"Non-Profit Returns Due",                  tag:"Non-Profit",urgent:false, form:"990", desc:"Tax-exempt organizations file their annual information returns." },
  { month:8,  day:15,  label:"Q3 Estimated Tax Payment",               tag:"Quarterly", urgent:false, form:"1040-ES", desc:"Third quarter estimated payment due." },
  { month:8,  day:15,  label:"Extended S-Corp & Partnership Returns",   tag:"Business",  urgent:false, form:"1065 / 1120-S", desc:"Final deadline for pass-through entities that filed for extension in March." },
  { month:9,  day:15,  label:"Extended Individual Return Deadline",     tag:"Individual",urgent:false, form:"1040", desc:"Final deadline if you filed Form 4868 in April." },
  { month:9,  day:15,  label:"Extended C-Corp Returns Due",            tag:"Business",  urgent:false, form:"1120", desc:"C-Corporations with calendar year-end that extended their return." },
  { month:11, day:31,  label:"Year-End Tax Planning Deadline",         tag:"Planning",  urgent:false, form:"Various", desc:"Last day for tax-loss harvesting, Roth conversions, and charitable deductions." },
  { month:11, day:31,  label:"Required Minimum Distributions (RMD)",   tag:"Retirement",urgent:false, form:"RMD", desc:"Taxpayers over 73 must take their RMD from traditional IRAs and 401(k)s." },
];

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/* ── API helpers ──────────────────────────────────── */

async function callClaude(prompt) {
  const res = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) throw new Error("API error");
  const data = await res.json();
  return data.text || "";
}

async function fetchRates(base = "USD") {
  const res = await fetch(`https://api.frankfurter.app/latest?from=${base}`);
  if (!res.ok) throw new Error("Rate fetch failed");
  return res.json();
}

/* ── Small UI pieces ──────────────────────────────── */

function Spinner({ size = 18 }) {
  return <div className="spinner" style={{ width: size, height: size }} />;
}

function LoadingRow() {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, color:"#475569", fontSize:14 }}>
      <Spinner /> Fetching live data…
    </div>
  );
}

function Tag({ label, color = "gray" }) {
  return <span className={`tag tag-${color}`}>{label}</span>;
}

function SectionHeader({ icon, title, children }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22, flexWrap:"wrap", gap:10 }}>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <span style={{ fontSize:22 }}>{icon}</span>
        <h2 className="section-title">{title}</h2>
      </div>
      {children}
    </div>
  );
}

/* ── Parsed item renderer ─────────────────────────── */
function parseItems(text, delimiter = "###ITEM###", endmark = "###END###") {
  return text
    .split(delimiter)
    .slice(1)
    .map(s => s.split(endmark)[0].trim())
    .map(s => s.split("|").map(p => p.trim()));
}

/* ═══════════════════════════════════════════════════
   EXCHANGE RATES TAB
═══════════════════════════════════════════════════ */
function RatesTab() {
  const [rates, setRates]         = useState({});
  const [base, setBase]           = useState("USD");
  const [loading, setLoading]     = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");
  const [search, setSearch]       = useState("");
  const [fromCur, setFromCur]     = useState("USD");
  const [toCur, setToCur]         = useState("PKR");
  const [amount, setAmount]       = useState("100");
  const [flipped, setFlipped]     = useState(false);

  const load = useCallback(async (b) => {
    setLoading(true);
    try {
      const data = await fetchRates(b);
      setRates(data.rates || {});
      setLastUpdated(new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }));
    } catch { setRates({}); }
    setLoading(false);
  }, []);

  useEffect(() => { load(base); }, [base, load]);

  /* Conversion logic */
  const getRate = (from, to) => {
    if (from === to) return 1;
    if (from === "USD") return rates[to] || 0;
    if (to === "USD") return rates[from] ? 1 / rates[from] : 0;
    const toUSD = rates[from] ? 1 / rates[from] : 0;
    return toUSD * (rates[to] || 0);
  };

  const rate = getRate(fromCur, toCur);
  const inputNum = parseFloat(amount) || 0;
  const converted = (inputNum * rate).toLocaleString("en-US", { maximumFractionDigits: toCur === "JPY" || toCur === "KRW" || toCur === "IDR" ? 0 : 2 });
  const reverseRate = rate > 0 ? 1 / rate : 0;

  const swap = () => { setFromCur(toCur); setToCur(fromCur); setFlipped(!flipped); };

  const currencyInfo = (code) => ALL_CURRENCIES.find(c => c.code === code) || { flag: "💱", name: code };

  const displayRates = CURRENCIES.filter(c => {
    if (!rates[c.code]) return false;
    const q = search.toLowerCase();
    return c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q);
  });

  const baseInfo = ALL_CURRENCIES.find(c => c.code === base) || { flag:"🇺🇸", name:"US Dollar" };

  const fmt = (code, val) => {
    const decimals = ["JPY","KRW","IDR","VND"].includes(code) ? 0 : 4;
    return val.toFixed(decimals);
  };

  return (
    <div className="fade-up">
      <SectionHeader icon="💱" title="Live Exchange Rates">
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span className="live-dot" />
          <span style={{ fontSize:12, color:"#64748b" }}>
            {loading ? "Updating…" : `Updated ${lastUpdated} · ECB via Frankfurter`}
          </span>
          <button className="btn-ghost" onClick={() => load(base)} disabled={loading} style={{ padding:"5px 10px" }}>
            ↺
          </button>
        </div>
      </SectionHeader>

      {/* ── Currency Converter ── */}
      <div className="card" style={{ marginBottom:28, background:"linear-gradient(145deg,#0c1a2e,#0f172a)", border:"1px solid #1e3a5f" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
          <span style={{ fontSize:18 }}>🔄</span>
          <h3 style={{ fontSize:17, fontWeight:700, color:"#f1f5f9" }}>Currency Converter</h3>
          <span style={{ fontSize:12, color:"#475569" }}>— enter any amount to convert instantly</span>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr auto 1fr", gap:12, alignItems:"end" }}>
          {/* FROM */}
          <div>
            <label style={{ fontSize:12, color:"#64748b", display:"block", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.06em" }}>From</label>
            <select className="select-dark" value={fromCur} onChange={e => setFromCur(e.target.value)} style={{ marginBottom:8 }}>
              {ALL_CURRENCIES.map(c => (
                <option key={c.code} value={c.code}>{c.flag} {c.code} — {c.name}</option>
              ))}
            </select>
            <input
              className="input-dark"
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="Enter amount"
              style={{ fontSize:20, fontWeight:700, color:"#38bdf8", padding:"12px 14px" }}
            />
          </div>

          {/* Swap */}
          <button
            onClick={swap}
            style={{
              background:"#1e293b", border:"1px solid #334155", color:"#94a3b8",
              width:42, height:42, borderRadius:"50%", fontSize:20,
              display:"flex", alignItems:"center", justifyContent:"center",
              transition:"all 0.2s", marginBottom:2,
            }}
            title="Swap currencies"
          >
            ⇄
          </button>

          {/* TO */}
          <div>
            <label style={{ fontSize:12, color:"#64748b", display:"block", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.06em" }}>To</label>
            <select className="select-dark" value={toCur} onChange={e => setToCur(e.target.value)} style={{ marginBottom:8 }}>
              {ALL_CURRENCIES.map(c => (
                <option key={c.code} value={c.code}>{c.flag} {c.code} — {c.name}</option>
              ))}
            </select>
            <div
              style={{
                background:"#020617", border:"1px solid #1e3a5f", borderRadius:10,
                padding:"12px 14px", fontSize:20, fontWeight:700, color:"#22c55e",
                minHeight:50, display:"flex", alignItems:"center",
              }}
            >
              {loading ? <Spinner size={20} /> : converted}
            </div>
          </div>
        </div>

        {/* Rate display */}
        {!loading && rate > 0 && (
          <div style={{ marginTop:16, padding:"12px 16px", background:"#020617", borderRadius:8, border:"1px solid #0f2744" }}>
            <div style={{ display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
              <div style={{ fontSize:14, color:"#94a3b8" }}>
                <span style={{ color:"#e2e8f0", fontWeight:600 }}>1 {currencyInfo(fromCur).flag} {fromCur}</span>
                {" = "}
                <span style={{ color:"#38bdf8", fontWeight:700 }}>{fmt(toCur, rate)} {currencyInfo(toCur).flag} {toCur}</span>
              </div>
              <div style={{ fontSize:14, color:"#94a3b8" }}>
                <span style={{ color:"#e2e8f0", fontWeight:600 }}>1 {currencyInfo(toCur).flag} {toCur}</span>
                {" = "}
                <span style={{ color:"#38bdf8", fontWeight:700 }}>{fmt(fromCur, reverseRate)} {currencyInfo(fromCur).flag} {fromCur}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Rate Table ── */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, flexWrap:"wrap", gap:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div>
            <label style={{ fontSize:12, color:"#64748b", display:"block", marginBottom:4, textTransform:"uppercase", letterSpacing:"0.05em" }}>Base currency</label>
            <select className="select-dark" value={base} onChange={e => setBase(e.target.value)} style={{ width:"auto" }}>
              {ALL_CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
            </select>
          </div>
        </div>
        <input
          className="input-dark"
          placeholder="🔍 Search currency or country…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width:240 }}
        />
      </div>

      <p style={{ fontSize:13, color:"#475569", marginBottom:16 }}>
        Showing all rates relative to <strong style={{ color:"#94a3b8" }}>{baseInfo.flag} 1 {base}</strong>
      </p>

      {loading ? (
        <div style={{ display:"flex", justifyContent:"center", padding:40 }}><Spinner size={32} /></div>
      ) : (
        <div className="grid-rates">
          {displayRates.map(cur => {
            const r = rates[cur.code];
            if (!r) return null;
            const isHighValue = r >= 100;
            const decimals = ["JPY","KRW","IDR","VND"].includes(cur.code) ? 2 : 4;
            return (
              <div key={cur.code} className="card-sm" style={{ cursor:"pointer" }}
                onClick={() => { setFromCur(base); setToCur(cur.code); }}>
                {/* Header */}
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:22 }}>{cur.flag}</span>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color:"#f1f5f9" }}>{cur.code}</div>
                      <div style={{ fontSize:11, color:"#475569" }}>{cur.country}</div>
                    </div>
                  </div>
                  <span style={{ fontSize:10, color:"#334155", border:"1px solid #1e293b", padding:"2px 6px", borderRadius:4 }}>tap to convert</span>
                </div>

                {/* Big rate */}
                <div style={{ borderTop:"1px solid #1e293b", paddingTop:10 }}>
                  <div style={{ fontSize:11, color:"#475569", marginBottom:3 }}>
                    1 {base} equals
                  </div>
                  <div style={{ fontSize:isHighValue ? 20 : 24, fontWeight:800, color:"#f1f5f9", fontFamily:"'Playfair Display', serif", lineHeight:1.1 }}>
                    {r.toFixed(decimals)}
                  </div>
                  <div style={{ fontSize:13, color:"#64748b", marginTop:2, fontWeight:500 }}>
                    {cur.name}
                  </div>
                </div>

                {/* Reverse rate */}
                <div style={{ marginTop:8, padding:"6px 10px", background:"#020617", borderRadius:6, fontSize:12, color:"#475569" }}>
                  1 {cur.code} = <span style={{ color:"#94a3b8", fontWeight:600 }}>{(1/r).toFixed(decimals)} {base}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && displayRates.length === 0 && (
        <div className="card" style={{ textAlign:"center", padding:40, color:"#475569" }}>
          No currencies found for "{search}"
        </div>
      )}

      <p style={{ fontSize:12, color:"#1e293b", marginTop:20, textAlign:"center" }}>
        Rates sourced from European Central Bank (ECB) via Frankfurter API · Updated daily · For reference only
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   IRS TAB
═══════════════════════════════════════════════════ */
const CAT_COLORS = { "Tax Relief":"green","Filing":"blue","Guidance":"purple","Enforcement":"red","Rates":"amber","Penalty":"red","Credits":"green","International":"teal","Notice":"gray" };

function IRSTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastFetched, setLastFetched] = useState("");
  const [expanded, setExpanded] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setItems([]);
    try {
      const txt = await callClaude(
        `Search the web for the 8 most recent and important IRS announcements, guidance, and regulatory updates from 2025.
Return exactly this format with no extra text before or after:
###ITEM### Title | Date | Category | 2-sentence plain-English summary of what changed and who is affected ###END###
Categories must be one of: Tax Relief, Filing, Guidance, Enforcement, Rates, Penalty, Credits, International, Notice`
      );
      const parsed = parseItems(txt)
        .map(([title,date,category,summary]) => ({ title,date,category,summary }))
        .filter(i => i.title && i.summary);
      setItems(parsed);
      setLastFetched(new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }));
    } catch { setItems([]); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="fade-up">
      <SectionHeader icon="🏛️" title="IRS Updates & Guidance">
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {lastFetched && <span style={{ fontSize:12, color:"#475569" }}>Fetched {lastFetched}</span>}
          <button className="btn-ghost" onClick={load} disabled={loading}>
            {loading ? <Spinner size={14} /> : "↺"} Refresh
          </button>
        </div>
      </SectionHeader>

      {loading && (
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {[...Array(4)].map((_,i) => (
            <div key={i} className="card">
              <div className="skeleton" style={{ height:14, width:"60%", marginBottom:10 }} />
              <div className="skeleton" style={{ height:12, width:"100%", marginBottom:6 }} />
              <div className="skeleton" style={{ height:12, width:"80%" }} />
            </div>
          ))}
        </div>
      )}

      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {items.map((item, i) => (
          <div key={i} className="card" style={{ cursor:"pointer" }} onClick={() => setExpanded(expanded === i ? null : i)}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 }}>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:8 }}>
                  <Tag label={item.category || "Update"} color={CAT_COLORS[item.category] || "gray"} />
                  {item.date && <span style={{ fontSize:11, color:"#475569", padding:"3px 0" }}>{item.date}</span>}
                </div>
                <h3 style={{ fontSize:15, fontWeight:600, color:"#e2e8f0", lineHeight:1.45, marginBottom: expanded===i ? 10 : 0 }}>
                  {item.title}
                </h3>
                {expanded === i && (
                  <p style={{ fontSize:14, color:"#94a3b8", lineHeight:1.65, marginTop:8 }}>{item.summary}</p>
                )}
              </div>
              <span style={{ color:"#334155", fontSize:18, flexShrink:0, marginTop:2 }}>
                {expanded === i ? "▲" : "▼"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {!loading && items.length === 0 && (
        <div className="card" style={{ textAlign:"center", padding:40, color:"#475569" }}>
          Failed to load. <button className="btn-ghost" onClick={load} style={{ display:"inline-flex", marginLeft:8 }}>Try again</button>
        </div>
      )}
      <p style={{ fontSize:12, color:"#1e293b", marginTop:20 }}>
        AI-powered · Sources verified via live web search · For informational purposes only · Not tax advice
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   LAW CHANGES TAB
═══════════════════════════════════════════════════ */
const AREA_COLORS = { Tax:"amber",Healthcare:"green",Finance:"blue",Immigration:"purple",Business:"gray",Environment:"teal",Tech:"blue",Labor:"red",Housing:"teal",Defense:"red" };

function LawsTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [lastFetched, setLastFetched] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setItems([]);
    try {
      const txt = await callClaude(
        `Search the web for the 8 most recent and significant US federal law changes, bills passed, or major regulatory changes from 2025.
Return exactly this format with no extra text:
###ITEM### Law/Bill Name | Date | Area | 2-sentence plain-English summary of what changed and who it affects ###END###
Area must be one of: Tax, Healthcare, Finance, Immigration, Business, Environment, Tech, Labor, Housing, Defense`
      );
      const parsed = parseItems(txt)
        .map(([name,date,area,summary]) => ({ name,date,area,summary }))
        .filter(i => i.name && i.summary);
      setItems(parsed);
      setLastFetched(new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }));
    } catch { setItems([]); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="fade-up">
      <SectionHeader icon="⚖️" title="Federal Law Changes">
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {lastFetched && <span style={{ fontSize:12, color:"#475569" }}>Fetched {lastFetched}</span>}
          <button className="btn-ghost" onClick={load} disabled={loading}>
            {loading ? <Spinner size={14} /> : "↺"} Refresh
          </button>
        </div>
      </SectionHeader>

      {loading && (
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {[...Array(4)].map((_,i) => (
            <div key={i} className="card">
              <div className="skeleton" style={{ height:14, width:"55%", marginBottom:10 }} />
              <div className="skeleton" style={{ height:12, width:"100%", marginBottom:6 }} />
              <div className="skeleton" style={{ height:12, width:"75%" }} />
            </div>
          ))}
        </div>
      )}

      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {items.map((item, i) => (
          <div key={i} className="card" style={{ cursor:"pointer" }} onClick={() => setExpanded(expanded === i ? null : i)}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 }}>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:8 }}>
                  <Tag label={item.area || "Law"} color={AREA_COLORS[item.area] || "gray"} />
                  {item.date && <span style={{ fontSize:11, color:"#475569", padding:"3px 0" }}>{item.date}</span>}
                </div>
                <h3 style={{ fontSize:15, fontWeight:600, color:"#e2e8f0", lineHeight:1.45 }}>{item.name}</h3>
                {expanded === i && (
                  <p style={{ fontSize:14, color:"#94a3b8", lineHeight:1.65, marginTop:10 }}>{item.summary}</p>
                )}
              </div>
              <span style={{ color:"#334155", fontSize:18, flexShrink:0, marginTop:2 }}>
                {expanded === i ? "▲" : "▼"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {!loading && items.length === 0 && (
        <div className="card" style={{ textAlign:"center", padding:40, color:"#475569" }}>
          Failed to load. <button className="btn-ghost" onClick={load} style={{ display:"inline-flex", marginLeft:8 }}>Try again</button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   TAX CALENDAR TAB
═══════════════════════════════════════════════════ */
const TAG_CAL = { Quarterly:"amber",Employer:"blue",Business:"purple",Individual:"green","Non-Profit":"teal",International:"blue",Planning:"gray",Retirement:"amber" };

function CalendarTab() {
  const today = new Date();
  const [selMonth, setSelMonth] = useState(today.getMonth());

  const monthDeadlines = DEADLINES.filter(d => d.month === selMonth);
  const nextDeadline = DEADLINES.find(d => {
    const dd = new Date(today.getFullYear(), d.month, d.day);
    return dd >= today;
  });

  return (
    <div className="fade-up">
      <SectionHeader icon="📅" title="Tax Calendar & Deadlines" />

      {nextDeadline && (
        <div className="card" style={{ marginBottom:24, borderLeft:"3px solid #38bdf8", background:"linear-gradient(135deg,#0c1a2e,#0f172a)" }}>
          <div style={{ fontSize:12, color:"#38bdf8", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:6 }}>Next Deadline</div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:8 }}>
            <div>
              <div style={{ fontSize:16, fontWeight:600, color:"#e2e8f0", marginBottom:4 }}>{nextDeadline.label}</div>
              <div style={{ fontSize:13, color:"#64748b" }}>{nextDeadline.form}</div>
            </div>
            <div style={{ background:"#1e293b", borderRadius:10, padding:"10px 18px", textAlign:"center", flexShrink:0 }}>
              <div style={{ fontSize:11, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.06em" }}>{MONTHS_SHORT[nextDeadline.month]}</div>
              <div style={{ fontSize:26, fontWeight:800, color:"#f1f5f9", fontFamily:"'Playfair Display',serif", lineHeight:1 }}>{nextDeadline.day}</div>
            </div>
          </div>
        </div>
      )}

      {/* Month picker */}
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:24 }}>
        {MONTHS_SHORT.map((m, i) => {
          const hasItems = DEADLINES.some(d => d.month === i);
          const isPast = i < today.getMonth();
          return (
            <button
              key={m}
              onClick={() => setSelMonth(i)}
              style={{
                background: selMonth === i ? "#0ea5e9" : "transparent",
                border: `1px solid ${selMonth === i ? "#0ea5e9" : hasItems ? "#1e3a5f" : "#0f172a"}`,
                color: selMonth === i ? "#fff" : isPast ? "#1e293b" : hasItems ? "#94a3b8" : "#334155",
                padding:"6px 13px", borderRadius:8, fontSize:13, fontWeight: selMonth === i ? 700 : 400,
                transition:"all 0.15s", position:"relative",
              }}
            >
              {m}
              {hasItems && selMonth !== i && <span style={{ position:"absolute",top:3,right:3,width:4,height:4,background:"#0ea5e9",borderRadius:"50%" }} />}
            </button>
          );
        })}
      </div>

      <h3 style={{ fontSize:16, fontWeight:600, color:"#94a3b8", marginBottom:16 }}>{MONTHS[selMonth]} Deadlines</h3>

      {monthDeadlines.length === 0 ? (
        <div className="card" style={{ textAlign:"center", padding:40, color:"#334155" }}>
          No major federal tax deadlines in {MONTHS[selMonth]}.
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {monthDeadlines.map((d, i) => (
            <div key={i} className="card" style={{ borderLeft:`3px solid ${d.urgent ? "#ef4444" : "#1e293b"}` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:16, flexWrap:"wrap" }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:8 }}>
                    {d.urgent && <Tag label="Urgent" color="red" />}
                    <Tag label={d.tag} color={TAG_CAL[d.tag] || "gray"} />
                    <span style={{ fontSize:11, color:"#475569", padding:"3px 0" }}>Form: {d.form}</span>
                  </div>
                  <div style={{ fontSize:15, fontWeight:600, color:"#e2e8f0", marginBottom:6 }}>{d.label}</div>
                  <div style={{ fontSize:13, color:"#64748b", lineHeight:1.55 }}>{d.desc}</div>
                </div>
                <div style={{ background:"#1e293b", borderRadius:10, padding:"10px 16px", textAlign:"center", flexShrink:0 }}>
                  <div style={{ fontSize:10, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.06em" }}>{MONTHS_SHORT[d.month]}</div>
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

/* ═══════════════════════════════════════════════════
   ASK LEXLIVE TAB
═══════════════════════════════════════════════════ */
function AskTab() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  const SUGGESTIONS = [
    "What is the 2025 standard deduction?",
    "How do I file for a tax extension?",
    "What changed in the Tax Cuts and Jobs Act?",
    "What are the 2025 capital gains tax rates?",
    "Do I need to file a FBAR?",
    "What is the child tax credit in 2025?",
  ];

  const send = async (text) => {
    const q = text || input.trim();
    if (!q || loading) return;
    setInput("");
    setMessages(m => [...m, { role:"user", text:q }]);
    setLoading(true);
    try {
      const answer = await callClaude(
        `You are LexLive, a friendly US tax and law assistant. The user asks: "${q}"
Search the web for current, accurate information. Give a clear, helpful, plain-English answer.
Use bullet points where helpful. Always mention if something is an estimate or if the user should consult a professional.
Keep your answer under 300 words.`
      );
      setMessages(m => [...m, { role:"assistant", text:answer }]);
    } catch {
      setMessages(m => [...m, { role:"assistant", text:"Sorry, I couldn't fetch an answer right now. Please try again." }]);
    }
    setLoading(false);
  };

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages, loading]);

  return (
    <div className="fade-up">
      <SectionHeader icon="🔍" title="Ask LexLive" />
      <p style={{ fontSize:14, color:"#64748b", marginBottom:20 }}>
        Ask anything about US taxes, IRS rules, laws, or financial regulations. Powered by live web search.
      </p>

      {messages.length === 0 && (
        <div style={{ marginBottom:24 }}>
          <p style={{ fontSize:13, color:"#475569", marginBottom:12 }}>Try asking:</p>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {SUGGESTIONS.map((s,i) => (
              <button key={i} onClick={() => send(s)}
                style={{
                  background:"#0f172a", border:"1px solid #1e293b", color:"#94a3b8",
                  padding:"7px 13px", borderRadius:8, fontSize:13, transition:"all 0.15s",
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ display:"flex", flexDirection:"column", gap:14, marginBottom:20, minHeight: messages.length ? 200 : 0 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display:"flex", justifyContent: m.role==="user" ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth:"85%",
              background: m.role==="user" ? "linear-gradient(135deg,#0ea5e9,#6366f1)" : "#0f172a",
              border: m.role==="assistant" ? "1px solid #1e293b" : "none",
              borderRadius: m.role==="user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
              padding:"12px 16px",
              fontSize:14,
              color: m.role==="user" ? "#fff" : "#cbd5e1",
              lineHeight:1.65,
              whiteSpace:"pre-wrap",
            }}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display:"flex", alignItems:"center", gap:10, color:"#475569", fontSize:14 }}>
            <Spinner size={16} /> LexLive is searching…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ display:"flex", gap:10 }}>
        <input
          className="input-dark"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Ask about taxes, IRS rules, laws…"
          disabled={loading}
        />
        <button className="btn-primary" onClick={() => send()} disabled={loading || !input.trim()} style={{ flexShrink:0, padding:"10px 18px" }}>
          {loading ? <Spinner size={16} /> : "Send →"}
        </button>
      </div>
      <p style={{ fontSize:12, color:"#1e293b", marginTop:10 }}>For informational purposes only · Not legal or tax advice · Consult a professional for your situation</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   DASHBOARD TAB
═══════════════════════════════════════════════════ */
function DashboardTab({ onNavigate }) {
  const [rates, setRates]         = useState({});
  const [irsSnip, setIrsSnip]     = useState(null);
  const [lawSnip, setLawSnip]     = useState(null);
  const [loadRates, setLoadRates] = useState(true);
  const [loadIRS, setLoadIRS]     = useState(true);
  const [loadLaw, setLoadLaw]     = useState(true);
  const today = new Date();

  const SPOT = ["EUR","GBP","JPY","PKR","AED","CAD"];

  useEffect(() => {
    fetchRates("USD").then(d => { setRates(d.rates||{}); setLoadRates(false); }).catch(() => setLoadRates(false));
    callClaude(`Search the web for the single most important IRS or federal tax update from 2025. Respond ONLY: TITLE: [max 12 words] | SUMMARY: [1 sentence] | DATE: [date]`)
      .then(t => { setIrsSnip(t); setLoadIRS(false); }).catch(() => setLoadIRS(false));
    callClaude(`Search the web for the single most significant new US law or regulation from 2025. Respond ONLY: TITLE: [max 12 words] | SUMMARY: [1 sentence] | DATE: [date]`)
      .then(t => { setLawSnip(t); setLoadLaw(false); }).catch(() => setLoadLaw(false));
  }, []);

  const parse = (t) => ({
    title:   t?.match(/TITLE:\s*([^|]+)/)?.[1]?.trim() || "",
    summary: t?.match(/SUMMARY:\s*([^|]+)/)?.[1]?.trim() || "",
    date:    t?.match(/DATE:\s*([^|$\n]+)/)?.[1]?.trim() || "",
  });

  const irs = parse(irsSnip);
  const law = parse(lawSnip);

  const upcoming = DEADLINES.filter(d => {
    const dd = new Date(today.getFullYear(), d.month, d.day);
    return dd >= today;
  }).slice(0, 3);

  const flagMap = Object.fromEntries(ALL_CURRENCIES.map(c => [c.code, c.flag]));
  const nameMap = Object.fromEntries(ALL_CURRENCIES.map(c => [c.code, c.name]));

  return (
    <div className="fade-up">
      {/* Hero */}
      <div style={{
        background:"linear-gradient(135deg,#0369a1 0%,#4f46e5 100%)",
        borderRadius:16, padding:"32px 36px", marginBottom:28, position:"relative", overflow:"hidden",
      }}>
        <div style={{ position:"absolute",top:-40,right:-40,width:220,height:220,borderRadius:"50%",background:"rgba(255,255,255,0.05)" }} />
        <div style={{ position:"absolute",bottom:-50,right:80,width:160,height:160,borderRadius:"50%",background:"rgba(255,255,255,0.07)" }} />
        <p style={{ margin:"0 0 4px", fontSize:13, color:"rgba(255,255,255,0.65)" }}>
          {today.toLocaleDateString("en-US",{ weekday:"long",year:"numeric",month:"long",day:"numeric" })}
        </p>
        <h1 style={{ margin:"0 0 6px", fontSize:32, fontWeight:800, color:"#fff", fontFamily:"'Playfair Display',serif", letterSpacing:"-0.03em", lineHeight:1.2 }}>
          LexLive
        </h1>
        <p style={{ margin:0, fontSize:16, color:"rgba(255,255,255,0.75)", fontWeight:500 }}>
          Your US Tax & Law Intelligence Portal — free for everyone
        </p>
      </div>

      {/* Spot rates */}
      <div style={{ marginBottom:28 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <h2 style={{ fontSize:16, fontWeight:600, color:"#94a3b8" }}>Live USD Rates</h2>
          <button className="btn-ghost" onClick={() => onNavigate("rates")} style={{ fontSize:13 }}>See all currencies →</button>
        </div>
        {loadRates ? (
          <div style={{ display:"flex", justifyContent:"center", padding:20 }}><Spinner size={24} /></div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))", gap:10 }}>
            {SPOT.filter(c => rates[c]).map(code => (
              <div key={code} className="card-sm" onClick={() => onNavigate("rates")} style={{ cursor:"pointer" }}>
                <div style={{ fontSize:11, color:"#475569", marginBottom:6 }}>{flagMap[code]} 1 USD =</div>
                <div style={{ fontSize:20, fontWeight:800, color:"#f1f5f9", fontFamily:"'Playfair Display',serif", lineHeight:1 }}>
                  {rates[code] >= 100 ? rates[code].toFixed(2) : rates[code].toFixed(4)}
                </div>
                <div style={{ fontSize:12, color:"#64748b", marginTop:3, fontWeight:500 }}>{code} · {nameMap[code]}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Latest updates */}
      <div className="grid-2" style={{ marginBottom:24 }}>
        <div className="card" style={{ cursor:"pointer" }} onClick={() => onNavigate("irs")}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
            <Tag label="Latest IRS" color="amber" />
            <span style={{ fontSize:20 }}>🏛️</span>
          </div>
          {loadIRS ? <LoadingRow /> : (
            <>
              <div style={{ fontSize:15, fontWeight:600, color:"#e2e8f0", lineHeight:1.45, marginBottom:6 }}>{irs.title || "Loading…"}</div>
              <div style={{ fontSize:13, color:"#64748b", lineHeight:1.55, marginBottom:8 }}>{irs.summary}</div>
              <div style={{ fontSize:12, color:"#475569" }}>{irs.date}</div>
            </>
          )}
          <div style={{ marginTop:14, fontSize:13, color:"#38bdf8" }}>All IRS updates →</div>
        </div>

        <div className="card" style={{ cursor:"pointer" }} onClick={() => onNavigate("laws")}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
            <Tag label="Latest Law" color="purple" />
            <span style={{ fontSize:20 }}>⚖️</span>
          </div>
          {loadLaw ? <LoadingRow /> : (
            <>
              <div style={{ fontSize:15, fontWeight:600, color:"#e2e8f0", lineHeight:1.45, marginBottom:6 }}>{law.title || "Loading…"}</div>
              <div style={{ fontSize:13, color:"#64748b", lineHeight:1.55, marginBottom:8 }}>{law.summary}</div>
              <div style={{ fontSize:12, color:"#475569" }}>{law.date}</div>
            </>
          )}
          <div style={{ marginTop:14, fontSize:13, color:"#38bdf8" }}>All law changes →</div>
        </div>
      </div>

      {/* Upcoming deadlines */}
      <div className="card">
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <h3 style={{ fontSize:15, fontWeight:600, color:"#e2e8f0" }}>Upcoming Tax Deadlines</h3>
          <button onClick={() => onNavigate("calendar")} className="btn-ghost" style={{ fontSize:13 }}>Full calendar →</button>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {upcoming.map((d, i) => (
            <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px", background:"#020617", borderRadius:8, gap:12 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, flex:1, flexWrap:"wrap" }}>
                {d.urgent && <Tag label="Urgent" color="red" />}
                <span style={{ fontSize:14, color:"#cbd5e1" }}>{d.label}</span>
              </div>
              <span style={{ fontSize:13, fontWeight:700, color:"#64748b", flexShrink:0 }}>{MONTHS_SHORT[d.month]} {d.day}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop:24, padding:"16px 20px", background:"#0c1a2e", borderRadius:12, border:"1px solid #1e3a5f" }}>
        <p style={{ fontSize:13, color:"#475569", lineHeight:1.6, margin:0 }}>
          <span style={{ color:"#38bdf8", fontWeight:600 }}>LexLive</span> is free for everyone. Exchange rates are sourced from the European Central Bank.
          IRS and law updates are retrieved via live AI-powered web search.
          This is for informational purposes only — always consult a qualified tax or legal professional for advice specific to your situation.
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   ROOT APP
═══════════════════════════════════════════════════ */
export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div style={{ minHeight:"100vh", background:"#020617" }}>
      {/* Header */}
      <header style={{
        position:"sticky", top:0, zIndex:100,
        background:"rgba(2,6,23,0.95)",
        backdropFilter:"blur(12px)",
        borderBottom:"1px solid #0f172a",
      }}>
        <div style={{ maxWidth:960, margin:"0 auto", padding:"0 20px", display:"flex", alignItems:"center", gap:0 }}>
          {/* Logo */}
          <div style={{ padding:"15px 20px 13px 0", flexShrink:0, marginRight:8 }}>
            <span style={{
              fontSize:22, fontWeight:800, fontFamily:"'Playfair Display',serif", letterSpacing:"-0.02em",
              background:"linear-gradient(90deg,#38bdf8,#818cf8)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
            }}>LexLive</span>
            <span style={{ fontSize:10, color:"#334155", marginLeft:6, letterSpacing:"0.1em", textTransform:"uppercase", fontWeight:600 }}>US Intel</span>
          </div>

          {/* Desktop nav */}
          <nav style={{ display:"flex", overflowX:"auto", flex:1 }} className="hide-on-small">
            {TABS.map(tab => (
              <button key={tab.id} className={`tab-btn ${activeTab===tab.id?"active":""}`}
                onClick={() => setActiveTab(tab.id)}>
                <span className="hide-mobile">{tab.icon}</span> {tab.label}
              </button>
            ))}
          </nav>

          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span className="live-dot" />
            <span style={{ fontSize:11, color:"#334155", fontWeight:500 }}>LIVE</span>
          </div>
        </div>

        {/* Mobile nav */}
        <div style={{ overflowX:"auto", display:"flex", padding:"0 20px", borderTop:"1px solid #0f172a" }}>
          {TABS.map(tab => (
            <button key={tab.id} className={`tab-btn ${activeTab===tab.id?"active":""}`}
              onClick={() => setActiveTab(tab.id)}
              style={{ fontSize:13, padding:"10px 10px 8px" }}>
              {tab.icon} <span style={{ display:"none" }}>{tab.label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Main */}
      <main style={{ maxWidth:960, margin:"0 auto", padding:"32px 20px 80px" }}>
        {activeTab === "dashboard" && <DashboardTab onNavigate={setActiveTab} />}
        {activeTab === "irs"       && <IRSTab />}
        {activeTab === "laws"      && <LawsTab />}
        {activeTab === "rates"     && <RatesTab />}
        {activeTab === "calendar"  && <CalendarTab />}
        {activeTab === "ask"       && <AskTab />}
      </main>

      {/* Footer */}
      <footer style={{ borderTop:"1px solid #0f172a", padding:"20px", textAlign:"center" }}>
        <p style={{ fontSize:12, color:"#1e293b" }}>
          LexLive · Powered by Claude AI + ECB exchange rates · Free for everyone · Not legal or tax advice
        </p>
      </footer>
    </div>
  );
}
