// lh3k.dev: the address bar types itself, and star counts come from GitHub
// on each visit.

const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---- the address bar types "localhost:3000" once ----
const addr = document.getElementById('addr');
if (addr && !calm) {
  const text = addr.textContent;
  addr.textContent = '';
  let i = 0;
  const type = () => {
    addr.textContent = text.slice(0, ++i);
    if (i < text.length) setTimeout(type, 55 + Math.random() * 70);
  };
  setTimeout(type, 500);
}

// ---- live star counts ----
const KEY = 'lh3k-stars';
const TEN_MINUTES = 10 * 60 * 1000;

function showStars(stars) {
  for (const el of document.querySelectorAll('[data-stars]')) {
    const count = stars[el.dataset.stars];
    if (!count) continue;
    el.textContent = `★ ${count}`;
    el.setAttribute('aria-label', `${count} stars on GitHub`);
    el.hidden = false;
  }
}

async function loadStars() {
  try {
    const kept = JSON.parse(sessionStorage.getItem(KEY) ?? 'null');
    if (kept && Date.now() - kept.at < TEN_MINUTES) return showStars(kept.stars);
  } catch { /* no storage: just ask GitHub */ }
  try {
    const reply = await fetch('https://api.github.com/users/Nyaughh/repos?per_page=100&type=owner');
    if (!reply.ok) return;
    const stars = {};
    for (const repo of await reply.json()) stars[repo.name] = repo.stargazers_count;
    showStars(stars);
    try { sessionStorage.setItem(KEY, JSON.stringify({ at: Date.now(), stars })); } catch { /* fine */ }
  } catch { /* offline or rate limited: the cards read fine without stars */ }
}
loadStars();
