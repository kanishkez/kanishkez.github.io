const isFileProtocol = true;

const hashToSection = {
  "#home": "home",
  "#projects": "projects",
  "#blogs": "blogs",
};

const pathToSection = {
  "/": "home",
  "/projects": "projects",
  "/blogs": "blogs",
};

const sectionToHash = {
  home: "#home",
  projects: "#projects",
  blogs: "#blogs",
};

const sectionToPath = {
  home: "/",
  projects: "/projects",
  blogs: "/blogs",
};

function setActive(sectionId) {
  document
    .querySelectorAll(".section")
    .forEach((section) => section.classList.remove("active"));

  document
    .querySelectorAll(".sidebar-nav a")
    .forEach((link) => link.classList.remove("active"));

  document.getElementById(sectionId)?.classList.add("active");
  document.getElementById(`nav-${sectionId}`)?.classList.add("active");

  window.scrollTo(0, 0);
}

function navigate(sectionId, event) {
  if (event) {
    event.preventDefault();
  }

  if (isFileProtocol) {
    location.hash = sectionToHash[sectionId] || "#home";
  } else {
    history.pushState({ section: sectionId }, "", sectionToPath[sectionId] || "/");
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
  if (!isFileProtocol) {
    return;
  }

  const section = hashToSection[location.hash] || "home";
  setActive(section);
});

(function init() {
  let section = "home";

  if (isFileProtocol) {
    section = hashToSection[location.hash] || "home";
  } else {
    const path = location.pathname.replace(/\/$/, "") || "/";
    section = pathToSection[path] || "home";
    history.replaceState({ section }, "", location.pathname);
  }

  setActive(section);
})();
