import { useState, useEffect, useCallback, useRef } from "react";

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
  { month:0,  day:31, label:"W-2 & 1099 Forms Issued to Recipients", tag:"Employer",      urgent:false, form:"W-2/1099",   desc:"Employers must send W-2s; payers must send 1099s to recipients by this date." },
  { month:2,  day:15, label:"S-Corp & Partnership Returns Due",      tag:"Business",      urgent:false, form:"1065/1120-S",desc:"Pass-through entities file returns or request a 6-month extension." },
  { month:3,  day:15, label:"Individual Income Tax Return Due",      tag:"Individual",    urgent:true,  form:"1040",       desc:"File your federal return or Form 4868 for an automatic 6-month extension." },
  { month:3,  day:15, label:"Q1 Estimated Tax Payment",              tag:"Quarterly",     urgent:true,  form:"1040-ES",    desc:"First quarter estimated payment for self-employed and non-wage income earners." },
  { month:3,  day:15, label:"IRA & HSA Contribution Deadline",       tag:"Individual",    urgent:false, form:"IRA/HSA",    desc:"Last day to make prior-year IRA and HSA contributions." },
  { month:4,  day:15, label:"FBAR Filing Deadline",                  tag:"International", urgent:false, form:"FinCEN 114", desc:"Report foreign bank accounts if total exceeded $10,000 at any point in the year." },
  { month:5,  day:16, label:"Q2 Estimated Tax Payment",              tag:"Quarterly",     urgent:false, form:"1040-ES",    desc:"Second quarter estimated payment due." },
  { month:5,  day:15, label:"Non-Profit Returns Due",                tag:"Non-Profit",    urgent:false, form:"990",        desc:"Tax-exempt organizations file annual information returns." },
  { month:8,  day:15, label:"Q3 Estimated Tax Payment",              tag:"Quarterly",     urgent:false, form:"1040-ES",    desc:"Third quarter estimated payment due." },
  { month:9,  day:15, label:"Extended Individual Return Deadline",   tag:"Individual",    urgent:false, form:"1040",       desc:"Final deadline if you filed Form 4868 back in April." },
  { month:11, day:31, label:"Year-End Tax Planning Deadline",        tag:"Planning",      urgent:false, form:"Various",    desc:"Last day for tax-loss harvesting, Roth conversions, and charitable deductions." },
  { month:11, day:31, label:"Required Minimum Distributions (RMD)",  tag:"Retirement",    urgent:false, form:"RMD",        desc:"Taxpayers over 73 must withdraw their RMD from traditional IRAs and 401(k)s." },
];

const MONTHS       = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/* ── Cache + helpers ── */
const cache = {};
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function callClaude(prompt, retries = 3) {
  const key = prompt.slice(0, 100);
  if (cache[key]) return cache[key];
  for (let i = 0; i < retries; i++) {
    try {
      if (i > 0) await sleep(3000 * i);
      const res = await fetch("/api/claude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (res.status === 429) { await sleep(4000 * (i + 1)); continue; }
      if (!res.ok) throw new Error("API " + res.status);
      const data = await res.json();
      const text = data.text || "";
      if (text) cache[key] = text;
      return text;
    } catch (err) {
      if (i === retries - 1) throw err;
    }
  }
  throw new Error("Failed after retries");
}

async function fetchRates(base = "USD") {
  const key = "rates_" + base;
  if (cache[key] && cache[key]._ts && Date.now() - cache[key]._ts < 3600000) return cache[key];
  const res = await fetch(`https://api.frankfurter.app/latest?from=${base}&to=${CURRENCIES.map(c=>c.code).join(",")}`);
  if (!res.ok) throw new Error("Rate fetch failed");
  const data = await res.json();
  data._ts = Date.now();
  cache[key] = data;
  return data;
}

function parseItems(text) {
  return text.split("###ITEM###").slice(1)
    .map(s => s.split("###END###")[0].trim())
    .map(s => s.split("|").map(p => p.trim()));
}

const CAT_COLORS  = { "Tax Relief":"green","Filing":"blue","Guidance":"purple","Enforcement":"red","Rates":"amber","Penalty":"red","Credits":"green","International":"teal","Notice":"gray" };
const AREA_COLORS = { Tax:"amber",Healthcare:"green",Finance:"blue",Immigration:"purple",Business:"gray",Environment:"teal",Tech:"blue",Labor:"red",Housing:"teal",Defense:"red" };
const TAG_COLORS  = { Quarterly:"amber",Employer:"blue",Business:"purple",Individual:"green","Non-Profit":"teal",International:"blue",Planning:"gray",Retirement:"amber" };

/* ── UI atoms ── */
function Spinner({ size=18 }) { return <div className="spinner" style={{ width:size, height:size }} />; }
function Tag({ label, color="gray" }) { return <span className={`tag tag-${color}`}>{label}</span>; }
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

/* ══════════════════════════════════
   EXCHANGE RATES TAB
══════════════════════════════════ */
function RatesTab() {
  const [rates, setRates]         = useState({});
  const [base, setBase]           = useState("USD");
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [lastUpdated, setLastUpdated] = useState("");
  const [search, setSearch]       = useState("");
  const [fromCur, setFromCur]     = useState("USD");
  const [toCur, setToCur]         = useState("PKR");
  const [amount, setAmount]       = useState("100");

  const load = useCallback(async (b) => {
    setLoading(true); setError("");
    try {
      const data = await fetchRates(b);
      setRates(data.rates || {});
      setLastUpdated(new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }));
    } catch(e) { setError("Could not load rates. Check your internet connection."); setRates({}); }
    setLoading(false);
  }, []);

  useEffect(() => { load(base); }, [base, load]);

  const getRate = (from, to) => {
    if (from === to) return 1;
    if (from === base) return rates[to] || 0;
    if (to === base) return rates[from] ? 1/rates[from] : 0;
    // cross rate
    const fromToBase = rates[from] ? 1/rates[from] : 0;
    return fromToBase * (rates[to] || 0);
  };

  // Recalc when base changes — rebuild rates relative to base
  const getDisplayRate = (code) => {
    if (base === "USD") return rates[code] || 0;
    return rates[code] || 0;
  };

  const rate      = getRate(fromCur, toCur);
  const inputNum  = parseFloat(amount) || 0;
  const isLarge   = code => ["JPY","KRW","IDR","VND"].includes(code);
  const converted = (inputNum * rate).toLocaleString("en-US", { maximumFractionDigits: isLarge(toCur)?0:2 });
  const revRate   = rate > 0 ? 1/rate : 0;
  const fmt       = (code, val) => isNaN(val) ? "—" : val.toFixed(isLarge(code)?2:4);

  const swap = () => { setFromCur(toCur); setToCur(fromCur); };

  const displayed = CURRENCIES.filter(c => {
    if (!rates[c.code]) return false;
    const q = search.toLowerCase();
    return !q || c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q);
  });

  const ci = code => ALL_CURRENCIES.find(c => c.code === code) || { flag:"💱", name:code };

  return (
    <div className="fade-up">
      <SectionHeader icon="💱" title="Live Exchange Rates">
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span className="live-dot" />
          <span style={{ fontSize:12, color:"#64748b" }}>{loading ? "Loading…" : `Updated ${lastUpdated} · ECB`}</span>
          <button className="btn-ghost" onClick={() => { delete cache["rates_"+base]; load(base); }} disabled={loading} style={{ padding:"5px 10px" }}>↺</button>
        </div>
      </SectionHeader>

      {error && <div style={{ background:"#7f1d1d", color:"#fca5a5", padding:"12px 16px", borderRadius:10, marginBottom:20, fontSize:14 }}>{error}</div>}

      {/* Converter card */}
      <div className="card" style={{ marginBottom:28, background:"linear-gradient(145deg,#0c1a2e,#0f172a)", border:"1px solid #1e3a5f" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:18 }}>
          <span style={{ fontSize:20 }}>🔄</span>
          <h3 style={{ fontSize:17, fontWeight:700, color:"#f1f5f9" }}>Currency Converter</h3>
          <span style={{ fontSize:13, color:"#475569" }}>— type any amount</span>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr auto 1fr", gap:12, alignItems:"end" }}>
          {/* FROM */}
          <div>
            <label style={{ fontSize:12, color:"#64748b", display:"block", marginBottom:6, textTransform:"uppercase", letterSpacing:".06em" }}>From</label>
            <select className="select-dark" value={fromCur} onChange={e => setFromCur(e.target.value)} style={{ marginBottom:8 }}>
              {ALL_CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code} — {c.name}</option>)}
            </select>
            <input className="input-dark" type="number" value={amount} onChange={e => setAmount(e.target.value)}
              placeholder="Amount" style={{ fontSize:22, fontWeight:700, color:"#38bdf8", padding:"12px 14px" }} />
          </div>

          {/* Swap */}
          <button onClick={swap} style={{
            background:"#1e293b", border:"1px solid #334155", color:"#94a3b8",
            width:44, height:44, borderRadius:"50%", fontSize:22,
            display:"flex", alignItems:"center", justifyContent:"center", marginBottom:4,
          }}>⇄</button>

          {/* TO */}
          <div>
            <label style={{ fontSize:12, color:"#64748b", display:"block", marginBottom:6, textTransform:"uppercase", letterSpacing:".06em" }}>To</label>
            <select className="select-dark" value={toCur} onChange={e => setToCur(e.target.value)} style={{ marginBottom:8 }}>
              {ALL_CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code} — {c.name}</option>)}
            </select>
            <div style={{ background:"#020617", border:"1px solid #1e3a5f", borderRadius:10, padding:"12px 14px",
              fontSize:22, fontWeight:700, color:"#22c55e", minHeight:52, display:"flex", alignItems:"center" }}>
              {loading ? <Spinner size={20}/> : converted || "0"}
            </div>
          </div>
        </div>

        {!loading && rate > 0 && (
          <div style={{ marginTop:16, padding:"14px 16px", background:"#020617", borderRadius:8, border:"1px solid #0f2744" }}>
            <div style={{ display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
              <div style={{ fontSize:15 }}>
                <span style={{ color:"#94a3b8" }}>1 {ci(fromCur).flag} <b style={{ color:"#e2e8f0" }}>{fromCur}</b> = </span>
                <b style={{ color:"#38bdf8", fontSize:16 }}>{fmt(toCur, rate)} {ci(toCur).flag} {toCur}</b>
              </div>
              <div style={{ fontSize:15 }}>
                <span style={{ color:"#94a3b8" }}>1 {ci(toCur).flag} <b style={{ color:"#e2e8f0" }}>{toCur}</b> = </span>
                <b style={{ color:"#38bdf8", fontSize:16 }}>{fmt(fromCur, revRate)} {ci(fromCur).flag} {fromCur}</b>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* All rates grid */}
      <div style={{ display:"flex", gap:12, marginBottom:16, flexWrap:"wrap", alignItems:"flex-end" }}>
        <div>
          <label style={{ fontSize:12, color:"#64748b", display:"block", marginBottom:4, textTransform:"uppercase", letterSpacing:".05em" }}>Base</label>
          <select className="select-dark" value={base} onChange={e => setBase(e.target.value)} style={{ width:"auto", minWidth:160 }}>
            {ALL_CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code} — {c.name}</option>)}
          </select>
        </div>
        <div style={{ flex:1, minWidth:180 }}>
          <label style={{ fontSize:12, color:"#64748b", display:"block", marginBottom:4, textTransform:"uppercase", letterSpacing:".05em" }}>Search</label>
          <input className="input-dark" placeholder="🔍  Currency name or country…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <p style={{ fontSize:13, color:"#64748b", marginBottom:16 }}>
        All rates shown as: <strong style={{ color:"#94a3b8" }}>1 {ci(base).flag} {base} = ...</strong> · Tap any card to fill the converter above
      </p>

      {loading ? (
        <div style={{ display:"flex", justifyContent:"center", padding:60 }}><Spinner size={36}/></div>
      ) : (
        <div className="grid-rates">
          {displayed.map(cur => {
            const r = getDisplayRate(cur.code);
            if (!r) return null;
            const big = ["JPY","KRW","IDR"].includes(cur.code);
            const d = big ? 2 : 4;
            return (
              <div key={cur.code} className="card-sm" style={{ cursor:"pointer" }}
                onClick={() => { setFromCur(base); setToCur(cur.code); window.scrollTo({ top:0, behavior:"smooth" }); }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:24 }}>{cur.flag}</span>
                    <div>
                      <div style={{ fontSize:14, fontWeight:700, color:"#f1f5f9" }}>{cur.code}</div>
                      <div style={{ fontSize:11, color:"#475569" }}>{cur.country}</div>
                    </div>
                  </div>
                  <span style={{ fontSize:10, color:"#334155", border:"1px solid #1e293b", padding:"2px 6px", borderRadius:4, flexShrink:0 }}>tap to convert</span>
                </div>

                <div style={{ borderTop:"1px solid #1e293b", paddingTop:10 }}>
                  <div style={{ fontSize:12, color:"#64748b", marginBottom:4 }}>
                    1 {ci(base).flag} {base} =
                  </div>
                  <div style={{ fontSize: r>=10000?16:r>=1000?18:r>=100?20:24, fontWeight:800, color:"#f1f5f9",
                    fontFamily:"'Playfair Display',serif", lineHeight:1.1, wordBreak:"break-all" }}>
                    {r.toFixed(d)}
                  </div>
                  <div style={{ fontSize:13, color:"#64748b", marginTop:3, fontWeight:500 }}>{cur.name}</div>
                </div>

                <div style={{ marginTop:10, padding:"7px 10px", background:"#020617", borderRadius:6 }}>
                  <div style={{ fontSize:12, color:"#475569" }}>
                    1 {cur.flag} {cur.code} =
                  </div>
                  <div style={{ fontSize:13, color:"#94a3b8", fontWeight:700 }}>
                    {(1/r).toFixed(d)} {ci(base).flag} {base}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {!loading && displayed.length === 0 && (
        <div className="card" style={{ textAlign:"center", padding:40, color:"#475569" }}>No currencies match "{search}"</div>
      )}
      <p style={{ fontSize:12, color:"#1e293b", marginTop:20, textAlign:"center" }}>
        Source: European Central Bank (ECB) via Frankfurter · Updated daily · For reference only
      </p>
    </div>
  );
}

/* ══════════════════════════════════
   IRS TAB
══════════════════════════════════ */
function IRSTab() {
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [expanded, setExpanded] = useState(null);
  const [lastFetched, setLastFetched] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError(""); setItems([]);
    try {
      const txt = await callClaude(
        `Search the web right now for the 8 most recent IRS announcements, tax guidance, and regulatory updates from 2025. Use today's date to find the very latest news.
Return ONLY this exact format, nothing else before or after:
###ITEM### Title | Date | Category | 2-sentence plain-English summary of what changed and who is affected ###END###
Category must be one of: Tax Relief, Filing, Guidance, Enforcement, Rates, Penalty, Credits, International, Notice`
      );
      const parsed = parseItems(txt)
        .map(([title,date,category,summary]) => ({ title,date,category,summary }))
        .filter(i => i.title && i.summary);
      setItems(parsed);
      setLastFetched(new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }));
    } catch(e) { setError("Failed to load. Please try again."); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="fade-up">
      <SectionHeader icon="🏛️" title="IRS Updates & Guidance">
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {lastFetched && <span style={{ fontSize:12, color:"#475569" }}>Fetched {lastFetched}</span>}
          <button className="btn-ghost" onClick={() => { const k = Object.keys(cache).find(k => k.includes("IRS")); if(k) delete cache[k]; load(); }} disabled={loading}>
            {loading ? <Spinner size={14}/> : "↺"} Refresh
          </button>
        </div>
      </SectionHeader>

      {error && <div style={{ background:"#7f1d1d", color:"#fca5a5", padding:"12px 16px", borderRadius:10, marginBottom:20, fontSize:14 }}>{error} <button className="btn-ghost" onClick={load} style={{ marginLeft:8, display:"inline-flex" }}>Retry</button></div>}

      {loading && [...Array(5)].map((_,i) => (
        <div key={i} className="card" style={{ marginBottom:12 }}>
          <div className="skeleton" style={{ height:14, width:"60%", marginBottom:10 }} />
          <div className="skeleton" style={{ height:12, width:"100%", marginBottom:6 }} />
          <div className="skeleton" style={{ height:12, width:"75%" }} />
        </div>
      ))}

      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {items.map((item,i) => (
          <div key={i} className="card" style={{ cursor:"pointer" }} onClick={() => setExpanded(expanded===i?null:i)}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 }}>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:8 }}>
                  <Tag label={item.category||"Update"} color={CAT_COLORS[item.category]||"gray"} />
                  {item.date && <span style={{ fontSize:11, color:"#475569", padding:"3px 0" }}>{item.date}</span>}
                </div>
                <h3 style={{ fontSize:15, fontWeight:600, color:"#e2e8f0", lineHeight:1.45 }}>{item.title}</h3>
                {expanded===i && <p style={{ fontSize:14, color:"#94a3b8", lineHeight:1.65, marginTop:10 }}>{item.summary}</p>}
              </div>
              <span style={{ color:"#334155", fontSize:16, flexShrink:0, marginTop:2 }}>{expanded===i?"▲":"▼"}</span>
            </div>
          </div>
        ))}
      </div>
      {!loading && !error && items.length === 0 && (
        <div className="card" style={{ textAlign:"center", padding:40, color:"#475569" }}>
          No updates loaded. <button className="btn-ghost" onClick={load} style={{ display:"inline-flex", marginLeft:8 }}>Try again</button>
        </div>
      )}
      <p style={{ fontSize:12, color:"#1e293b", marginTop:20 }}>AI-powered · Live web search · For informational purposes only · Not tax advice</p>
    </div>
  );
}

/* ══════════════════════════════════
   LAW CHANGES TAB
══════════════════════════════════ */
function LawsTab() {
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [expanded, setExpanded] = useState(null);
  const [lastFetched, setLastFetched] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError(""); setItems([]);
    try {
      const txt = await callClaude(
        `Search the web right now for the 8 most recent significant US federal law changes, bills signed into law, or major regulatory changes from 2025. Find the very latest news.
Return ONLY this exact format, nothing else:
###ITEM### Law/Bill Name | Date | Area | 2-sentence plain-English summary of what changed and who it affects ###END###
Area must be one of: Tax, Healthcare, Finance, Immigration, Business, Environment, Tech, Labor, Housing, Defense`
      );
      const parsed = parseItems(txt)
        .map(([name,date,area,summary]) => ({ name,date,area,summary }))
        .filter(i => i.name && i.summary);
      setItems(parsed);
      setLastFetched(new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }));
    } catch(e) { setError("Failed to load. Please try again."); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="fade-up">
      <SectionHeader icon="⚖️" title="Federal Law Changes">
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {lastFetched && <span style={{ fontSize:12, color:"#475569" }}>Fetched {lastFetched}</span>}
          <button className="btn-ghost" onClick={load} disabled={loading}>
            {loading ? <Spinner size={14}/> : "↺"} Refresh
          </button>
        </div>
      </SectionHeader>

      {error && <div style={{ background:"#7f1d1d", color:"#fca5a5", padding:"12px 16px", borderRadius:10, marginBottom:20, fontSize:14 }}>{error}</div>}

      {loading && [...Array(5)].map((_,i) => (
        <div key={i} className="card" style={{ marginBottom:12 }}>
          <div className="skeleton" style={{ height:14, width:"55%", marginBottom:10 }} />
          <div className="skeleton" style={{ height:12, width:"100%", marginBottom:6 }} />
          <div className="skeleton" style={{ height:12, width:"70%" }} />
        </div>
      ))}

      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {items.map((item,i) => (
          <div key={i} className="card" style={{ cursor:"pointer" }} onClick={() => setExpanded(expanded===i?null:i)}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 }}>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:8 }}>
                  <Tag label={item.area||"Law"} color={AREA_COLORS[item.area]||"gray"} />
                  {item.date && <span style={{ fontSize:11, color:"#475569", padding:"3px 0" }}>{item.date}</span>}
                </div>
                <h3 style={{ fontSize:15, fontWeight:600, color:"#e2e8f0", lineHeight:1.45 }}>{item.name}</h3>
                {expanded===i && <p style={{ fontSize:14, color:"#94a3b8", lineHeight:1.65, marginTop:10 }}>{item.summary}</p>}
              </div>
              <span style={{ color:"#334155", fontSize:16, flexShrink:0, marginTop:2 }}>{expanded===i?"▲":"▼"}</span>
            </div>
          </div>
        ))}
      </div>
      {!loading && !error && items.length === 0 && (
        <div className="card" style={{ textAlign:"center", padding:40, color:"#475569" }}>
          No updates loaded. <button className="btn-ghost" onClick={load} style={{ display:"inline-flex", marginLeft:8 }}>Try again</button>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════
   TAX CALENDAR TAB
══════════════════════════════════ */
function CalendarTab() {
  const today    = new Date();
  const [selMonth, setSelMonth] = useState(today.getMonth());
  const monthDeadlines = DEADLINES.filter(d => d.month === selMonth);
  const nextDeadline   = DEADLINES.find(d => new Date(today.getFullYear(), d.month, d.day) >= today);

  return (
    <div className="fade-up">
      <SectionHeader icon="📅" title="Tax Calendar & Deadlines" />

      {nextDeadline && (
        <div className="card" style={{ marginBottom:24, borderLeft:"3px solid #38bdf8", background:"linear-gradient(135deg,#0c1a2e,#0f172a)" }}>
          <div style={{ fontSize:12, color:"#38bdf8", textTransform:"uppercase", letterSpacing:".07em", marginBottom:6 }}>Next Upcoming Deadline</div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:8 }}>
            <div>
              <div style={{ fontSize:16, fontWeight:600, color:"#e2e8f0", marginBottom:4 }}>{nextDeadline.label}</div>
              <div style={{ fontSize:13, color:"#64748b" }}>Form: {nextDeadline.form}</div>
            </div>
            <div style={{ background:"#1e293b", borderRadius:10, padding:"10px 20px", textAlign:"center", flexShrink:0 }}>
              <div style={{ fontSize:11, color:"#64748b", textTransform:"uppercase", letterSpacing:".06em" }}>{MONTHS_SHORT[nextDeadline.month]}</div>
              <div style={{ fontSize:28, fontWeight:800, color:"#f1f5f9", fontFamily:"'Playfair Display',serif", lineHeight:1 }}>{nextDeadline.day}</div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:24 }}>
        {MONTHS_SHORT.map((m,i) => {
          const has  = DEADLINES.some(d => d.month===i);
          const past = i < today.getMonth();
          return (
            <button key={m} onClick={() => setSelMonth(i)} style={{
              background: selMonth===i ? "#0ea5e9" : "transparent",
              border:`1px solid ${selMonth===i?"#0ea5e9":has?"#1e3a5f":"#0f172a"}`,
              color: selMonth===i?"#fff":past?"#1e293b":has?"#94a3b8":"#334155",
              padding:"6px 13px", borderRadius:8, fontSize:13,
              fontWeight: selMonth===i?700:400, position:"relative",
            }}>
              {m}
              {has && selMonth!==i && <span style={{ position:"absolute",top:3,right:3,width:4,height:4,background:"#0ea5e9",borderRadius:"50%" }} />}
            </button>
          );
        })}
      </div>

      <h3 style={{ fontSize:16, fontWeight:600, color:"#94a3b8", marginBottom:14 }}>{MONTHS[selMonth]}</h3>

      {monthDeadlines.length === 0 ? (
        <div className="card" style={{ textAlign:"center", padding:40, color:"#334155" }}>No major deadlines in {MONTHS[selMonth]}.</div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {monthDeadlines.map((d,i) => (
            <div key={i} className="card" style={{ borderLeft:`3px solid ${d.urgent?"#ef4444":"#1e293b"}` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:16, flexWrap:"wrap" }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:8 }}>
                    {d.urgent && <Tag label="Urgent" color="red" />}
                    <Tag label={d.tag} color={TAG_COLORS[d.tag]||"gray"} />
                    <span style={{ fontSize:11, color:"#475569", padding:"3px 0" }}>Form: {d.form}</span>
                  </div>
                  <div style={{ fontSize:15, fontWeight:600, color:"#e2e8f0", marginBottom:6 }}>{d.label}</div>
                  <div style={{ fontSize:13, color:"#64748b", lineHeight:1.55 }}>{d.desc}</div>
                </div>
                <div style={{ background:"#1e293b", borderRadius:10, padding:"10px 18px", textAlign:"center", flexShrink:0 }}>
                  <div style={{ fontSize:10, color:"#64748b", textTransform:"uppercase", letterSpacing:".06em" }}>{MONTHS_SHORT[d.month]}</div>
                  <div style={{ fontSize:26, fontWeight:800, color:"#f1f5f9", fontFamily:"'Playfair Display',serif", lineHeight:1 }}>{d.day}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════
   ASK LEXLIVE TAB
══════════════════════════════════ */
function AskTab() {
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const bottomRef               = useRef(null);

  const SUGGESTIONS = [
    "What is the 2025 standard deduction?",
    "How do I file for a tax extension?",
    "What are the 2025 capital gains tax rates?",
    "Do I need to file a FBAR?",
    "What is the child tax credit in 2025?",
    "What changed in US tax law recently?",
  ];

  const send = async (text) => {
    const q = (text || input).trim();
    if (!q || loading) return;
    setInput("");
    setMessages(m => [...m, { role:"user", text:q }]);
    setLoading(true);
    try {
      const answer = await callClaude(
        `You are LexLive, a helpful US tax and law assistant. Search the web for current accurate information to answer this question: "${q}"
Give a clear, plain-English answer under 250 words. Use bullet points where helpful. Note if the user should consult a professional for their specific situation.`
      );
      setMessages(m => [...m, { role:"assistant", text:answer }]);
    } catch {
      setMessages(m => [...m, { role:"assistant", text:"Sorry, I couldn't get an answer right now. Please try again in a moment." }]);
    }
    setLoading(false);
  };

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages, loading]);

  return (
    <div className="fade-up">
      <SectionHeader icon="🔍" title="Ask LexLive" />
      <p style={{ fontSize:14, color:"#64748b", marginBottom:20 }}>Ask anything about US taxes, IRS rules, laws, or financial regulations.</p>

      {messages.length === 0 && (
        <div style={{ marginBottom:24 }}>
          <p style={{ fontSize:13, color:"#475569", marginBottom:12 }}>Try asking:</p>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {SUGGESTIONS.map((s,i) => (
              <button key={i} onClick={() => send(s)} style={{
                background:"#0f172a", border:"1px solid #1e293b", color:"#94a3b8",
                padding:"7px 13px", borderRadius:8, fontSize:13, transition:"all .15s",
              }}>{s}</button>
            ))}
          </div>
        </div>
      )}

      <div style={{ display:"flex", flexDirection:"column", gap:14, marginBottom:20 }}>
        {messages.map((m,i) => (
          <div key={i} style={{ display:"flex", justifyContent:m.role==="user"?"flex-end":"flex-start" }}>
            <div style={{
              maxWidth:"85%",
              background: m.role==="user" ? "linear-gradient(135deg,#0ea5e9,#6366f1)" : "#0f172a",
              border: m.role==="assistant" ? "1px solid #1e293b" : "none",
              borderRadius: m.role==="user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
              padding:"12px 16px", fontSize:14, color:m.role==="user"?"#fff":"#cbd5e1",
              lineHeight:1.65, whiteSpace:"pre-wrap",
            }}>{m.text}</div>
          </div>
        ))}
        {loading && (
          <div style={{ display:"flex", alignItems:"center", gap:10, color:"#475569", fontSize:14 }}>
            <Spinner size={16}/> Searching for your answer…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ display:"flex", gap:10 }}>
        <input className="input-dark" value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if(e.key==="Enter" && !e.shiftKey){ e.preventDefault(); send(); } }}
          placeholder="Ask about taxes, IRS rules, laws…" disabled={loading} />
        <button className="btn-primary" onClick={() => send()} disabled={loading||!input.trim()} style={{ flexShrink:0 }}>
          {loading ? <Spinner size={16}/> : "Send →"}
        </button>
      </div>
      <p style={{ fontSize:12, color:"#1e293b", marginTop:10 }}>For informational purposes only · Not legal or tax advice</p>
    </div>
  );
}

/* ══════════════════════════════════
   DASHBOARD TAB
══════════════════════════════════ */
function DashboardTab({ onNavigate }) {
  const [rates, setRates]     = useState({});
  const [irsSnip, setIrsSnip] = useState(null);
  const [lawSnip, setLawSnip] = useState(null);
  const [loadR, setLoadR]     = useState(true);
  const [loadI, setLoadI]     = useState(true);
  const [loadL, setLoadL]     = useState(true);
  const today = new Date();
  const SPOT  = ["EUR","GBP","JPY","PKR","AED","CAD"];

  useEffect(() => {
    // Load rates first
    fetchRates("USD")
      .then(d => { setRates(d.rates||{}); setLoadR(false); })
      .catch(() => setLoadR(false));

    // Then IRS snippet after 1s delay
    const t1 = setTimeout(() => {
      callClaude(`Search the web for the single most important IRS or federal tax update from this week in 2025. Respond ONLY: TITLE: [max 12 words] | SUMMARY: [1 sentence max] | DATE: [date]`)
        .then(t => { setIrsSnip(t); setLoadI(false); }).catch(() => setLoadI(false));
    }, 1000);

    // Then law snippet after 3s delay
    const t2 = setTimeout(() => {
      callClaude(`Search the web for the single most significant new US law or regulation from this month in 2025. Respond ONLY: TITLE: [max 12 words] | SUMMARY: [1 sentence max] | DATE: [date]`)
        .then(t => { setLawSnip(t); setLoadL(false); }).catch(() => setLoadL(false));
    }, 3000);

    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const parse = t => ({
    title:   t?.match(/TITLE:\s*([^|]+)/)?.[1]?.trim()||"",
    summary: t?.match(/SUMMARY:\s*([^|]+)/)?.[1]?.trim()||"",
    date:    t?.match(/DATE:\s*([^|\n]+)/)?.[1]?.trim()||"",
  });

  const irs = parse(irsSnip);
  const law = parse(lawSnip);
  const ci  = code => ALL_CURRENCIES.find(c => c.code===code)||{ flag:"💱" };

  const upcoming = DEADLINES.filter(d => new Date(today.getFullYear(), d.month, d.day) >= today).slice(0, 3);

  return (
    <div className="fade-up">
      {/* Hero */}
      <div style={{ background:"linear-gradient(135deg,#0369a1 0%,#4f46e5 100%)", borderRadius:16, padding:"32px 36px", marginBottom:28, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute",top:-40,right:-40,width:220,height:220,borderRadius:"50%",background:"rgba(255,255,255,.05)" }} />
        <div style={{ position:"absolute",bottom:-50,right:80,width:160,height:160,borderRadius:"50%",background:"rgba(255,255,255,.07)" }} />
        <p style={{ margin:"0 0 4px", fontSize:13, color:"rgba(255,255,255,.65)" }}>
          {today.toLocaleDateString("en-US",{ weekday:"long",year:"numeric",month:"long",day:"numeric" })}
        </p>
        <h1 style={{ margin:"0 0 6px", fontSize:32, fontWeight:800, color:"#fff", fontFamily:"'Playfair Display',serif", letterSpacing:"-.03em", lineHeight:1.2 }}>LexLive</h1>
        <p style={{ margin:0, fontSize:16, color:"rgba(255,255,255,.75)", fontWeight:500 }}>Your US Tax & Law Intelligence Portal — free for everyone</p>
      </div>

      {/* Spot rates */}
      <div style={{ marginBottom:28 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <h2 style={{ fontSize:16, fontWeight:600, color:"#94a3b8" }}>Live USD Rates</h2>
          <button className="btn-ghost" onClick={() => onNavigate("rates")} style={{ fontSize:13 }}>See all & convert →</button>
        </div>
        {loadR ? (
          <div style={{ display:"flex", justifyContent:"center", padding:20 }}><Spinner size={28}/></div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:10 }}>
            {SPOT.filter(c => rates[c]).map(code => {
              const r = rates[code];
              const big = ["JPY","KRW","IDR"].includes(code);
              return (
                <div key={code} className="card-sm" style={{ cursor:"pointer" }} onClick={() => onNavigate("rates")}>
                  <div style={{ fontSize:11, color:"#475569", marginBottom:4 }}>{ci(code).flag} 1 USD =</div>
                  <div style={{ fontSize:big?16:20, fontWeight:800, color:"#f1f5f9", fontFamily:"'Playfair Display',serif", lineHeight:1.1 }}>
                    {r.toFixed(big?2:4)}
                  </div>
                  <div style={{ fontSize:11, color:"#64748b", marginTop:3 }}>{code}</div>
                </div>
              );
            })}
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
          {loadI ? <div style={{ display:"flex", alignItems:"center", gap:8, color:"#475569", fontSize:13 }}><Spinner size={14}/> Loading…</div> : (
            <>
              <div style={{ fontSize:15, fontWeight:600, color:"#e2e8f0", lineHeight:1.45, marginBottom:6 }}>{irs.title||"No update loaded"}</div>
              <div style={{ fontSize:13, color:"#64748b", lineHeight:1.55, marginBottom:6 }}>{irs.summary}</div>
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
          {loadL ? <div style={{ display:"flex", alignItems:"center", gap:8, color:"#475569", fontSize:13 }}><Spinner size={14}/> Loading…</div> : (
            <>
              <div style={{ fontSize:15, fontWeight:600, color:"#e2e8f0", lineHeight:1.45, marginBottom:6 }}>{law.title||"No update loaded"}</div>
              <div style={{ fontSize:13, color:"#64748b", lineHeight:1.55, marginBottom:6 }}>{law.summary}</div>
              <div style={{ fontSize:12, color:"#475569" }}>{law.date}</div>
            </>
          )}
          <div style={{ marginTop:14, fontSize:13, color:"#38bdf8" }}>All law changes →</div>
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
              <span style={{ fontSize:13, fontWeight:700, color:"#64748b", flexShrink:0 }}>{MONTHS_SHORT[d.month]} {d.day}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop:24, padding:"14px 18px", background:"#0c1a2e", borderRadius:12, border:"1px solid #1e3a5f" }}>
        <p style={{ fontSize:13, color:"#475569", lineHeight:1.6, margin:0 }}>
          <span style={{ color:"#38bdf8", fontWeight:600 }}>LexLive</span> is free for everyone.
          Exchange rates from the European Central Bank. IRS & law updates via live AI web search.
          For informational purposes only — consult a qualified professional for advice specific to your situation.
        </p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════
   ROOT APP
══════════════════════════════════ */
export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div style={{ minHeight:"100vh", background:"#020617" }}>
      {/* Header */}
      <header style={{ position:"sticky", top:0, zIndex:100, background:"rgba(2,6,23,.97)", backdropFilter:"blur(12px)", borderBottom:"1px solid #0f172a" }}>
        <div style={{ maxWidth:980, margin:"0 auto", padding:"0 20px" }}>
          {/* Top row */}
          <div style={{ display:"flex", alignItems:"center", gap:16 }}>
            <div style={{ padding:"15px 0 13px", flexShrink:0 }}>
              <span style={{ fontSize:22, fontWeight:800, fontFamily:"'Playfair Display',serif", letterSpacing:"-.02em",
                background:"linear-gradient(90deg,#38bdf8,#818cf8)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>LexLive</span>
              <span style={{ fontSize:10, color:"#334155", marginLeft:6, letterSpacing:".1em", textTransform:"uppercase", fontWeight:600 }}>US Intel</span>
            </div>
            <div style={{ flex:1 }} />
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <span className="live-dot" />
              <span style={{ fontSize:11, color:"#334155", fontWeight:600 }}>LIVE</span>
            </div>
          </div>
          {/* Nav */}
          <nav style={{ display:"flex", overflowX:"auto", gap:0 }}>
            {TABS.map(tab => (
              <button key={tab.id} className={`tab-btn ${activeTab===tab.id?"active":""}`}
                onClick={() => setActiveTab(tab.id)} style={{ fontSize:13 }}>
                {tab.icon} <span className="hide-mobile">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main style={{ maxWidth:980, margin:"0 auto", padding:"32px 20px 80px" }}>
        {activeTab==="dashboard" && <DashboardTab onNavigate={setActiveTab} />}
        {activeTab==="irs"       && <IRSTab />}
        {activeTab==="laws"      && <LawsTab />}
        {activeTab==="rates"     && <RatesTab />}
        {activeTab==="calendar"  && <CalendarTab />}
        {activeTab==="ask"       && <AskTab />}
      </main>

      <footer style={{ borderTop:"1px solid #0f172a", padding:"18px 20px", textAlign:"center" }}>
        <p style={{ fontSize:12, color:"#1e293b" }}>LexLive · Claude AI + ECB rates · Free for everyone · Not legal or tax advice</p>
      </footer>
    </div>
  );
}
