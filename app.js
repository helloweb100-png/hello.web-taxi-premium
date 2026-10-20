/* ══════════════════════════════════════════════════════════════
   TAXI PREMIUM · SERVICIO PLUS
   Interacciones y animaciones de scroll

   Dependencias (CDN, ver index.html):
   · GSAP 3.12.5 + ScrollTrigger  → coreografía de scroll
   · Lenis 1.1.13                 → scroll suave inercial
   Si alguna no carga, o el usuario pide menos movimiento, la página
   funciona igual en modo estático (sin ocultar contenido).
══════════════════════════════════════════════════════════════ */
(() => {
    'use strict';

    /* ───────── Configuración del negocio ───────── */
    const PHONES = { l1: '529383868447', l2: '529382931137' };
    const WA = 'https://wa.me/';

    /* ───────── Utilidades ───────── */
    const root = document.documentElement;
    const $ = (s, c = document) => c.querySelector(s);
    const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    const smooth = t => t * t * (3 - 2 * t);

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const hasGsap = !!(window.gsap && window.ScrollTrigger);
    const motionOn = hasGsap && !reduceMotion;

    const safe = (name, fn) => {
        try { return fn(); } catch (err) { console.error('[Taxi Premium] ' + name, err); }
    };

    let lenis = null;
    let headerEl = null;
    let menuOpen = false;

    /* ══════════════════════════════════════════════
       ARRANQUE
    ══════════════════════════════════════════════ */
    document.addEventListener('DOMContentLoaded', boot);

    function boot() {
        headerEl = $('#site-header');
        if (motionOn) {
            gsap.registerPlugin(ScrollTrigger);
            gsap.defaults({ ease: 'expo.out', duration: 1 });
            ScrollTrigger.config({ ignoreMobileResize: true });
            root.classList.add('motion');
        }

        safe('whatsapp-links', initWhatsAppLinks);
        safe('lenis', initLenis);
        safe('split-text', prepareSplits);
        safe('hero-prep', prepareHero);
        safe('header', initHeader);
        safe('menu', initMenu);
        safe('anchors', initAnchors);
        safe('faq', initFaq);
        safe('form', initForm);
        safe('hero-net', initNetwork);
        safe('fleet', initFleet);
        safe('tiles', initTiles);
        safe('footer-word', initFooterWord);

        if (motionOn) {
            safe('hero-scroll', initHeroScroll);
            safe('marquee', initMarquee);
            safe('expand', initExpand);
            safe('manifesto', initManifesto);
            safe('reveals', initReveals);
            safe('journey', initJourney);
            safe('stack', initStack);
            safe('compare', initCompare);
            safe('counters', initCounters);
            safe('fleet-scroll', initFleetScroll);
            safe('magnetic', initMagnetic);
        } else {
            $$('[data-count]').forEach(el => { el.textContent = el.dataset.count; });
        }

        runPreloader().then(() => {
            if (lenis) lenis.start();
            root.style.overflow = '';
            safe('hero-intro', playHeroIntro);
            safe('wa-float', showWhatsAppFloat);
            if (motionOn) ScrollTrigger.refresh();
        });

        window.addEventListener('load', () => {
            // Evita saltos: carga ya las imágenes diferidas y recalcula posiciones de scroll.
            $$('img[loading="lazy"]').forEach(img => { img.loading = 'eager'; });
            if (motionOn) setTimeout(() => ScrollTrigger.refresh(), 300);
        });
        if (document.fonts && motionOn) document.fonts.ready.then(() => ScrollTrigger.refresh());

        // Plan B si algo se atora: nunca dejar contenido oculto.
        setTimeout(() => {
            if (!document.body.dataset.ready) {
                root.classList.add('motion-fail');
                root.style.overflow = '';
                if (lenis) lenis.start();
            }
        }, 9500);
    }

    /* ══════════════════════════════════════════════
       WHATSAPP (enlaces centralizados)
    ══════════════════════════════════════════════ */
    function initWhatsAppLinks() {
        $$('[data-wa]').forEach(a => {
            a.href = WA + PHONES.l1 + '?text=' + encodeURIComponent(a.dataset.wa);
        });
    }

    function showWhatsAppFloat() {
        const el = $('#wa-float');
        if (!el) return;
        setTimeout(() => el.classList.add('is-in'), 900);
        setTimeout(() => el.classList.add('show-tip'), 4200);
        setTimeout(() => el.classList.remove('show-tip'), 9800);
    }

    /* ══════════════════════════════════════════════
       PRELOADER
    ══════════════════════════════════════════════ */
    function runPreloader() {
        return new Promise(resolve => {
            const pre = $('#preloader');
            const done = () => { document.body.dataset.ready = '1'; resolve(); };
            if (!pre) return done();

            if (!motionOn) {
                // Modo sin animación: una salida simple.
                const hide = () => {
                    pre.style.transition = 'opacity .4s';
                    pre.style.opacity = '0';
                    setTimeout(() => { pre.remove(); done(); }, 420);
                };
                if (document.readyState === 'complete') hide(); else window.addEventListener('load', hide, { once: true });
                return;
            }

            root.style.overflow = 'hidden';
            if (lenis) lenis.stop();

            const pctEl = $('.pl__pct b', pre);
            const statusEl = $('.pl__status', pre);
            const road = $('.pl__road', pre);
            const steps = [[0, 'Calibrando rutas'], [38, 'Afinando el confort'], [78, 'Listo para salir']];
            const state = { v: 0 };
            let leaving = false;

            const paint = () => {
                const v = Math.round(state.v);
                pctEl.textContent = v;
                road.style.setProperty('--p', (state.v / 100).toFixed(3));
                const label = steps.filter(s => v >= s[0]).pop()[1];
                if (statusEl.textContent !== label) statusEl.textContent = label;
            };

            const climb = gsap.to(state, { v: 86, duration: 2.4, ease: 'power2.out', onUpdate: paint });

            const heroImg = $('#hero-car img');
            const loaded = new Promise(res => { if (document.readyState === 'complete') res(); else window.addEventListener('load', res, { once: true }); });
            const fonts = document.fonts ? Promise.race([document.fonts.ready, wait(2500)]) : Promise.resolve();
            const image = heroImg && heroImg.decode ? heroImg.decode().catch(() => {}) : Promise.resolve();

            const leave = () => {
                if (leaving) return;
                leaving = true;
                climb.kill();
                const tl = gsap.timeline({ onComplete: () => { pre.remove(); done(); } });
                tl.to(state, { v: 100, duration: .55, ease: 'power2.out', onUpdate: paint })
                    .to('.pl__core', { scale: .92, opacity: 0, duration: .55, ease: 'power3.in' }, '+=.1')
                    .to('.pl__panel--top', { yPercent: -101, duration: 1.15, ease: 'expo.inOut' }, '-=.15')
                    .to('.pl__panel--bottom', { yPercent: 101, duration: 1.15, ease: 'expo.inOut' }, '<')
                    .add(() => resolve(), '-=.8');
            };

            Promise.all([loaded, fonts, image, wait(2300)]).then(leave);
            setTimeout(leave, 7000);
        });
    }

    /* ══════════════════════════════════════════════
       SCROLL SUAVE (Lenis)
    ══════════════════════════════════════════════ */
    function initLenis() {
        if (!motionOn || typeof window.Lenis === 'undefined') return;
        lenis = new Lenis({
            duration: 1.35,
            easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true,
            wheelMultiplier: .9,
            touchMultiplier: 1.15
        });
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add(time => lenis.raf(time * 1000));
        gsap.ticker.lagSmoothing(0);
        lenis.stop();
    }

    function initAnchors() {
        $$('a[href^="#"]').forEach(a => {
            a.addEventListener('click', e => {
                const id = a.getAttribute('href');
                if (!id || id.length < 2) return;
                const target = $(id);
                if (!target) return;
                e.preventDefault();
                if (menuOpen) setMenu(false);
                if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.9, easing: t => 1 - Math.pow(1 - t, 4) });
                else target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
            });
        });
    }

    /* ══════════════════════════════════════════════
       HEADER, PROGRESO Y SECCIÓN ACTIVA
    ══════════════════════════════════════════════ */
    function initHeader() {
        // Estado "sólido": centinela con IntersectionObserver (sin listeners de scroll).
        const sentinel = document.createElement('div');
        sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:40px;pointer-events:none;';
        document.body.prepend(sentinel);
        new IntersectionObserver(([entry]) => {
            headerEl.classList.toggle('is-solid', !entry.isIntersecting);
        }).observe(sentinel);

        if (!motionOn) { $('.progress')?.remove(); return; }

        ScrollTrigger.create({
            start: 0, end: 'max',
            onUpdate: self => {
                if (menuOpen) return;
                const y = self.scroll();
                if (y > 480 && self.direction === 1) headerEl.classList.add('is-hidden');
                else if (self.direction === -1 || y <= 480) headerEl.classList.remove('is-hidden');
            }
        });

        gsap.to('#progress-bar', {
            scaleX: 1, ease: 'none',
            scrollTrigger: { start: 0, end: 'max', scrub: .25 }
        });

        $$('.nav__links a').forEach(link => {
            const target = $(link.getAttribute('href'));
            if (!target) return;
            ScrollTrigger.create({
                trigger: target, start: 'top 55%', end: 'bottom 55%',
                onToggle: self => link.classList.toggle('is-active', self.isActive)
            });
        });
    }

    /* ══════════════════════════════════════════════
       MENÚ MÓVIL
    ══════════════════════════════════════════════ */
    function setMenu(open) {
        const toggle = $('#nav-toggle');
        const menu = $('#menu');
        menuOpen = open;
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
        menu.classList.toggle('is-open', open);
        root.classList.toggle('menu-open', open);
        menu.setAttribute('aria-hidden', String(!open));
        if (open) menu.removeAttribute('inert'); else menu.setAttribute('inert', '');
        if (open) headerEl.classList.remove('is-hidden');
        if (lenis) { open ? lenis.stop() : lenis.start(); }
        else root.style.overflow = open ? 'hidden' : '';
    }

    function initMenu() {
        const toggle = $('#nav-toggle');
        if (!toggle) return;
        toggle.addEventListener('click', () => setMenu(!menuOpen));
        document.addEventListener('keydown', e => { if (e.key === 'Escape' && menuOpen) { setMenu(false); toggle.focus(); } });
        window.matchMedia('(min-width: 980px)').addEventListener('change', e => { if (e.matches && menuOpen) setMenu(false); });
    }

    /* ══════════════════════════════════════════════
       TEXTO DIVIDIDO EN PALABRAS
    ══════════════════════════════════════════════ */
    function splitWords(el) {
        const walk = node => {
            Array.from(node.childNodes).forEach(child => {
                if (child.nodeType === 3) {
                    const frag = document.createDocumentFragment();
                    child.textContent.split(/(\s+)/).forEach(part => {
                        if (!part) return;
                        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
                        const w = document.createElement('span');
                        const i = document.createElement('span');
                        w.className = 'w'; i.className = 'wi'; i.textContent = part;
                        w.appendChild(i); frag.appendChild(w);
                    });
                    child.replaceWith(frag);
                } else if (child.nodeType === 1 && !child.classList.contains('w')) {
                    walk(child);
                }
            });
        };
        walk(el);
    }

    function prepareHero() {
        if (!motionOn) return;
        gsap.set('.hero__title .line__in', { yPercent: 112 });
    }

    function prepareSplits() {
        if (!motionOn) return;
        $$('[data-split]').forEach(splitWords);
        const m = $('#manifesto-text');
        if (m) splitWords(m);
    }

    /* ══════════════════════════════════════════════
       HERO
    ══════════════════════════════════════════════ */
    function playHeroIntro() {
        if (!motionOn) return;
        const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });

        tl.fromTo('.hero__chip', { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: .9 }, 0)
            .to('.hero__title .line__in', { yPercent: 0, duration: 1.3, stagger: .14 }, .1)
            .fromTo('.hero__lead', { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 1.1 }, .55)
            .fromTo('.hero__cta', { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 1.1 }, .72)
            .fromTo('.hero__car', { opacity: 0, x: '-30vw', scale: .88 }, { opacity: 1, x: 0, scale: 1, duration: 2, ease: 'expo.out' }, 0)
            .fromTo('.hero__halo', { opacity: 0 }, { opacity: 1, duration: 2 }, .2)
            .fromTo('.hero__ico', { opacity: 0, scale: .3 }, { opacity: 1, scale: 1, duration: .9, stagger: .14, ease: 'back.out(2.2)' }, 1);

        // Arcos de la marca: se dibujan solos
        const a1 = $('.arc--1'), a2 = $('.arc--2'), a3 = $('.arc--3');
        [a1, a2].forEach((p, i) => {
            const len = p.getTotalLength();
            gsap.set(p, { opacity: 1, strokeDasharray: len, strokeDashoffset: len });
            gsap.to(p, { strokeDashoffset: 0, duration: 2.4, delay: .3 + i * .25, ease: 'power3.inOut', onComplete: () => { p.style.strokeDasharray = 'none'; } });
        });
        gsap.to(a3, { opacity: 1, duration: 1.4, delay: 1 });

        initHeroOrb(a3);
        initHeroParallax();
        return tl;
    }

    // Punto de luz que recorre el arco punteado
    function initHeroOrb(path) {
        const svg = path.ownerSVGElement;
        const ns = 'http://www.w3.org/2000/svg';
        const halo = document.createElementNS(ns, 'circle');
        const dot = document.createElementNS(ns, 'circle');
        halo.setAttribute('r', '20'); halo.setAttribute('fill', '#38D9FF');
        dot.setAttribute('r', '7'); dot.setAttribute('fill', '#EAF2FF');
        svg.appendChild(halo); svg.appendChild(dot);
        const len = path.getTotalLength();
        const o = { p: 0 };
        const tween = gsap.to(o, {
            p: 1, duration: 6.5, ease: 'none', repeat: -1,
            onUpdate: () => {
                const pt = path.getPointAtLength(o.p * len);
                const a = Math.sin(o.p * Math.PI);
                halo.setAttribute('cx', pt.x); halo.setAttribute('cy', pt.y); halo.setAttribute('fill-opacity', (.28 * a).toFixed(3));
                dot.setAttribute('cx', pt.x); dot.setAttribute('cy', pt.y); dot.setAttribute('fill-opacity', a.toFixed(3));
            }
        });
        ScrollTrigger.create({ trigger: '.hero', start: 'top top', end: 'bottom top', onToggle: s => tween.paused(!s.isActive) });
    }

    // Parallax de mouse (y deriva automática en táctil o sin movimiento del puntero)
    function initHeroParallax() {
        const hero = $('.hero');
        const stage = $('.hero__stage');
        if (!hero || !stage) return;
        let tx = 0, ty = 0, cx = 0, cy = 0, last = 0, visible = true;
        const t0 = performance.now();

        hero.addEventListener('pointermove', e => {
            if (e.pointerType === 'touch') return;
            const r = hero.getBoundingClientRect();
            tx = ((e.clientX - r.left) / r.width - .5) * 2;
            ty = ((e.clientY - r.top) / r.height - .5) * 2;
            last = performance.now();
        }, { passive: true });
        new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(hero);

        gsap.ticker.add(() => {
            if (!visible) return;
            const now = performance.now();
            if (now - last > 2200) {
                const s = (now - t0) / 1000;
                tx = Math.sin(s * .45) * .6;
                ty = Math.cos(s * .33) * .4;
            }
            cx += (tx - cx) * .06;
            cy += (ty - cy) * .06;
            stage.style.setProperty('--px', cx.toFixed(4));
            stage.style.setProperty('--py', cy.toFixed(4));
        });
    }

    // El hero reacciona al scroll: el auto baja y el texto se desvanece
    function initHeroScroll() {
        const st = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: .8 };
        gsap.to('.hero__stage', { yPercent: 16, ease: 'none', scrollTrigger: st });
        gsap.to('.hero__copy', { yPercent: -10, opacity: .15, ease: 'none', scrollTrigger: st });
    }

    // Red de partículas (lienzo del hero)
    function initNetwork() {
        const cv = $('#hero-net');
        if (!cv) return;
        const ctx = cv.getContext('2d');
        let w = 0, h = 0, pts = [], running = false, raf = 0;
        const mouse = { x: -999, y: -999 };

        const resize = () => {
            const r = cv.getBoundingClientRect();
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            w = r.width; h = r.height;
            cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            const n = Math.round(clamp((w * h) / 17000, 24, w < 700 ? 38 : 78));
            pts = Array.from({ length: n }, () => ({
                x: Math.random() * w, y: Math.random() * h,
                vx: (Math.random() - .5) * .34, vy: (Math.random() - .5) * .34,
                r: Math.random() * 1.5 + .6
            }));
        };

        const draw = (move = true) => {
            ctx.clearRect(0, 0, w, h);
            for (let i = 0; i < pts.length; i++) {
                const p = pts[i];
                if (move) {
                    p.x += p.vx; p.y += p.vy;
                    if (p.x < -10) p.x = w + 10; else if (p.x > w + 10) p.x = -10;
                    if (p.y < -10) p.y = h + 10; else if (p.y > h + 10) p.y = -10;
                }
                ctx.fillStyle = 'rgba(123,232,255,.85)';
                ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fill();
                for (let j = i + 1; j < pts.length; j++) {
                    const q = pts[j];
                    const dx = p.x - q.x, dy = p.y - q.y;
                    const d = dx * dx + dy * dy;
                    if (d < 15000) {
                        ctx.strokeStyle = 'rgba(56,217,255,' + ((1 - d / 15000) * .3).toFixed(3) + ')';
                        ctx.lineWidth = 1;
                        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
                    }
                }
                const mx = p.x - mouse.x, my = p.y - mouse.y;
                const md = mx * mx + my * my;
                if (md < 26000) {
                    ctx.strokeStyle = 'rgba(184,243,255,' + ((1 - md / 26000) * .5).toFixed(3) + ')';
                    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
                }
            }
        };

        const loop = () => { draw(true); raf = requestAnimationFrame(loop); };
        const start = () => { if (!running) { running = true; raf = requestAnimationFrame(loop); } };
        const stop = () => { running = false; cancelAnimationFrame(raf); };

        resize();
        if (reduceMotion) { draw(false); return; }

        const hero = $('.hero');
        hero.addEventListener('pointermove', e => {
            const r = cv.getBoundingClientRect();
            mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
        }, { passive: true });
        hero.addEventListener('pointerleave', () => { mouse.x = mouse.y = -999; });
        new IntersectionObserver(([e]) => { e.isIntersecting ? start() : stop(); }).observe(hero);

        let t;
        window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(resize, 200); });
    }

    /* ══════════════════════════════════════════════
       MARQUEE (reacciona a la velocidad del scroll)
    ══════════════════════════════════════════════ */
    function initMarquee() {
        const track = $('#marquee-track');
        if (!track) return;
        const tween = gsap.to(track, { xPercent: -50, duration: 34, ease: 'none', repeat: -1 });
        let ts = 1, dir = 1, active = true;

        ScrollTrigger.create({
            trigger: '.marquee', start: 'top bottom', end: 'bottom top',
            onToggle: s => { active = s.isActive; tween.paused(!active); }
        });

        gsap.ticker.add(() => {
            if (!active) return;
            const v = lenis ? lenis.velocity : 0;
            if (Math.abs(v) > .4) dir = v > 0 ? 1 : -1;
            const target = dir * (1 + Math.min(Math.abs(v) * .45, 8));
            ts += (target - ts) * .06;
            tween.timeScale(ts);
        });
    }

    /* ══════════════════════════════════════════════
       EXPANSIÓN DE IMAGEN
    ══════════════════════════════════════════════ */
    function initExpand() {
        const sec = $('.expand');
        if (!sec) return;
        const mm = gsap.matchMedia();

        mm.add({ desk: '(min-width: 860px)', mob: '(max-width: 859px)' }, ctx => {
            const desk = ctx.conditions.desk;
            const media = $('#expand-media');
            const img = $('img', media);
            const wl = $('.expand__word--l');
            const wr = $('.expand__word--r');
            const cap = $('#expand-caption');

            // Estado inicial de la tarjeta (recorte) y escala de la foto.
            // El recorte y la escala avanzan con la misma curva para que la foto
            // siempre cubra el recorte y el auto se vea completo desde el inicio.
            const from = desk
                ? { iy: 30, ix: 28, r: 28, s: .46, px: 40 }
                : { iy: 14, ix: 16, r: 22, s: .8, px: 18 };
            const to = desk
                ? { iy: 0, ix: 0, r: 0, s: 1, px: 40 }
                : { iy: 0, ix: 0, r: 22, s: 1, px: 82 };
            const lerp = (a, b, t) => a + (b - a) * t;

            const apply = t => {
                media.style.clipPath = 'inset(' + lerp(from.iy, to.iy, t).toFixed(3) + '% ' + lerp(from.ix, to.ix, t).toFixed(3) + '% round ' + lerp(from.r, to.r, t).toFixed(2) + 'px)';
                gsap.set(img, { scale: lerp(from.s, to.s, t), objectPosition: lerp(from.px, to.px, t).toFixed(2) + '% 50%' });
            };

            const proxy = { t: 0 };
            apply(0);
            gsap.set(cap, { opacity: 0, y: 44 });

            const tl = gsap.timeline({
                defaults: { ease: 'none' },
                scrollTrigger: { trigger: sec, start: 'top top', end: 'bottom bottom', scrub: 1 }
            });
            tl.to(proxy, { t: 1, duration: 5.2, ease: 'power2.inOut', onUpdate: () => apply(proxy.t) }, 0)
                .to(wl, { xPercent: -130, duration: 4, ease: 'power2.in' }, .6)
                .to(wr, { xPercent: 130, duration: 4, ease: 'power2.in' }, .6)
                .to([wl, wr], { opacity: 0, duration: 1.6 }, 3.2)
                .to(cap, { opacity: 1, y: 0, duration: 1.8, ease: 'power2.out' }, 5.2)
                .to({}, { duration: 1 });
        });
    }

    /* ══════════════════════════════════════════════
       MANIFIESTO (palabra por palabra)
    ══════════════════════════════════════════════ */
    function initManifesto() {
        const text = $('#manifesto-text');
        if (!text) return;
        gsap.to($$('.w', text), {
            opacity: 1, ease: 'none', stagger: .12,
            scrollTrigger: { trigger: text, start: 'top 82%', end: 'bottom 46%', scrub: .6 }
        });
    }

    /* ══════════════════════════════════════════════
       REVELADO GENERAL (títulos y bloques)
    ══════════════════════════════════════════════ */
    function initReveals() {
        $$('[data-split]').forEach(h => {
            const words = $$('.wi', h);
            gsap.set(words, { y: 0, yPercent: 118 });
            ScrollTrigger.create({
                trigger: h, start: 'top 88%', once: true,
                onEnter: () => gsap.to(words, { yPercent: 0, duration: 1.2, stagger: .06, ease: 'expo.out' })
            });
        });

        gsap.set('[data-reveal]', { opacity: 0, y: 36 });
        ScrollTrigger.batch('[data-reveal]', {
            start: 'top 90%', once: true,
            onEnter: batch => gsap.to(batch, { opacity: 1, y: 0, duration: 1.1, stagger: .12, ease: 'expo.out', overwrite: true })
        });

        // Paralaje suave dentro de las imágenes del bento
        $$('.tile__img').forEach(img => {
            gsap.fromTo(img, { yPercent: -6 }, {
                yPercent: 6, ease: 'none',
                scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true }
            });
        });
    }

    function initTiles() {
        $$('.tile').forEach(tile => {
            tile.addEventListener('pointermove', e => {
                const r = tile.getBoundingClientRect();
                tile.style.setProperty('--mx', (e.clientX - r.left) + 'px');
                tile.style.setProperty('--my', (e.clientY - r.top) + 'px');
            }, { passive: true });
        });
    }

    /* ══════════════════════════════════════════════
       RUTAS: el viaje se dibuja con el scroll
    ══════════════════════════════════════════════ */
    function initJourney() {
        const sec = $('.journey');
        const map = $('#journey-map');
        if (!sec || !map) return;

        const stops = $$('.stop', sec);
        const dots = $$('.journey__dots li', sec);
        const nodesWrap = $('#journey-nodes');
        const car = $('#journey-car');
        const names = ['Campeche', 'Champotón', 'Sabancuy', 'Carmen'];
        // Fracción de la ruta donde vive cada parada
        const fr = [0, .36, .68, 1];
        // Línea de tiempo del scroll: pausa en cada ciudad y viaja entre ellas
        const keyS = [0, .10, .30, .40, .60, .70, .90, 1];
        const keyF = [0, 0, fr[1], fr[1], fr[2], fr[2], fr[3], fr[3]];

        const pathFraction = s => {
            for (let i = 0; i < keyS.length - 1; i++) {
                if (s <= keyS[i + 1]) {
                    const t = (s - keyS[i]) / (keyS[i + 1] - keyS[i] || 1);
                    return keyF[i] + (keyF[i + 1] - keyF[i]) * smooth(clamp(t, 0, 1));
                }
            }
            return 1;
        };

        const mm = gsap.matchMedia();
        mm.add({ desk: '(min-width: 900px)', mob: '(max-width: 899px)' }, ctx => {
            const desk = ctx.conditions.desk;
            const svg = $(desk ? '#route-d' : '#route-m');
            const trace = $(desk ? '#trace-d' : '#trace-m');
            const vb = svg.viewBox.baseVal;
            const L = trace.getTotalLength();
            const size = { w: map.clientWidth, h: map.clientHeight };

            trace.style.strokeDasharray = L;
            trace.style.strokeDashoffset = L;

            // Nodos (HTML, para texto nítido)
            nodesWrap.innerHTML = '';
            const nodes = fr.map((f, i) => {
                const p = trace.getPointAtLength(L * f);
                const n = document.createElement('div');
                const left = p.x / vb.width;
                n.className = 'node ' + (left < .5 ? 'node--right' : 'node--left');
                n.style.left = (left * 100) + '%';
                n.style.top = (p.y / vb.height * 100) + '%';
                n.innerHTML = '<span class="node__dot"></span><span class="node__label">' + names[i] + '</span>';
                nodesWrap.appendChild(n);
                return n;
            });

            const ro = new ResizeObserver(() => { size.w = map.clientWidth; size.h = map.clientHeight; });
            ro.observe(map);

            let current = -1;
            const update = s => {
                const f = pathFraction(s);
                trace.style.strokeDashoffset = L * (1 - f);
                const pt = trace.getPointAtLength(L * f);
                gsap.set(car, { x: pt.x / vb.width * size.w, y: pt.y / vb.height * size.h });

                nodes.forEach((n, i) => n.classList.toggle('is-on', f >= fr[i] - .004));
                // Parada activa: la más cercana a la posición del auto
                let idx = 0, best = 9;
                fr.forEach((v, i) => { const d = Math.abs(f - v); if (d < best) { best = d; idx = i; } });
                if (idx !== current) {
                    current = idx;
                    stops.forEach((el, i) => el.classList.toggle('is-active', i === idx));
                    dots.forEach((el, i) => el.classList.toggle('is-active', i === idx));
                }
            };

            const proxy = { s: 0 };
            update(0);
            gsap.to(proxy, {
                s: 1, ease: 'none', onUpdate: () => update(proxy.s),
                scrollTrigger: { trigger: sec, start: 'top top', end: 'bottom bottom', scrub: .9 }
            });

            return () => { ro.disconnect(); nodesWrap.innerHTML = ''; };
        });
    }

    /* ══════════════════════════════════════════════
       CÓMO FUNCIONA: cartas que se apilan
    ══════════════════════════════════════════════ */
    function initStack() {
        const cards = $$('#stack .card');
        cards.forEach((card, i) => {
            const next = cards[i + 1];
            if (!next) return;
            const trigger = {
                trigger: next, start: 'top 92%',
                end: () => 'top ' + getComputedStyle(next).top,
                scrub: true
            };
            gsap.to(card, { scale: .93, transformOrigin: '50% 0%', ease: 'none', scrollTrigger: trigger });
            gsap.to($('.card__shade', card), { opacity: .55, ease: 'none', scrollTrigger: trigger });
        });
    }

    /* ══════════════════════════════════════════════
       FLOTA: hotspots sobre el auto
    ══════════════════════════════════════════════ */
    function initFleet() {
        const stage = $('#fleet-stage');
        if (!stage) return;
        const hots = $$('.hot', stage);
        const feats = $$('.feat');
        hots[0]?.classList.add('hot--l');
        hots[hots.length - 1]?.classList.add('hot--r');
        let active = 0, timer = null, pausedUntil = 0, inView = false;

        const setActive = i => {
            active = i;
            hots.forEach((h, k) => h.classList.toggle('is-active', k === i));
            feats.forEach((f, k) => f.classList.toggle('is-active', k === i));
        };
        const pause = () => { pausedUntil = Date.now() + 9000; };

        hots.forEach((h, i) => {
            h.addEventListener('mouseenter', () => { pause(); setActive(i); });
            h.addEventListener('focus', () => { pause(); setActive(i); });
            h.addEventListener('click', () => { pause(); setActive(i); });
        });
        feats.forEach((f, i) => f.addEventListener('click', () => { pause(); setActive(i); }));

        setActive(0);
        if (reduceMotion) return;

        const tick = () => { if (inView && Date.now() > pausedUntil) setActive((active + 1) % hots.length); };
        new IntersectionObserver(([e]) => {
            inView = e.isIntersecting;
            if (inView && !timer) timer = setInterval(tick, 3200);
            if (!inView && timer) { clearInterval(timer); timer = null; }
        }, { threshold: .35 }).observe(stage);
    }

    function initFleetScroll() {
        const stage = $('#fleet-stage');
        if (!stage) return;
        gsap.fromTo('#fleet-car', { xPercent: -16, scale: .88, opacity: .15 }, {
            xPercent: 0, scale: 1, opacity: 1, ease: 'none',
            scrollTrigger: { trigger: stage, start: 'top 90%', end: 'center 55%', scrub: .9 }
        });
        gsap.set('.hot__dot', { scale: 0 });
        ScrollTrigger.create({
            trigger: stage, start: 'top 55%', once: true,
            onEnter: () => {
                gsap.set('.hot', { opacity: 1 });
                gsap.to('.hot__dot', { scale: 1, duration: .9, stagger: .18, ease: 'back.out(2.4)' });
            }
        });
    }

    /* ══════════════════════════════════════════════
       COMPARATIVO Y NÚMEROS
    ══════════════════════════════════════════════ */
    function initCompare() {
        const table = $('.cmp');
        if (!table) return;
        gsap.from($$('tbody tr', table), {
            opacity: 0, y: 28, duration: .9, stagger: .12, ease: 'expo.out',
            scrollTrigger: { trigger: table, start: 'top 78%', once: true }
        });
        gsap.from($$('td.cmp__plus i', table), {
            scale: 0, duration: .7, stagger: .12, delay: .35, ease: 'back.out(3)',
            scrollTrigger: { trigger: table, start: 'top 78%', once: true }
        });
    }

    function initCounters() {
        $$('[data-count]').forEach(el => {
            const end = parseInt(el.dataset.count, 10);
            const o = { v: 0 };
            el.textContent = '0';
            ScrollTrigger.create({
                trigger: el, start: 'top 92%', once: true,
                onEnter: () => gsap.to(o, {
                    v: end, duration: end > 100 ? 2.6 : 1.7, ease: 'power3.out',
                    onUpdate: () => { el.textContent = String(Math.round(o.v)); }
                })
            });
        });
    }

    /* ══════════════════════════════════════════════
       PREGUNTAS (acordeón)
    ══════════════════════════════════════════════ */
    function initFaq() {
        const items = $$('.qa');
        let refreshTimer;
        items.forEach(qa => {
            const btn = $('.qa__q', qa);
            btn.addEventListener('click', () => {
                const open = btn.getAttribute('aria-expanded') === 'true';
                items.forEach(o => {
                    o.classList.remove('is-open');
                    $('.qa__q', o).setAttribute('aria-expanded', 'false');
                });
                if (!open) {
                    qa.classList.add('is-open');
                    btn.setAttribute('aria-expanded', 'true');
                }
                if (motionOn) {
                    clearTimeout(refreshTimer);
                    refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 650);
                }
            });
        });
    }

    /* ══════════════════════════════════════════════
       BOTONES MAGNÉTICOS
    ══════════════════════════════════════════════ */
    function initMagnetic() {
        if (!finePointer) return;
        $$('.magnetic').forEach(btn => {
            const xTo = gsap.quickTo(btn, 'x', { duration: .7, ease: 'elastic.out(1, .55)' });
            const yTo = gsap.quickTo(btn, 'y', { duration: .7, ease: 'elastic.out(1, .55)' });
            btn.addEventListener('pointermove', e => {
                const r = btn.getBoundingClientRect();
                xTo((e.clientX - (r.left + r.width / 2)) * .28);
                yTo((e.clientY - (r.top + r.height / 2)) * .4);
            });
            btn.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
        });
    }

    /* ══════════════════════════════════════════════
       FOOTER: palabra gigante
    ══════════════════════════════════════════════ */
    function initFooterWord() {
        const word = $('#footer-word');
        if (!word || !motionOn) return;
        const text = word.textContent.trim();
        word.innerHTML = Array.from(text).map(c => c === ' ' ? ' ' : '<span class="ch">' + c + '</span>').join('');
        const chars = $$('.ch', word);
        gsap.set(chars, { yPercent: 105 });
        ScrollTrigger.create({
            trigger: word, start: 'top 96%', once: true,
            onEnter: () => gsap.to(chars, { yPercent: 0, duration: 1.4, stagger: .05, ease: 'expo.out' })
        });
    }

    /* ══════════════════════════════════════════════
       FORMULARIO → WHATSAPP
    ══════════════════════════════════════════════ */
    function initForm() {
        const form = $('#booking');
        if (!form) return;
        const f = {
            name: $('#f-name'), from: $('#f-from'), to: $('#f-to'),
            date: $('#f-date'), time: $('#f-time'), pax: $('#f-pax'), note: $('#f-note')
        };
        const status = $('#booking-status');
        const submit = $('#booking-submit');

        const pad = n => String(n).padStart(2, '0');
        const d = new Date();
        f.date.min = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());

        const setError = (key, msg) => {
            const input = f[key];
            const box = input.closest('.field');
            const out = $('#e-' + (key === 'name' ? 'name' : key));
            box.classList.toggle('has-error', !!msg);
            input.setAttribute('aria-invalid', msg ? 'true' : 'false');
            if (out) { out.textContent = msg || ''; }
            return !msg;
        };

        const validate = () => {
            let ok = true;
            const first = [];
            const check = (key, cond, msg) => { const v = setError(key, cond ? '' : msg); if (!v) { ok = false; first.push(f[key]); } };

            check('name', f.name.value.trim().length >= 2, 'Escribe tu nombre para saber a quién responder.');
            check('from', !!f.from.value, 'Elige de dónde sales.');
            check('to', !!f.to.value, 'Elige a dónde vas.');
            if (f.from.value && f.to.value && f.from.value === f.to.value && f.from.value !== 'Otro punto') {
                setError('to', 'El destino debe ser distinto al origen.'); ok = false; first.push(f.to);
            }
            check('date', !!f.date.value && f.date.value >= f.date.min, 'Elige una fecha de hoy en adelante.');
            check('time', !!f.time.value, 'Elige la hora de salida.');

            if (!ok && first[0]) {
                first[0].focus();
                if (motionOn) gsap.fromTo(first[0].closest('.field'), { x: -8 }, { x: 0, duration: .7, ease: 'elastic.out(1, .3)' });
            }
            return ok;
        };

        ['name', 'from', 'to', 'date', 'time'].forEach(k => {
            f[k].addEventListener('input', () => setError(k, ''));
            f[k].addEventListener('change', () => setError(k, ''));
        });

        form.addEventListener('submit', e => {
            e.preventDefault();
            if (!validate()) { status.textContent = 'Revisa los campos marcados.'; return; }

            const [y, m, day] = f.date.value.split('-');
            const lines = [
                'Hola Taxi Premium, soy ' + f.name.value.trim() + '.',
                'Quiero cotizar un viaje:',
                '• Origen: ' + f.from.value,
                '• Destino: ' + f.to.value,
                '• Fecha: ' + day + '/' + m + '/' + y,
                '• Hora: ' + f.time.value,
                '• Pasajeros: ' + f.pax.value
            ];
            if (f.note.value.trim()) lines.push('• Notas: ' + f.note.value.trim());
            lines.push('', 'Gracias, quedo atento(a) a mi tarifa.');

            const line = (form.elements['linea'] && form.elements['linea'].value) || PHONES.l1;
            const url = WA + line + '?text=' + encodeURIComponent(lines.join('\n'));

            const label = $('span', submit);
            const original = label.textContent;
            submit.disabled = true;
            label.textContent = 'Abriendo WhatsApp...';
            status.innerHTML = '';

            setTimeout(() => {
                const win = window.open(url, '_blank', 'noopener');
                if (!win) window.location.href = url;
                submit.disabled = false;
                label.textContent = original;
                status.innerHTML = 'Listo. Si WhatsApp no se abrió, <a href="' + url + '" target="_blank" rel="noopener">toca aquí para enviarlo</a>.';
            }, 700);
        });
    }

})();
