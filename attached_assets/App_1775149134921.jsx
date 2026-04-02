import { useState, useEffect, useCallback, useRef } from "react";

// ─── CONFIG ─────────────────────────────────────────────────────────
const API = "/api";
const METRICS = [
  { id: "pe_ratio", name: "P/E Ratio", desc: "Price-to-Earnings" },
  { id: "debt_to_equity", name: "Debt-to-Equity", desc: "Total Debt / Equity" },
  { id: "eps_growth", name: "EPS Growth (%)", desc: "YoY earnings growth" },
  { id: "dividend_yield", name: "Dividend Yield (%)", desc: "Annual dividends / price" },
  { id: "roe", name: "ROE (%)", desc: "Return on Equity" },
  { id: "revenue_growth", name: "Revenue Growth (%)", desc: "YoY revenue growth" },
  { id: "profit_margin", name: "Profit Margin (%)", desc: "Net income / revenue" },
  { id: "current_ratio", name: "Current Ratio", desc: "Current assets / liabilities" },
  { id: "market_cap_b", name: "Market Cap ($B)", desc: "Market cap in billions" },
  { id: "beta", name: "Beta", desc: "Volatility vs market" },
];

const TEMPLATES = [
  { name: "Value Investing", desc: "Low P/E, low debt, strong margins", criteria: [
    { metricId: "pe_ratio", operator: "lt", value: 20, valueLow: 0, valueHigh: 0 },
    { metricId: "debt_to_equity", operator: "lt", value: 1.0, valueLow: 0, valueHigh: 0 },
    { metricId: "profit_margin", operator: "gt", value: 10, valueLow: 0, valueHigh: 0 },
    { metricId: "current_ratio", operator: "gt", value: 1.0, valueLow: 0, valueHigh: 0 },
  ]},
  { name: "Growth Stocks", desc: "High EPS & revenue growth, strong ROE", criteria: [
    { metricId: "eps_growth", operator: "gt", value: 15, valueLow: 0, valueHigh: 0 },
    { metricId: "revenue_growth", operator: "gt", value: 10, valueLow: 0, valueHigh: 0 },
    { metricId: "roe", operator: "gt", value: 15, valueLow: 0, valueHigh: 0 },
  ]},
  { name: "Dividend Income", desc: "High yield, sustainable payout", criteria: [
    { metricId: "dividend_yield", operator: "gt", value: 2.5, valueLow: 0, valueHigh: 0 },
    { metricId: "pe_ratio", operator: "lt", value: 30, valueLow: 0, valueHigh: 0 },
    { metricId: "debt_to_equity", operator: "lt", value: 2.0, valueLow: 0, valueHigh: 0 },
    { metricId: "profit_margin", operator: "gt", value: 8, valueLow: 0, valueHigh: 0 },
  ]},
  { name: "Low Volatility", desc: "Low beta, stable dividends", criteria: [
    { metricId: "beta", operator: "lt", value: 0.8, valueLow: 0, valueHigh: 0 },
    { metricId: "dividend_yield", operator: "gt", value: 1.5, valueLow: 0, valueHigh: 0 },
    { metricId: "current_ratio", operator: "gt", value: 0.8, valueLow: 0, valueHigh: 0 },
  ]},
  { name: "Quality at Any Price", desc: "High ROE, strong margins, low debt", criteria: [
    { metricId: "roe", operator: "gt", value: 20, valueLow: 0, valueHigh: 0 },
    { metricId: "profit_margin", operator: "gt", value: 15, valueLow: 0, valueHigh: 0 },
    { metricId: "debt_to_equity", operator: "lt", value: 1.5, valueLow: 0, valueHigh: 0 },
    { metricId: "revenue_growth", operator: "gt", value: 5, valueLow: 0, valueHigh: 0 },
  ]},
];

// ─── API HELPERS ────────────────────────────────────────────────────
const getToken = () => localStorage.getItem("ib_token");
const setToken = (t) => localStorage.setItem("ib_token", t);
const clearToken = () => localStorage.removeItem("ib_token");

async function api(path, opts = {}) {
  const token = getToken();
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...opts.headers },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

// ─── COLORS ─────────────────────────────────────────────────────────
const C = {
  pri: "#1E3A8A", priL: "#3B5FBF", priF: "#EFF3FE",
  acc: "#10B981", accL: "#D1FAE5",
  bg: "#F8FAFC", card: "#fff", bdr: "#E2E8F0",
  txt: "#111827", mut: "#64748B",
  err: "#EF4444", errBg: "#FEF2F2", errBdr: "#FECACA",
  okBg: "#F0FDF4", okBdr: "#BBF7D0",
  warn: "#D97706", warnBg: "#FFFBEB",
};
const F = "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif";
const M = "'JetBrains Mono', 'SF Mono', monospace";

// ─── ICONS ──────────────────────────────────────────────────────────
function I({ t, s = 18, c = "currentColor", f = false }) {
  const p = {
    home: "M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z|M9 21V12h6v9",
    filter: "M22 3H2l8 9.46V19l4 2v-8.54L22 3z",
    star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
    play: "M5 3l14 9-14 9V3z",
    plus: "M12 5v14|M5 12h14",
    edit: "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7|M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
    trash: "M3 6h18|M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2|M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6",
    logout: "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4|M16 17l5-5-5-5|M21 12H9",
    back: "M15 18l-6-6 6-6",
    check: "M20 6L9 17l-5-5",
    x: "M18 6L6 18|M6 6l12 12",
    search: "",
    chart: "M18 20V10|M12 20V4|M6 20v-6",
    ai: "M12 2a10 10 0 100 20 10 10 0 000-20z|M12 6v2|M12 16v2|M6 12h2|M16 12h2",
    stocks: "M2 20h20|M5 20V14|M9 20V10|M13 20V6|M17 20V2",
    refresh: "M23 4v6h-6|M1 20v-6h6|M3.51 9a9 9 0 0114.85-3.36L23 10|M20.49 15a9 9 0 01-14.85 3.36L1 14",
    download: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4|M7 10l5 5 5-5|M12 15V3",
    sort: "M3 6h18|M3 12h12|M3 18h6",
    up: "M18 15l-6-6-6 6",
    down: "M6 9l6 6 6-6",
  };
  const d = p[t] || "";
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      {d.split("|").map((path, i) => (
        <path key={i} d={path} fill={t === "star" && f ? c : "none"}
          stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      ))}
      {t === "search" && <><circle cx="11" cy="11" r="8" fill="none" stroke={c} strokeWidth="2" /><path d="M21 21l-4.35-4.35" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" /></>}
    </svg>
  );
}

// ─── UI COMPONENTS ──────────────────────────────────────────────────
function Btn({ children, onClick, v = "pri", sz = "md", disabled, icon, style }) {
  const szs = { sm: { padding: "6px 12px", fontSize: 13 }, md: { padding: "10px 18px", fontSize: 14 }, lg: { padding: "12px 24px", fontSize: 15 } };
  const vs = {
    pri: { background: C.pri, color: "#fff" }, acc: { background: C.acc, color: "#fff" },
    out: { background: "transparent", color: C.pri, border: `1.5px solid ${C.pri}` },
    ghost: { background: "transparent", color: C.mut }, danger: { background: C.err, color: "#fff" },
    warn: { background: C.warn, color: "#fff" },
  };
  return (
    <button onClick={disabled ? undefined : onClick} style={{
      display: "inline-flex", alignItems: "center", gap: 6, border: "none", borderRadius: 8,
      cursor: disabled ? "not-allowed" : "pointer", fontFamily: F, fontWeight: 600,
      transition: "all 0.15s", opacity: disabled ? 0.5 : 1, ...szs[sz], ...vs[v], ...style,
    }}>{icon && <I t={icon} s={sz === "sm" ? 14 : 16} />}{children}</button>
  );
}

function Card({ children, style, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: C.card, borderRadius: 12, border: `1px solid ${C.bdr}`, padding: 20,
      cursor: onClick ? "pointer" : "default", transition: "box-shadow 0.15s, transform 0.15s", ...style,
    }}
    onMouseEnter={e => { if (onClick) { e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.07)"; e.currentTarget.style.transform = "translateY(-1px)"; }}}
    onMouseLeave={e => { if (onClick) { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}}
    >{children}</div>
  );
}

function Badge({ children, v = "default" }) {
  const vs = { default: { bg: "#F1F5F9", c: C.txt }, success: { bg: C.accL, c: "#065F46" }, error: { bg: C.errBg, c: "#991B1B" }, pri: { bg: C.priF, c: C.pri }, warn: { bg: C.warnBg, c: "#92400E" } };
  return <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, fontFamily: F, background: vs[v].bg, color: vs[v].c }}>{children}</span>;
}

function Score({ score }) {
  const c = score >= 80 ? "#059669" : score >= 50 ? "#D97706" : "#DC2626";
  return (
    <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 46, height: 46, borderRadius: "50%", background: `${c}12`, border: `2.5px solid ${c}`, color: c, fontWeight: 700, fontSize: 15, fontFamily: M }}>{score}</div>
  );
}

function Inp({ label, error, ...p }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {label && <label style={{ fontSize: 13, fontWeight: 600, color: C.txt, fontFamily: F }}>{label}</label>}
      <input {...p} style={{ padding: "9px 12px", borderRadius: 8, fontFamily: F, fontSize: 14, border: `1.5px solid ${error ? C.err : C.bdr}`, outline: "none", ...p.style }}
        onFocus={e => { e.target.style.borderColor = C.pri; }}
        onBlur={e => { e.target.style.borderColor = error ? C.err : C.bdr; }} />
      {error && <span style={{ fontSize: 12, color: C.err }}>{error}</span>}
    </div>
  );
}

function Sel({ label, options, ...p }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {label && <label style={{ fontSize: 13, fontWeight: 600, color: C.txt, fontFamily: F }}>{label}</label>}
      <select {...p} style={{ padding: "9px 12px", borderRadius: 8, fontFamily: F, fontSize: 14, border: `1.5px solid ${C.bdr}`, outline: "none", background: "#fff", cursor: "pointer", ...p.style }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function Spin({ text = "Loading..." }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: 40 }}>
      <div style={{ width: 32, height: 32, border: `3px solid ${C.bdr}`, borderTopColor: C.pri, borderRadius: "50%", animation: "ib-spin 0.8s linear infinite" }} />
      <span style={{ fontSize: 14, color: C.mut, fontFamily: F }}>{text}</span>
      <style>{`@keyframes ib-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function Empty({ icon, title, sub, action }) {
  return (
    <div style={{ textAlign: "center", padding: "40px 20px" }}>
      <div style={{ marginBottom: 10, opacity: 0.3 }}><I t={icon} s={44} /></div>
      <div style={{ fontSize: 16, fontWeight: 600, color: C.txt, fontFamily: F, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 13, color: C.mut, fontFamily: F, marginBottom: 14 }}>{sub}</div>
      {action}
    </div>
  );
}

function BackBtn({ onClick, label = "Back" }) {
  return (
    <button onClick={onClick} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, color: C.pri, fontFamily: F, fontSize: 13, fontWeight: 500, padding: 0, marginBottom: 10 }}>
      <I t="back" s={16} c={C.pri} /> {label}
    </button>
  );
}

function Toast({ message, type = "success", onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  const bg = type === "error" ? C.errBg : C.accL;
  const bc = type === "error" ? C.errBdr : C.okBdr;
  const tc = type === "error" ? "#991B1B" : "#065F46";
  return (
    <div style={{ position: "fixed", top: 70, right: 20, zIndex: 999, padding: "12px 20px", borderRadius: 10, background: bg, border: `1px solid ${bc}`, color: tc, fontFamily: F, fontSize: 14, fontWeight: 500, boxShadow: "0 4px 20px rgba(0,0,0,0.1)", display: "flex", alignItems: "center", gap: 10, animation: "ib-slidein 0.3s ease" }}>
      {message}
      <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}><I t="x" s={14} c={tc} /></button>
      <style>{`@keyframes ib-slidein { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: none; } }`}</style>
    </div>
  );
}

// ─── MAIN APP ───────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("login");
  const [user, setUser] = useState(null);
  const [criteriaSets, setCriteriaSets] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [screenResults, setScreenResults] = useState(null);
  const [selectedStock, setSelectedStock] = useState(null);
  const [activeCritSet, setActiveCritSet] = useState(null);
  const [editingSet, setEditingSet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [prevPage, setPrevPage] = useState(null);

  const showToast = (message, type = "success") => setToast({ message, type });

  useEffect(() => {
    const token = getToken();
    const email = localStorage.getItem("ib_email");
    if (token && email) { setUser({ email }); setPage("dashboard"); }
  }, []);

  useEffect(() => { if (user) { loadCriteria(); loadWatchlist(); } }, [user]);

  async function loadCriteria() {
    try { setCriteriaSets(await api("/criteria")); } catch {}
  }
  async function loadWatchlist() {
    try { setWatchlist((await api("/watchlist")).map(w => w.ticker)); } catch {}
  }

  const login = (email) => { localStorage.setItem("ib_email", email); setUser({ email }); setPage("dashboard"); };
  const logout = () => { clearToken(); localStorage.removeItem("ib_email"); setUser(null); setCriteriaSets([]); setWatchlist([]); setScreenResults(null); setPage("login"); };

  const saveCriteria = async (cs) => {
    try { await api("/criteria", { method: "POST", body: JSON.stringify(cs) }); await loadCriteria(); setEditingSet(null); setPage("criteria-library"); showToast(`Saved "${cs.name}"`); } catch (e) { showToast(e.message, "error"); }
  };

  const deleteCriteria = async (id) => {
    try { await api(`/criteria/${id}`, { method: "DELETE" }); await loadCriteria(); showToast("Criteria set deleted"); } catch {}
  };

  const runScreen = async (cs) => {
    setActiveCritSet(cs); setLoading(true);
    try { setScreenResults(await api("/screen", { method: "POST", body: JSON.stringify({ criteria: cs.criteria }) })); setPage("results"); }
    catch (e) { showToast("Screening failed: " + e.message, "error"); }
    finally { setLoading(false); }
  };

  const toggleWL = async (ticker) => {
    const has = watchlist.includes(ticker);
    try {
      if (has) { await api(`/watchlist/${ticker}`, { method: "DELETE" }); setWatchlist(p => p.filter(t => t !== ticker)); }
      else { await api(`/watchlist/${ticker}`, { method: "POST" }); setWatchlist(p => [...p, ticker]); }
    } catch {}
  };

  const viewStock = (stock, from) => {
    setSelectedStock(stock);
    setPrevPage(from || page);
    setPage("analysis");
  };

  const nav = (pg) => { setPage(pg); setSelectedStock(null); };

  if (!user) return <LoginPage onLogin={login} />;

  const NAV_ITEMS = [
    { id: "dashboard", label: "Dashboard", icon: "home" },
    { id: "stocks", label: "Stocks", icon: "stocks" },
    { id: "criteria-library", label: "Criteria", icon: "filter" },
    { id: "watchlist", label: "Watchlist", icon: "star" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: F }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* NAV */}
      <nav style={{
        background: `linear-gradient(135deg, ${C.pri} 0%, #152C6B 100%)`,
        padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 12px rgba(30,58,138,0.3)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <span onClick={() => nav("dashboard")} style={{ color: "#fff", fontSize: 17, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 7, letterSpacing: "-0.3px" }}>
            <I t="chart" s={20} c="#34D399" /> Investor Buddy
          </span>
          <div style={{ display: "flex", gap: 2 }}>
            {NAV_ITEMS.map(it => (
              <button key={it.id} onClick={() => nav(it.id)} style={{
                display: "flex", alignItems: "center", gap: 5,
                background: page === it.id ? "rgba(255,255,255,0.14)" : "transparent",
                border: "none", color: page === it.id ? "#fff" : "rgba(255,255,255,0.7)",
                padding: "7px 14px", borderRadius: 6, cursor: "pointer", fontFamily: F, fontSize: 13, fontWeight: 500,
              }}><I t={it.icon} s={15} c={page === it.id ? "#fff" : "rgba(255,255,255,0.7)"} />{it.label}</button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>{user.email}</span>
          <button onClick={logout} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "rgba(255,255,255,0.8)", padding: "5px 10px", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontFamily: F, fontSize: 12 }}>
            <I t="logout" s={14} c="rgba(255,255,255,0.8)" /> Logout
          </button>
        </div>
      </nav>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 20px", minHeight: "calc(100vh - 120px)" }}>
        {loading && <Spin text="Running screening..." />}
        {!loading && page === "dashboard" && <Dashboard criteriaSets={criteriaSets} watchlist={watchlist} onNew={() => { setEditingSet(null); setPage("criteria-builder"); }} onRun={runScreen} onNav={nav} />}
        {!loading && page === "stocks" && <StocksPage onViewStock={(s) => viewStock(s, "stocks")} onToast={showToast} watchlist={watchlist} onToggleWL={toggleWL} />}
        {!loading && page === "criteria-library" && <CriteriaLibrary sets={criteriaSets} onNew={() => { setEditingSet(null); setPage("criteria-builder"); }} onEdit={cs => { setEditingSet(cs); setPage("criteria-builder"); }} onDelete={deleteCriteria} onRun={runScreen} />}
        {page === "criteria-builder" && <CriteriaBuilder existing={editingSet} onSave={saveCriteria} onCancel={() => setPage("criteria-library")} />}
        {!loading && page === "results" && <Results results={screenResults} critSet={activeCritSet} watchlist={watchlist} onToggleWL={toggleWL} onSelect={s => viewStock(s, "results")} onBack={() => nav("criteria-library")} />}
        {page === "analysis" && selectedStock && <Analysis stock={selectedStock} critSet={activeCritSet} isWL={watchlist.includes(selectedStock.ticker)} onToggleWL={() => toggleWL(selectedStock.ticker)} onBack={() => nav(prevPage || "results")} />}
        {page === "watchlist" && <WatchlistPage watchlist={watchlist} onRemove={toggleWL} onSelect={s => viewStock(s, "watchlist")} />}
      </main>

      <footer style={{ textAlign: "center", padding: "14px 20px", fontSize: 11, color: C.mut, fontFamily: F, borderTop: `1px solid ${C.bdr}`, background: "#fff" }}>
        Investor Buddy is an informational tool only and does not constitute registered investment advice.
      </footer>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// LOGIN
// ═══════════════════════════════════════════════════════════════════
function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [reg, setReg] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setErr("");
    if (!email.includes("@")) { setErr("Please enter a valid email."); return; }
    if (pw.length < 8) { setErr("Password must be at least 8 characters."); return; }
    setBusy(true);
    try { const d = await api(reg ? "/auth/register" : "/auth/login", { method: "POST", body: JSON.stringify({ email, password: pw }) }); setToken(d.token); onLogin(d.email); }
    catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(135deg, ${C.pri} 0%, #0F1D45 100%)`, fontFamily: F }}>
      <Card style={{ width: 400, padding: 36, borderRadius: 16, border: "none", boxShadow: "0 24px 64px rgba(0,0,0,0.3)" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 6 }}>
            <I t="chart" s={26} c={C.pri} />
            <span style={{ fontSize: 22, fontWeight: 700, color: C.pri, letterSpacing: "-0.5px" }}>Investor Buddy</span>
          </div>
          <p style={{ fontSize: 14, color: C.mut, margin: 0 }}>{reg ? "Create your account" : "Sign in to continue"}</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Inp label="Email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} />
          <Inp label="Password" type="password" placeholder="Min. 8 characters" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} />
          {err && <div style={{ color: C.err, fontSize: 13, background: C.errBg, padding: "8px 12px", borderRadius: 6 }}>{err}</div>}
          <Btn onClick={submit} disabled={busy} style={{ width: "100%", justifyContent: "center", padding: "12px 0" }}>{busy ? "Please wait..." : reg ? "Create Account" : "Sign In"}</Btn>
          <div style={{ textAlign: "center" }}>
            <button onClick={() => { setReg(!reg); setErr(""); }} style={{ background: "none", border: "none", color: C.pri, cursor: "pointer", fontFamily: F, fontSize: 13, fontWeight: 500 }}>
              {reg ? "Already have an account? Sign in" : "Don't have an account? Register"}
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════════
function Dashboard({ criteriaSets, watchlist, onNew, onRun, onNav }) {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: C.txt, margin: "0 0 4px 0" }}>Dashboard</h1>
        <p style={{ fontSize: 14, color: C.mut, margin: 0 }}>Your stock screening overview.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Criteria Sets", value: criteriaSets.length, icon: "filter", color: C.pri },
          { label: "Watchlist", value: watchlist.length, icon: "star", color: C.warn },
          { label: "Metrics Available", value: METRICS.length, icon: "chart", color: C.acc },
        ].map((s, i) => (
          <Card key={i} style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: `${s.color}12`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <I t={s.icon} s={20} c={s.color} />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: C.txt, fontFamily: M }}>{s.value}</div>
              <div style={{ fontSize: 12, color: C.mut }}>{s.label}</div>
            </div>
          </Card>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Criteria */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>My Criteria Sets</h3>
            <Btn sz="sm" icon="plus" onClick={onNew}>New</Btn>
          </div>
          {criteriaSets.length === 0 ? (
            <Empty icon="filter" title="No criteria sets yet" sub="Create or use a template to start." action={<Btn sz="sm" onClick={onNew}>Create</Btn>} />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {criteriaSets.slice(0, 4).map(cs => (
                <div key={cs.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderRadius: 8, background: C.bg }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.txt }}>{cs.name}</div>
                    <div style={{ fontSize: 12, color: C.mut }}>{cs.criteria.length} criteria</div>
                  </div>
                  <Btn sz="sm" v="acc" icon="play" onClick={() => onRun(cs)}>Run</Btn>
                </div>
              ))}
              {criteriaSets.length > 4 && <button onClick={() => onNav("criteria-library")} style={{ background: "none", border: "none", color: C.pri, cursor: "pointer", fontFamily: F, fontSize: 13, fontWeight: 500, padding: 4 }}>View all →</button>}
            </div>
          )}
        </Card>

        {/* Quick Actions */}
        <Card>
          <h3 style={{ margin: "0 0 14px 0", fontSize: 15, fontWeight: 600 }}>Quick Actions</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div onClick={onNew} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 8, background: C.priF, cursor: "pointer" }}>
              <I t="plus" s={18} c={C.pri} />
              <div><div style={{ fontSize: 14, fontWeight: 600, color: C.pri }}>New Criteria Set</div><div style={{ fontSize: 12, color: C.mut }}>Build custom or from template</div></div>
            </div>
            <div onClick={() => onNav("stocks")} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 8, background: "#F0FDF4", cursor: "pointer" }}>
              <I t="search" s={18} c="#059669" />
              <div><div style={{ fontSize: 14, fontWeight: 600, color: "#065F46" }}>Search & Add Stocks</div><div style={{ fontSize: 12, color: C.mut }}>Find any ticker on Alpha Vantage</div></div>
            </div>
            <div onClick={() => onNav("watchlist")} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 8, background: C.warnBg, cursor: "pointer" }}>
              <I t="star" s={18} c={C.warn} />
              <div><div style={{ fontSize: 14, fontWeight: 600, color: "#92400E" }}>Watchlist</div><div style={{ fontSize: 12, color: C.mut }}>{watchlist.length} stocks tracked</div></div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// STOCKS PAGE (browse + search + add)
// ═══════════════════════════════════════════════════════════════════
function StocksPage({ onViewStock, onToast, watchlist, onToggleWL }) {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [sortCol, setSortCol] = useState("ticker");
  const [sortDir, setSortDir] = useState("asc");
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(null);

  const loadStocks = async () => { try { setStocks(await api("/stocks")); } catch {} setLoading(false); };
  useEffect(() => { loadStocks(); }, []);

  const doSearch = async () => {
    if (!searchQ.trim()) return;
    setSearching(true); setSearchResults([]);
    try { setSearchResults(await api(`/stocks/search/${encodeURIComponent(searchQ.trim())}`)); }
    catch (e) { onToast(e.message, "error"); }
    finally { setSearching(false); }
  };

  const addStock = async (ticker) => {
    setAdding(ticker);
    try {
      const stock = await api(`/stocks/add/${ticker}`, { method: "POST" });
      onToast(`Added ${stock.name} (${stock.ticker})`);
      await loadStocks();
      setSearchResults(prev => prev.map(r => r.ticker === ticker ? { ...r, inDatabase: true } : r));
    } catch (e) { onToast(e.message, "error"); }
    finally { setAdding(null); }
  };

  const deleteStock = async (ticker) => {
    if (!confirm(`Remove ${ticker} from the database?`)) return;
    try { await api(`/stocks/${ticker}`, { method: "DELETE" }); onToast(`Removed ${ticker}`); await loadStocks(); }
    catch (e) { onToast(e.message, "error"); }
  };

  const refreshStock = async (ticker) => {
    try { await api(`/stocks/refresh/${ticker}`, { method: "POST" }); onToast(`Refreshed ${ticker}`); await loadStocks(); }
    catch (e) { onToast(e.message, "error"); }
  };

  const toggleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  };

  const filtered = stocks
    .filter(s => s.ticker.toLowerCase().includes(filter.toLowerCase()) || s.name.toLowerCase().includes(filter.toLowerCase()) || s.sector.toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => {
      const av = a[sortCol], bv = b[sortCol];
      const cmp = typeof av === "string" ? av.localeCompare(bv) : av - bv;
      return sortDir === "asc" ? cmp : -cmp;
    });

  const TH = ({ col, label, w }) => (
    <th onClick={() => toggleSort(col)} style={{ padding: "11px 14px", fontSize: 11, fontWeight: 600, color: C.mut, textAlign: "left", textTransform: "uppercase", letterSpacing: "0.5px", cursor: "pointer", userSelect: "none", width: w }}>
      <span style={{ display: "flex", alignItems: "center", gap: 3 }}>{label}{sortCol === col && <I t={sortDir === "asc" ? "up" : "down"} s={12} c={C.mut} />}</span>
    </th>
  );

  if (loading) return <Spin text="Loading stocks..." />;

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: C.txt, margin: "0 0 4px 0" }}>Stocks</h1>
        <p style={{ fontSize: 14, color: C.mut, margin: 0 }}>{stocks.length} stocks in your database. Search Alpha Vantage to add more.</p>
      </div>

      {/* Search bar */}
      <Card style={{ marginBottom: 16, padding: 16 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.txt, fontFamily: F, marginBottom: 4, display: "block" }}>Search & Add Stocks</label>
            <input placeholder="Enter company name or ticker (e.g. SHOP, Shopify)..." value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              onKeyDown={e => e.key === "Enter" && doSearch()}
              style={{ width: "100%", padding: "10px 14px", borderRadius: 8, fontFamily: F, fontSize: 14, border: `1.5px solid ${C.bdr}`, outline: "none", boxSizing: "border-box" }} />
          </div>
          <Btn onClick={doSearch} disabled={searching || !searchQ.trim()} icon="search">{searching ? "Searching..." : "Search"}</Btn>
        </div>

        {/* Search results */}
        {searchResults.length > 0 && (
          <div style={{ marginTop: 14, borderTop: `1px solid ${C.bdr}`, paddingTop: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.mut, marginBottom: 8 }}>Search Results</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {searchResults.map(r => (
                <div key={r.ticker} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderRadius: 8, background: C.bg }}>
                  <div>
                    <span style={{ fontWeight: 700, color: C.pri, fontFamily: M, fontSize: 14, marginRight: 8 }}>{r.ticker}</span>
                    <span style={{ fontSize: 13, color: C.txt }}>{r.name}</span>
                    <span style={{ fontSize: 12, color: C.mut, marginLeft: 6 }}>({r.type})</span>
                  </div>
                  {r.inDatabase ? (
                    <Badge v="success">In Database</Badge>
                  ) : (
                    <Btn sz="sm" v="acc" icon="plus" disabled={adding === r.ticker} onClick={() => addStock(r.ticker)}>
                      {adding === r.ticker ? "Adding..." : "Add"}
                    </Btn>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Filter */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: C.txt }}>{filtered.length} stocks</div>
        <input placeholder="Filter..." value={filter} onChange={e => setFilter(e.target.value)}
          style={{ padding: "7px 12px", borderRadius: 8, border: `1.5px solid ${C.bdr}`, fontFamily: F, fontSize: 13, width: 220, outline: "none" }} />
      </div>

      {/* Table */}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: F, minWidth: 900 }}>
            <thead><tr style={{ background: C.bg }}>
              <TH col="ticker" label="Ticker" w="80px" />
              <TH col="name" label="Company" />
              <TH col="sector" label="Sector" w="100px" />
              <TH col="price" label="Price" w="80px" />
              <TH col="pe_ratio" label="P/E" w="70px" />
              <TH col="dividend_yield" label="Div %" w="70px" />
              <TH col="market_cap_b" label="Mkt Cap" w="80px" />
              <TH col="beta" label="Beta" w="60px" />
              <th style={{ padding: "11px 14px", width: 120 }}></th>
            </tr></thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.ticker} style={{ borderBottom: `1px solid ${C.bdr}`, transition: "background 0.1s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = C.bg; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                  <td style={{ padding: "10px 14px", fontWeight: 700, color: C.pri, fontFamily: M, fontSize: 13, cursor: "pointer" }} onClick={() => onViewStock(s)}>{s.ticker}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13, color: C.txt, cursor: "pointer" }} onClick={() => onViewStock(s)}>{s.name}</td>
                  <td style={{ padding: "10px 14px" }}><Badge>{s.sector}</Badge></td>
                  <td style={{ padding: "10px 14px", fontFamily: M, fontSize: 13, fontWeight: 600 }}>${s.price}</td>
                  <td style={{ padding: "10px 14px", fontFamily: M, fontSize: 13 }}>{s.pe_ratio}</td>
                  <td style={{ padding: "10px 14px", fontFamily: M, fontSize: 13 }}>{s.dividend_yield}%</td>
                  <td style={{ padding: "10px 14px", fontFamily: M, fontSize: 13 }}>${s.market_cap_b}B</td>
                  <td style={{ padding: "10px 14px", fontFamily: M, fontSize: 13 }}>{s.beta}</td>
                  <td style={{ padding: "10px 14px", display: "flex", gap: 4 }}>
                    <button onClick={() => onToggleWL(s.ticker)} title={watchlist.includes(s.ticker) ? "Remove from watchlist" : "Add to watchlist"} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                      <I t="star" s={16} f={watchlist.includes(s.ticker)} c={watchlist.includes(s.ticker) ? C.warn : C.mut} />
                    </button>
                    <button onClick={() => refreshStock(s.ticker)} title="Refresh from Alpha Vantage" style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}><I t="refresh" s={14} c={C.mut} /></button>
                    <button onClick={() => deleteStock(s.ticker)} title="Remove stock" style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}><I t="trash" s={14} c={C.err} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// CRITERIA LIBRARY
// ═══════════════════════════════════════════════════════════════════
function CriteriaLibrary({ sets, onNew, onEdit, onDelete, onRun }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: C.txt, margin: "0 0 4px 0" }}>Criteria Library</h1>
          <p style={{ fontSize: 14, color: C.mut, margin: 0 }}>Your saved criteria sets and templates.</p>
        </div>
        <Btn icon="plus" onClick={onNew}>New Criteria Set</Btn>
      </div>

      {sets.length === 0 ? (
        <Card><Empty icon="filter" title="No criteria sets" sub="Create from scratch or use a template below." action={<Btn onClick={onNew} icon="plus">Create</Btn>} /></Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
          {sets.map(cs => (
            <Card key={cs.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: C.txt, marginBottom: 6 }}>{cs.name}</div>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {cs.criteria.map((c, i) => <Badge key={i} v="pri">{METRICS.find(m => m.id === c.metricId)?.name || c.metricId}</Badge>)}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Btn sz="sm" v="acc" icon="play" onClick={() => onRun(cs)}>Run</Btn>
                <Btn sz="sm" v="out" icon="edit" onClick={() => onEdit(cs)}>Edit</Btn>
                <Btn sz="sm" v="ghost" onClick={() => onDelete(cs.id)}><I t="trash" s={15} c={C.err} /></Btn>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Templates */}
      <div style={{ marginTop: 8 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: C.txt, marginBottom: 14 }}>Quick-Start Templates</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
          {TEMPLATES.map((t, i) => (
            <Card key={i} style={{ padding: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: C.txt, marginBottom: 4 }}>{t.name}</div>
              <div style={{ fontSize: 13, color: C.mut, marginBottom: 10 }}>{t.desc}</div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 12 }}>
                {t.criteria.map((c, j) => <Badge key={j} v="pri">{METRICS.find(m => m.id === c.metricId)?.name}</Badge>)}
              </div>
              <Btn sz="sm" v="out" icon="download" onClick={() => {
                const el = document.createElement("textarea");
                // Trigger save via criteria builder
                const name = prompt("Name this criteria set:", t.name);
                if (name) {
                  api("/criteria", { method: "POST", body: JSON.stringify({ id: `cs-${Date.now()}`, name, criteria: t.criteria }) })
                    .then(() => window.location.reload());
                }
              }}>Use Template</Btn>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// CRITERIA BUILDER
// ═══════════════════════════════════════════════════════════════════
function CriteriaBuilder({ existing, onSave, onCancel }) {
  const [name, setName] = useState(existing?.name || "");
  const [criteria, setCriteria] = useState(existing?.criteria || []);
  const [err, setErr] = useState("");
  const [showTemplates, setShowTemplates] = useState(!existing && criteria.length === 0);

  const add = () => setCriteria(p => [...p, { metricId: "pe_ratio", operator: "lt", value: 20, valueLow: 0, valueHigh: 0 }]);
  const upd = (i, f, v) => setCriteria(p => { const n = [...p]; n[i] = { ...n[i], [f]: f === "metricId" || f === "operator" ? v : parseFloat(v) || 0 }; return n; });
  const rm = (i) => setCriteria(p => p.filter((_, idx) => idx !== i));

  const save = () => {
    if (!name.trim()) { setErr("Name is required."); return; }
    if (!criteria.length) { setErr("Add at least one criterion."); return; }
    onSave({ id: existing?.id || `cs-${Date.now()}`, name: name.trim(), criteria });
  };

  const useTemplate = (t) => {
    setName(t.name);
    setCriteria(JSON.parse(JSON.stringify(t.criteria)));
    setShowTemplates(false);
  };

  const ops = { gt: "Greater than", lt: "Less than", between: "Between" };

  return (
    <div>
      <BackBtn onClick={onCancel} label="Back to Library" />
      <h1 style={{ fontSize: 24, fontWeight: 700, color: C.txt, margin: "0 0 20px 0" }}>{existing ? "Edit Criteria Set" : "New Criteria Set"}</h1>

      {/* Templates */}
      {showTemplates && (
        <Card style={{ marginBottom: 16, background: C.priF, border: `1px solid #C7D2FE` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: C.pri }}>Start from a template</h3>
            <button onClick={() => setShowTemplates(false)} style={{ background: "none", border: "none", color: C.mut, cursor: "pointer", fontSize: 13, fontFamily: F }}>or build from scratch</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 }}>
            {TEMPLATES.map((t, i) => (
              <div key={i} onClick={() => useTemplate(t)} style={{ padding: "10px 12px", borderRadius: 8, background: "#fff", cursor: "pointer", border: `1px solid ${C.bdr}`, transition: "border-color 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.pri; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.bdr; }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.txt }}>{t.name}</div>
                <div style={{ fontSize: 12, color: C.mut }}>{t.desc}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card style={{ marginBottom: 16 }}>
        <Inp label="Criteria Set Name" placeholder="e.g. Value Stocks, Growth Play..." value={name} onChange={e => { setName(e.target.value); setErr(""); }} error={err} style={{ maxWidth: 400 }} />
      </Card>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Criteria ({criteria.length})</h3>
          <Btn sz="sm" v="out" icon="plus" onClick={add}>Add Criterion</Btn>
        </div>
        {criteria.length === 0 ? (
          <Empty icon="filter" title="No criteria" sub="Add metrics and thresholds." action={<Btn sz="sm" onClick={add} icon="plus">Add</Btn>} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {criteria.map((c, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-end", padding: 12, borderRadius: 10, background: C.bg }}>
                <Sel label="Metric" value={c.metricId} onChange={e => upd(i, "metricId", e.target.value)}
                  options={METRICS.map(m => ({ value: m.id, label: m.name }))} style={{ flex: 2 }} />
                <Sel label="Operator" value={c.operator} onChange={e => upd(i, "operator", e.target.value)}
                  options={Object.entries(ops).map(([v, l]) => ({ value: v, label: l }))} style={{ flex: 1.5 }} />
                {c.operator === "between" ? (
                  <><Inp label="Low" type="number" value={c.valueLow} onChange={e => upd(i, "valueLow", e.target.value)} style={{ flex: 1 }} />
                  <Inp label="High" type="number" value={c.valueHigh} onChange={e => upd(i, "valueHigh", e.target.value)} style={{ flex: 1 }} /></>
                ) : (
                  <Inp label="Value" type="number" value={c.value} onChange={e => upd(i, "value", e.target.value)} style={{ flex: 1 }} />
                )}
                <button onClick={() => rm(i)} style={{ background: "none", border: "none", cursor: "pointer", padding: 8, marginBottom: 2 }}><I t="trash" s={16} c={C.err} /></button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div style={{ display: "flex", gap: 12, marginTop: 20, justifyContent: "flex-end" }}>
        <Btn v="ghost" onClick={onCancel}>Cancel</Btn>
        <Btn onClick={save} icon="check">{existing ? "Save Changes" : "Save Criteria Set"}</Btn>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// RESULTS
// ═══════════════════════════════════════════════════════════════════
function Results({ results, critSet, watchlist, onToggleWL, onSelect, onBack }) {
  const [filter, setFilter] = useState("");
  const [sortCol, setSortCol] = useState("score");
  const [sortDir, setSortDir] = useState("desc");

  const toggleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir(col === "score" ? "desc" : "asc"); }
  };

  const filtered = (results || [])
    .filter(r => r.ticker.toLowerCase().includes(filter.toLowerCase()) || r.name.toLowerCase().includes(filter.toLowerCase()) || r.sector.toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => {
      const av = a[sortCol], bv = b[sortCol];
      const cmp = typeof av === "string" ? av.localeCompare(bv) : av - bv;
      return sortDir === "asc" ? cmp : -cmp;
    });

  const TH = ({ col, label }) => (
    <th onClick={() => toggleSort(col)} style={{ padding: "11px 14px", fontSize: 11, fontWeight: 600, color: C.mut, textAlign: "left", textTransform: "uppercase", letterSpacing: "0.5px", cursor: "pointer", userSelect: "none" }}>
      <span style={{ display: "flex", alignItems: "center", gap: 3 }}>{label}{sortCol === col && <I t={sortDir === "asc" ? "up" : "down"} s={12} c={C.mut} />}</span>
    </th>
  );

  return (
    <div>
      <BackBtn onClick={onBack} label="Back to Criteria" />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: C.txt, margin: "0 0 4px 0" }}>Screening Results</h1>
          <p style={{ fontSize: 14, color: C.mut, margin: 0 }}>{critSet?.name} — {filtered.length} stocks evaluated</p>
        </div>
        <input placeholder="Filter..." value={filter} onChange={e => setFilter(e.target.value)}
          style={{ padding: "8px 14px", borderRadius: 8, border: `1.5px solid ${C.bdr}`, fontFamily: F, fontSize: 13, width: 220, outline: "none" }} />
      </div>

      {filtered.length === 0 ? (
        <Card><Empty icon="search" title="No stocks matched" sub="Try relaxing your thresholds." action={<Btn v="out" onClick={onBack}>Edit Criteria</Btn>} /></Card>
      ) : (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: F }}>
            <thead><tr style={{ background: C.bg }}>
              <th style={{ padding: "11px 14px", fontSize: 11, fontWeight: 600, color: C.mut, textAlign: "left", width: 50 }}>#</th>
              <TH col="ticker" label="Ticker" />
              <TH col="name" label="Company" />
              <TH col="sector" label="Sector" />
              <TH col="price" label="Price" />
              <TH col="score" label="Score" />
              <th style={{ padding: "11px 14px", width: 40 }}></th>
            </tr></thead>
            <tbody>
              {filtered.map((s, i) => (
                <tr key={s.ticker} onClick={() => onSelect(s)} style={{ cursor: "pointer", borderBottom: `1px solid ${C.bdr}`, transition: "background 0.1s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = C.bg; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                  <td style={{ padding: "11px 14px", fontSize: 13, color: C.mut }}>#{i + 1}</td>
                  <td style={{ padding: "11px 14px", fontWeight: 700, color: C.pri, fontFamily: M, fontSize: 13 }}>{s.ticker}</td>
                  <td style={{ padding: "11px 14px", fontSize: 13, color: C.txt }}>{s.name}</td>
                  <td style={{ padding: "11px 14px" }}><Badge>{s.sector}</Badge></td>
                  <td style={{ padding: "11px 14px", fontFamily: M, fontSize: 13, fontWeight: 600 }}>${s.price}</td>
                  <td style={{ padding: "11px 14px" }}><Score score={s.score} /></td>
                  <td style={{ padding: "11px 14px" }}>
                    <button onClick={e => { e.stopPropagation(); onToggleWL(s.ticker); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                      <I t="star" s={18} f={watchlist.includes(s.ticker)} c={watchlist.includes(s.ticker) ? C.warn : C.mut} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ANALYSIS
// ═══════════════════════════════════════════════════════════════════
function Analysis({ stock, critSet, isWL, onToggleWL, onBack }) {
  const [explanation, setExplanation] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiErr, setAiErr] = useState("");
  const fetched = useRef(false);

  const fetchAI = useCallback(async () => {
    setAiLoading(true); setAiErr("");
    try {
      const d = await api("/analyze", { method: "POST", body: JSON.stringify({ stock, criteriaDetails: stock.criteriaDetails || [] }) });
      setExplanation(d.explanation);
    } catch (e) { setAiErr(e.message); }
    finally { setAiLoading(false); }
  }, [stock]);

  useEffect(() => { if (!fetched.current) { fetched.current = true; fetchAI(); } }, [fetchAI]);

  return (
    <div>
      <BackBtn onClick={onBack} />

      {/* Header */}
      <Card style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {stock.score != null && <Score score={stock.score} />}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 20, fontWeight: 700, color: C.txt }}>{stock.name}</span>
              <span style={{ fontSize: 15, fontWeight: 600, color: C.pri, fontFamily: M }}>{stock.ticker}</span>
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
              <Badge>{stock.sector}</Badge>
              <Badge v="pri">${stock.price}</Badge>
              {stock.market_cap_b > 0 && <Badge>Mkt Cap: ${stock.market_cap_b}B</Badge>}
            </div>
          </div>
        </div>
        <Btn v={isWL ? "acc" : "out"} icon="star" onClick={onToggleWL}>{isWL ? "Watchlisted" : "Add to Watchlist"}</Btn>
      </Card>

      {/* Metrics */}
      <Card style={{ marginBottom: 16 }}>
        <h3 style={{ margin: "0 0 12px 0", fontSize: 15, fontWeight: 600 }}>Key Financial Metrics</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
          {[
            { l: "P/E Ratio", v: stock.pe_ratio }, { l: "Debt/Equity", v: stock.debt_to_equity },
            { l: "EPS Growth", v: `${stock.eps_growth}%` }, { l: "Div Yield", v: `${stock.dividend_yield}%` },
            { l: "ROE", v: `${stock.roe}%` }, { l: "Rev Growth", v: `${stock.revenue_growth}%` },
            { l: "Profit Margin", v: `${stock.profit_margin}%` }, { l: "Current Ratio", v: stock.current_ratio },
            { l: "Beta", v: stock.beta }, { l: "Price", v: `$${stock.price}` },
          ].map((m, i) => (
            <div key={i} style={{ padding: "9px 11px", borderRadius: 8, background: C.bg }}>
              <div style={{ fontSize: 10, color: C.mut, marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.5px" }}>{m.l}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.txt, fontFamily: M }}>{m.v}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Scorecard */}
      {stock.criteriaDetails?.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <h3 style={{ margin: "0 0 12px 0", fontSize: 15, fontWeight: 600 }}>Criteria Scorecard</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {stock.criteriaDetails.map((d, i) => {
              const m = METRICS.find(met => met.id === d.metricId);
              const op = d.operator === "gt" ? ">" : d.operator === "lt" ? "<" : "between";
              const th = d.operator === "between" ? `${d.valueLow} – ${d.valueHigh}` : d.value;
              return (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 12px", borderRadius: 8, background: d.pass ? C.okBg : C.errBg, border: `1px solid ${d.pass ? C.okBdr : C.errBdr}` }}>
                  <div>
                    <span style={{ fontWeight: 600, color: C.txt, fontSize: 13 }}>{m?.name || d.metricId}</span>
                    <span style={{ color: C.mut, fontSize: 12, marginLeft: 8 }}>
                      Actual: <strong style={{ fontFamily: M }}>{d.actual}</strong> | Target: {op} <strong style={{ fontFamily: M }}>{th}</strong>
                    </span>
                  </div>
                  <Badge v={d.pass ? "success" : "error"}>{d.pass ? "PASS" : "FAIL"}</Badge>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* AI */}
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <I t="ai" s={20} c={C.pri} />
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>AI-Powered Analysis</h3>
        </div>
        {aiLoading ? <Spin text="Generating AI analysis..." /> : aiErr ? (
          <div style={{ padding: 14, background: C.errBg, borderRadius: 8, border: `1px solid ${C.errBdr}` }}>
            <p style={{ color: C.err, margin: "0 0 8px 0", fontSize: 13 }}>{aiErr}</p>
            <Btn sz="sm" v="out" onClick={() => { fetched.current = false; fetchAI(); }}>Retry</Btn>
          </div>
        ) : (
          <div style={{ fontSize: 14, lineHeight: 1.7, color: C.txt, whiteSpace: "pre-wrap" }}>{explanation}</div>
        )}
        <div style={{ marginTop: 14, padding: "9px 12px", background: C.bg, borderRadius: 8, fontSize: 11, color: C.mut, fontStyle: "italic" }}>
          This analysis is for informational purposes only and does not constitute investment advice.
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// WATCHLIST
// ═══════════════════════════════════════════════════════════════════
function WatchlistPage({ watchlist, onRemove, onSelect }) {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { (async () => { try { setStocks(await api("/watchlist")); } catch {} setLoading(false); })(); }, [watchlist]);

  if (loading) return <Spin text="Loading watchlist..." />;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: C.txt, margin: "0 0 4px 0" }}>Watchlist</h1>
        <p style={{ fontSize: 14, color: C.mut, margin: 0 }}>{stocks.length} stocks you're monitoring.</p>
      </div>

      {stocks.length === 0 ? (
        <Card><Empty icon="star" title="Watchlist is empty" sub="Add stocks from screening results or the Stocks page." /></Card>
      ) : (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: F }}>
            <thead><tr style={{ background: C.bg }}>
              {["Ticker", "Company", "Sector", "Price", "P/E", "Div Yield", ""].map((h, i) => (
                <th key={i} style={{ padding: "11px 14px", fontSize: 11, fontWeight: 600, color: C.mut, textAlign: "left", textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {stocks.map(s => (
                <tr key={s.ticker} onClick={() => onSelect(s)} style={{ cursor: "pointer", borderBottom: `1px solid ${C.bdr}`, transition: "background 0.1s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = C.bg; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                  <td style={{ padding: "11px 14px", fontWeight: 700, color: C.pri, fontFamily: M, fontSize: 13 }}>{s.ticker}</td>
                  <td style={{ padding: "11px 14px", fontSize: 13, color: C.txt }}>{s.name}</td>
                  <td style={{ padding: "11px 14px" }}><Badge>{s.sector}</Badge></td>
                  <td style={{ padding: "11px 14px", fontWeight: 600, fontFamily: M, fontSize: 13 }}>${s.price}</td>
                  <td style={{ padding: "11px 14px", fontFamily: M, fontSize: 13 }}>{s.pe_ratio}</td>
                  <td style={{ padding: "11px 14px", fontFamily: M, fontSize: 13 }}>{s.dividend_yield}%</td>
                  <td style={{ padding: "11px 14px" }}>
                    <button onClick={e => { e.stopPropagation(); onRemove(s.ticker); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}><I t="x" s={16} c={C.err} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
