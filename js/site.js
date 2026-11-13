/* ═══════════════════════════════════════════════════════════════════════════
   VIC BARBERSHOP — navegación y movimiento
   Sin JS, o con "reducir movimiento" activado, la web se lee entera y estática.
   Con movimiento: escenas fijadas, vídeo controlado por el scroll (misma
   técnica que scroll-world: clip cargado como blob, currentTime = scroll,
   suavizado con rAF y seeks sin acumular) y entradas con GSAP ScrollTrigger.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── Menú móvil ───────────────────────────────────────────────────────── */
  var menuBtn = document.querySelector('.menu-btn');
  var mobileNav = document.querySelector('.mobile-nav');
  function setMenu(open) {
    if (!menuBtn || !mobileNav) return;
    mobileNav.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.textContent = open ? 'Cerrar' : 'Menú';
    document.documentElement.style.overflow = open ? 'hidden' : '';
  }
  if (menuBtn && mobileNav) {
    menuBtn.addEventListener('click', function () { setMenu(!mobileNav.classList.contains('open')); });
    mobileNav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
    window.matchMedia('(min-width: 861px)').addEventListener('change', function () { setMenu(false); });
  }

  /* ── ¿Hay movimiento? ─────────────────────────────────────────────────── */
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  if (reduce || !hasGsap) return;

  var gsap = window.gsap, ScrollTrigger = window.ScrollTrigger;
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
  document.documentElement.classList.add('motion');

  /* ── La barra se esconde al bajar y vuelve al subir ───────────────────── */
  var nav = document.querySelector('.nav');
  ScrollTrigger.create({
    start: 200, end: 'max',
    onUpdate: function (self) {
      if (mobileNav && mobileNav.classList.contains('open')) return;
      nav.classList.toggle('hide', self.direction === 1);
    },
    onLeaveBack: function () { nav.classList.remove('hide'); }
  });

  /* ── Hero: bucle real + deriva con el scroll ──────────────────────────── */
  var heroVideo = document.querySelector('.hero-media video');
  if (heroVideo) {
    heroVideo.muted = true;
    var p = heroVideo.play();
    if (p && p.catch) p.catch(function () {});
    gsap.to(heroVideo, {
      yPercent: 10, scale: 1.08, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });
  }

  /* ── Vídeo controlado por el scroll ───────────────────────────────────── */
  function ScrubVideo(wrap) {
    var video = wrap.querySelector('video');
    var src = video.getAttribute('data-src');
    var state = { target: 0, current: 0, duration: 0, loaded: false, loading: false, raf: 0 };

    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';

    function load() {
      if (state.loading) return;
      state.loading = true;
      // Blob en memoria: siempre se puede buscar, aunque el hosting no sirva rangos.
      fetch(src).then(function (r) { return r.blob(); }).then(function (blob) {
        video.src = URL.createObjectURL(blob);
        video.load();
      }).catch(function () { video.src = src; video.load(); });
    }
    video.addEventListener('loadedmetadata', function () {
      state.duration = video.duration || 0;
      state.loaded = true;
      video.currentTime = 0.001;
    });
    // El póster se queda hasta que el clip pinta su primer fotograma (iOS).
    video.addEventListener('seeked', function once() {
      wrap.classList.add('ready');
      video.removeEventListener('seeked', once);
    });
    // iOS no pinta un vídeo que nunca se ha reproducido: se "ceba" al primer toque.
    window.addEventListener('touchstart', function prime() {
      window.removeEventListener('touchstart', prime);
      var pr = video.play();
      if (pr && pr.then) pr.then(function () { video.pause(); }).catch(function () {});
    }, { passive: true });

    function tick() {
      state.raf = 0;
      if (!state.loaded) { state.raf = requestAnimationFrame(tick); return; }
      state.current += (state.target - state.current) * 0.18;
      var diff = Math.abs(state.target - state.current);
      if (diff < 0.0005) state.current = state.target;
      // No encolar un seek mientras el decodificador sigue con el anterior.
      if (!video.seeking) {
        var t = Math.min(state.duration - 0.04, Math.max(0, state.current * state.duration));
        if (Math.abs(video.currentTime - t) > 0.008) video.currentTime = t;
      }
      if (state.current !== state.target || video.seeking) state.raf = requestAnimationFrame(tick);
    }
    this.set = function (progress) {
      state.target = Math.min(1, Math.max(0, progress));
      if (!state.raf) state.raf = requestAnimationFrame(tick);
    };

    new IntersectionObserver(function (entries, io) {
      if (entries.some(function (e) { return e.isIntersecting; })) { load(); io.disconnect(); }
    }, { rootMargin: '150% 0px' }).observe(wrap);
  }

  /* ── Escena «La vuelta» ───────────────────────────────────────────────── */
  var vuelta = document.querySelector('.vuelta');
  if (vuelta) {
    var vScrub = new ScrubVideo(vuelta.querySelector('.scrub'));
    var beats = vuelta.querySelectorAll('.beats .statement');
    gsap.set(beats, { opacity: 0, y: 28 });
    var tl = gsap.timeline({
      defaults: { ease: 'power2.out' },
      scrollTrigger: {
        trigger: vuelta, start: 'top top', end: 'bottom bottom', scrub: .4,
        onUpdate: function (self) { vScrub.set(self.progress); }
      }
    });
    tl.to({}, { duration: 1 }, 0);
    var n = beats.length, slot = 1 / n;
    beats.forEach(function (b, i) {
      var at = i * slot;
      tl.to(b, { opacity: 1, y: 0, duration: slot * .22 }, at + slot * .04);
      if (i < n - 1) tl.to(b, { opacity: 0, y: -28, duration: slot * .2, ease: 'power2.in' }, at + slot * .8);
    });
    gsap.from('.vuelta .scrub', {
      clipPath: 'inset(18% 18% 18% 18%)', ease: 'none',
      scrollTrigger: { trigger: vuelta, start: 'top 80%', end: 'top top', scrub: true }
    });
  }

  /* ── Escena «Textura»: la ventana se abre mientras gira ───────────────── */
  var textura = document.querySelector('.textura');
  if (textura) {
    var tScrub = new ScrubVideo(textura.querySelector('.scrub'));
    var tVideoWrap = textura.querySelector('.scrub');
    gsap.timeline({
      scrollTrigger: {
        trigger: textura, start: 'top 35%', end: 'bottom bottom', scrub: .4,
        onUpdate: function (self) { tScrub.set(self.progress); }
      }
    })
      .fromTo(tVideoWrap, { clipPath: 'inset(30% 24% 30% 24%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'power2.inOut', duration: .55 }, 0)
      .fromTo(tVideoWrap.querySelectorAll('video, img'), { scale: 1.3 }, { scale: 1, ease: 'power2.inOut', duration: .55 }, 0);
  }

  /* ── Galería: recorrido horizontal fijado (solo escritorio) ───────────── */
  var gallery = document.querySelector('.gallery');
  if (gallery) {
    var mm = gsap.matchMedia();
    mm.add('(min-width: 861px)', function () {
      var stage = gallery.querySelector('.gallery-stage');
      var track = gallery.querySelector('.track');
      gallery.classList.add('pinned');
      function dist() { return Math.max(0, track.scrollWidth - window.innerWidth); }
      function size() { gallery.style.height = (dist() + window.innerHeight) + 'px'; }
      size();
      ScrollTrigger.addEventListener('refreshInit', size);
      var tween = gsap.to(track, {
        x: function () { return -dist(); }, ease: 'none',
        scrollTrigger: { trigger: gallery, start: 'top top', end: 'bottom bottom', scrub: .5, invalidateOnRefresh: true }
      });
      track.querySelectorAll('.shot img').forEach(function (img) {
        gsap.fromTo(img, { xPercent: -6, scale: 1.14 }, {
          xPercent: 6, scale: 1.14, ease: 'none',
          scrollTrigger: { trigger: img, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true }
        });
      });
      return function () {
        ScrollTrigger.removeEventListener('refreshInit', size);
        gallery.classList.remove('pinned');
        gallery.style.height = '';
        gsap.set(track, { clearProps: 'transform' });
        void stage;
      };
    });
  }

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
})();
