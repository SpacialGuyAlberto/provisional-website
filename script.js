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

    /* ---------------- Nav hover behavior ---------------- */
    const links = $$(".nav__link");
    links.forEach((link) => {
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

    /* ---------------- Background Carousel ---------------- */
    const carouselImages = $$(".bg__carousel .bg__img");
    let currentIdx = 0;

    const nextImage = () => {
        if (carouselImages.length < 2) return;

        carouselImages[currentIdx].classList.remove("is-active");
        currentIdx = (currentIdx + 1) % carouselImages.length;
        carouselImages[currentIdx].classList.add("is-active");
    };

    if (carouselImages.length > 1) {
        setInterval(nextImage, 5000);
    }

    /* ---------------- Founder Video Manager ---------------- */
    const founderVideo = $("#founderVideo");
    if (founderVideo) {
        const desktopSrc = "assets/istockphoto-514978584-640_adpp_is.mp4";
        const mobileSrc = "assets/istockphoto-1263263145-640_adpp_is.mp4";

        const updateVideoSource = () => {
            const isMobile = window.innerWidth <= 760;
            const targetSrc = isMobile ? mobileSrc : desktopSrc;

            if (founderVideo.getAttribute("src") !== targetSrc) {
                founderVideo.src = targetSrc;
                founderVideo.load();
            }
        };

        // Initialize and listen for resize
        updateVideoSource();
        window.addEventListener("resize", updateVideoSource);

        // Fade in when loaded
        founderVideo.oncanplay = () => founderVideo.classList.add("is-loaded");

        // Intersection Observer for performance: only play when in view
        const videoObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    founderVideo.play().catch(() => { });
                } else {
                    founderVideo.pause();
                }
            });
        }, { threshold: 0.1 });

        videoObserver.observe(founderVideo);
    }

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

    form?.addEventListener("submit", async (e) => {
        e.preventDefault();

        const input = form.querySelector('input[name="email"]');
        const btn = form.querySelector('button[type="submit"]');
        const email = normalizeEmail(input?.value);

        if (!email || !email.includes("@") || email.length < 6) {
            input?.focus();
            input?.setAttribute("aria-invalid", "true");
            return;
        }
        input?.removeAttribute("aria-invalid");
        if (btn) {
            btn.disabled = true;
            btn.textContent = "Moment...";
        }

        try {
            const res = await fetch('/api/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await res.json();

            if (res.ok) {
                if (followStep) followStep.hidden = false;
                setTimeout(() => {
                    if (thanks) thanks.hidden = false;
                    followStep?.scrollIntoView({ behavior: "smooth", block: "start" });
                }, 180);
            } else {
                alert("Fehler: " + (data.error || "Unbekannter Fehler"));
                if (btn) {
                    btn.disabled = false;
                    btn.textContent = "Eintragen";
                }
            }

        } catch (err) {
            console.error("Signup error:", err);
            alert("Verbindungsfehler. Bitte versuche es später erneut.");
            if (btn) {
                btn.disabled = false;
                btn.textContent = "Eintragen";
            }
        }
    });
    /* ---------------- Map & Locations ---------------- */
    const initMap = async () => {
        const mapContainer = document.getElementById("locationsMap");
        if (!mapContainer || !window.L) return;

        // Center on Hamburg (where the promotion is)
        const map = L.map('locationsMap', {
            scrollWheelZoom: false,
            dragging: !L.Browser.mobile, // disable dragging on mobile init to prevent scroll trap
            tap: false
        }).setView([51.1657, 10.4515], 6); // 6 es el nivel de zoom ideal para ver todo el país

        // Standard Dark style tiles (Native visibility)
        // USA ESTA LÍNEA (dark_nolabels)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/dark_nolabels/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap &copy; CARTO',
            subdomains: 'abcd',
            maxZoom: 19
        }).addTo(map);

        // Geolocation: Center on user
        console.log("Checking geolocation availability...");
        if (navigator.geolocation) {
            console.log("Geolocation is available. Requesting position...");
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    console.log("Geolocation granted:", pos.coords);
                    const { latitude, longitude } = pos.coords;
                    map.flyTo([latitude, longitude], 15, {
                        duration: 3, // 3 seconds for a smooth fly-in effect
                        easeLinearity: 0.25
                    });
                },
                (err) => {
                    console.warn("Geolocation error or denied:", err.code, err.message);
                },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
        } else {
            console.warn("Geolocation API not supported by this browser.");
        }

        try {
            const res = await fetch('/api/locations');
            if (!res.ok) throw new Error("Failed to fetch locations");
            const locations = await res.json();
            console.log(`Fetched ${locations.length} locations from API.`);

            // Custom glowing marker icon
            const customIcon = L.divIcon({
                className: 'custom-marker',
                html: '<div class="marker-pin"></div>',
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            });

            // TEST MARKER in Hamburg to verify style
            L.marker([53.5511, 9.9937], { icon: customIcon })
                .addTo(map)
                .bindPopup('<div class="map-card"><div class="map-card-content"><div class="map-card-title">Hamburg Promo</div><p class="map-card-description">Test marker for neon design.</p></div></div>');

            let markerCount = 0;
            locations.forEach(loc => {
                const geo = loc.presentationLocation?.geopoint;
                console.log("Processing location:", loc.id, geo);

                if (geo) {
                    const lat = geo.latitude || geo._latitude;
                    const lng = geo.longitude || geo._longitude;

                    if (lat !== undefined && lng !== undefined) {
                        const title = (loc.presentationTitle?.de) || (loc.presentationTitle?.en) || loc.eventOrganizer || "Event Location";

                        // Image Handling
                        let imageUrl = '';
                        if (loc.presentationImageUrls && loc.presentationImageUrls.length > 0) {
                            imageUrl = loc.presentationImageUrls[0];
                        } else if (loc.eventLogoPath) {
                            imageUrl = loc.eventLogoPath;
                        }

                        // Fallback image if empty
                        if (!imageUrl) {
                            imageUrl = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=600&auto=format&fit=crop';
                        }

                        // Description / Subtitle
                        let description = "Event Location";
                        if (loc.presentationDescription && loc.presentationDescription.length > 0) {
                            description = loc.presentationDescription[0];
                        } else if (loc.cityDocId) {
                            description = "Auf der Karte entdecken";
                        }

                        const popupContent = `
                        <div class="date-card">
                            <div class="date-card-hero" style="background-image: url('${imageUrl}')">
                                <span class="date-card-badge">RESTAURANT</span>
                            </div>
                            <div class="date-card-body">
                                <div class="date-card-header">
                                    <h3 class="date-card-title">${title}</h3>
                                    <div class="date-card-rating">
                                        <span class="star">★</span> 4.6 <span class="max-rating">/5</span>
                                    </div>
                                </div>
                                <div class="date-card-subtitle">${description}</div>

                                <div class="date-card-stats">
                                    <div class="stat-box">
                                        <span class="stat-label">SINGLES</span>
                                        <div class="stat-value"><span class="stat-circle">9</span> jetzt</div>
                                    </div>
                                    <div class="stat-box">
                                        <span class="stat-label">Ø</span>
                                        <div class="stat-value"><span class="stat-circle">16</span> typisch</div>
                                    </div>
                                </div>

                                <div class="date-card-address">
                                    <span class="address-label">ADRESSE</span>
                                    <div class="address-value">Prenzlauer Berg • Berlin</div>
                                </div>

                                <div class="date-card-actions">
                                    <button class="btn-card btn-route">Route öffnen</button>
                                    <button class="btn-card btn-save">Merken</button>
                                </div>

                                <div class="date-card-footer">
                                    Hinweis: Visual-Demo. Live-Logik & Module werden weiter ausgebaut.
                                </div>
                            </div>
                        </div>
                        `;

                        // 1. Dibuja el marcador sin bindPopup
                        const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);

                        // 2. Crea la tarjeta flotante en el body (si no existe ya)
                        let floatingCard = document.getElementById('floating-date-card');
                        if (!floatingCard) {
                            floatingCard = document.createElement('div');
                            floatingCard.id = 'floating-date-card';
                            document.body.appendChild(floatingCard);

                            // Cierra la tarjeta si tocas el mapa de fondo
                            map.on('click', () => {
                                floatingCard.classList.remove('is-visible');
                            });
                        }

                        // 3. Al hacer clic en el punto, mostramos la tarjeta flotante
                        marker.on('click', () => {
                            // Hace que el mapa se mueva suavemente hacia el punto
                            map.flyTo([lat, lng], map.getZoom(), { animate: true, duration: 0.5 });

                            // Inyecta el contenido y un botón de cerrar propio
                            floatingCard.innerHTML = `
        <button class="close-floating-card">✕</button>
        ${popupContent} 
    `;

                            // Anima la entrada
                            floatingCard.classList.add('is-visible');

                            // Funcionalidad del nuevo botón de cerrar
                            floatingCard.querySelector('.close-floating-card').onclick = () => {
                                floatingCard.classList.remove('is-visible');
                            };
                        });

                        markerCount++;
                    }
                }
            });
            console.log(`Map initialized with ${markerCount} locations.`);

        } catch (err) {
            console.error("Map error:", err);
        }
    };

    // Defer slightly to ensure Leaflet loads if async
    setTimeout(initMap, 100);

})();
