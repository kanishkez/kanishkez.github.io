const isFileProtocol = window.location.protocol === "file:";

const hashToSection = {
  "#home": "home",
  "#projects": "projects",
  "#blogs": "blogs",
  "#notes": "notes",
};

const pathToSection = {
  "/": "home",
  "/projects": "projects",
  "/blogs": "blogs",
  "/notes": "notes",
};

const sectionToHash = {
  home: "#home",
  projects: "#projects",
  blogs: "#blogs",
  notes: "#notes",
};

const sectionToPath = {
  home: "#home",
  projects: "#projects",
  blogs: "#blogs",
  notes: "#notes",
};

function setActive(sectionId) {
  document.querySelectorAll(".section").forEach((section) => {
    section.classList.remove("active");
  });
  document.querySelectorAll(".primary-nav a").forEach((link) => {
    link.classList.remove("active");
  });
  document.getElementById(sectionId)?.classList.add("active");
  document.getElementById(`nav-${sectionId}`)?.classList.add("active");
  window.scrollTo({ top: 0, behavior: "instant" });
  triggerSectionAnimations(sectionId);
}

function navigate(sectionId, event) {
  if (event) event.preventDefault();
  if (isFileProtocol) {
    location.hash = sectionToHash[sectionId] || "#home";
  } else {
    history.pushState({ section: sectionId }, "", sectionToPath[sectionId] || "#home");
  }
  setActive(sectionId);
}

function navigateTo(sectionId) {
  navigate(sectionId);
}

window.addEventListener("popstate", (event) => {
  const section = event.state?.section || pathToSection[location.pathname] || "home";
  setActive(section);
});

window.addEventListener("hashchange", () => {
  if (!isFileProtocol) return;
  setActive(hashToSection[location.hash] || "home");
});

(function initNavigation() {
  let section = "home";
  if (location.hash && hashToSection[location.hash]) {
    section = hashToSection[location.hash];
    if (!isFileProtocol) {
      history.replaceState({ section }, "", sectionToPath[section] || "/");
    }
  } else if (isFileProtocol) {
    section = hashToSection[location.hash] || "home";
  } else {
    const path = location.pathname.replace(/\/$/, "") || "/";
    section = pathToSection[path] || "home";
    history.replaceState({ section }, "", location.pathname);
  }
  setActive(section);
})();

// ─── Neural Network Canvas ────────────────────────────────────────────────
(function initNeuralCanvas() {
  const canvas = document.getElementById("ambient-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let W, H, nodes = [], mouse = { x: -999, y: -999 };
  const NODE_COUNT = 55;
  const MAX_DIST = 160;
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) return;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function makeNode() {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 2.2 + 1.2,
      pulse: Math.random() * Math.PI * 2,
    };
  }

  resize();
  window.addEventListener("resize", resize);
  window.addEventListener("mousemove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
  window.addEventListener("mouseleave", () => { mouse.x = -999; mouse.y = -999; });

  for (let i = 0; i < NODE_COUNT; i++) nodes.push(makeNode());

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Draw connections
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < MAX_DIST) {
          const alpha = (1 - d / MAX_DIST) * 0.18;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.strokeStyle = `rgba(8, 80, 40, ${alpha})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
      // mouse connections
      const mdx = nodes[i].x - mouse.x;
      const mdy = nodes[i].y - mouse.y;
      const md = Math.sqrt(mdx * mdx + mdy * mdy);
      if (md < MAX_DIST * 1.6) {
        const alpha = (1 - md / (MAX_DIST * 1.6)) * 0.45;
        ctx.beginPath();
        ctx.moveTo(nodes[i].x, nodes[i].y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.strokeStyle = `rgba(8, 80, 40, ${alpha})`;
        ctx.lineWidth = 0.9;
        ctx.stroke();
      }
    }

    // Draw nodes
    nodes.forEach((n) => {
      n.pulse += 0.025;
      const pr = n.r + Math.sin(n.pulse) * 0.6;
      ctx.beginPath();
      ctx.arc(n.x, n.y, pr, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(8, 80, 40, 0.28)";
      ctx.fill();

      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 0 || n.x > W) n.vx *= -1;
      if (n.y < 0 || n.y > H) n.vy *= -1;
    });

    requestAnimationFrame(draw);
  }

  draw();
})();

// ─── Cursor Glow ─────────────────────────────────────────────────────────
(function initCursorGlow() {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) return;
  if (window.matchMedia("(pointer: coarse)").matches) return;

  const glow = document.createElement("div");
  glow.id = "cursor-glow";
  document.body.appendChild(glow);

  let mx = -200, my = -200, cx = -200, cy = -200;
  window.addEventListener("mousemove", (e) => { mx = e.clientX; my = e.clientY; });

  (function tick() {
    cx += (mx - cx) * 0.08;
    cy += (my - cy) * 0.08;
    glow.style.transform = `translate(${cx - 180}px, ${cy - 180}px)`;
    requestAnimationFrame(tick);
  })();
})();

// ─── Text scramble on intro ───────────────────────────────────────────────
class TextScramble {
  constructor(el) {
    this.el = el;
    this.chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    this.update = this.update.bind(this);
  }
  setText(newText) {
    const old = this.el.innerText;
    const len = Math.max(old.length, newText.length);
    const promise = new Promise((resolve) => (this.resolve = resolve));
    this.queue = [];
    for (let i = 0; i < len; i++) {
      const from = old[i] || "";
      const to = newText[i] || "";
      const start = Math.floor(Math.random() * 22);
      const end = start + Math.floor(Math.random() * 18);
      this.queue.push({ from, to, start, end });
    }
    cancelAnimationFrame(this.frameRequest);
    this.frame = 0;
    this.update();
    return promise;
  }
  update() {
    let output = "";
    let complete = 0;
    for (let i = 0; i < this.queue.length; i++) {
      let { from, to, start, end, char } = this.queue[i];
      if (this.frame >= end) {
        complete++;
        output += to;
      } else if (this.frame >= start) {
        if (!char || Math.random() < 0.28) {
          char = this.chars[Math.floor(Math.random() * this.chars.length)];
          this.queue[i].char = char;
        }
        output += `<span class="scramble-char">${char}</span>`;
      } else {
        output += from;
      }
    }
    this.el.innerHTML = output;
    if (complete === this.queue.length) {
      this.resolve();
    } else {
      this.frameRequest = requestAnimationFrame(this.update);
      this.frame++;
    }
  }
}

// ─── Intersection Observer for stagger reveals ───────────────────────────
function triggerSectionAnimations(sectionId) {
  const section = document.getElementById(sectionId);
  if (!section) return;
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) return;

  // Stagger project articles
  setTimeout(() => {
    const articles = section.querySelectorAll(".project-list article, .mini-item");
    articles.forEach((el, i) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(18px)";
      setTimeout(() => {
        el.style.transition = "opacity 380ms ease, transform 380ms ease";
        el.style.opacity = "1";
        el.style.transform = "translateY(0)";
      }, i * 55 + 80);
    });
  }, 60);
}

// ─── Scramble the name on load ────────────────────────────────────────────
window.addEventListener("DOMContentLoaded", () => {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!prefersReduced) {
    const nameEl = document.querySelector(".identity");
    if (nameEl) {
      const scrambler = new TextScramble(nameEl);
      scrambler.setText("kanishk");
    }

    // Fade in intro lines with stagger
    const introLines = document.querySelectorAll(".intro-line, .lead, .hero-actions");
    introLines.forEach((el, i) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(14px)";
      setTimeout(() => {
        el.style.transition = "opacity 500ms ease, transform 500ms ease";
        el.style.opacity = "1";
        el.style.transform = "translateY(0)";
      }, 300 + i * 140);
    });
  }
});

// ─── Typing cursor on intro span ─────────────────────────────────────────
window.addEventListener("DOMContentLoaded", () => {
  const span = document.querySelector(".intro-line span");
  if (!span) return;
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) return;
  span.classList.add("typed-name");
});
