import { React, run } from "uebersicht";
// --- Inlined design system (self-contained; formerly theme.js) ---
// Shared design system for the widget set: color tokens, fonts, layout, the
// common card shell, drag/resize handles, a last-known-good cache, and the
// standard data-resolution helper. Imported by every widget so they stay
// visually and behaviorally consistent.
const T = {
  // Accent tints
  tintBlue: "#296BE0",
  tintPink: "#E86E87",
  tintGreen: "#59A875",
  tintOrange: "#D9946B",
  tintPurple: "#A861DE",

  // Cards
  cardLight: "rgba(255,255,255,0.74)",
  cardDark: "rgba(33,36,43,0.88)",

  // Ink (text on light)
  ink: "#1F2129",
  inkDim: "#616670",
  inkMute: "#8C919C",

  // Text on dark
  onDark: "#F7F7FA",
  onDarkDim: "#BDBFC7",
  onDarkMute: "#8F949E",

  // Walls (desktop stand-in backgrounds)
  wall1: "#F0F2F7",
  wall2: "#DBE3ED",
  wall3: "#BFC7DB",

  // GitHub ramp
  ghEmpty: "rgba(255,255,255,0.10)",
  ghGreen1: "#9CE8A8",
  ghGreen2: "#40C463",
  ghGreen3: "#30A14F",
  ghGreen4: "#216E38",

  // Scene colors
  nightSky: "#14141A",
  cosmicBase: "#0A051A",
  cosmicViolet: "#8C338C",
  cosmicMagenta: "#D9598C",
  cosmicIndigo: "#331A66",
  shaderPurple: "#402673",
  shaderTeal: "#268C8C",
  duskBase: "#4D408C",
  duskAmber: "#D9A666",
  duskPurple: "#8C4DA6",
  duskGlow: "#F28073",
  cardCream: "#F2F0E6",
  paperGrain: "#9E8052",

  archivePalette: [
    "#D98C4D", "#A64D33", "#733326", "#E0B359",
    "#8C6640", "#B88CCC", "#594D80", "#8C73BF",
    "#8CBF8C", "#4D8059", "#598CD9", "#334D8C",
  ],

  // Layout
  radius: "24px",
  captionTracking: "1.5px",
};

// Fonts. Install Instrument Serif, Geist, and Geist Mono for the intended look;
// each stack falls back to a system font if the family is missing.
const serif = "'Instrument Serif', Georgia, serif";
const sans = "'Geist', -apple-system, BlinkMacSystemFont, sans-serif";
const mono = "'Geist Mono', 'SF Mono', ui-monospace, monospace";

// Default desktop placement [x, y] per widget. Each widget calls
// card(variant, w, h, ...LAYOUT.<key>) so widgets lay out at distinct positions
// rather than stacking at the origin. These are overridden by any saved
// position from the drag handle.
const LAYOUT = {
  nowSpinning:  [380, 40],
  musicArchive: [40, 40],
  spatial:      [380, 200],
  mosaic:       [1120, 40],
  stack:        [1120, 486],
  drop:         [1120, 708],
  swap:         [380, 672],
  aiDailyPull:  [40, 368],
  apod:         [40, 576],
  atlas:        [1280, 224],
  tarot:        [1120, 224],
};

// Shared card shell. variant is "dark" or "light"; x/y set the on-desktop
// position. The common loading/empty/stale state styles are appended so every
// widget can render those states without repeating CSS.
const card = (variant, w, h, x = 0, y = 0) => `
  position: absolute;
  left: ${x}px; top: ${y}px;
  width: ${w}px;
  height: ${h}px;
  border-radius: ${T.radius};
  overflow: hidden;
  box-shadow: 0 12px 40px rgba(0,0,0,0.35);
  background: ${variant === "dark" ? T.cardDark : T.cardLight};
  backdrop-filter: blur(20px);
  color: ${variant === "dark" ? T.onDark : T.ink};
  font-family: ${sans};
  box-sizing: border-box;
  transform-origin: top left;

  /* Promote each card to its own GPU layer so a sibling widget's frequent
     refresh cannot trigger a backdrop-filter recomposite, which otherwise made
     the blur flicker on and off. */
  will-change: transform;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;

  .ws-stale { position:absolute; top:8px; right:10px; z-index:5;
              font-family:${mono}; font-size:8px; letter-spacing:1px;
              text-transform:uppercase; opacity:0.72;
              color:${variant === "dark" ? T.onDarkMute : T.inkMute}; }
  .ws-empty { position:absolute; inset:0; display:flex; align-items:center;
              justify-content:center; padding:24px; text-align:center;
              font-family:${serif}; font-style:italic; font-size:18px;
              opacity:0.6; color:${variant === "dark" ? T.onDarkDim : T.inkDim}; }
  .ws-skel  { position:absolute; inset:14px; border-radius:14px; opacity:0.18;
              animation: ws-pulse 1.6s ease-in-out infinite; }
  @keyframes ws-pulse { 0%,100% { opacity:0.10; } 50% { opacity:0.24; } }
  @media (prefers-reduced-motion: reduce) {
    .ws-skel { animation:none; opacity:0.16; }
  }

  .ws-drag  { position:absolute; top:6px; left:6px; z-index:30;
              width:18px; height:18px; border-radius:6px;
              display:flex; align-items:center; justify-content:center;
              font-size:11px; line-height:1; cursor:grab; opacity:0.22;
              transition:opacity .15s ease; user-select:none;
              -webkit-user-select:none;
              color:${variant === "dark" ? T.onDarkMute : T.inkMute};
              background:${variant === "dark"
                ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}; }
  .ws-drag:hover  { opacity:0.95; }
  .ws-drag:active { cursor:grabbing; }

  .ws-resize { position:absolute; bottom:5px; right:5px; z-index:30;
               width:16px; height:16px; border-radius:5px;
               display:flex; align-items:center; justify-content:center;
               font-size:11px; line-height:1; cursor:nwse-resize; opacity:0.22;
               transition:opacity .15s ease; user-select:none;
               -webkit-user-select:none;
               color:${variant === "dark" ? T.onDarkMute : T.inkMute};
               background:${variant === "dark"
                 ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}; }
  .ws-resize:hover { opacity:0.95; }
`;

// Small uppercase monospace caption used for metadata labels.
const caption = (color) => `
  font-family: ${mono};
  text-transform: uppercase;
  letter-spacing: ${T.captionTracking};
  color: ${color};
`;

// State helpers, returned as React elements (this is plain JS, not JSX).
const h = React.createElement;

// Loading: an accent-tinted skeleton block.
const Skel = ({ tint = T.tintBlue }) =>
  h("div", { className: "ws-skel", style: { background: tint } });

// Empty: a single quiet line of text.
const Empty = ({ text }) => h("div", { className: "ws-empty" }, text);

// Stale: a small marker showing the time of the last successful refresh.
const Stale = ({ ts }) =>
  h("div", { className: "ws-stale" }, `stale · ${clockStamp(ts)}`);

// Drag and resize support.
//
// Übersicht renders each widget into its own absolutely-positioned `.widget`
// node, all inside a shared `#uebersicht` container. The wrapper to move is the
// nearest `.widget` ancestor of a handle — not the topmost absolute element,
// which is the shared container.
//
// DragHandle updates the wrapper's left/top. ResizeHandle scales it uniformly
// via a top-left-anchored CSS transform, keeping these fixed-layout cards crisp
// instead of clipping. Both persist to localStorage, so position and size
// survive refreshes and reboots.
const posKey = (k) => `ws:pos:${k}`;
const scaleKey = (k) => `ws:scale:${k}`;
const MIN_SCALE = 0.4, MAX_SCALE = 3;

const findWrapper = (node) => node && node.closest(".widget");

// Apply any saved position and scale. Runs on every mount, since the wrapper
// may have been recreated on refresh.
const applySaved = (wrapper, key) => {
  try {
    const pos = JSON.parse(localStorage.getItem(posKey(key)) || "null");
    if (pos && typeof pos.x === "number") {
      wrapper.style.left = pos.x + "px";
      wrapper.style.top = pos.y + "px";
    }
  } catch (e) { /* storage unavailable */ }
  try {
    const scale = parseFloat(localStorage.getItem(scaleKey(key)));
    if (scale > 0) wrapper.style.transform = `scale(${scale})`;
  } catch (e) { /* storage unavailable */ }
};

const initDrag = (node, key) => {
  if (!node) return;
  const wrapper = findWrapper(node);
  if (!wrapper) return;
  applySaved(wrapper, key);

  if (node.__wsDragWired) return; // attach listeners once per node
  node.__wsDragWired = true;

  // Keep grip clicks from reaching the card's own onClick handler.
  node.addEventListener("click", (e) => e.stopPropagation());

  node.addEventListener("mousedown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX, startY = e.clientY;
    const cs = getComputedStyle(wrapper);
    const origX = parseFloat(wrapper.style.left || cs.left) || 0;
    const origY = parseFloat(wrapper.style.top || cs.top) || 0;
    const onMove = (ev) => {
      wrapper.style.left = origX + (ev.clientX - startX) + "px";
      wrapper.style.top = origY + (ev.clientY - startY) + "px";
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      try {
        localStorage.setItem(posKey(key), JSON.stringify({
          x: parseFloat(wrapper.style.left) || 0,
          y: parseFloat(wrapper.style.top) || 0,
        }));
      } catch (e) { /* storage unavailable */ }
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  });

  // Double-click the grip to snap back to the card's default LAYOUT slot.
  node.addEventListener("dblclick", (e) => {
    e.preventDefault();
    e.stopPropagation();
    try { localStorage.removeItem(posKey(key)); } catch (e) { /* ignore */ }
    wrapper.style.left = "";
    wrapper.style.top = "";
  });
};

const initResize = (node, key) => {
  if (!node) return;
  const wrapper = findWrapper(node);
  if (!wrapper) return;
  applySaved(wrapper, key);

  if (node.__wsResizeWired) return;
  node.__wsResizeWired = true;

  node.addEventListener("click", (e) => e.stopPropagation());

  node.addEventListener("mousedown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX, startY = e.clientY;
    const cs = getComputedStyle(wrapper);
    // Layout width/height are unaffected by transform, so they stay constant.
    const baseW = parseFloat(cs.width) || 1;
    const baseH = parseFloat(cs.height) || 1;
    const m = /scale\(([^)]+)\)/.exec(wrapper.style.transform || "");
    const origScale = m ? parseFloat(m[1]) || 1 : 1;
    const onMove = (ev) => {
      const delta = (ev.clientX - startX + (ev.clientY - startY)) / (baseW + baseH);
      const next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, origScale + delta));
      wrapper.style.transform = `scale(${next})`;
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      const m2 = /scale\(([^)]+)\)/.exec(wrapper.style.transform || "");
      try { localStorage.setItem(scaleKey(key), String(m2 ? m2[1] : 1)); }
      catch (e) { /* storage unavailable */ }
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  });

  // Double-click the corner to restore the card's default size.
  node.addEventListener("dblclick", (e) => {
    e.preventDefault();
    e.stopPropagation();
    try { localStorage.removeItem(scaleKey(key)); } catch (e) { /* ignore */ }
    wrapper.style.transform = "";
  });
};

// Each handle takes the widget's LAYOUT key so position and scale are stored
// per widget. DragHandle renders top-left, ResizeHandle bottom-right.
const DragHandle = ({ k }) =>
  h("div", { className: "ws-drag", title: "Drag to move · double-click to reset",
             ref: (n) => initDrag(n, k) }, "☰");

const ResizeHandle = ({ k }) =>
  h("div", { className: "ws-resize", title: "Drag to resize · double-click to reset",
             ref: (n) => initResize(n, k) }, "⤡");

// Last-known-good cache, persisted in localStorage with a timestamp.
const remember = (key, data) => {
  try { localStorage.setItem(`ws:${key}`, JSON.stringify({ data, ts: Date.now() })); }
  catch (e) { /* storage unavailable; skip */ }
};

const recall = (key) => {
  try { return JSON.parse(localStorage.getItem(`ws:${key}`)); }
  catch (e) { return null; }
};

const clockStamp = (ms) =>
  new Date(ms).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

// True before the command has produced any output (the initial load tick).
const isLoading = ({ output, error }) =>
  output === undefined && !error;

// Standard data flow for command-backed widgets. parse(output) must return a
// falsy value when there is nothing usable.
//   loading -> { loading: true }            render <Skel/>
//   success -> { data }                     cached as last-known-good
//   failure -> { data, staleTs }            last-known-good + time, render <Stale/>
//   cold    -> { data, mock: true }         mock data, nothing cached yet
const resolve = (key, props, parse, mock) => {
  if (isLoading(props)) return { loading: true };
  let data = null;
  try { data = parse(props.output); } catch (e) { data = null; }
  if (data) { remember(key, data); return { data }; }
  const cached = recall(key);
  if (cached && cached.data) return { data: cached.data, staleTs: cached.ts };
  return { data: mock, mock: true };
};
// --- End inlined design system ---

// One AI prompt per day on a frosted-glass panel.
//
// The prompt is generated by a local helper that calls the Anthropic (Claude)
// API and caches one prompt per day. If the helper is absent or returns
// nothing, the widget falls back to the bundled PROMPTS library (chosen by day
// of year). Clicking copies the prompt and opens a new chat.
//
// To edit: change the helper path below, or edit the bundled PROMPTS library.
const FETCH = `$HOME/.config/widgetsuite/ai-daily-pull-fetch.py`;
export const command = `/usr/bin/python3 "${FETCH}" 2>/dev/null || echo ""`;
export const refreshFrequency = 1000 * 60 * 30; // helper caches daily; just re-read

export const className = card("dark", 320, 200, ...LAYOUT.aiDailyPull) + `
  background: rgba(38,40,48,0.42);
  backdrop-filter: blur(30px) saturate(170%);
  -webkit-backdrop-filter: blur(30px) saturate(170%);
  border: 0.5px solid rgba(255,255,255,0.16);
  box-shadow: 0 12px 40px rgba(0,0,0,0.30), inset 0 0.5px 0 rgba(255,255,255,0.20);
  padding: 0;
  .wrap   { position:absolute; inset:0; display:flex; align-items:center; padding:24px; cursor:pointer; }
  .prompt { font-family:${serif}; font-style:italic; font-size:20px; letter-spacing:-0.2px;
            line-height:1.3; color:${T.onDark}; text-shadow:0 1px 3px rgba(0,0,0,0.35);
            display:-webkit-box; -webkit-line-clamp:6; -webkit-box-orient:vertical; overflow:hidden; }

  /* Provider switcher: the active model's logo sits bottom-right; clicking it
     reveals the other two so the prompt can be (re)generated by that model. */
  .ai-switch { position:absolute; bottom:10px; right:10px; z-index:20;
               display:flex; flex-direction:row-reverse; align-items:center; gap:7px; }
  .ailogo  { width:24px; height:24px; display:block;
             filter: drop-shadow(0 1px 2px rgba(0,0,0,0.35)); }
  .ailogo.claude { color:#D97757; fill:currentColor; }
  .ailogo.openai { color:#FFFFFF; fill:currentColor; }
  .ailogo.gemini { fill:currentColor; }
  .ai-current { display:flex; cursor:pointer; opacity:0.92; padding:2px;
                border-radius:8px; transition:opacity .15s ease, background .15s ease; }
  .ai-current:hover { opacity:1; background:rgba(255,255,255,0.10); }
  .ai-menu { display:none; align-items:center; gap:5px;
             padding:3px 5px; border-radius:11px;
             background:rgba(20,20,28,0.6); backdrop-filter:blur(8px);
             border:0.5px solid rgba(255,255,255,0.16); }
  .ai-switch.open .ai-menu { display:flex; }
  .ai-opt { display:flex; align-items:center; justify-content:center; cursor:pointer;
            background:none; border:0; padding:2px; border-radius:7px; opacity:0.7;
            transition:opacity .15s ease, background .15s ease; }
  .ai-opt:hover { opacity:1; background:rgba(255,255,255,0.12); }
  .ai-opt.sel { opacity:1; background:rgba(255,255,255,0.16); }
`;

// A bundled library of universal, ready-to-paste prompts. Used as the fallback
// (selected by day of year) when no API key is configured, so the widget is
// useful out of the box for anyone.
const PROMPTS = [
  "Explain a concept I find confusing using three different analogies, then ask which one landed.",
  "Act as a skeptical editor and cut my draft by 30% without losing its meaning.",
  "Give me five questions about this decision that I probably haven't thought to ask.",
  "Turn my rough notes into one clear paragraph a busy person could read in 20 seconds.",
  "Play devil's advocate against my current plan and name its three weakest assumptions.",
  "Teach me the 20% of this topic that covers 80% of everyday use.",
  "Help me write a message that declines a request politely but firmly.",
  "Break this overwhelming goal into the smallest possible first step I can do today.",
  "Quiz me with five increasingly hard questions on a topic I want to learn.",
  "Rewrite this paragraph in three tones: formal, friendly, and blunt.",
  "Help me prepare for a hard conversation by role-playing the other person's side.",
  "List the trade-offs between my two options and recommend one, with reasons.",
  "Find the hidden assumption in my argument and tell me whether it holds up.",
  "Draft a five-line daily plan that protects two hours of uninterrupted focus.",
  "Explain how this technology actually works under the hood, step by step.",
  "Give me ten name ideas for this project, from literal to playful.",
  "Summarize both sides of this debate fairly, then say where the evidence points.",
  "Turn the feedback I just received into three concrete actions I can take.",
  "Give me a tighter, more confident version of this sentence.",
  "Help me design a simple weekly review I'll actually stick to.",
  "Interview me for my dream role and ask five sharp questions.",
  "Explain the most common beginner mistake in this skill and how to avoid it.",
  "Help me write a clear apology that takes responsibility without over-explaining.",
  "Brainstorm ten ideas, then star the three that are genuinely good and say why.",
  "Translate this technical explanation into plain language a friend would get.",
  "Help me set one meaningful goal for this month and define what done looks like.",
  "Critique my reasoning like a mentor who wants me to actually improve.",
  "Give me a checklist to run through before I send something important.",
  "Ask me a few questions to help me figure out what's really bothering me here.",
  "Suggest a 15-minute and a 1-hour version of learning this topic today.",
  "Rewrite my to-do list in priority order and tell me what to drop.",
  "Explain this idea as if I were ten, then again as if I were an expert.",
  "Draft a concise update for my team: what I did, what's next, any blockers.",
  "Challenge me to defend my opinion, then point out where I'm being inconsistent.",
  "Give me three small experiments to test whether this idea is worth pursuing.",
  "Help me write a warm but brief thank-you note for someone who helped me.",
  "Summarize this into five bullet points and one key takeaway.",
  "Help me turn a vague worry into a concrete plan with a clear first action.",
  "Compare how a beginner and an expert would approach this problem differently.",
  "Rewrite this so it sounds less like a robot and more like a real person.",
  "Help me prepare three talking points for a meeting so I don't ramble.",
  "Point out what I'm overcomplicating and show me the simpler path.",
  "Give me a metaphor that makes this abstract concept concrete and memorable.",
  "Help me say no to something so I can protect time for what actually matters.",
  "Draft a friendly reminder message that doesn't come across as passive-aggressive.",
  "Explain the strongest counterargument to a belief I hold, as fairly as you can.",
  "Help me break a habit by designing one small change to my environment.",
  "Turn this messy idea into a clean outline with three main sections.",
  "Ask me what I've been avoiding, then help me make it feel less daunting.",
  "Give me a 30-second elevator pitch for what I'm working on.",
  "Help me decide by asking which choice I'd regret more a year from now.",
  "Review this plan and name the single most likely reason it fails.",
  "Explain a recent development in a field I care about in five clear sentences.",
  "Suggest a better question than the one I just asked, then answer that one.",
  "Help me reflect on this week: what worked, what didn't, what's next.",
  "Give me the simplest possible explanation, then add one layer of nuance.",
  "Help me rehearse a tough request by drafting exactly what I'll say.",
  "Point out a blind spot I might have about this situation.",
  "Help me write a clear, kind boundary for a situation that keeps draining me.",
  "Take my half-formed idea and ask the three questions that would sharpen it most.",
];

const dayOfYear = () => {
  const now = new Date();
  return Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
};

const shq = (s) => `'${String(s).replace(/'/g, "'\\''")}'`;

// Extract the prompt from the helper's JSON; null when unavailable.
const parseHost = (output) => {
  try { const j = JSON.parse(output); if (j && j.prompt) return j.prompt; } catch (e) {}
  return null;
};

// Which model produced the prompt, derived from the helper's "source" field
// (e.g. "Anthropic / claude-..."). null when the helper supplied nothing.
const parseSource = (output) => {
  try {
    const s = (JSON.parse(output) || {}).source || "";
    if (/anthropic|claude/i.test(s)) return "claude";
    if (/openai|gpt/i.test(s)) return "openai";
    if (/google|gemini/i.test(s)) return "gemini";
  } catch (e) {}
  return null;
};

// Provider registry: display label, where clicking the prompt opens a chat, and
// the brand mark (inline SVG so the widget needs no image files and works
// offline). Marks are used nominatively to denote each provider.
const PROVIDERS = ["claude", "openai", "gemini"];
const PROVIDER_LABEL = { claude: "Claude", openai: "ChatGPT", gemini: "Gemini" };
const PROVIDER_CHAT = {
  claude: "https://claude.ai/new",
  openai: "https://chatgpt.com/",
  gemini: "https://gemini.google.com/app",
};
const LOGOS = {
  claude: { vb: "0 0 24 24", inner: '<path d="m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z"/>' },
  openai: { vb: "0 0 256 260", inner: '<path d="M239.184 106.203a64.716 64.716 0 0 0-5.576-53.103C219.452 28.459 191 15.784 163.213 21.74A65.586 65.586 0 0 0 52.096 45.22a64.716 64.716 0 0 0-43.23 31.36c-14.31 24.602-11.061 55.634 8.033 76.74a64.665 64.665 0 0 0 5.525 53.102c14.174 24.65 42.644 37.324 70.446 31.36a64.72 64.72 0 0 0 48.754 21.744c28.481.025 53.714-18.361 62.414-45.481a64.767 64.767 0 0 0 43.229-31.36c14.137-24.558 10.875-55.423-8.083-76.483Zm-97.56 136.338a48.397 48.397 0 0 1-31.105-11.255l1.535-.87 51.67-29.825a8.595 8.595 0 0 0 4.247-7.367v-72.85l21.845 12.636c.218.111.37.32.409.563v60.367c-.056 26.818-21.783 48.545-48.601 48.601Zm-104.466-44.61a48.345 48.345 0 0 1-5.781-32.589l1.534.921 51.722 29.826a8.339 8.339 0 0 0 8.441 0l63.181-36.425v25.221a.87.87 0 0 1-.358.665l-52.335 30.184c-23.257 13.398-52.97 5.431-66.404-17.803ZM23.549 85.38a48.499 48.499 0 0 1 25.58-21.333v61.39a8.288 8.288 0 0 0 4.195 7.316l62.874 36.272-21.845 12.636a.819.819 0 0 1-.767 0L41.353 151.53c-23.211-13.454-31.171-43.144-17.804-66.405v.256Zm179.466 41.695-63.08-36.63L161.73 77.86a.819.819 0 0 1 .768 0l52.233 30.184a48.6 48.6 0 0 1-7.316 87.635v-61.391a8.544 8.544 0 0 0-4.4-7.213Zm21.742-32.69-1.535-.922-51.619-30.081a8.39 8.39 0 0 0-8.492 0L99.98 99.808V74.587a.716.716 0 0 1 .307-.665l52.233-30.133a48.652 48.652 0 0 1 72.236 50.391v.205ZM88.061 139.097l-21.845-12.585a.87.87 0 0 1-.41-.614V65.685a48.652 48.652 0 0 1 79.757-37.346l-1.535.87-51.67 29.825a8.595 8.595 0 0 0-4.246 7.367l-.051 72.697Zm11.868-25.58 28.138-16.217 28.188 16.218v32.434l-28.086 16.218-28.188-16.218-.052-32.434Z"/>' },
  gemini: { vb: "0 0 24 24", inner: '<defs><linearGradient id="wsgm" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#4285F4"/><stop offset="1" stop-color="#9B72F2"/></linearGradient></defs><path fill="url(#wsgm)" d="M11.04 19.32Q12 21.51 12 24q0-2.49.93-4.68.96-2.19 2.58-3.81t3.81-2.55Q21.51 12 24 12q-2.49 0-4.68-.93a12.3 12.3 0 0 1-3.81-2.58 12.3 12.3 0 0 1-2.58-3.81Q12 2.49 12 0q0 2.49-.96 4.68-.93 2.19-2.55 3.81a12.3 12.3 0 0 1-3.81 2.58Q2.49 12 0 12q2.49 0 4.68.96 2.19.93 3.81 2.55t2.55 3.81"/>' },
};
const svgHTML = (p) =>
  `<svg class="ailogo ${p}" viewBox="${LOGOS[p].vb}" xmlns="http://www.w3.org/2000/svg">${LOGOS[p].inner}</svg>`;

const PROVIDER_KEY = "ws:aiprovider";
// Current provider: the user's saved choice wins; otherwise reflect whichever
// model the helper last used; default to Claude.
const getProvider = (output) => {
  try {
    const saved = localStorage.getItem(PROVIDER_KEY);
    if (PROVIDERS.includes(saved)) return saved;
  } catch (e) {}
  return parseSource(output) || "claude";
};

// Wire the switcher once: the active mark toggles the menu; choosing a provider
// persists it, writes the selector file the helper reads, and forces the next
// pull to use it. Visual state is updated directly so it reflects immediately
// without waiting for the widget's slow refresh.
const initSwitch = (node) => {
  if (!node) return;
  const current = node.querySelector(".ai-current");
  if (current && current.dataset.p) current.innerHTML = svgHTML(current.dataset.p);
  if (node.__wsSwitchWired) return;
  node.__wsSwitchWired = true;

  current && current.addEventListener("click", (e) => {
    e.stopPropagation();
    node.classList.toggle("open");
  });
  node.querySelectorAll(".ai-opt").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const p = btn.dataset.p;
      if (!PROVIDERS.includes(p)) return;
      try { localStorage.setItem(PROVIDER_KEY, p); } catch (err) {}
      if (current) { current.dataset.p = p; current.innerHTML = svgHTML(p); }
      node.querySelectorAll(".ai-opt").forEach((b) =>
        b.classList.toggle("sel", b.dataset.p === p));
      node.classList.remove("open");
      run(`mkdir -p "$HOME/.config/widgetsuite"; printf %s ${shq(p)} > "$HOME/.config/widgetsuite/ai-provider.txt"; touch "$HOME/Library/Caches/ws-aipull.force"`);
    });
  });
};

const Switcher = ({ active }) =>
  h("div", { className: "ai-switch", ref: initSwitch },
    h("div", { className: "ai-current", "data-p": active,
               title: `Generated by ${PROVIDER_LABEL[active]} · click to switch`,
               dangerouslySetInnerHTML: { __html: svgHTML(active) } }),
    h("div", { className: "ai-menu" },
      ...PROVIDERS.map((p) =>
        h("button", { key: p, className: `ai-opt${p === active ? " sel" : ""}`,
                      "data-p": p, title: PROVIDER_LABEL[p],
                      dangerouslySetInnerHTML: { __html: svgHTML(p) } }))));

// Memo of the last render so the periodic refresh doesn't re-render (and flash)
// the card when neither the prompt nor the active model has changed.
let __aiSig = null, __aiEl = null;

export const render = (props) => {
  if (isLoading(props)) return <Skel tint={T.tintPurple} />;
  const prompt = parseHost(props.output) || PROMPTS[dayOfYear() % PROMPTS.length];
  const active = getProvider(props.output);
  const chat = PROVIDER_CHAT[active] || PROVIDER_CHAT.claude;

  const sig = JSON.stringify({ prompt, active });
  if (sig === __aiSig && __aiEl) return __aiEl;
  __aiSig = sig;

  return (__aiEl = (
    <div aria-label={`Daily prompt: ${prompt}`}>
      <DragHandle k="aiDailyPull" />
      <ResizeHandle k="aiDailyPull" />
      <div className="wrap"
           onClick={() => run(`printf %s ${shq(prompt)} | pbcopy; open ${shq(chat)}`)}>
        <div className="prompt">{prompt}</div>
      </div>
      <Switcher active={active} />
    </div>
  ));
};
