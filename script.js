/* ============ FindIt Campus — behaviour ============ */

const STORAGE_KEY = "findit-campus-posts-v1";

/* ---------- seed data ---------- */
const SEED_ITEMS = [
  {
    id: "seed-1",
    title: "Black backpack with a yellow label",
    type: "found",
    category: "Bags",
    location: "Riverside Library — 2nd floor",
    date: "2026-11-18",
    desc: "Plain black backpack with a small yellow tag on the front pocket. Inside: a maths notebook, a charger and a folded hoodie. Handed to the library front desk.",
    poster: "Aisha K. · 2nd year",
    contact: "aisha.k@campus.edu",
    img: "images/backpack.jpg",
    alt: "Black backpack standing against a white wall"
  },
  {
    id: "seed-2",
    title: "Matte green water bottle, 750 ml",
    type: "found",
    category: "Drinkware",
    location: "Engineering Block — Room 204",
    date: "2026-11-17",
    desc: "Insulated green bottle with a screw lid, no stickers. Left on the desk after the 3pm lecture — I've kept it in my locker.",
    poster: "Daniel O. · 3rd year",
    contact: "daniel.o@campus.edu",
    img: "images/bottle.jpg",
    alt: "Green insulated water bottle on a white surface"
  },
  {
    id: "seed-3",
    title: "Black over-ear headphones",
    type: "found",
    category: "Tech",
    location: "Sports Centre — weights area",
    date: "2026-11-16",
    desc: "Wireless over-ear headphones, small scuff on the left ear cup. Still had charge when I found them. Ask me at the gym or message here.",
    poster: "Priya S. · 1st year",
    contact: "priya.s@campus.edu",
    img: "images/headphones.jpg",
    alt: "Black over-ear headphones on a bright yellow background"
  },
  {
    id: "seed-4",
    title: "Keys with a red fabric charm",
    type: "found",
    category: "Keys",
    location: "Quad — by the north bike racks",
    date: "2026-11-15",
    desc: "Keyring with two silver keys and a small red fabric charm. Found on the path near the bike racks after the rain. Held at the Student Union desk.",
    poster: "Marcus T. · 4th year",
    contact: "marcus.t@campus.edu",
    img: "images/keys.jpg",
    alt: "Keys on a ring with a red charm lying on paving stones"
  },
  {
    id: "seed-5",
    title: "Scientific calculator — please help!",
    type: "lost",
    category: "Study",
    location: "Lecture Hall B",
    date: "2026-11-14",
    desc: "Black Casio scientific calculator with my initials written in marker on the back cover. I need it for Friday's stats exam, so any lead helps.",
    poster: "Noor H. · 2nd year",
    contact: "noor.h@campus.edu",
    img: "images/calculator.jpg",
    alt: "Scientific calculator and pencil on a wooden desk"
  },
  {
    id: "seed-6",
    title: "Round gold-frame sunglasses",
    type: "lost",
    category: "Other",
    location: "24-hour study room",
    date: "2026-11-13",
    desc: "Round gold frames with dark green lenses, probably still in a soft blue case. I think I left them on a table near the power sockets in the study room.",
    poster: "Elena V. · 1st year",
    contact: "elena.v@campus.edu",
    img: "images/glasses.jpg",
    alt: "Round gold-frame sunglasses resting on a white marble surface"
  },
  {
    id: "seed-7",
    title: "Plain grey pullover hoodie",
    type: "lost",
    category: "Clothing",
    location: "Sports Centre — changing room",
    date: "2026-11-12",
    desc: "Grey pullover hoodie, size M, completely plain — no print, no crest. I'm almost sure I left it on a bench in the changing room on Wednesday. Here's a photo of me wearing it so you know which one.",
    poster: "Tom B. · 3rd year",
    contact: "tom.b@campus.edu",
    img: "images/hoodie.jpg",
    alt: "Person seen from behind wearing a plain grey pullover hoodie"
  }
];

const CATEGORY_ICONS = {
  Bags: "🎒",
  Tech: "🎧",
  Keys: "🔑",
  Drinkware: "🧴",
  Study: "📚",
  Clothing: "🧥",
  Other: "📦"
};

/* ---------- state ---------- */
const state = { type: "all", category: "all", sort: "newest", query: "" };
let userItems = loadUserItems();
let activeModalId = null;
let pendingPhoto = "";

/* ---------- elements ---------- */
const $ = (sel) => document.querySelector(sel);
const grid = $("#itemGrid");
const emptyState = $("#emptyState");
const resultCount = $("#resultCount");
const boardQuery = $("#boardQuery");
const catFilter = $("#catFilter");
const sortBy = $("#sortBy");
const form = $("#reportForm");
const toast = $("#toast");
const modal = $("#itemModal");

/* ---------- storage ---------- */
function loadUserItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn("Could not read saved posts", err);
    return [];
  }
}

function saveUserItems(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    return true;
  } catch (err) {
    // Most likely the browser storage limit — retry without embedded photos.
    try {
      const slim = items.map((i) => (i.img && i.img.startsWith("data:") ? { ...i, img: "" } : i));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(slim));
      userItems = slim;
      showToast("Saved without photos — browser storage is full.");
      return true;
    } catch (err2) {
      console.warn("Could not save posts", err2);
      showToast("Could not save to this browser — the item is still shown.");
      return false;
    }
  }
}

/* ---------- helpers ---------- */
function allItems() {
  return [...userItems, ...SEED_ITEMS];
}

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(iso) {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function initials(name = "") {
  return name.replace(/·.*/, "").trim().charAt(0).toUpperCase() || "?";
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("is-visible"), 3600);
}

function isNew(iso) {
  const posted = new Date(`${iso}T12:00:00`);
  const diff = (Date.now() - posted.getTime()) / 86400000;
  return diff <= 2;
}

/* ---------- rendering ---------- */
function visibleItems() {
  const q = state.query.trim().toLowerCase();

  let items = allItems().filter((item) => {
    if (state.type !== "all" && item.type !== state.type) return false;
    if (state.category !== "all" && item.category !== state.category) return false;
    if (!q) return true;
    return [item.title, item.desc, item.location, item.category, item.poster]
      .join(" ")
      .toLowerCase()
      .includes(q);
  });

  items.sort((a, b) => {
    if (state.sort === "az") return a.title.localeCompare(b.title);
    if (state.sort === "oldest") return a.date.localeCompare(b.date);
    return b.date.localeCompare(a.date);
  });

  return items;
}

function cardMarkup(item) {
  const media = item.img
    ? `<img src="${escapeHtml(item.img)}" alt="${escapeHtml(item.alt || item.title)}" loading="lazy" />`
    : `<div class="card__placeholder" aria-hidden="true">${CATEGORY_ICONS[item.category] || "📦"}</div>`;

  return `
    <article class="card" data-open="${escapeHtml(item.id)}">
      <div class="card__media">
        ${media}
        <span class="badge badge--${item.type}">${item.type}</span>
        ${isNew(item.date) ? '<span class="badge badge--new">New</span>' : ""}
      </div>
      <div class="card__body">
        <p class="card__cat">${escapeHtml(item.category)}</p>
        <h3 class="card__title">${escapeHtml(item.title)}</h3>
        <p class="card__desc">${escapeHtml(item.desc)}</p>
        <ul class="card__meta">
          <li>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11Z" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="10" r="2.4" stroke="currentColor" stroke-width="1.8"/></svg>
            ${escapeHtml(item.location)}
          </li>
          <li>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15.5" rx="2.5" stroke="currentColor" stroke-width="1.8"/><path d="M8 3v4M16 3v4M3.5 10h17" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
            ${escapeHtml(formatDate(item.date))}
          </li>
        </ul>
        <button class="card__btn" type="button" data-open="${escapeHtml(item.id)}">View details</button>
      </div>
    </article>`;
}

function render() {
  const items = visibleItems();
  grid.innerHTML = items.map(cardMarkup).join("");
  emptyState.hidden = items.length > 0;
  resultCount.textContent = `${items.length} item${items.length === 1 ? "" : "s"} on the board`;

  const live = allItems().length;
  const statEl = $("#statLive");
  if (statEl) statEl.textContent = live;
}

/* ---------- modal ---------- */
function openItem(id) {
  const item = allItems().find((i) => i.id === id);
  if (!item) return;
  activeModalId = id;

  const img = $("#modalImg");
  if (item.img) {
    img.src = item.img;
    img.alt = item.alt || item.title;
    img.hidden = false;
    img.parentElement.style.display = "";
  } else {
    img.removeAttribute("src");
    img.alt = "";
    img.hidden = true;
  }

  const badge = $("#modalBadge");
  badge.textContent = item.type;
  badge.className = `badge badge--${item.type}`;

  $("#modalCategory").textContent = item.category;
  $("#modalTitle").textContent = item.title;
  $("#modalLocation").textContent = item.location;
  $("#modalDate").textContent = formatDate(item.date);
  $("#modalPoster").textContent = item.poster;
  $("#modalDesc").textContent = item.desc;

  const email = $("#modalEmail");
  email.hidden = true;
  email.textContent = "";
  const claimBtn = $("#claimBtn");
  claimBtn.textContent = item.type === "found" ? "This is mine — reveal contact" : "I found this — reveal contact";
  claimBtn.disabled = false;

  modal.showModal();
}

function closeModal() {
  if (modal.open) modal.close();
  activeModalId = null;
}

/* ---------- search + filters ---------- */
function setQuery(value) {
  state.query = value;
  boardQuery.value = value;
  render();
}

function scrollToBoard() {
  $("#browse").scrollIntoView({ behavior: "smooth", block: "start" });
}

$("#heroSearch").addEventListener("submit", (e) => {
  e.preventDefault();
  setQuery($("#heroQuery").value);
  scrollToBoard();
});

document.querySelectorAll("[data-quick]").forEach((btn) => {
  btn.addEventListener("click", () => {
    setQuery(btn.dataset.quick);
    scrollToBoard();
  });
});

boardQuery.addEventListener("input", (e) => {
  state.query = e.target.value;
  render();
});

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => {
      t.classList.remove("is-active");
      t.setAttribute("aria-selected", "false");
    });
    tab.classList.add("is-active");
    tab.setAttribute("aria-selected", "true");
    state.type = tab.dataset.type;
    render();
  });
});

catFilter.addEventListener("change", (e) => {
  state.category = e.target.value;
  render();
});

sortBy.addEventListener("change", (e) => {
  state.sort = e.target.value;
  render();
});

$("#clearFilters").addEventListener("click", () => {
  state.type = "all";
  state.category = "all";
  state.sort = "newest";
  state.query = "";
  catFilter.value = "all";
  sortBy.value = "newest";
  boardQuery.value = "";
  $("#heroQuery").value = "";
  document.querySelectorAll(".tab").forEach((t) => {
    const isAll = t.dataset.type === "all";
    t.classList.toggle("is-active", isAll);
    t.setAttribute("aria-selected", String(isAll));
  });
  render();
  showToast("Filters reset.");
});

/* ---------- grid + modal events ---------- */
grid.addEventListener("click", (e) => {
  const trigger = e.target.closest("[data-open]");
  if (!trigger) return;
  openItem(trigger.dataset.open);
});

$("#modalClose").addEventListener("click", closeModal);

modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});

$("#claimBtn").addEventListener("click", () => {
  const item = allItems().find((i) => i.id === activeModalId);
  if (!item) return;
  const email = $("#modalEmail");
  email.innerHTML = "";
  const link = document.createElement("a");
  link.href = `mailto:${item.contact}?subject=${encodeURIComponent(`Lost & found: ${item.title}`)}`;
  link.textContent = item.contact;
  link.style.color = "inherit";
  email.appendChild(link);
  email.hidden = false;
  $("#claimBtn").disabled = true;
  $("#claimBtn").textContent = "Contact revealed";
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal.open) closeModal();
});

/* ---------- report form ---------- */
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function setError(fieldId, message) {
  const input = $(`#${fieldId}`);
  const errorEl = document.querySelector(`[data-error-for="${fieldId}"]`);
  const wrapper = input.closest(".field");
  if (message) {
    wrapper.classList.add("has-error");
    input.setAttribute("aria-invalid", "true");
    if (errorEl) errorEl.textContent = message;
  } else {
    wrapper.classList.remove("has-error");
    input.removeAttribute("aria-invalid");
    if (errorEl) errorEl.textContent = "";
  }
}

function validateForm() {
  const checks = [
    ["itemTitle", "Give the item a short name (3+ characters).", (v) => v.trim().length >= 3],
    ["itemLocation", "Where was it lost or found?", (v) => v.trim().length >= 3],
    ["itemDate", "Pick the date you lost or found it.", (v) => !!v],
    ["itemDesc", "Add a few details — at least 10 characters.", (v) => v.trim().length >= 10],
    ["itemContact", "Enter a valid campus email.", (v) => emailPattern.test(v.trim())]
  ];

  let valid = true;
  checks.forEach(([id, message, test]) => {
    const value = $(`#${id}`).value;
    const ok = test(value);
    setError(id, ok ? "" : message);
    if (!ok) valid = false;
    return ok;
  });

  return valid;
}

["itemTitle", "itemLocation", "itemDate", "itemDesc", "itemContact"].forEach((id) => {
  $(`#${id}`).addEventListener("input", () => {
    if ($(`#${id}`).closest(".field").classList.contains("has-error")) setError(id, "");
  });
});

$("#itemPhoto").addEventListener("change", (e) => {
  const file = e.target.files && e.target.files[0];
  const preview = $("#photoPreview");
  pendingPhoto = "";

  if (!file) {
    preview.hidden = true;
    preview.removeAttribute("src");
    return;
  }

  if (!file.type.startsWith("image/")) {
    showToast("That file isn't an image.");
    e.target.value = "";
    preview.hidden = true;
    return;
  }

  if (file.size > 1.5 * 1024 * 1024) {
    showToast("Please pick a photo under 1.5 MB.");
    e.target.value = "";
    preview.hidden = true;
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    pendingPhoto = reader.result;
    preview.src = pendingPhoto;
    preview.hidden = false;
  };
  reader.readAsDataURL(file);
});

form.addEventListener("submit", (e) => {
  e.preventDefault();

  if (!validateForm()) {
    showToast("Almost there — check the highlighted fields.");
    const firstError = form.querySelector(".has-error input, .has-error select, .has-error textarea");
    if (firstError) firstError.focus();
    return;
  }

  const type = form.querySelector('input[name="type"]:checked').value;
  const title = $("#itemTitle").value.trim();
  const contact = $("#itemContact").value.trim();
  const name = contact.split("@")[0].replace(/[._-]+/g, " ");

  const item = {
    id: `post-${Date.now()}`,
    title,
    type,
    category: $("#itemCategory").value,
    location: $("#itemLocation").value.trim(),
    date: $("#itemDate").value,
    desc: $("#itemDesc").value.trim(),
    poster: `${name.charAt(0).toUpperCase()}${name.slice(1)} · you`,
    contact,
    img: pendingPhoto,
    alt: pendingPhoto ? title : ""
  };

  userItems = [item, ...userItems];
  saveUserItems(userItems);

  form.reset();
  pendingPhoto = "";
  const preview = $("#photoPreview");
  preview.hidden = true;
  preview.removeAttribute("src");
  form.querySelectorAll(".has-error").forEach((el) => el.classList.remove("has-error"));
  setDefaultDate();

  // Show the new post without stale filters hiding it.
  state.type = "all";
  state.category = "all";
  state.sort = "newest";
  state.query = "";
  boardQuery.value = "";
  catFilter.value = "all";
  sortBy.value = "newest";
  document.querySelectorAll(".tab").forEach((t) => {
    const isAll = t.dataset.type === "all";
    t.classList.toggle("is-active", isAll);
    t.setAttribute("aria-selected", String(isAll));
  });

  render();
  showToast("Posted! Your item is at the top of the board.");
  scrollToBoard();
});

/* ---------- init ---------- */
function setDefaultDate() {
  const input = $("#itemDate");
  if (!input.value) {
    const today = new Date();
    const iso = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 10);
    input.value = iso;
    input.max = iso;
  }
}

$("#year").textContent = new Date().getFullYear();
setDefaultDate();
render();
