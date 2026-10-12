const GITHUB_USER = "pelinkonak";
const EXCLUDED_REPOS = new Set(["ownwebsite.github.io", "pelinkonak"]);

const ICON_MOON = `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
const ICON_SUN = `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>`;

document.documentElement.classList.add("js");

function isDark() {
  const set = document.documentElement.getAttribute("data-theme");
  if (set) return set === "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function syncThemeIcon() {
  document.querySelectorAll(".theme-toggle").forEach((btn) => {
    btn.innerHTML = isDark() ? ICON_SUN : ICON_MOON;
  });
}

function initTheme() {
  syncThemeIcon();
  document.querySelectorAll(".theme-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const next = isDark() ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try {
        localStorage.setItem("theme", next);
      } catch (e) {}
      syncThemeIcon();
    });
  });
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", syncThemeIcon);
}

function initNav() {
  const burger = document.querySelector(".nav__burger");
  const links = document.getElementById("nav-links");
  const header = document.querySelector(".site-header");
  if (burger && links) {
    const close = () => {
      links.classList.remove("open");
      burger.setAttribute("aria-expanded", "false");
    };
    burger.addEventListener("click", () => {
      const open = links.classList.toggle("open");
      burger.setAttribute("aria-expanded", String(open));
    });
    links.querySelectorAll("a").forEach((a) => a.addEventListener("click", close));
    document.addEventListener("keydown", (e) => e.key === "Escape" && close());
  }

  const bar = document.querySelector(".scroll-progress");
  const onScroll = () => {
    const el = document.documentElement;
    const max = el.scrollHeight - el.clientHeight;
    if (bar) bar.style.transform = `scaleX(${max > 0 ? el.scrollTop / max : 0})`;
    if (header) header.classList.toggle("is-scrolled", el.scrollTop > 8);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Active section highlight
  const navAnchors = [...document.querySelectorAll(".nav__links a")];
  const sections = navAnchors.map((a) => document.querySelector(a.getAttribute("href"))).filter(Boolean);
  if ("IntersectionObserver" in window && sections.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          navAnchors.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === `#${entry.target.id}`));
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach((s) => io.observe(s));
  }
}

function initReveal(scope = document) {
  const els = [...scope.querySelectorAll(".reveal:not(.is-visible)")];
  if (!("IntersectionObserver" in window)) {
    els.forEach((el) => el.classList.add("is-visible"));
    return;
  }
  // stagger siblings in the same parent
  els.forEach((el) => {
    const siblings = [...el.parentElement.children].filter((c) => c.classList.contains("reveal"));
    const i = siblings.indexOf(el);
    if (i > 0) el.style.setProperty("--d", `${Math.min(i, 6) * 0.07}s`);
  });
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
  );
  els.forEach((el) => io.observe(el));
}

async function loadGithubRepos() {
  const grid = document.getElementById("github-grid");
  const errEl = document.getElementById("github-error");
  if (!grid) return;

  grid.setAttribute("aria-busy", "true");
  grid.innerHTML = Array.from({ length: 6 }, () => '<div class="repo repo--skeleton" aria-hidden="true"></div>').join("");

  try {
    const res = await fetch(`https://api.github.com/users/${GITHUB_USER}/repos?sort=pushed&per_page=40&type=owner`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const repos = await res.json();
    const list = repos.filter((r) => !r.fork && !EXCLUDED_REPOS.has(r.name)).slice(0, 9);

    grid.innerHTML = "";
    if (!list.length) throw new Error("empty");

    list.forEach((repo) => {
      const a = document.createElement("a");
      a.className = "repo";
      a.href = repo.html_url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";

      const name = document.createElement("span");
      name.className = "repo__name";
      name.textContent = repo.name;

      const desc = document.createElement("span");
      desc.className = "repo__desc";
      desc.textContent = repo.description || "Açıklama eklenmemiş.";

      const meta = document.createElement("span");
      meta.className = "repo__meta";
      if (repo.language) {
        const lang = document.createElement("span");
        lang.className = "repo__lang";
        lang.textContent = repo.language;
        meta.appendChild(lang);
      }
      if (repo.stargazers_count > 0) {
        const s = document.createElement("span");
        s.textContent = `★ ${repo.stargazers_count}`;
        meta.appendChild(s);
      }
      const updated = document.createElement("span");
      updated.textContent = new Date(repo.pushed_at).toLocaleDateString("tr-TR", { month: "short", year: "numeric" });
      meta.appendChild(updated);

      a.append(name, desc, meta);
      grid.appendChild(a);
    });
  } catch (e) {
    grid.innerHTML = "";
    if (errEl) {
      errEl.innerHTML =
        'Repolar şu an yüklenemedi. <a class="inline-link" href="https://github.com/pelinkonak" target="_blank" rel="noopener">GitHub profilime göz at ↗</a>';
      errEl.classList.remove("hidden");
    }
  } finally {
    grid.removeAttribute("aria-busy");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const y = document.getElementById("year");
  if (y) y.textContent = String(new Date().getFullYear());
  initTheme();
  initNav();
  initReveal();
  loadGithubRepos();
});
