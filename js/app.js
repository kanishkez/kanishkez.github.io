const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// ── notes index, built from notes/notes-data.js ─────────────────────────
(function notes() {
  const el = document.getElementById("notes-container");
  if (!el || typeof NOTES_DATA === "undefined") return;
  el.innerHTML = NOTES_DATA.map((cat) => `
    <details class="notes-cat">
      <summary>${esc(cat.title)} <span>(${cat.notes.length})</span></summary>
      <ul>${cat.notes.map((n) => `<li><a href="notes/${esc(n.slug)}/">${esc(n.title)}</a></li>`).join("")}</ul>
    </details>`).join("");
})();

// ── a toy attention head over the intro ─────────────────────────────────
// each word gets a character-trigram embedding; hovering a word makes it
// the query, and every other word lights up by softmax(cosine / T).
(function attention() {
  const p = document.getElementById("attn");
  const out = document.getElementById("readout");
  if (!p || !out) return;

  const words = p.textContent.trim().split(/\s+/);
  p.innerHTML = words.map((w, i) => `<span class="w" data-i="${i}">${esc(w)}</span>`).join(" ");
  const spans = [...p.querySelectorAll(".w")];

  const STOP = new Set("i'm a an the and or to of in on with which that these this it its i see what's up them from".split(" "));
  const clean = (w) => w.toLowerCase().replace(/[^a-z'-]/g, "");
  const vecs = words.map((w) => {
    const s = `#${clean(w)}#`, v = new Map();
    for (let k = 0; k < s.length - 2; k++) { const g = s.slice(k, k + 3); v.set(g, (v.get(g) || 0) + 1); }
    let n = 0; v.forEach((x) => (n += x * x));
    return { v, n: Math.sqrt(n) || 1 };
  });
  const cos = (a, b) => { let d = 0; a.v.forEach((x, g) => { if (b.v.has(g)) d += x * b.v.get(g); }); return d / (a.n * b.n); };

  function attend(q) {
    const T = 0.09;
    const raw = words.map((w, j) => {
      if (j === q) return -Infinity;
      let s = cos(vecs[q], vecs[j]) - 0.004 * Math.abs(q - j);
      if (STOP.has(clean(w))) s -= 0.35;
      return s / T;
    });
    const m = Math.max(...raw);
    const e = raw.map((x) => Math.exp(x - m));
    const z = e.reduce((a, b) => a + b, 0);
    return e.map((x) => x / z);
  }

  function show(q) {
    const wts = attend(q);
    const max = Math.max(...wts);
    spans.forEach((s, j) => {
      const a = j === q ? 0 : (wts[j] / max) * 0.85;
      s.style.setProperty("--a", a.toFixed(3));
      s.classList.toggle("q", j === q);
      s.classList.toggle("hot", a > 0.45);
    });
    const top = wts.map((w, j) => [w, j]).sort((a, b) => b[0] - a[0]).slice(0, 5);
    out.innerHTML = `
      <div class="h">attention head 0.0</div>
      <div class="q">query: <b>${esc(clean(words[q]) || words[q])}</b></div>
      <ol>${top.map(([w, j]) => `<li><span>${esc(clean(words[j]))}<span class="wbar" style="width:${Math.round((w / top[0][0]) * 100)}%"></span></span><span>${w.toFixed(2)}</span></li>`).join("")}</ol>
      <p class="fine">a toy head running in your browser: character-trigram embeddings, cosine similarity, softmax. no model was harmed.</p>`;
  }

  function clear() {
    spans.forEach((s) => { s.style.setProperty("--a", 0); s.classList.remove("q", "hot"); });
  }

  // idle demo until someone touches it
  const demo = ["machines", "models", "mathematics", "training", "fine-tuning,", "inside."]
    .map((w) => words.indexOf(w)).filter((i) => i >= 0);
  let k = 0, timer = null;
  const tick = () => { show(demo[k++ % demo.length]); };
  const stopDemo = () => { clearInterval(timer); timer = null; };
  if (!reduceMotion && demo.length) {
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !timer && !p.dataset.touched) { tick(); timer = setInterval(tick, 2400); }
      else if (!e.isIntersecting) stopDemo();
    });
    io.observe(p);
  }

  const pick = (ev) => {
    const w = ev.target.closest(".w");
    if (!w) return;
    p.dataset.touched = "1";
    stopDemo();
    show(+w.dataset.i);
  };
  p.addEventListener("mouseover", pick);
  p.addEventListener("click", pick);
  p.addEventListener("mouseleave", () => { if (p.dataset.touched) clear(); });
})();

// ── scroll depth, counted in Tiny Aya layers ────────────────────────────
(function layers() {
  const box = document.getElementById("layer");
  if (!box) return;
  const ticks = box.querySelector(".ticks");
  const num = box.querySelector(".num");
  const N = 36;
  ticks.innerHTML = Array.from({ length: N }, (_, i) => `<i class="${i >= 14 && i <= 22 ? "band" : ""}"></i>`).join("");
  const bars = [...ticks.children];
  let last = -1;
  const update = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    const L = max > 0 ? Math.min(N - 1, Math.round((scrollY / max) * (N - 1))) : 0;
    if (L === last) return;
    last = L;
    bars.forEach((b, i) => b.classList.toggle("on", i <= L));
    num.textContent = "L" + String(L).padStart(2, "0");
    box.classList.toggle("hot", L >= 14 && L <= 22);
  };
  addEventListener("scroll", update, { passive: true });
  addEventListener("resize", update);
  update();
})();

// ── grow the safeswitch bars when they scroll into view ─────────────────
(function graph() {
  const g = document.getElementById("graph");
  if (!g) return;
  if (reduceMotion || !("IntersectionObserver" in window)) { g.classList.add("go"); return; }
  const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { g.classList.add("go"); io.disconnect(); } }, { threshold: 0.4 });
  io.observe(g);
})();

// ── highlight the section you're in ─────────────────────────────────────
(function spy() {
  const links = [...document.querySelectorAll(".site-header nav a")].filter((a) => a.getAttribute("href").startsWith("#"));
  const secs = links.map((a) => document.querySelector(a.getAttribute("href"))).filter(Boolean);
  if (!secs.length || !("IntersectionObserver" in window)) return;
  const seen = new Map();
  const obs = new IntersectionObserver((es) => {
    es.forEach((e) => seen.set(e.target.id, e.isIntersecting));
    const cur = secs.find((s) => seen.get(s.id));
    links.forEach((a) => a.classList.toggle("active", !!cur && a.getAttribute("href") === "#" + cur.id));
  }, { rootMargin: "-40% 0px -55% 0px" });
  secs.forEach((s) => obs.observe(s));
})();
