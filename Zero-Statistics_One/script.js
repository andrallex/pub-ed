/* =========================================================
   Statistics for beginners — front-end
   ========================================================= */

const state = {
    data: null,
    filter: "all",
    lastFocus: null,
};

const views = {
    home: null,
    topic: null,
};

const els = {};

document.addEventListener("DOMContentLoaded", init);

async function init() {
    views.home = document.getElementById("view-home");
    views.topic = document.getElementById("view-topic");
    els.heroStats = document.getElementById("heroStats");
    els.contentsCard = document.getElementById("contentsCard");
    els.filters = document.getElementById("filters");
    els.topicGrid = document.getElementById("topicGrid");
    els.topicsHint = document.getElementById("topicsHint");
    els.emptyFilter = document.getElementById("emptyFilter");
    els.topicView = views.topic;
    els.menuBtn = document.getElementById("menuBtn");
    els.nav = document.getElementById("mainNav");

    bindChrome();

    try {
        const res = await fetch("/api/content", { cache: "no-store" });
        if (!res.ok) throw new Error("HTTP " + res.status);
        state.data = await res.json();
    } catch (err) {
        els.topicGrid.innerHTML =
            '<div class="empty-filter">Не удалось загрузить материалы. Обновите страницу.</div>';
        return;
    }

    renderHeroStats();
    renderContents();
    renderFilters();
    renderTopics();
    route();
}

/* ---------------- helpers ---------------- */

function esc(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function plural(n, forms) {
    const abs = Math.abs(n) % 100;
    const last = abs % 10;
    if (abs > 10 && abs < 20) return forms[2];
    if (last > 1 && last < 5) return forms[1];
    if (last === 1) return forms[0];
    return forms[2];
}

function countLabel(n, forms) {
    return `${n} ${plural(n, forms)}`;
}

function mediaUrl(name) {
    return "/media/" + encodeURIComponent(name);
}

function downloadUrl(name) {
    return "/download/" + encodeURIComponent(name);
}

function lectureCode(lecture) {
    return lecture.code ? lecture.code : String(lecture.number).padStart(2, "0");
}

/* ---------------- home ---------------- */

function renderHeroStats() {
    const t = state.data.totals;
    const items = [
        ["Тем", t.topics],
        ["Лекций", t.lectures],
        ["Видео", t.videos],
        ["Презентаций", t.slides],
    ];
    els.heroStats.innerHTML = items
        .map(([label, value]) => `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`)
        .join("");
}

function renderContents() {
    const topics = state.data.topics;
    const rows = topics
        .map((topic) => {
            const c = topic.counts;
            return `
            <a class="contents-row" href="#/topic/${encodeURIComponent(topic.id)}">
                <span class="contents-num">${String(topic.number).padStart(2, "0")}</span>
                <span class="contents-text">
                    <strong>${esc(topic.name)}</strong>
                    <span>${countLabel(c.lectures, ["лекция", "лекции", "лекций"])} · ${
                        c.slides
                    } ${plural(c.slides, ["презентация", "презентации", "презентаций"])}</span>
                </span>
                <span class="contents-arrow">→</span>
            </a>`;
        })
        .join("");

    els.contentsCard.innerHTML = `
        <div class="contents-head">
            <h3>Все темы курса</h3>
            <span class="hint">${topics.length} ${plural(topics.length, [
                "тема",
                "темы",
                "тем",
            ])} · выберите карточку темы</span>
        </div>
        <div class="contents-list">${rows}</div>`;
}

function renderFilters() {
    const topics = state.data.topics;
    const chips = [
        `<button class="chip is-active" type="button" data-filter="all" aria-pressed="true">Все темы</button>`,
        ...topics.map(
            (topic) =>
                `<button class="chip" type="button" data-filter="${esc(topic.id)}" aria-pressed="false">${esc(
                    topic.name
                )}</button>`
        ),
    ];
    els.filters.innerHTML = chips.join("");

    els.filters.addEventListener("click", (event) => {
        const btn = event.target.closest(".chip");
        if (!btn) return;
        state.filter = btn.dataset.filter;
        [...els.filters.querySelectorAll(".chip")].forEach((chip) => {
            const active = chip === btn;
            chip.classList.toggle("is-active", active);
            chip.setAttribute("aria-pressed", String(active));
        });
        renderTopics();
    });
}

function renderTopics() {
    const topics = state.data.topics;
    const visible =
        state.filter === "all" ? topics : topics.filter((t) => t.id === state.filter);

    els.emptyFilter.hidden = visible.length > 0;

    if (state.filter === "all") {
        els.topicsHint.textContent = "Каждая карточка ведёт к лекциям темы.";
    } else {
        const topic = topics.find((t) => t.id === state.filter);
        els.topicsHint.textContent = topic
            ? `Выбрана тема: ${topic.name}.`
            : "Каждая карточка ведёт к лекциям темы.";
    }

    els.topicGrid.innerHTML = visible.map(topicCard).join("");
}

function topicCard(topic, index) {
    const c = topic.counts;
    const lectures = topic.lectures.length
        ? `<ul class="lecture-list">${topic.lectures
              .map(
                  (lecture) => `
                    <li>
                        <a class="lecture-link" href="#/topic/${encodeURIComponent(
                            topic.id
                        )}/${encodeURIComponent(lecture.id)}">
                            <span class="lecture-dot"></span>
                            <span class="lecture-code">${esc(lectureCode(lecture))}</span>
                            <span class="lecture-name">${esc(lecture.title)}</span>
                            ${
                                lecture.duration
                                    ? `<span class="lecture-time">${esc(lecture.duration)}</span>`
                                    : ""
                            }
                        </a>
                    </li>`
              )
              .join("")}</ul>`
        : `<p class="topic-meta">Материалы этой темы скоро появятся.</p>`;

    return `
    <article class="topic-card" style="--i:${index}">
        <div class="topic-top">
            <span class="topic-num"><b>${String(topic.number).padStart(2, "0")}</b> тема</span>
            <span class="topic-count">${countLabel(c.lectures, [
                "лекция",
                "лекции",
                "лекций",
            ])}</span>
        </div>
        <h3>${esc(topic.name)}</h3>
        <p class="topic-meta">${c.videos} видео · ${c.slides} презентаций · ${c.texts} конспектов</p>
        ${lectures}
        <a class="topic-open" href="#/topic/${encodeURIComponent(topic.id)}">
            Открыть тему <span class="arrow">→</span>
        </a>
    </article>`;
}

/* ---------------- topic view ---------------- */

function renderTopic(topicId, lectureId) {
    const topics = state.data.topics;
    const topic = topics.find((t) => t.id === topicId);

    if (!topic) {
        location.hash = "#/";
        return;
    }

    const index = topics.indexOf(topic);
    const prev = topics[index - 1];
    const next = topics[index + 1];
    const c = topic.counts;

    const cards = topic.lectures
        .map((lecture, i) => lectureCard(lecture, i))
        .join("");

    const extras = topic.extras.length ? extrasBlock(topic.extras) : "";

    const pager = `
        <div class="topic-pager">
            ${
                prev
                    ? `<a class="pager-link prev" href="#/topic/${encodeURIComponent(prev.id)}">
                           <span class="dir">← Предыдущая тема</span>
                           <span class="name">${esc(prev.name)}</span>
                       </a>`
                    : ""
            }
            ${
                next
                    ? `<a class="pager-link next" href="#/topic/${encodeURIComponent(next.id)}">
                           <span class="dir">Следующая тема →</span>
                           <span class="name">${esc(next.name)}</span>
                       </a>`
                    : ""
            }
        </div>`;

    els.topicView.innerHTML = `
        <section class="topic-hero">
            <div class="topic-hero-inner">
                <nav class="crumbs" aria-label="Хлебные крошки">
                    <a href="#/">Курс</a>
                    <span class="sep">/</span>
                    <a href="#contents">Содержание</a>
                    <span class="sep">/</span>
                    <span>Тема ${String(topic.number).padStart(2, "0")}</span>
                </nav>
                <h1>${esc(topic.name)}</h1>
                <div class="meta-chips">
                    <span class="meta-chip"><b>${c.lectures}</b> ${plural(c.lectures, [
                        "лекция",
                        "лекции",
                        "лекций",
                    ])}</span>
                    <span class="meta-chip"><b>${c.videos}</b> видео</span>
                    <span class="meta-chip"><b>${c.slides}</b> ${plural(c.slides, [
                        "презентация",
                        "презентации",
                        "презентаций",
                    ])}</span>
                    <span class="meta-chip"><b>${c.texts}</b> ${plural(c.texts, [
                        "конспект",
                        "конспекта",
                        "конспектов",
                    ])}</span>
                </div>
            </div>
        </section>

        <div class="lectures-wrap">
            <div class="lectures-grid">${cards}</div>
            ${extras}
        </div>
        ${pager}`;

    views.home.hidden = true;
    views.topic.hidden = false;

    if (lectureId) {
        const target = els.topicView.querySelector(
            `[data-lecture="${cssEscape(lectureId)}"]`
        );
        requestAnimationFrame(() => {
            if (target) {
                target.scrollIntoView({ behavior: "smooth", block: "start" });
                target.classList.add("is-target");
                setTimeout(() => target.classList.remove("is-target"), 2200);
            } else {
                window.scrollTo({ top: 0, behavior: "auto" });
            }
        });
    } else {
        window.scrollTo({ top: 0, behavior: "auto" });
    }
}

function lectureCard(lecture, index) {
    const video = lecture.video
        ? `<a class="file-btn is-video" href="${mediaUrl(lecture.video)}" target="_blank" rel="noopener">
               <span class="fi">▶</span><span>Видео</span><span class="fx">.mp4</span>
           </a>`
        : `<span class="file-btn is-empty"><span class="fi">▶</span><span>Видео</span><span class="fx">—</span></span>`;

    const slides = lecture.slides
        ? `<a class="file-btn is-slides" href="${mediaUrl(lecture.slides)}" target="_blank" rel="noopener">
               <span class="fi">▤</span><span>Слайды</span><span class="fx">.pdf</span>
           </a>`
        : `<span class="file-btn is-empty"><span class="fi">▤</span><span>Слайды</span><span class="fx">—</span></span>`;

    const text = lecture.text
        ? `<button class="file-btn is-text" type="button" data-read="${esc(lecture.text)}">
               <span class="fi">✎</span><span>Конспект</span><span class="fx">.txt</span>
           </button>`
        : `<span class="file-btn is-empty"><span class="fi">✎</span><span>Конспект</span><span class="fx">—</span></span>`;

    return `
    <article class="lecture-card" id="lecture-${esc(lecture.id)}" data-lecture="${esc(
        lecture.id
    )}" style="--i:${index}">
        <div class="lecture-head">
            <span class="lec-badge">${esc(lectureCode(lecture))}</span>
            <div class="lecture-title">
                <h3>${esc(lecture.title)}</h3>
                <div class="lecture-sub">
                    <span>Лекция ${lecture.number}</span>
                    ${lecture.duration ? `<span class="time">${esc(lecture.duration)}</span>` : ""}
                </div>
            </div>
        </div>
        <div class="file-actions">${video}${slides}${text}</div>
    </article>`;
}

function extrasBlock(extras) {
    const links = extras
        .map(
            (extra) => `
            <a class="extra-link" href="${mediaUrl(extra.name)}" target="_blank" rel="noopener">
                <span class="kind">${esc(extra.kind)}</span>
                <span>${esc(extra.name)}</span>
            </a>`
        )
        .join("");

    return `
    <div class="extras-block">
        <h3>Дополнительные материалы</h3>
        <p>Наборы данных и вспомогательные файлы темы.</p>
        <div class="extras-list">${links}</div>
    </div>`;
}

function cssEscape(value) {
    if (window.CSS && CSS.escape) return CSS.escape(value);
    return String(value).replace(/["\\]/g, "\\$&");
}

/* ---------------- routing ---------------- */

function route() {
    const hash = location.hash || "#/";

    if (hash.startsWith("#/topic/")) {
        const rest = hash.slice("#/topic/".length);
        const [rawId, rawLecture] = rest.split("/");
        renderTopic(decodeURIComponent(rawId || ""), rawLecture ? decodeURIComponent(rawLecture) : "");
        setNavActive(null);
        return;
    }

    views.topic.hidden = true;
    views.home.hidden = false;
    setNavActive(hash === "#/" || hash === "" ? "home" : hash.slice(1));

    if (hash === "#/" || hash === "") {
        window.scrollTo({ top: 0, behavior: "auto" });
    } else {
        const target = document.getElementById(hash.slice(1));
        if (target) {
            requestAnimationFrame(() =>
                target.scrollIntoView({ behavior: "smooth", block: "start" })
            );
        }
    }
}

function setNavActive(section) {
    const links = [...els.nav.querySelectorAll("a")];
    links.forEach((link) => {
        const href = link.getAttribute("href");
        const active =
            (section === "home" && href === "#/") ||
            (section && href === "#" + section);
        link.classList.toggle("is-active", Boolean(active));
    });
}

/* ---------------- chrome: menu, modal ---------------- */

function bindChrome() {
    els.menuBtn.addEventListener("click", () => {
        const open = els.menuBtn.getAttribute("aria-expanded") === "true";
        els.menuBtn.setAttribute("aria-expanded", String(!open));
        els.nav.classList.toggle("is-open", !open);
    });

    els.nav.addEventListener("click", (event) => {
        if (event.target.closest("a")) {
            els.nav.classList.remove("is-open");
            els.menuBtn.setAttribute("aria-expanded", "false");
        }
    });

    window.addEventListener("hashchange", route);
    window.addEventListener("resize", () => {
        if (window.innerWidth > 860) {
            els.nav.classList.remove("is-open");
            els.menuBtn.setAttribute("aria-expanded", "false");
        }
    });

    document.addEventListener("click", async (event) => {
        const reader = event.target.closest("[data-read]");
        if (reader) {
            openText(reader.dataset.read);
            return;
        }
        if (event.target.closest("[data-close-modal]")) {
            closeModal();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closeModal();
    });

    document.addEventListener("keydown", (event) => {
        if (event.key !== "Tab") return;
        const modal = document.getElementById("textModal");
        if (!modal || modal.hidden) return;
        const focusable = modal.querySelectorAll("button, a[href]");
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    });
}

async function openText(filename) {
    const modal = document.getElementById("textModal");
    const title = document.getElementById("modalTitle");
    const body = document.getElementById("modalText");
    const download = document.getElementById("modalDownload");

    state.lastFocus = document.activeElement;
    title.textContent = filename;
    body.textContent = "Загрузка конспекта…";
    download.href = downloadUrl(filename);
    download.setAttribute("download", filename);
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    modal.querySelector(".icon-btn").focus();

    try {
        const res = await fetch(mediaUrl(filename));
        if (!res.ok) throw new Error("HTTP " + res.status);
        const text = await res.text();
        body.textContent = text.trim() || "Файл пуст.";
        body.scrollTop = 0;
    } catch (err) {
        modal.hidden = true;
        document.body.style.overflow = "";
        window.open(mediaUrl(filename), "_blank", "noopener");
    }
}

function closeModal() {
    const modal = document.getElementById("textModal");
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    document.body.style.overflow = "";
    if (state.lastFocus && typeof state.lastFocus.focus === "function") {
        state.lastFocus.focus();
    }
}
