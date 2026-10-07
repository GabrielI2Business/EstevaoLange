(() => {
  'use strict';
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const header = $('#header');
  const menuButton = $('.menu-toggle');
  const menu = $('#mobile-menu');
  const video = $('#hero-video');
  const videoButton = $('#video-toggle');
  let userPaused = reduced.matches;
  let videoInView = true;
  let ticking = false;

  function updateHeader() {
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 40 || menu.classList.contains('is-open'));
    const range = document.documentElement.scrollHeight - window.innerHeight;
    $('.reading-progress').style.transform = `scaleX(${range > 0 ? Math.min(y / range, 1) : 0})`;
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(updateHeader); ticking = true; }
  }, { passive: true });
  updateHeader();

  function setMenu(open, restoreFocus = false) {
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    menu.classList.toggle('is-open', open);
    menu.inert = !open;
    document.body.classList.toggle('menu-open', open);
    $('main').inert = open;
    updateHeader();
    if (open) $('nav a', menu).focus({ preventScroll: true });
    else if (restoreFocus) menuButton.focus({ preventScroll: true });
  }
  menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true', true));
  $$('a', menu).forEach(link => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => {
    if (!menu.classList.contains('is-open')) return;
    if (e.key === 'Escape') { setMenu(false, true); return; }
    if (e.key === 'Tab') {
      const items = [menuButton, ...$$('a', menu)];
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
      if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
    }
  });
  window.addEventListener('resize', () => { if (window.innerWidth > 800 && menu.classList.contains('is-open')) setMenu(false); }, { passive: true });

  function syncVideoButton() {
    const paused = video.paused;
    videoButton.setAttribute('aria-pressed', String(paused));
    videoButton.setAttribute('aria-label', paused ? 'Reproduzir vídeo de fundo' : 'Pausar vídeo de fundo');
    $('use', videoButton).setAttribute('href', paused ? '#play' : '#pause');
    $('span', videoButton).textContent = paused ? 'REPRODUZIR FILME' : 'PAUSAR FILME';
  }
  function syncVideo() {
    if (userPaused || !videoInView || document.hidden) video.pause();
    else video.play().catch(syncVideoButton);
    syncVideoButton();
  }
  videoButton.addEventListener('click', () => { userPaused = !video.paused; syncVideo(); });
  video.addEventListener('play', syncVideoButton);
  video.addEventListener('pause', syncVideoButton);
  new IntersectionObserver(entries => { videoInView = entries[0].isIntersecting; syncVideo(); }, { threshold: 0.02 }).observe($('.hero'));
  document.addEventListener('visibilitychange', syncVideo);
  reduced.addEventListener('change', () => { userPaused = reduced.matches; syncVideo(); });
  syncVideo();

  $$('.practice button').forEach(button => button.addEventListener('click', () => {
    const row = button.closest('.practice');
    const opening = !row.classList.contains('is-open');
    $$('.practice').forEach(item => {
      const open = item === row && opening;
      item.classList.toggle('is-open', open);
      $('button', item).setAttribute('aria-expanded', String(open));
      $('.practice-content', item).inert = !open;
    });
    window.setTimeout(() => window.ScrollTrigger?.refresh(), 550);
  }));

  const privacy = $('#privacy-dialog');
  $('.privacy-trigger').addEventListener('click', () => privacy.showModal());
  $('.dialog-close').addEventListener('click', () => privacy.close());
  privacy.addEventListener('click', e => { if (e.target === privacy) { const r = privacy.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) privacy.close(); } });
  $('#year').textContent = new Date().getFullYear();

  $$('a[href^="#"]').forEach(link => link.addEventListener('click', e => {
    const target = $(link.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const y = target.getBoundingClientRect().top + window.scrollY - (target.id === 'inicio' ? 0 : 73);
    window.scrollTo({ top: y, behavior: reduced.matches ? 'instant' : 'smooth' });
    history.replaceState(null, '', link.getAttribute('href'));
    if (link.classList.contains('skip-link')) { target.tabIndex = -1; target.focus({ preventScroll: true }); }
  }));
  const navLinks = $$('.desktop-nav a');
  new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) {
      navLinks.forEach(a => a.removeAttribute('aria-current'));
      const link = navLinks.find(a => a.getAttribute('href') === '#' + entry.target.id);
      link?.setAttribute('aria-current', 'location');
    }
  }, { rootMargin: '-20% 0px -55% 0px', threshold: 0 }).observe($('#essencia'));
  ['atuacao', 'abordagem', 'contato'].forEach(id => new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) { navLinks.forEach(a => a.removeAttribute('aria-current')); navLinks.find(a => a.getAttribute('href') === '#' + id)?.setAttribute('aria-current', 'location'); }
  }, { rootMargin: '-20% 0px -55% 0px' }).observe($('#' + id)));

  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  const mm = gsap.matchMedia();
  mm.add({ motion: '(prefers-reduced-motion: no-preference)', desktop: '(min-width: 801px)' }, context => {
    if (!context.conditions.motion) return;
    const desktop = context.conditions.desktop;
    const intro = gsap.timeline({ defaults: { ease: 'power3.out' } });
    intro.from('.hero-intro', { opacity: 0, y: 12, duration: 1 }, .15)
      .from('.hero h1 .line>span', { yPercent: 115, rotate: 2, duration: 1.45, stagger: .12 }, .2)
      .from('.hero-bottom', { y: 22, opacity: 0, duration: 1.1 }, .9)
      .from('.hero-footer', { opacity: 0, duration: 1 }, 1.1);
    // Keep the opening fully readable even when a device throttles animation frames.
    const introDeadline = window.setTimeout(() => intro.progress(1), 2600);
    context.add(() => () => window.clearTimeout(introDeadline));

    gsap.to('.hero-media video', { scale: 1.19, yPercent: 7, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1.1 } });
    gsap.to('.hero-content', { y: desktop ? -90 : -45, opacity: .2, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom 25%', scrub: 1 } });

    const heading = $('.word-reveal');
    if (!heading.dataset.split) {
      const wrap = node => {
        if (node.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          node.textContent.split(/(\s+)/).forEach(word => {
            if (/^\s+$/.test(word)) frag.append(document.createTextNode(word));
            else if (word) { const span = document.createElement('span'); span.className = 'word'; span.textContent = word; frag.append(span); }
          });
          node.replaceWith(frag);
        } else [...node.childNodes].forEach(wrap);
      };
      [...heading.childNodes].forEach(wrap); heading.dataset.split = 'true';
    }
    gsap.fromTo('.word-reveal .word', { opacity: .2 }, { opacity: 1, stagger: .12, ease: 'none', scrollTrigger: { trigger: '.manifesto-body', start: 'top 72%', end: 'bottom 60%', scrub: .6 } });

    $$('.reveal').forEach(el => {
      gsap.from(el, { y: 35, opacity: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 94%', once: true } });
    });
    gsap.fromTo('.portrait-parallax', { yPercent: 0 }, { yPercent: -2, ease: 'none', scrollTrigger: { trigger: '.portrait-frame', start: 'top bottom', end: 'bottom top', scrub: 1 } });
    gsap.from('.portrait-frame', { clipPath: 'inset(8% 0% 8% 0%)', duration: 1.4, ease: 'power3.out', scrollTrigger: { trigger: '.portrait-frame', start: 'top 80%', once: true } });
    gsap.to('.expertise-art>img', { yPercent: -6, ease: 'none', scrollTrigger: { trigger: '.expertise', start: 'top bottom', end: 'bottom top', scrub: 1 } });

    if (desktop) {
      const legacy = gsap.timeline({ scrollTrigger: { trigger: '.legacy-stage', start: 'top top', end: '+=85%', pin: true, scrub: 1, anticipatePin: 1, invalidateOnRefresh: true } });
      legacy.fromTo('.legacy-image', { scale: 1.22 }, { scale: 1, ease: 'none', duration: 1 }, 0)
        .fromTo('.legacy-word', { scale: .88, opacity: .6 }, { scale: 1.25, opacity: .13, duration: 1, ease: 'none' }, 0)
        .from('.legacy-content h2', { y: 65, opacity: .1, duration: .5 }, 0)
        .from('.legacy-rule', { scaleY: 0, transformOrigin: 'top', duration: .4 }, .3)
        .from('.legacy-content>p:last-child', { opacity: 0, y: 15, duration: .35 }, .4);
    } else {
      gsap.from('.legacy-content', { y: 25, opacity: 0, duration: 1.2, scrollTrigger: { trigger: '.legacy', start: 'top 70%', once: true } });
      gsap.to('.legacy-image', { scale: 1, ease: 'none', scrollTrigger: { trigger: '.legacy', start: 'top bottom', end: 'bottom top', scrub: 1 } });
    }

    $$('.method-step').forEach(step => {
      gsap.from($('.method-line', step), { scaleX: 0, ease: 'none', scrollTrigger: { trigger: step, start: 'top 80%', end: 'bottom 55%', scrub: .6 } });
      gsap.from($$('div, .method-number', step), { y: 26, opacity: 0, duration: 1, stagger: .12, scrollTrigger: { trigger: step, start: 'top 87%', once: true } });
    });
    gsap.to('.working-frame img', { yPercent: -7, ease: 'none', scrollTrigger: { trigger: '.approach', start: 'top bottom', end: 'bottom top', scrub: 1 } });
  });

  mm.add('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
    const cursor = $('.cursor-aura');
    const moveX = gsap.quickTo(cursor, 'x', { duration: .45, ease: 'power3' });
    const moveY = gsap.quickTo(cursor, 'y', { duration: .45, ease: 'power3' });
    const onMove = e => { cursor.style.opacity = '1'; const offset = cursor.classList.contains('is-hover') ? 26 : 17; moveX(e.clientX - offset); moveY(e.clientY - offset); };
    const onLeave = () => cursor.style.opacity = '0';
    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    const cleanups = [];
    $$('a, button').forEach(el => {
      const enter = () => cursor.classList.add('is-hover'); const leave = () => cursor.classList.remove('is-hover');
      el.addEventListener('pointerenter', enter); el.addEventListener('pointerleave', leave);
      cleanups.push(() => { el.removeEventListener('pointerenter', enter); el.removeEventListener('pointerleave', leave); });
    });
    $$('[data-magnetic]').forEach(el => {
      const move = e => { const r = el.getBoundingClientRect(); gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * .06, y: (e.clientY - r.top - r.height / 2) * .12, duration: .4, ease: 'power2.out' }); };
      const leave = () => gsap.to(el, { x: 0, y: 0, duration: .7, ease: 'elastic.out(1, .5)' });
      el.addEventListener('pointermove', move); el.addEventListener('pointerleave', leave);
      cleanups.push(() => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); });
    });
    return () => { window.removeEventListener('pointermove', onMove); document.documentElement.removeEventListener('pointerleave', onLeave); cursor.style.opacity = '0'; cleanups.forEach(f => f()); };
  });
  document.fonts.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener('load', () => { ScrollTrigger.refresh(); updateHeader(); }, { once: true });
})();
