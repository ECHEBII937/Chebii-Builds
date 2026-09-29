/* Renders the shop from data/site.json. You normally never edit this file. */
const $ = (id) => document.getElementById(id);
const store = {
  get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
};
const esc = (t = "") => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const slug = (p) => p.id || p.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
let DATA, active = "all", saved = new Set(store.get("saved", [])), stop3d = null;

fetch("data/site.json")
  .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
  .then((d) => { DATA = d; init(); })
  .catch(() => { $("grid").innerHTML = '<div class="empty">Could not load data/site.json. If you opened index.html by double-clicking, run a local server instead (see README).</div>'; });

function init() {
  const s = DATA.site;
  document.title = s.name + " — " + s.tagline;
  $("brand").textContent = s.name;
  $("tagline").textContent = s.tagline;
  $("about-text").textContent = s.about;
  $("year").textContent = new Date().getFullYear();
  $("links").innerHTML =
    `<a class="btn" href="https://wa.me/${s.whatsapp}" target="_blank" rel="noopener">WhatsApp</a>` +
    `<a class="btn alt" href="mailto:${s.email}">Email</a>` +
    (s.github ? `<a class="btn alt" href="${s.github}" target="_blank" rel="noopener">GitHub</a>` : "");

  const live = DATA.products.filter((p) => p.published !== false);
  $("tiles").innerHTML = DATA.categories.map((c) =>
    `<button class="tile" data-id="${c.id}"><b>${esc(c.name)}</b><span>${live.filter((p) => p.category === c.id).length} items</span></button>`).join("");
  $("tiles").addEventListener("click", (e) => {
    const t = e.target.closest(".tile"); if (!t) return;
    setActive(t.dataset.id); $("shop").scrollIntoView({ behavior: "smooth" });
  });

  drawChips();
  $("chips").addEventListener("click", (e) => { const b = e.target.closest(".chip"); if (b) setActive(b.dataset.id); });
  $("search").addEventListener("input", render);
  $("sort").addEventListener("change", render);
  $("grid").addEventListener("click", onGrid);

  $("f-type").innerHTML = DATA.categories.map((c) => `<option>${esc(c.name)}</option>`).join("") + "<option>Something else</option>";
  $("f-send").addEventListener("click", sendRequest);

  const saveTheme = store.get("theme", null);
  if (saveTheme) document.documentElement.dataset.theme = saveTheme;
  $("theme").addEventListener("click", () => {
    const dark = getComputedStyle(document.documentElement).getPropertyValue("--plate").trim().toLowerCase() === "#0b1c22";
    const next = dark ? "light" : "dark";
    document.documentElement.dataset.theme = next; store.set("theme", next);
  });

  $("modal").addEventListener("click", (e) => { if (e.target === $("modal")) $("modal").close(); });
  $("modal").addEventListener("close", () => { if (stop3d) stop3d(); stop3d = null; history.replaceState(null, "", location.pathname); });
  render();
  const h = location.hash.replace("#", "");
  const hit = DATA.products.find((p) => slug(p) === h);
  if (hit) openModal(hit);
}

function drawChips() {
  const cats = [{ id: "all", name: "All" }, ...DATA.categories, { id: "saved", name: `Saved (${saved.size})` }];
  $("chips").innerHTML = cats.map((c) =>
    `<button class="chip" data-id="${c.id}" aria-pressed="${c.id === active}">${esc(c.name)}</button>`).join("");
}
function setActive(id) { active = id; drawChips(); render(); }
function toast(t) {
  const el = document.createElement("div"); el.className = "toast"; el.textContent = t;
  document.body.appendChild(el); setTimeout(() => el.remove(), 1800);
}

function action(p) {
  const s = DATA.site;
  if (p.price === 0) return p.file ? `<a class="btn" href="${esc(p.file)}" download>Download</a>` : "";
  if (p.buyLink) return `<a class="btn" href="${esc(p.buyLink)}" target="_blank" rel="noopener">Buy now</a>`;
  const msg = encodeURIComponent(`Hi Chebii Builds, I want to order: ${p.title} (${s.currency} ${p.price}).`);
  return `<a class="btn" href="https://wa.me/${s.whatsapp}?text=${msg}" target="_blank" rel="noopener">Order</a>`;
}
const isNew = (p) => p.date && (Date.now() - new Date(p.date)) / 864e5 <= 30;
const priceText = (p) => p.price === 0 ? "Free" : DATA.site.currency + " " + p.price.toLocaleString();

function render() {
  const q = $("search").value.trim().toLowerCase();
  const sort = $("sort").value;
  const catName = Object.fromEntries(DATA.categories.map((c) => [c.id, c.name]));
  const list = DATA.products.filter((p) => p.published !== false)
    .filter((p) => active === "all" || (active === "saved" ? saved.has(slug(p)) : p.category === active))
    .filter((p) => !q || [p.title, p.description, (p.tags || []).join(" ")].join(" ").toLowerCase().includes(q))
    .sort((a, b) => sort === "low" ? a.price - b.price : sort === "high" ? b.price - a.price
      : sort === "free" ? (a.price === 0 ? 0 : 1) - (b.price === 0 ? 0 : 1) || (b.date || "").localeCompare(a.date || "")
      : (b.date || "").localeCompare(a.date || ""));

  $("grid").innerHTML = list.length ? list.map((p) => {
    const id = slug(p), img = p.image || (p.images || [])[0];
    return `<article class="card ${p.featured ? "feature" : ""}">
      <button class="thumb" data-open="${id}" aria-label="Open ${esc(p.title)}">
        ${img ? `<img src="${esc(img)}" alt="" loading="lazy">` : `<span>${esc(catName[p.category] || "")}</span>`}
        <div class="badges">${isNew(p) ? '<i class="badge">New</i>' : ""}${p.model ? '<i class="badge b3d">3D view</i>' : ""}</div>
      </button>
      <button class="heart" data-heart="${id}" aria-pressed="${saved.has(id)}" aria-label="Save ${esc(p.title)}">${saved.has(id) ? "♥" : "♡"}</button>
      <div class="info">
        <button class="title-btn" data-open="${id}">${esc(p.title)}</button>
        <p>${esc(p.description)}</p>
        <div class="tags">${(p.tags || []).map(esc).join(", ")}</div>
        <div class="meta"><span class="price ${p.price === 0 ? "free" : ""}">${priceText(p)}</span>${action(p)}</div>
      </div></article>`;
  }).join("") : `<div class="empty">${active === "saved" ? "Nothing saved yet. Tap the heart on anything you like." : "Nothing here yet. Try another category or clear the search."}</div>`;
}

function onGrid(e) {
  const o = e.target.closest("[data-open]"), h = e.target.closest("[data-heart]");
  if (h) { toggleSave(h.dataset.heart); return; }
  if (o) openModal(DATA.products.find((p) => slug(p) === o.dataset.open));
}
function toggleSave(id) {
  saved.has(id) ? saved.delete(id) : saved.add(id);
  store.set("saved", [...saved]); drawChips(); render();
}

const load = (src) => new Promise((res, rej) => {
  if (document.querySelector(`script[src="${src}"]`)) return res();
  const s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s);
});

function openModal(p) {
  if (!p) return;
  const id = slug(p), imgs = p.images || (p.image ? [p.image] : []);
  const views = [...imgs.map((u, i) => ({ t: imgs.length > 1 ? "Photo " + (i + 1) : "Photo", u })), ...(p.model ? [{ t: "3D view", m: p.model }] : [])];
  const specs = Object.entries(p.specs || {}).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("");
  $("modal-body").innerHTML = `<button class="icon close" id="x" aria-label="Close">✕</button>
    <div class="m"><div class="m-media"><div class="stage" id="stage"></div>
      ${views.length > 1 ? `<div class="thumbs" id="thumbs">${views.map((v, i) => `<button data-v="${i}" aria-pressed="${i === 0}">${esc(v.t)}</button>`).join("")}</div>` : ""}</div>
    <div class="m-info"><h2>${esc(p.title)}</h2><div class="price ${p.price === 0 ? "free" : ""}">${priceText(p)}</div>
      <p>${esc(p.details || p.description)}</p>${specs ? `<dl class="specs">${specs}</dl>` : ""}
      <div class="tags">${(p.tags || []).map(esc).join(", ")}</div>
      <div class="m-actions">${action(p)}<button class="btn alt" id="sv">${saved.has(id) ? "Saved ♥" : "Save ♡"}</button><button class="btn alt" id="sh">Share</button></div></div></div>`;
  $("x").onclick = () => $("modal").close();
  $("sv").onclick = () => { toggleSave(id); $("sv").textContent = saved.has(id) ? "Saved ♥" : "Save ♡"; };
  $("sh").onclick = async () => {
    const url = location.origin + location.pathname + "#" + id;
    if (navigator.share) { try { await navigator.share({ title: p.title, url }); return; } catch {} }
    try { await navigator.clipboard.writeText(url); toast("Link copied"); } catch { toast(url); }
  };
  const show = (i) => {
    if (stop3d) stop3d(); stop3d = null;
    const st = $("stage"), v = views[i];
    st.className = "stage" + (v && v.m ? " v3d" : ""); st.innerHTML = "";
    if (!v) st.innerHTML = '<div class="msg"><b>Preview coming soon</b></div>';
    else if (v.u) st.innerHTML = `<img src="${esc(v.u)}" alt="${esc(p.title)}">`;
    else view3d(st, v.m);
    document.querySelectorAll("#thumbs button").forEach((b) => b.setAttribute("aria-pressed", +b.dataset.v === i));
  };
  $("thumbs")?.addEventListener("click", (e) => { const b = e.target.closest("[data-v]"); if (b) show(+b.dataset.v); });
  history.replaceState(null, "", "#" + id);
  $("modal").showModal(); show(0);
}

async function view3d(el, url) {
  el.innerHTML = '<div class="msg">Loading 3D model…</div>';
  const cdn = "https://cdn.jsdelivr.net/npm/three@0.128.0/";
  try {
    await load(cdn + "build/three.min.js");
    await Promise.all([load(cdn + "examples/js/controls/OrbitControls.js"), load(cdn + "examples/js/loaders/STLLoader.js")]);
  } catch { el.innerHTML = '<div class="msg">3D viewer could not load. Check your connection.</div>'; return; }
  let raf, dead = false;
  const w = el.clientWidth, h = el.clientHeight;
  const r = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  r.setSize(w, h); r.setPixelRatio(Math.min(devicePixelRatio, 2));
  const sc = new THREE.Scene(), cam = new THREE.PerspectiveCamera(45, w / h, 0.1, 5000);
  sc.add(new THREE.HemisphereLight(0xffffff, 0x445566, 1));
  const dl = new THREE.DirectionalLight(0xffffff, 0.8); dl.position.set(1, 2, 3); sc.add(dl);
  const ctl = new THREE.OrbitControls(cam, r.domElement); ctl.autoRotate = true; ctl.autoRotateSpeed = 2;
  new THREE.STLLoader().load(url, (g) => {
    if (dead) return;
    el.innerHTML = ""; el.appendChild(r.domElement);
    g.center(); g.computeBoundingSphere();
    const rad = g.boundingSphere.radius;
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0xFFC629, roughness: 0.5, metalness: 0.1 }));
    m.rotation.x = -Math.PI / 2; sc.add(m);
    cam.position.set(rad * 1.6, rad * 1.2, rad * 2.4); ctl.update();
    (function loop() { raf = requestAnimationFrame(loop); ctl.update(); r.render(sc, cam); })();
  }, undefined, () => { el.innerHTML = '<div class="msg">Model file not found. Check the path in site.json.</div>'; });
  stop3d = () => { dead = true; cancelAnimationFrame(raf); r.dispose(); };
}

function sendRequest() {
  const s = DATA.site, n = $("f-name").value.trim(), m = $("f-msg").value.trim();
  if (!m) { toast("Add a short description first"); return; }
  const b = $("f-budget").value.trim();
  const text = `Hi Chebii Builds, ${n ? "I'm " + n + ". " : ""}I need: ${$("f-type").value}.\n${m}${b ? "\nBudget: " + b : ""}`;
  window.open(`https://wa.me/${s.whatsapp}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
}
