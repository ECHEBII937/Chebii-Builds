/* Renders the shop from data/site.json. You normally never edit this file. */
const $ = (id) => document.getElementById(id);
let DATA, active = "all";

fetch("data/site.json")
  .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
  .then((d) => { DATA = d; init(); })
  .catch(() => {
    $("grid").innerHTML = '<div class="empty">Could not load data/site.json. If you opened index.html by double-clicking, run a local server instead (see README).</div>';
  });

function init() {
  const s = DATA.site;
  document.title = s.name + " — " + s.tagline;
  $("brand").textContent = s.name;
  $("tagline").textContent = s.tagline;
  $("about-text").textContent = s.about;
  $("year").textContent = new Date().getFullYear();

  const wa = "https://wa.me/" + s.whatsapp;
  $("links").innerHTML =
    `<a class="btn" href="${wa}" target="_blank" rel="noopener">WhatsApp</a>` +
    `<a class="btn alt" href="mailto:${s.email}">Email</a>` +
    (s.github ? `<a class="btn alt" href="${s.github}" target="_blank" rel="noopener">GitHub</a>` : "");

  const cats = [{ id: "all", name: "All" }, ...DATA.categories];
  $("chips").innerHTML = cats.map((c) =>
    `<button class="chip" data-id="${c.id}" aria-pressed="${c.id === "all"}">${c.name}</button>`).join("");
  $("chips").addEventListener("click", (e) => {
    const b = e.target.closest(".chip"); if (!b) return;
    active = b.dataset.id;
    document.querySelectorAll(".chip").forEach((x) => x.setAttribute("aria-pressed", x === b));
    render();
  });
  $("search").addEventListener("input", render);
  render();
}

const esc = (t = "") => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function action(p) {
  const s = DATA.site;
  if (p.price === 0) return p.file ? `<a class="btn" href="${esc(p.file)}" download>Download</a>` : "";
  if (p.buyLink) return `<a class="btn" href="${esc(p.buyLink)}" target="_blank" rel="noopener">Buy now</a>`;
  const msg = encodeURIComponent(`Hi Chebii Builds, I want to order: ${p.title} (${s.currency} ${p.price}).`);
  return `<a class="btn" href="https://wa.me/${s.whatsapp}?text=${msg}" target="_blank" rel="noopener">Order</a>`;
}

function render() {
  const q = $("search").value.trim().toLowerCase();
  const catName = Object.fromEntries(DATA.categories.map((c) => [c.id, c.name]));
  const list = DATA.products.filter((p) => p.published !== false)
    .filter((p) => active === "all" || p.category === active)
    .filter((p) => !q || [p.title, p.description, (p.tags || []).join(" ")].join(" ").toLowerCase().includes(q))
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  $("grid").innerHTML = list.length ? list.map((p) => `
    <article class="card">
      <div class="thumb">${p.image ? `<img src="${esc(p.image)}" alt="${esc(p.title)}" loading="lazy">` : `<span>${esc(catName[p.category] || "")}</span>`}</div>
      <div class="info">
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.description)}</p>
        <div class="tags">${(p.tags || []).map(esc).join(", ")}</div>
        <div class="meta">
          <span class="price ${p.price === 0 ? "free" : ""}">${p.price === 0 ? "Free" : DATA.site.currency + " " + p.price.toLocaleString()}</span>
          ${action(p)}
        </div>
      </div>
    </article>`).join("")
    : '<div class="empty">Nothing here yet. Try another category or clear the search.</div>';
}
