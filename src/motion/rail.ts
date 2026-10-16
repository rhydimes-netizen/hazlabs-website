import { headerOffset, scrollToTarget } from './scroll';

type Entry = { section: HTMLElement; link: HTMLAnchorElement; navLink: HTMLAnchorElement | null };

const pad = (n: number) => String(n).padStart(2, '0');

function letters(text: string) {
  const span = document.createElement('span');
  span.className = 't';
  [...text].forEach((ch, i) => {
    const c = document.createElement('i');
    c.textContent = ch;
    c.style.setProperty('--i', String(i));
    span.appendChild(c);
  });
  return span;
}

// A digit wheel for the odometer readout: 0–9 stacked, shifted by transform.
function wheel() {
  const col = document.createElement('span');
  col.className = 'hz-wheel';
  const strip = document.createElement('span');
  for (let d = 0; d < 10; d++) {
    const digit = document.createElement('span');
    digit.textContent = String(d);
    strip.appendChild(digit);
  }
  col.appendChild(strip);
  return { col, set: (d: number) => (strip.style.transform = `translateY(${-d}em)`) };
}

export function initRail(_reduced: boolean) {
  const sections = Array.from(document.querySelectorAll<HTMLElement>('main > section[id]'));
  if (!sections.length) return;

  const rail = document.createElement('nav');
  rail.className = 'hz-rail';
  rail.setAttribute('aria-label', 'Page sections');

  // Ruler: a tick every 2 %, a longer tick every 10 %.
  const track = document.createElement('div');
  track.className = 'hz-rail-track';
  track.setAttribute('aria-hidden', 'true');
  for (let p = 0; p <= 100; p += 2) {
    const t = document.createElement('span');
    t.className = p % 10 === 0 ? 'hz-tick hz-tick-major' : 'hz-tick';
    t.style.top = `${p}%`;
    track.appendChild(t);
  }
  const needle = document.createElement('span');
  needle.className = 'hz-needle';
  track.appendChild(needle);

  const list = document.createElement('ol');
  list.className = 'hz-rail-list';
  const entries: Entry[] = sections.map((section, i) => {
    const navLink = document.querySelector<HTMLAnchorElement>(`header.top a.nl[href="#${section.id}"]`);
    const fallback = section.id === 'top' ? 'Intro' : section.id[0].toUpperCase() + section.id.slice(1);
    const name = navLink?.textContent?.trim() || fallback;
    const li = document.createElement('li');
    const link = document.createElement('a');
    link.href = `#${section.id}`;
    link.setAttribute('aria-label', name);
    const n = document.createElement('span');
    n.className = 'n';
    n.textContent = pad(i + 1);
    link.append(n, letters(name));
    li.appendChild(link);
    list.appendChild(li);
    return { section, link, navLink };
  });

  const readout = document.createElement('div');
  readout.className = 'hz-rail-readout';
  readout.setAttribute('aria-hidden', 'true');
  const wheels = [wheel(), wheel(), wheel()];
  wheels.forEach((w) => readout.appendChild(w.col));
  readout.append('%');

  rail.append(track, list, readout);
  const progress = document.createElement('div');
  progress.className = 'hz-progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.append(rail, progress);

  let maxScroll = 1;
  let trackH = 1;
  let active = -1;

  // Place each label where its section starts on the ruler, nudging labels
  // apart where short sections would otherwise overlap.
  function layout() {
    rail.style.top = `${headerOffset() + 12}px`;
    maxScroll = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    trackH = track.clientHeight;
    const gap = 22;
    const ys = entries.map(({ section }) => {
      const start = section.getBoundingClientRect().top + scrollY - headerOffset();
      return (Math.min(Math.max(start, 0), maxScroll) / maxScroll) * trackH;
    });
    for (let i = 1; i < ys.length; i++) ys[i] = Math.max(ys[i], ys[i - 1] + gap);
    ys[ys.length - 1] = Math.min(ys[ys.length - 1], trackH);
    for (let i = ys.length - 2; i >= 0; i--) ys[i] = Math.min(ys[i], ys[i + 1] - gap);
    entries.forEach((e, i) => (e.link.style.top = `${ys[i]}px`));
    update();
  }

  function update() {
    const p = Math.min(Math.max(scrollY / maxScroll, 0), 1);
    needle.style.transform = `translateY(${p * trackH}px)`;
    progress.style.transform = `scaleX(${p})`;
    const pct = Math.round(p * 100);
    wheels[0].set(Math.floor(pct / 100));
    wheels[1].set(Math.floor(pct / 10) % 10);
    wheels[2].set(pct % 10);

    const line = headerOffset() + innerHeight * 0.3;
    let next = 0;
    entries.forEach((e, i) => {
      if (e.section.getBoundingClientRect().top <= line) next = i;
    });
    if (p > 0.995) next = entries.length - 1;
    if (next !== active) {
      entries.forEach((e, i) => {
        const on = i === next;
        e.link.classList.toggle('is-active', on);
        if (on) e.link.setAttribute('aria-current', 'true');
        else e.link.removeAttribute('aria-current');
        if (e.navLink) {
          if (on) e.navLink.setAttribute('aria-current', 'true');
          else e.navLink.removeAttribute('aria-current');
        }
      });
      active = next;
    }
  }

  let frame = 0;
  addEventListener('scroll', () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(update);
  }, { passive: true });
  addEventListener('resize', layout);
  new ResizeObserver(layout).observe(document.getElementById('main')!);
  layout();

  // Click or drag along the ruler to scrub through the page.
  const seek = (e: PointerEvent) => {
    const r = track.getBoundingClientRect();
    const f = Math.min(Math.max((e.clientY - r.top) / r.height, 0), 1);
    scrollToTarget(f * maxScroll);
  };
  track.addEventListener('pointerdown', (e) => {
    track.setPointerCapture(e.pointerId);
    rail.classList.add('is-dragging');
    seek(e);
  });
  track.addEventListener('pointermove', (e) => {
    if (track.hasPointerCapture(e.pointerId)) seek(e);
  });
  const end = () => rail.classList.remove('is-dragging');
  track.addEventListener('pointerup', end);
  track.addEventListener('pointercancel', end);
}
