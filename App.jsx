import { useMemo, useState } from "react";

/* ═══════════════════ RANGES ═══════════════════ */

// 6-max Open-Raise (unopened Pot, ~40BB+)
const OPEN = {
  UTG: new Set(["77","88","99","TT","JJ","QQ","KK","AA","ATs","AJs","AQs","AKs","AQo","AKo","KQs","KJs","QJs","JTs"]),
  HJ: new Set(["55","66","77","88","99","TT","JJ","QQ","KK","AA","A9s","ATs","AJs","AQs","AKs","AJo","AQo","AKo","KTs","KJs","KQs","KQo","QTs","QJs","JTs","T9s"]),
  CO: new Set(["22","33","44","55","66","77","88","99","TT","JJ","QQ","KK","AA","A2s","A3s","A4s","A5s","A6s","A7s","A8s","A9s","ATs","AJs","AQs","AKs","ATo","AJo","AQo","AKo","K9s","KTs","KJs","KQs","KJo","KQo","Q9s","QTs","QJs","QJo","J9s","JTs","T9s","98s","87s","76s"]),
  BTN: new Set(["22","33","44","55","66","77","88","99","TT","JJ","QQ","KK","AA","A2s","A3s","A4s","A5s","A6s","A7s","A8s","A9s","ATs","AJs","AQs","AKs","A5o","A7o","A8o","A9o","ATo","AJo","AQo","AKo","K5s","K6s","K7s","K8s","K9s","KTs","KJs","KQs","KTo","KJo","KQo","Q8s","Q9s","QTs","QJs","QTo","QJo","J8s","J9s","JTs","JTo","T8s","T9s","98s","97s","87s","86s","76s","65s","54s"]),
  SB: new Set(["22","33","44","55","66","77","88","99","TT","JJ","QQ","KK","AA","A2s","A3s","A4s","A5s","A6s","A7s","A8s","A9s","ATs","AJs","AQs","AKs","A8o","A9o","ATo","AJo","AQo","AKo","K7s","K8s","K9s","KTs","KJs","KQs","KTo","KJo","KQo","Q9s","QTs","QJs","QJo","J9s","JTs","T9s","98s","87s","76s","65s"]),
};

// Push-or-Fold bei ≤ 15 BB (unopened)
const PUSH = {
  UTG: new Set(["44","55","66","77","88","99","TT","JJ","QQ","KK","AA","A9s","ATs","AJs","AQs","AKs","ATo","AJo","AQo","AKo","KQs","KQo","KJs"]),
  HJ: new Set(["33","44","55","66","77","88","99","TT","JJ","QQ","KK","AA","A7s","A8s","A9s","ATs","AJs","AQs","AKs","A9o","ATo","AJo","AQo","AKo","KTs","KJs","KQs","KQo","QJs"]),
  CO: new Set(["22","33","44","55","66","77","88","99","TT","JJ","QQ","KK","AA","A2s","A3s","A4s","A5s","A6s","A7s","A8s","A9s","ATs","AJs","AQs","AKs","A7o","A8o","A9o","ATo","AJo","AQo","AKo","K9s","KTs","KJs","KQs","KTo","KJo","KQo","QTs","QJs","QJo","JTs"]),
  BTN: new Set(["22","33","44","55","66","77","88","99","TT","JJ","QQ","KK","AA","A2s","A3s","A4s","A5s","A6s","A7s","A8s","A9s","ATs","AJs","AQs","AKs","A2o","A3o","A4o","A5o","A6o","A7o","A8o","A9o","ATo","AJo","AQo","AKo","K7s","K8s","K9s","KTs","KJs","KQs","K9o","KTo","KJo","KQo","Q9s","QTs","QJs","QTo","QJo","J9s","JTs","JTo","T9s","98s"]),
  SB: new Set(["22","33","44","55","66","77","88","99","TT","JJ","QQ","KK","AA","A2s","A3s","A4s","A5s","A6s","A7s","A8s","A9s","ATs","AJs","AQs","AKs","A2o","A3o","A4o","A5o","A6o","A7o","A8o","A9o","ATo","AJo","AQo","AKo","K5s","K6s","K7s","K8s","K9s","KTs","KJs","KQs","K9o","KTo","KJo","KQo","Q8s","Q9s","QTs","QJs","QTo","QJo","J8s","J9s","JTs","JTo","T8s","T9s","98s","87s"]),
};

// Gegen Raise vor dir (deep)
const THREEBET = new Set(["JJ","QQ","KK","AA","AKs","AKo"]);
const CALL_IP = new Set(["22","33","44","55","66","77","88","99","TT","AQs","AQo","AJs","ATs","KQs","QJs","JTs","T9s","98s"]);
const CALL_SB = new Set(["66","77","88","99","TT","AQs","AQo","AJs","KQs"]);

/* ═══════════════════ META ═══════════════════ */

const POS_INFO = {
  UTG: { label: "UTG", seat: 0 },
  HJ: { label: "Hijack", seat: 1 },
  CO: { label: "Cutoff", seat: 2 },
  BTN: { label: "Button", seat: 3 },
  SB: { label: "Small Blind", seat: 4 },
};
const POSITIONS = Object.keys(POS_INFO);
const SEAT_NAMES = ["UTG", "HJ", "CO", "BTN", "SB", "BB"];
const RANK_ORDER = "AKQJT98765432";
const SUITS = ["♠", "♥", "♦", "♣"];
const SUIT_COLORS = ["#1c1c1c", "#c0392b", "#2471a3", "#1e8449"];
const SESSION_LENGTH = 50;

const rand = (n) => Math.floor(Math.random() * n);

function dealSpot() {
  const deck = [];
  for (let r = 0; r < 13; r++) for (let s = 0; s < 4; s++) deck.push({ r, s });
  const a = deck.splice(rand(deck.length), 1)[0];
  const b = deck.splice(rand(deck.length), 1)[0];
  const [hi, lo] = a.r <= b.r ? [a, b] : [b, a];

  // Stack: 60% deep (25–50 BB), 40% short (8–15 BB)
  const short = Math.random() < 0.4;
  const bb = short ? 8 + rand(8) : 25 + rand(26);

  let scenario, pos, raiserSeat = null;
  if (short) {
    scenario = "PUSH";
    pos = POSITIONS[rand(POSITIONS.length)];
  } else {
    const roll = Math.random();
    if (roll < 0.45) {
      scenario = "OPEN";
      pos = POSITIONS[rand(POSITIONS.length)];
    } else if (roll < 0.8) {
      scenario = "VSRAISE";
      // Hero muss nach dem Raiser sitzen
      const heroIdx = 1 + rand(4); // HJ..SB
      pos = POSITIONS[heroIdx];
      raiserSeat = rand(heroIdx); // jemand davor
    } else {
      scenario = "VSLIMP";
      const heroIdx = 1 + rand(4);
      pos = POSITIONS[heroIdx];
      raiserSeat = rand(heroIdx);
    }
  }
  return { hi, lo, pos, bb, scenario, raiserSeat };
}

function notation(hi, lo) {
  const r1 = RANK_ORDER[hi.r], r2 = RANK_ORDER[lo.r];
  return hi.r === lo.r ? r1 + r2 : r1 + r2 + (hi.s === lo.s ? "s" : "o");
}

function correctAction(spot, nota) {
  switch (spot.scenario) {
    case "PUSH":
      return PUSH[spot.pos].has(nota) ? "ALLIN" : "FOLD";
    case "OPEN":
      return OPEN[spot.pos].has(nota) ? "RAISE" : "FOLD";
    case "VSLIMP":
      return OPEN[spot.pos].has(nota) ? "RAISE" : "FOLD";
    case "VSRAISE": {
      if (THREEBET.has(nota)) return "3BET";
      const callSet = spot.pos === "SB" ? CALL_SB : CALL_IP;
      return callSet.has(nota) ? "CALL" : "FOLD";
    }
    default:
      return "FOLD";
  }
}

const ACTION_LABELS = { FOLD: "Fold", RAISE: "Raise", CALL: "Call", "3BET": "3-Bet", ALLIN: "All-in" };
const AGGRO = { FOLD: 0, CALL: 1, RAISE: 2, "3BET": 2, ALLIN: 2 };

function scenarioText(spot) {
  switch (spot.scenario) {
    case "PUSH": return `Kurzer Stack (${spot.bb} BB) – alle vor dir haben gefoldet. Es gilt: All-in oder Fold.`;
    case "OPEN": return `${spot.bb} BB Stack – alle vor dir haben gefoldet.`;
    case "VSRAISE": return `${spot.bb} BB Stack – ${SEAT_NAMES[spot.raiserSeat]} hat auf 2,5 BB erhöht. Rest hat gefoldet.`;
    case "VSLIMP": return `${spot.bb} BB Stack – ${SEAT_NAMES[spot.raiserSeat]} ist nur mitgegangen (Limp).`;
    default: return "";
  }
}

function explanation(spot, correct, nota) {
  if (spot.scenario === "PUSH") {
    return correct === "ALLIN"
      ? "Mit so wenig Chips zählt Fold Equity: All-in setzt Druck und gewinnt die Blinds oft kampflos. Callen oder klein raisen wäre der Fehler."
      : "Zu schwach für ein All-in aus dieser Position. Lieber auf einen besseren Spot warten – auch mit kurzem Stack.";
  }
  if (spot.scenario === "VSRAISE") {
    if (correct === "3BET") return "Premium-Hand: Erhöhen für Value. Nur callen lässt zu viele Gegner billig mitgehen.";
    if (correct === "CALL") return "Stark genug zum Mitgehen, aber nicht stark genug für eine 3-Bet gegen einen Raise.";
    return "Gegen einen Raise brauchst du deutlich mehr Handstärke als beim Eröffnen. Weg damit.";
  }
  if (spot.scenario === "VSLIMP") {
    return correct === "RAISE"
      ? "Limper bestrafen: Raisen isoliert den schwachen Spieler und du spielst den Pot in Position."
      : "Nicht stark genug zum Isolieren. Über-Limpen lohnt selten – Fold ist sauber.";
  }
  return correct === "RAISE"
    ? "Stark genug, um aus dieser Position zu eröffnen."
    : "Zu schwach für diese Position – aus späterer Position wäre sie evtl. spielbar.";
}

/* ═══════════════════ UI ═══════════════════ */

function Card({ card, delay }) {
  const color = SUIT_COLORS[card.s];
  return (
    <div style={{
      width: 88, height: 124, borderRadius: 10,
      background: "linear-gradient(155deg,#fbf8ef,#ece7d8)",
      boxShadow: "0 8px 24px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.8)",
      display: "flex", alignItems: "center", justifyContent: "center",
      position: "relative",
      animation: `dealIn 0.35s ${delay}s cubic-bezier(0.2,0.9,0.3,1.2) both`,
    }}>
      <div style={{ position: "absolute", top: 8, left: 10, fontSize: 19, fontWeight: 800, color, fontFamily: "Georgia,serif", lineHeight: 1 }}>
        {RANK_ORDER[card.r]}<br /><span style={{ fontSize: 15 }}>{SUITS[card.s]}</span>
      </div>
      <div style={{ fontSize: 48, color }}>{SUITS[card.s]}</div>
    </div>
  );
}

function Table({ pos, raiserSeat, scenario }) {
  const heroIdx = POS_INFO[pos].seat;
  const coords = [
    { x: 25, y: 88 }, { x: 8, y: 50 }, { x: 25, y: 12 },
    { x: 75, y: 12 }, { x: 92, y: 50 }, { x: 75, y: 88 },
  ];
  return (
    <div style={{ position: "relative", width: 250, height: 132, margin: "0 auto" }}>
      <div style={{
        position: "absolute", inset: "14px 28px", borderRadius: "50%",
        background: "radial-gradient(ellipse at 50% 40%, #14532d, #0b3a1e)",
        border: "3px solid #3a2c18", boxShadow: "inset 0 4px 18px rgba(0,0,0,0.6)",
      }} />
      {SEAT_NAMES.map((name, i) => {
        const hero = i === heroIdx;
        const villain = raiserSeat === i;
        return (
          <div key={name} style={{
            position: "absolute", left: `${coords[i].x}%`, top: `${coords[i].y}%`,
            transform: "translate(-50%,-50%)", padding: "3px 9px", borderRadius: 20,
            fontSize: 11, fontWeight: hero || villain ? 800 : 500, whiteSpace: "nowrap",
            background: hero ? "#d4a943" : villain ? "#7a3030" : "rgba(0,0,0,0.55)",
            color: hero ? "#1a1408" : villain ? "#f2d3d3" : "#8a9688",
            border: hero ? "1px solid #f0cd6e" : villain ? "1px solid #a85050" : "1px solid #2c3a2e",
            boxShadow: hero ? "0 0 14px rgba(212,169,67,0.5)" : "none",
          }}>
            {hero ? `DU · ${name}` : villain ? `${name} ${scenario === "VSLIMP" ? "· Limp" : "· Raise"}` : name}
          </div>
        );
      })}
    </div>
  );
}

const btnBase = {
  padding: "13px 26px", fontSize: 16, fontWeight: 800, letterSpacing: "0.07em",
  borderRadius: 10, cursor: "pointer", boxShadow: "0 4px 14px rgba(0,0,0,0.4)",
};
const BTN_STYLES = {
  FOLD: { ...btnBase, border: "1px solid #4a3030", background: "linear-gradient(180deg,#5e2f2f,#3d1e1e)", color: "#f0d9d9" },
  CALL: { ...btnBase, border: "1px solid #2e4a5c", background: "linear-gradient(180deg,#2f5a75,#1d3a4d)", color: "#d5e8f2" },
  RAISE: { ...btnBase, border: "1px solid #6b5520", background: "linear-gradient(180deg,#c79a35,#8f6c1d)", color: "#211a06" },
  "3BET": { ...btnBase, border: "1px solid #6b5520", background: "linear-gradient(180deg,#c79a35,#8f6c1d)", color: "#211a06" },
  ALLIN: { ...btnBase, border: "1px solid #7a2828", background: "linear-gradient(180deg,#b03a3a,#7c2222)", color: "#ffe3e3" },
};

function actionsFor(scenario) {
  if (scenario === "PUSH") return ["FOLD", "ALLIN"];
  if (scenario === "VSRAISE") return ["FOLD", "CALL", "3BET"];
  return ["FOLD", "RAISE"];
}

/* ═══════════════════ APP ═══════════════════ */

export default function App() {
  const [spot, setSpot] = useState(dealSpot);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]); // {pos, scenario, correct:bool, tooLoose:bool, tooTight:bool, nota, right}
  const [finished, setFinished] = useState(false);

  const nota = useMemo(() => notation(spot.hi, spot.lo), [spot]);
  const right = useMemo(() => correctAction(spot, nota), [spot, nota]);

  const total = history.length;
  const correct = history.filter(h => h.correct).length;
  const streak = (() => { let s = 0; for (let i = history.length - 1; i >= 0 && history[i].correct; i--) s++; return s; })();
  const pct = total ? Math.round((correct / total) * 100) : 0;

  function answer(a) {
    if (result) return;
    const ok = a === right;
    setResult({ ok, chosen: a });
    setHistory(h => [...h, {
      pos: spot.pos, scenario: spot.scenario, correct: ok, nota, right,
      tooLoose: !ok && AGGRO[a] > AGGRO[right],
      tooTight: !ok && AGGRO[a] < AGGRO[right],
    }]);
  }

  function next() {
    if (history.length >= SESSION_LENGTH) { setFinished(true); return; }
    setResult(null);
    setSpot(dealSpot());
  }

  function restart() {
    setHistory([]); setFinished(false); setResult(null); setSpot(dealSpot());
  }

  /* ── Report ── */
  if (finished) {
    const byPos = POSITIONS.map(p => {
      const hs = history.filter(h => h.pos === p);
      return { p, t: hs.length, r: hs.filter(h => h.correct).length };
    }).filter(x => x.t > 0);
    const weakest = [...byPos].sort((a, b) => a.r / a.t - b.r / b.t)[0];
    const loose = history.filter(h => h.tooLoose).length;
    const tight = history.filter(h => h.tooTight).length;
    const pushHands = history.filter(h => h.scenario === "PUSH");
    const pushPct = pushHands.length ? Math.round(pushHands.filter(h => h.correct).length / pushHands.length * 100) : null;
    const tips = [];
    if (loose > tight) tips.push("Du spielst zu viele Hände. Heute Abend: Im Zweifel folden – Geduld ist dein Edge.");
    else if (tight > loose) tips.push("Du foldest zu oft gute Spots. Trau dich, spielbare Hände auch zu spielen – besonders vom Button.");
    else if (loose + tight > 0) tips.push("Deine Fehler sind gemischt – konzentrier dich auf die Position, bevor du auf die Karten schaust.");
    if (weakest && weakest.r / weakest.t < 0.7) tips.push(`Schwächste Position: ${POS_INFO[weakest.p].label}. Geh die Range dafür nochmal kurz durch.`);
    if (pushPct !== null && pushPct < 75) tips.push("Push-or-Fold sitzt noch nicht: Unter 15 BB gibt es kein Callen und kein Mini-Raisen mehr.");
    if (tips.length === 0) tips.push("Sauber! Bleib heute Abend einfach bei genau diesem Spiel – und lass dich von losen Gegnern nicht anstecken.");

    return (
      <Shell>
        <div style={{ textAlign: "center", maxWidth: 460, animation: "popIn 0.3s ease both" }}>
          <div style={{ fontFamily: "Georgia,serif", fontSize: 26, color: "#d4a943", marginBottom: 4 }}>Session-Bericht</div>
          <div style={{ fontSize: 46, fontWeight: 800, color: pct >= 80 ? "#8fd18f" : "#d4a943", margin: "10px 0" }}>{pct}%</div>
          <div style={{ color: "#8fa08e", fontSize: 14, marginBottom: 22 }}>{correct} von {total} richtig · Fehler: {loose}× zu loose, {tight}× zu tight</div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginBottom: 26 }}>
            {byPos.map(({ p, t, r }) => (
              <div key={p} style={{
                padding: "6px 12px", borderRadius: 8, fontSize: 12,
                background: "rgba(0,0,0,0.3)", border: "1px solid #1e2f24",
                color: r / t >= 0.75 ? "#8fd18f" : "#d4a943",
              }}>{POS_INFO[p].label}: {Math.round(r / t * 100)}% ({r}/{t})</div>
            ))}
            {pushPct !== null && (
              <div style={{ padding: "6px 12px", borderRadius: 8, fontSize: 12, background: "rgba(0,0,0,0.3)", border: "1px solid #1e2f24", color: pushPct >= 75 ? "#8fd18f" : "#d4a943" }}>
                Push-or-Fold: {pushPct}%
              </div>
            )}
          </div>

          <div style={{ textAlign: "left", background: "rgba(0,0,0,0.3)", border: "1px solid #21362a", borderRadius: 12, padding: "16px 20px", marginBottom: 26 }}>
            <div style={{ fontSize: 12, letterSpacing: "0.18em", color: "#5e7261", marginBottom: 10 }}>MERKSÄTZE FÜR HEUTE ABEND</div>
            {tips.map((t, i) => (
              <div key={i} style={{ fontSize: 14, color: "#cfdccb", marginBottom: 8, lineHeight: 1.5 }}>→ {t}</div>
            ))}
          </div>

          <button onClick={restart} style={BTN_STYLES.RAISE}>NEUE SESSION</button>
        </div>
      </Shell>
    );
  }

  /* ── Trainer ── */
  return (
    <Shell>
      <div style={{ textAlign: "center", marginBottom: 18 }}>
        <div style={{ fontFamily: "Georgia,serif", fontSize: 28, fontWeight: 700, color: "#d4a943", letterSpacing: "0.06em" }}>PREFLOP TRAINER</div>
        <div style={{ fontSize: 11.5, letterSpacing: "0.22em", color: "#5e7261", marginTop: 2 }}>6-MAX · SESSION {total}/{SESSION_LENGTH}</div>
      </div>

      <div style={{ display: "flex", gap: 20, marginBottom: 20, fontSize: 13, background: "rgba(0,0,0,0.35)", padding: "8px 20px", borderRadius: 30, border: "1px solid #21362a" }}>
        <span>Quote: <b style={{ color: pct >= 75 ? "#8fd18f" : "#d4a943" }}>{pct}%</b></span>
        <span>Serie: <b style={{ color: "#d4a943" }}>{streak}</b></span>
        <span style={{ color: "#6c7f6e" }}>{spot.bb} BB</span>
      </div>

      <Table pos={spot.pos} raiserSeat={spot.raiserSeat} scenario={spot.scenario} />
      <div style={{ margin: "10px 0 4px", fontSize: 15, fontWeight: 700, color: "#d4a943" }}>{POS_INFO[spot.pos].label}</div>
      <div style={{ fontSize: 13, color: "#7d8f7f", maxWidth: 360, textAlign: "center", marginBottom: 16, lineHeight: 1.5 }}>{scenarioText(spot)}</div>

      <div style={{ display: "flex", gap: 12, marginBottom: 24 }} key={total + (result ? "r" : "")}>
        <Card card={spot.hi} delay={0} />
        <Card card={spot.lo} delay={0.08} />
      </div>

      {!result ? (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          {actionsFor(spot.scenario).map(a => (
            <button key={a} onClick={() => answer(a)} style={BTN_STYLES[a]}>{ACTION_LABELS[a].toUpperCase()}</button>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: "center", animation: "popIn 0.25s ease both", maxWidth: 400 }}>
          <div style={{ fontSize: 21, fontWeight: 800, marginBottom: 6, color: result.ok ? "#8fd18f" : "#e07a7a" }}>
            {result.ok ? "✓ Richtig!" : `✗ Falsch – richtig wäre ${ACTION_LABELS[right]}`}
          </div>
          <div style={{ fontSize: 13.5, color: "#aebcab", marginBottom: 14, lineHeight: 1.55 }}>
            <b style={{ color: "#e8e4d8" }}>{nota}</b>: {explanation(spot, right, nota)}
          </div>
          <button onClick={next} autoFocus style={{ ...btnBase, border: "1px solid #2e4a36", background: "linear-gradient(180deg,#2c5238,#1b3524)", color: "#cfe3d2" }}>
            {total >= SESSION_LENGTH ? "ZUM BERICHT →" : "NÄCHSTE HAND →"}
          </button>
        </div>
      )}
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at 50% -10%, #163d24 0%, #0c1f13 45%, #070f0a 100%)",
      color: "#dfe6d9", fontFamily: "'Trebuchet MS','Segoe UI',sans-serif",
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "26px 16px 48px",
    }}>
      <style>{`
        @keyframes dealIn { from { opacity:0; transform: translateY(-24px) rotate(-6deg); } to { opacity:1; transform:none; } }
        @keyframes popIn { from { opacity:0; transform: scale(0.92); } to { opacity:1; transform: scale(1); } }
        button:focus-visible { outline: 2px solid #d4a943; outline-offset: 2px; }
        @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
      `}</style>
      {children}
    </div>
  );
}
