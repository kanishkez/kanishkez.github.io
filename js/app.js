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
  // Animations removed per user request
}

// ─── Scramble the name on load ────────────────────────────────────────────
window.addEventListener("DOMContentLoaded", () => {
  // Scramble and intro fade animations removed per user request
});

// ─── Typing cursor on intro span ─────────────────────────────────────────
window.addEventListener("DOMContentLoaded", () => {
  const span = document.querySelector(".intro-line span");
  if (!span) return;
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) return;
  span.classList.add("typed-name");
});
