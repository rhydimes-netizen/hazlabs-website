import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';

const SVG = 'http://www.w3.org/2000/svg';
const W = 1440;
const H = 900;

// Small seeded PRNG so the contours look the same on every visit.
function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// One closed contour: a circle warped by a few low-frequency waves, smoothed
// into cubic Béziers (Catmull-Rom). Rings share their phases, so neighbouring
// contours stay roughly parallel like a survey map.
function contour(cx: number, cy: number, r: number, k: number, ph: number[]) {
  const n = 72;
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const w =
      1 +
      0.13 * Math.sin(3 * a + ph[0] + k * 0.32) +
      0.07 * Math.sin(5 * a + ph[1] - k * 0.21) +
      0.035 * Math.sin(9 * a + ph[2] + k * 0.11);
    pts.push([cx + Math.cos(a) * r * w, cy + Math.sin(a) * r * w * 0.82]);
  }
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d + 'Z';
}

function el<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>) {
  const node = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  return node;
}

function hill(cx: number, cy: number, r0: number, step: number, count: number, seed: number) {
  const rand = rng(seed);
  const ph = [rand() * 6.28, rand() * 6.28, rand() * 6.28];
  const g = el('g', {});
  for (let k = 0; k < count; k++) {
    // Every fourth ring is an "index contour": slightly heavier, as on a topo sheet.
    const index = k % 4 === 3;
    g.appendChild(
      el('path', {
        d: contour(cx, cy, r0 + k * step, k, ph),
        class: index ? 'hz-contour hz-contour-index' : 'hz-contour',
      }),
    );
  }
  return g;
}

function buildBackdrop() {
  const svg = el('svg', {
    class: 'hz-hero-bg',
    viewBox: `0 0 ${W} ${H}`,
    preserveAspectRatio: 'xMidYMid slice',
    'aria-hidden': 'true',
    focusable: 'false',
  });
  const far = hill(1130, 170, 46, 52, 11, 7);
  const near = hill(140, 930, 70, 58, 8, 19);
  const cross = el('g', { class: 'hz-cross' });
  cross.append(
    el('line', { x1: 1010, y1: 0, x2: 1010, y2: H, class: 'hz-rule' }),
    el('line', { x1: 0, y1: 600, x2: W, y2: 600, class: 'hz-rule' }),
    el('circle', { cx: 1010, cy: 600, r: 9, class: 'hz-mark' }),
    el('path', { d: 'M1010 586v28M996 600h28', class: 'hz-mark' }),
  );
  svg.append(far, near, cross);
  return { svg, far, near, cross };
}

// "1–10" -> counts 0→1 and 0→10 together, keeping the dash.
function countUp(node: HTMLElement, delay: number) {
  const text = node.textContent ?? '';
  const nums = text.match(/\d+/g);
  if (!nums) return;
  const state = nums.map(() => ({ v: 0 }));
  const render = () => {
    let i = 0;
    node.textContent = text.replace(/\d+/g, () => String(Math.round(state[i++].v)));
  };
  render();
  state.forEach((s, i) =>
    gsap.to(s, { v: Number(nums[i]), duration: 1.4, delay, ease: 'power3.out', onUpdate: render }),
  );
}

export function initHero(reduced: boolean) {
  const hero = document.querySelector<HTMLElement>('section.hero');
  if (!hero) return;
  const { svg, far, near, cross } = buildBackdrop();
  hero.prepend(svg);

  if (reduced) return;

  const wrap = hero.querySelector<HTMLElement>('.wrap')!;
  const oval = hero.querySelector('.hl-oval');
  const h1 = hero.querySelector('h1')!;
  const lead = hero.querySelector('.lead');
  const ctas = lead?.nextElementSibling;
  const figures = hero.querySelectorAll<HTMLElement>('.figures > div');

  // Contours draw themselves in from the summit outwards.
  const paths = svg.querySelectorAll<SVGPathElement>('.hz-contour');
  paths.forEach((p) => {
    const len = p.getTotalLength();
    p.style.strokeDasharray = `${len}`;
    p.style.strokeDashoffset = `${len}`;
  });
  const rules = svg.querySelectorAll<SVGLineElement>('.hz-rule');
  rules.forEach((l) => {
    const len = l.getTotalLength();
    l.style.strokeDasharray = `${len}`;
    l.style.strokeDashoffset = `${len}`;
  });

  const split = SplitText.create(h1, { type: 'lines', mask: 'lines', linesClass: 'hz-line' });

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  tl.to(paths, { strokeDashoffset: 0, duration: 2.4, stagger: 0.05, ease: 'power2.inOut' }, 0)
    .to(rules, { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut' }, 0.3)
    .from(svg.querySelectorAll('.hz-mark'), { scale: 0, transformOrigin: '50% 50%', duration: 0.6, ease: 'back.out(2)' }, 1.2)
    .from(oval, { y: 16, autoAlpha: 0, duration: 0.7 }, 0.15)
    .from(split.lines, { yPercent: 105, duration: 1, stagger: 0.09 }, 0.25)
    .from([lead, ctas], { y: 24, autoAlpha: 0, duration: 0.8, stagger: 0.1 }, 0.65)
    .from(figures, { y: 28, autoAlpha: 0, duration: 0.8, stagger: 0.08 }, 0.9);
  figures.forEach((f, i) => {
    const n = f.querySelector<HTMLElement>('.fig');
    if (n) countUp(n, 0.95 + i * 0.08);
  });

  // Scrolling away: the copy lifts and fades while the map lags behind it.
  gsap
    .timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } })
    .to(wrap, { y: -60, opacity: 0.35, ease: 'none' }, 0)
    .to(svg, { y: 120, ease: 'none' }, 0);

  // Pointer parallax: the two hills and the crosshair drift at different depths.
  if (matchMedia('(pointer: fine)').matches) {
    const layers = [
      [far, 18],
      [near, 10],
      [cross, 5],
    ] as const;
    const movers = layers.map(([g, s]) => ({
      s,
      x: gsap.quickTo(g, 'x', { duration: 1.2, ease: 'power3.out' }),
      y: gsap.quickTo(g, 'y', { duration: 1.2, ease: 'power3.out' }),
    }));
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      movers.forEach((m) => {
        m.x(-nx * m.s * 2);
        m.y(-ny * m.s * 2);
      });
    });
  }
}
