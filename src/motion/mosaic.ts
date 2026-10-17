import { gsap } from 'gsap';
import { lockScroll } from './scroll';

// Where each tile flies in from while the index assembles: whole tile-widths
// off to a side, so the mosaic reads as blocks sliding into a grid.
const FROM = [
  { xPercent: -120, yPercent: 0 },
  { xPercent: 0, yPercent: -140 },
  { xPercent: 0, yPercent: 120 },
  { xPercent: 130, yPercent: 0 },
  { xPercent: -130, yPercent: 0 },
  { xPercent: 0, yPercent: 130 },
  { xPercent: 0, yPercent: 160 },
  { xPercent: 130, yPercent: 0 },
];

// The index section: on desktop it pins while the eight tiles slide in from
// the edges and lock into the mosaic as you scroll. The same mosaic also opens
// full-screen as the site menu (from the left strip or the pill).
export function initMosaic(reduced: boolean) {
  const section = document.getElementById('index');
  const mosaic = section?.querySelector<HTMLElement>('.mosaic');
  if (!section || !mosaic) return { openMenu: () => {} };

  if (!reduced) {
    const tiles = Array.from(mosaic.children) as HTMLElement[];
    const head = section.querySelector('.index-head');
    const mm = gsap.matchMedia();
    mm.add('(min-width: 900px)', () => {
      gsap
        .timeline({
          scrollTrigger: { trigger: section, start: 'top top', end: '+=90%', pin: true, scrub: 0.6 },
        })
        .from(head, { y: 40, autoAlpha: 0, duration: 0.3, ease: 'power2.out' }, 0)
        .from(
          tiles,
          {
            xPercent: (i) => FROM[i % FROM.length].xPercent,
            yPercent: (i) => FROM[i % FROM.length].yPercent,
            autoAlpha: 0,
            duration: 1,
            stagger: 0.08,
            ease: 'power3.out',
          },
          0.1,
        );
    });
    mm.add('(max-width: 899px)', () => {
      tiles.forEach((tile) =>
        gsap.from(tile, {
          clipPath: 'inset(0 0 100% 0)',
          y: 24,
          duration: 0.8,
          ease: 'power3.out',
          clearProps: 'clipPath,transform',
          scrollTrigger: { trigger: tile, start: 'top 92%', once: true },
        }),
      );
    });
  }

  return { openMenu: buildMenu(mosaic, reduced) };
}

// Full-screen menu: a copy of the mosaic on the grid canvas.
function buildMenu(source: HTMLElement, reduced: boolean) {
  const menu = document.createElement('div');
  menu.className = 'hz-menu grid-canvas';
  menu.id = 'hz-menu';
  menu.setAttribute('role', 'dialog');
  menu.setAttribute('aria-modal', 'true');
  menu.setAttribute('aria-label', 'Sections');
  menu.hidden = true;

  const bar = document.createElement('div');
  bar.className = 'hz-menu-bar';
  bar.innerHTML =
    '<span class="hl-oval">Sections</span><button type="button" class="hz-menu-close">Close <span aria-hidden="true">×</span></button>';
  const grid = source.cloneNode(true) as HTMLElement;
  grid.setAttribute('aria-label', 'Sections');
  menu.append(bar, grid);
  document.body.appendChild(menu);

  const close = bar.querySelector<HTMLButtonElement>('.hz-menu-close')!;
  const tiles = Array.from(grid.children) as HTMLElement[];
  let opener: HTMLElement | null = null;

  const hide = (thenScrollTo?: HTMLElement) => {
    const done = () => {
      menu.hidden = true;
      gsap.set([menu, ...tiles], { clearProps: 'all' });
      lockScroll(false);
      if (thenScrollTo) thenScrollTo.click();
      else opener?.focus();
    };
    if (reduced) return done();
    gsap
      .timeline({ onComplete: done })
      .to(tiles, { clipPath: 'inset(0 0 100% 0)', duration: 0.35, stagger: 0.02, ease: 'power2.in' }, 0)
      .to(menu, { autoAlpha: 0, duration: 0.25 }, 0.2);
  };

  // A tile closes the menu first, then follows its link through the page's
  // smooth-scroll handler (a hidden twin link keeps that one code path).
  tiles.forEach((tile) =>
    tile.addEventListener('click', (e) => {
      e.preventDefault();
      const twin = document.createElement('a');
      twin.href = tile.getAttribute('href')!;
      twin.hidden = true;
      document.body.appendChild(twin);
      hide(twin);
      setTimeout(() => twin.remove(), 2000);
    }),
  );
  close.addEventListener('click', () => hide());
  menu.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hide();
  });

  return (from?: HTMLElement) => {
    opener = from ?? null;
    menu.hidden = false;
    lockScroll(true);
    close.focus();
    if (reduced) return;
    gsap
      .timeline()
      .from(menu, { autoAlpha: 0, duration: 0.2 }, 0)
      .from(
        tiles,
        { clipPath: 'inset(100% 0 0 0)', duration: 0.55, stagger: 0.045, ease: 'power3.out', clearProps: 'clipPath' },
        0.05,
      );
  };
}
