import { gsap } from 'gsap';
import { headerOffset } from './scroll';

// navLinks: the header and pill-menu links for the same section, kept in sync.
type Entry = { section: HTMLElement; name: string; navLinks: HTMLAnchorElement[] };

const pad = (n: number) => String(n).padStart(2, '0');

// Left-edge strip (desktop): the current section's name runs up the edge,
// rotated, above a menu button that opens the full-screen mosaic and a
// section count. Narrow screens get a thin progress bar instead.
export function initStrip(reduced: boolean, openMenu: (from?: HTMLElement) => void) {
  // Any depth: pinning wraps the index section in a spacer element.
  const sections = Array.from(document.querySelectorAll<HTMLElement>('main section[id]'));
  if (!sections.length) return;

  const entries: Entry[] = sections.map((section) => {
    const navLink = document.querySelector<HTMLAnchorElement>(`header.top a.nl[href="#${section.id}"]`);
    const fallback: Record<string, string> = { top: 'Intro', index: 'Index', contact: 'Contact' };
    const name = navLink?.textContent?.trim() || fallback[section.id] || section.id;
    const navLinks = Array.from(
      document.querySelectorAll<HTMLAnchorElement>(
        `header.top a.nl[href="#${section.id}"], .pill-menu a[href="#${section.id}"]`,
      ),
    );
    return { section, name, navLinks };
  });

  const strip = document.createElement('aside');
  strip.className = 'hz-strip';
  strip.setAttribute('aria-label', 'Current section');
  strip.innerHTML =
    '<span class="hz-strip-title" aria-live="polite"><span class="hz-strip-text"></span></span>' +
    '<button type="button" class="hz-strip-menu" aria-haspopup="dialog" aria-controls="hz-menu">' +
    '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" stroke-width="1.5"/></svg>' +
    '<span class="sr">Open sections</span></button>' +
    '<span class="hz-strip-count code" aria-hidden="true"></span>';
  const progress = document.createElement('div');
  progress.className = 'hz-progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.append(strip, progress);
  document.documentElement.classList.add('has-strip');

  const titleBox = strip.querySelector<HTMLElement>('.hz-strip-title')!;
  let text = strip.querySelector<HTMLElement>('.hz-strip-text')!;
  const count = strip.querySelector<HTMLElement>('.hz-strip-count')!;
  const menuBtn = strip.querySelector<HTMLButtonElement>('.hz-strip-menu')!;
  menuBtn.addEventListener('click', () => openMenu(menuBtn));

  // The pill's Sections button opens the same full-screen menu once JS runs.
  const summary = document.querySelector<HTMLElement>('.pill summary');
  summary?.addEventListener('click', (e) => {
    e.preventDefault();
    openMenu(summary);
  });

  let active = -1;
  function setTitle(name: string, dir: number) {
    if (reduced || active === -1) {
      text.textContent = name;
      return;
    }
    // The new name slides in along the strip while the old one slides out.
    const next = text.cloneNode() as HTMLElement;
    next.textContent = name;
    titleBox.appendChild(next);
    const old = text;
    text = next;
    gsap.fromTo(next, { yPercent: 100 * dir }, { yPercent: 0, duration: 0.5, ease: 'power3.out' });
    gsap.to(old, { yPercent: -100 * dir, duration: 0.5, ease: 'power3.out', onComplete: () => old.remove() });
  }

  function update() {
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    const p = Math.min(Math.max(scrollY / max, 0), 1);
    progress.style.transform = `scaleX(${p})`;

    const line = headerOffset() + innerHeight * 0.3;
    let next = 0;
    entries.forEach((e, i) => {
      if (e.section.getBoundingClientRect().top <= line) next = i;
    });
    if (p > 0.995) next = entries.length - 1;
    if (next === active) return;
    setTitle(entries[next].name, next > active ? 1 : -1);
    count.textContent = `${pad(next + 1)}/${pad(entries.length)}`;
    entries.forEach((e, i) => {
      for (const a of e.navLinks) {
        if (i === next) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      }
    });
    active = next;
  }

  let frame = 0;
  addEventListener(
    'scroll',
    () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    },
    { passive: true },
  );
  addEventListener('resize', update);
  update();
}
