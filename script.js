const GITHUB_USER = "pelinkonak";
const EXCLUDED_REPOS = new Set(["ownwebsite.github.io", "pelinkonak"]);

const ICON_MOON = `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
const ICON_SUN = `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>`;

function setThemeIcons(isDark) {
  document.querySelectorAll(".theme-toggle").forEach((btn) => {
    btn.innerHTML = isDark ? ICON_SUN : ICON_MOON;
  });
}

function initScrollProgress() {
  const bar = document.querySelector(".scroll-progress");
  if (!bar) return;
  const update = () => {
    const el = document.documentElement;
    const scrollable = el.scrollHeight - el.clientHeight;
    const p = scrollable > 0 ? el.scrollTop / scrollable : 0;
    bar.style.transform = `scaleX(${Math.min(1, Math.max(0, p))})`;
  };
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update, { passive: true });
  update();
}

function initHeroSpotlight() {
  const spot = document.getElementById("hero-spotlight");
  const hero = document.querySelector(".hero");
  if (!spot || !hero) return;
  const mq = window.matchMedia("(max-width: 900px)");
  const coarse = window.matchMedia("(pointer: coarse)");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (mq.matches || coarse.matches || reduced.matches) return;

  hero.addEventListener(
    "mousemove",
    (e) => {
      const r = hero.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;
      spot.style.setProperty("--sx", `${x}%`);
      spot.style.setProperty("--sy", `${y}%`);
    },
    { passive: true }
  );
}

function observeStaggerGroup(group) {
  if (!group || group.dataset.staggerObserved) return;
  group.dataset.staggerObserved = "1";

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) {
    group.classList.add("is-visible");
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    },
    { root: null, rootMargin: "0px 0px -6% 0px", threshold: 0.06 }
  );
  io.observe(group);
}

function initStaggerGroups() {
  document.querySelectorAll(".stagger-group").forEach(observeStaggerGroup);
}

document.addEventListener("DOMContentLoaded", () => {
  const y = document.getElementById("year");
  if (y) y.textContent = String(new Date().getFullYear());

  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
  }
  setThemeIcons(document.body.classList.contains("dark-mode"));

  document.querySelectorAll(".theme-toggle").forEach((button) => {
    button.addEventListener("click", () => {
      document.body.classList.toggle("dark-mode");
      const currentTheme = document.body.classList.contains("dark-mode") ? "dark" : "light";
      localStorage.setItem("theme", currentTheme);
      setThemeIcons(document.body.classList.contains("dark-mode"));
    });
  });

  initScrollProgress();
  initHeroSpotlight();
  initReveal(document);
  initStaggerGroups();
  loadGithubRepos();
});

function toggleMenu() {
  const menu = document.querySelector(".menu-links");
  const icon = document.querySelector(".hamburger-icon");
  if (menu) menu.classList.toggle("open");
  if (icon) icon.classList.toggle("open");
}

function initReveal(root) {
  const scope = root && root.querySelectorAll ? root : document;
  const els = scope.querySelectorAll(".reveal:not([data-reveal-init])");
  if (!els.length) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) {
    els.forEach((el) => {
      el.classList.add("is-visible");
      el.dataset.revealInit = "1";
    });
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    },
    { root: null, rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
  );

  els.forEach((el) => {
    el.dataset.revealInit = "1";
    io.observe(el);
  });
}

function ogImageUrl(owner, repo) {
  return `https://opengraph.githubassets.com/1/${owner}/${repo}`;
}

function renderGithubSkeletons(grid, count) {
  grid.innerHTML = "";
  for (let i = 0; i < count; i += 1) {
    const card = document.createElement("article");
    card.className = "github-card github-card--skeleton";
    card.setAttribute("aria-hidden", "true");
    card.innerHTML = `
      <div class="github-card__img-wrap"></div>
      <div class="github-card__body">
        <div class="skeleton-line skeleton-line--short"></div>
        <div class="skeleton-line skeleton-line--med"></div>
        <div class="skeleton-line skeleton-line--tiny"></div>
      </div>
    `;
    grid.appendChild(card);
  }
}

async function loadGithubRepos() {
  const grid = document.getElementById("github-grid");
  const loading = document.getElementById("github-loading");
  const errEl = document.getElementById("github-error");
  if (!grid) return;

  grid.setAttribute("aria-busy", "true");
  renderGithubSkeletons(grid, 6);

  try {
    const res = await fetch(`https://api.github.com/users/${GITHUB_USER}/repos?sort=updated&per_page=40&type=owner`);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const repos = await res.json();
    const list = repos.filter((r) => !r.fork && !EXCLUDED_REPOS.has(r.name)).slice(0, 12);

    if (!list.length) {
      grid.innerHTML = "";
      grid.removeAttribute("aria-busy");
      if (errEl) {
        errEl.textContent = "Gösterilecek public repo bulunamadı.";
        errEl.classList.remove("hidden");
      }
      return;
    }

    grid.innerHTML = "";
    grid.classList.add("stagger-group");
    delete grid.dataset.staggerObserved;

    list.forEach((repo) => {
      const card = document.createElement("article");
      card.className = "github-card interactive-card reveal-item";

      const imgWrap = document.createElement("div");
      imgWrap.className = "github-card__img-wrap";

      const img = document.createElement("img");
      img.className = "github-card__img";
      img.alt = "";
      img.loading = "lazy";
      img.src = ogImageUrl(repo.owner.login, repo.name);
      img.addEventListener("error", () => {
        img.remove();
        const ph = document.createElement("div");
        ph.className = "github-card__img github-card__img--fallback mono";
        ph.textContent = repo.name.slice(0, 3).toUpperCase();
        ph.style.display = "flex";
        ph.style.alignItems = "center";
        ph.style.justifyContent = "center";
        ph.style.fontSize = "1.25rem";
        ph.style.color = "var(--muted)";
        imgWrap.appendChild(ph);
      });
      imgWrap.appendChild(img);

      const body = document.createElement("div");
      body.className = "github-card__body";

      const title = document.createElement("h3");
      title.className = "github-card__title";
      const link = document.createElement("a");
      link.href = repo.html_url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = repo.name;
      title.appendChild(link);

      const desc = document.createElement("p");
      desc.className = "github-card__desc";
      desc.textContent = repo.description || "Açıklama eklenmemiş.";

      const meta = document.createElement("div");
      meta.className = "github-card__meta";
      if (repo.language) {
        const lang = document.createElement("span");
        lang.className = "lang-pill";
        lang.textContent = repo.language;
        meta.appendChild(lang);
      }
      if (repo.stargazers_count > 0) {
        const stars = document.createElement("span");
        stars.className = "star-count";
        stars.textContent = `★ ${repo.stargazers_count}`;
        meta.appendChild(stars);
      }

      body.appendChild(title);
      body.appendChild(desc);
      if (meta.childElementCount) body.appendChild(meta);

      card.appendChild(imgWrap);
      card.appendChild(body);
      grid.appendChild(card);
    });

    observeStaggerGroup(grid);
    grid.removeAttribute("aria-busy");
  } catch (e) {
    grid.removeAttribute("aria-busy");
    if (loading) loading.classList.add("hidden");
    grid.innerHTML = "";
    if (errEl) {
      errEl.textContent =
        "GitHub repoları yüklenemedi (ağ veya API limiti). Sayfayı daha sonra yenileyebilirsiniz.";
      errEl.classList.remove("hidden");
    }
  }
}
