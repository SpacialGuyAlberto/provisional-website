(() => {
    /* ---------------- SETTINGS ---------------- */
    const LAUNCH_ISO = "2026-03-15T00:00:00+01:00"; // Europe/Berlin
    const INSTAGRAM_URL = "https://instagram.com/"; // TODO: set real profile
    // Destatis: Haushalte nach Haushaltsgröße, Bundesländer, Jahr 2024, Stand 30. Jan 2026.
    // Values are "Einpersonenhaushalte" in 1,000 from Destatis table; we render as absolute.
    const DESTATS_EINPERSONEN_2024_TSD = [
        ["Deutschland", 17448],
        ["Nordrhein‑Westfalen", 3550],
        ["Bayern", 2729],
        ["Baden‑Württemberg", 2194],
        ["Niedersachsen", 1675],
        ["Hessen", 1288],
        ["Berlin", 1017],
        ["Hamburg", 502],
        ["Sachsen", 965],
        ["Schleswig‑Holstein", 624],
        ["Rheinland‑Pfalz", 747],
        ["Bremen", 174]
    ];

    /* ---------------- Helpers ---------------- */
    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
    const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
    const fmtInt = (n) =>
        new Intl.NumberFormat("de-DE").format(Math.max(0, Math.floor(n)));

    /* ---------------- Nav emoji behavior ---------------- */
    const links = $$(".nav__link");
    links.forEach((link) => {
        const emojiEl = link.querySelector(".nav__emoji");
        const hasEmoji = link.dataset.hasEmoji === "true";
        const emoji = link.dataset.emoji || "";
        if (emojiEl) emojiEl.textContent = hasEmoji ? emoji : "";

        let leaveTimer;
        link.addEventListener("mouseenter", () => {
            if (leaveTimer) clearTimeout(leaveTimer);
            link.classList.add("is-hovered");
        });
        link.addEventListener("mouseleave", () => {
            leaveTimer = setTimeout(() => link.classList.remove("is-hovered"), 60);
        });
    });

    /* ---------------- Smooth scroll with header offset ---------------- */
    const header = $(".topbar");
    const getHeaderOffset = () =>
        header ? header.getBoundingClientRect().height + 14 : 90;

    document.addEventListener("click", (e) => {
        const a = e.target.closest('a[href^="#"]');
        if (!a) return;

        const id = a.getAttribute("href");
        if (!id || id === "#") return;

        const target = $(id);
        if (!target) return;

        e.preventDefault();
        const y =
            window.scrollY + target.getBoundingClientRect().top - getHeaderOffset();
        window.scrollTo({ top: y, behavior: "smooth" });
    });

    /* ---------------- Topbar style on scroll ---------------- */
    const onScrollHeader = () => {
        if (!header) return;
        header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    window.addEventListener("scroll", onScrollHeader, { passive: true });
    onScrollHeader();

    /* ---------------- Reveal on scroll ---------------- */
    const revealEls = $$(".reveal");
    const io = new IntersectionObserver(
        (entries) =>
            entries.forEach(
                (en) => en.isIntersecting && en.target.classList.add("is-in")
            ),
        { threshold: 0.12, rootMargin: "0px 0px -10% 0px" }
    );
    revealEls.forEach((el) => io.observe(el));

    /* ---------------- Scrollspy ---------------- */
    const sectionIds = ["vision", "founder", "community", "signup", "germany"];
    const sections = sectionIds.map((id) => $("#" + id)).filter(Boolean);

    const setActiveLink = (id) => {
        links.forEach((l) =>
            l.classList.toggle("is-active", l.getAttribute("href") === "#" + id)
        );
    };

    const spy = () => {
        const offset = getHeaderOffset() + 12;
        const y = window.scrollY + offset;

        let current = "vision";
        for (const s of sections) {
            if (s.offsetTop <= y) current = s.id;
        }
        setActiveLink(current);
    };
    window.addEventListener("scroll", spy, { passive: true });
    spy();

    /* ---------------- Background transition (Hero → Dark) ---------------- */
    const hero = $(".hero");
    const rootStyle = document.documentElement.style;

    const updateBg = () => {
        if (!hero) return;
        const h = hero.getBoundingClientRect().height;
        const y = window.scrollY;

        // progress: 0 at top, 1 after roughly hero height
        const p = clamp(y / Math.max(1, h * 0.9), 0, 1);

        // Fade hero image down, bring dark pattern up
        const imgOpacity = 1 - p * 0.92; // ends around 0.08
        const overlayOpacity = 0.72 + p * 0.22; // gets darker
        const patternOpacity = p * 0.95;

        rootStyle.setProperty("--bgImgOpacity", imgOpacity.toFixed(3));
        rootStyle.setProperty("--bgOverlayOpacity", overlayOpacity.toFixed(3));
        rootStyle.setProperty("--bgPatternOpacity", patternOpacity.toFixed(3));
    };

    window.addEventListener("scroll", updateBg, { passive: true });
    updateBg();

    /* ---------------- Countdown ---------------- */
    const launch = new Date(LAUNCH_ISO).getTime();
    const cdRoot = $("#countdown");
    const cd = {
        days: cdRoot?.querySelector('[data-cd="days"]'),
        hours: cdRoot?.querySelector('[data-cd="hours"]'),
        mins: cdRoot?.querySelector('[data-cd="mins"]'),
        secs: cdRoot?.querySelector('[data-cd="secs"]')
    };

    const tickCountdown = () => {
        const now = Date.now();
        const diff = Math.max(0, launch - now);

        const sec = Math.floor(diff / 1000);
        const days = Math.floor(sec / (3600 * 24));
        const hours = Math.floor((sec % (3600 * 24)) / 3600);
        const mins = Math.floor((sec % 3600) / 60);
        const secs = Math.floor(sec % 60);

        if (cd.days) cd.days.textContent = fmtInt(days);
        if (cd.hours) cd.hours.textContent = String(hours).padStart(2, "0");
        if (cd.mins) cd.mins.textContent = String(mins).padStart(2, "0");
        if (cd.secs) cd.secs.textContent = String(secs).padStart(2, "0");
    };

    tickCountdown();
    setInterval(tickCountdown, 1000);

    /* ---------------- Ticker (real numbers from Destatis table, rendered) ---------------- */
    const tickerTrack = $("#tickerTrack");
    if (tickerTrack) {
        // Create items, duplicate to loop cleanly
        const items = DESTATS_EINPERSONEN_2024_TSD.map(([name, k]) => {
            const n = k * 1000;
            return `${name} — ${fmtInt(n)} Einpersonenhaushalte`;
        });

        // build DOM
        const render = (arr) =>
            arr.map((t) => {
                const span = document.createElement("span");
                span.className = "ticker__item";
                span.textContent = t;
                return span;
            });

        const dom = [...render(items), ...render(items)];
        tickerTrack.replaceChildren(...dom);
    }

    /* ---------------- Signup flow (Email → show Instagram) ---------------- */
    const form = $("#waitlistForm");
    const followStep = $("#followStep");
    const igFollowBtn = $("#igFollowBtn");
    const thanks = $("#thanksState");

    if (igFollowBtn) igFollowBtn.href = INSTAGRAM_URL;

    const normalizeEmail = (e) =>
        String(e || "")
            .trim()
            .toLowerCase();

    form?.addEventListener("submit", (e) => {
        e.preventDefault();

        const input = form.querySelector('input[name="email"]');
        const email = normalizeEmail(input?.value);

        if (!email || !email.includes("@") || email.length < 6) {
            input?.focus();
            input?.setAttribute("aria-invalid", "true");
            return;
        }
        input?.removeAttribute("aria-invalid");

        // Placeholder storage (replace with real backend later)
        try {
            const key = "snapyourdate_emails";
            const raw = localStorage.getItem(key);
            const arr = raw ? JSON.parse(raw) : [];
            if (!arr.includes(email)) arr.push(email);
            localStorage.setItem(key, JSON.stringify(arr.slice(0, 5000)));
        } catch { }

        // Show step
        if (followStep) followStep.hidden = false;

        // Show thanks after a short beat (feels responsive)
        setTimeout(() => {
            if (thanks) thanks.hidden = false;
            followStep?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 180);
    });

    /* ---------------- Optional: set your song URL here ---------------- */
    // const song = $("#song");
    // if (song) song.src = "https://YOUR-AUDIO-FILE.mp3";
})();
