// lh3k.dev: the address bar types itself, the jobs open like browser tabs,
// and star counts come from GitHub on each visit.

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

// ---- where I've worked: one job showing at a time, like browser tabs ----
const jobs = document.getElementById('jobs');
if (jobs) {
  const tabs = [...jobs.querySelectorAll('[role="tab"]')];
  const open = (tab, focus) => {
    for (const each of tabs) {
      const on = each === tab;
      each.setAttribute('aria-selected', on);
      each.tabIndex = on ? 0 : -1;
      document.getElementById(each.getAttribute('aria-controls')).hidden = !on;
    }
    if (focus) tab.focus();
    tab.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  };
  jobs.classList.add('tabbed');
  for (const each of tabs) each.addEventListener('click', () => open(each));
  jobs.querySelector('[role="tablist"]').addEventListener('keydown', (e) => {
    const at = tabs.indexOf(document.activeElement);
    const to = { ArrowRight: at + 1, ArrowLeft: at - 1, Home: 0, End: tabs.length - 1 }[e.key];
    if (at < 0 || to === undefined) return;
    e.preventDefault();
    open(tabs[(to + tabs.length) % tabs.length], true);
  });
  for (const each of tabs.slice(1)) document.getElementById(each.getAttribute('aria-controls')).hidden = true;
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
