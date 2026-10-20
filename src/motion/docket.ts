import { gsap } from 'gsap';

// The docket's live parts, all read from what the page's own script renders
// (its state is private): #dk-count, and one <li> per code in #dk-list with the
// code, the name and a capacity input.
type Item = { code: string; name: string; qty: string; unit: string };

function items(): Item[] {
  return Array.from(document.querySelectorAll<HTMLElement>('#dk-list > li')).map((li) => {
    const input = li.querySelector<HTMLInputElement>('input[data-qty]');
    return {
      code: li.querySelector('.code')?.textContent?.trim() ?? '',
      name: li.children[1]?.textContent?.trim() ?? '',
      qty: input?.value.trim() ?? '',
      unit: li.querySelector('label .code')?.textContent?.trim() ?? '',
    };
  });
}

const pad = (n: number) => String(n).padStart(2, '0');

export function initDocket(reduced: boolean) {
  const list = document.getElementById('dk-list');
  const pillBtn = document.getElementById('pill-docket') as HTMLAnchorElement | null;
  if (!list || !pillBtn) return;

  // ---- live count on the index tile(s) and the step the visitor is on ----
  const steps = Array.from(document.querySelectorAll<HTMLElement>('.docket-steps li'));
  function sync() {
    const all = items();
    for (const el of document.querySelectorAll<HTMLElement>('[data-docket-count]')) el.textContent = pad(all.length);
    const now = all.length === 0 ? 1 : all.some((i) => !i.qty) ? 2 : 3;
    steps.forEach((li, i) => {
      li.classList.toggle('is-now', i + 1 === now);
      li.classList.toggle('is-done', i + 1 < now);
    });
    if (!tray.hidden) fillTray();
  }

  // ---- the tray: what's in the docket, from the pill ----
  const tray = document.createElement('div');
  tray.className = 'dk-tray';
  tray.id = 'dk-tray';
  tray.setAttribute('role', 'dialog');
  tray.setAttribute('aria-label', 'Your docket');
  tray.hidden = true;
  pillBtn.parentElement!.appendChild(tray);
  pillBtn.setAttribute('aria-controls', 'dk-tray');
  pillBtn.setAttribute('aria-expanded', 'false');

  const esc = (t: string) => t.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
  function fillTray() {
    const all = items();
    const rows = all
      .map(
        (i) =>
          `<li><span class="code">${esc(i.code)}</span><span>${esc(i.name)}</span>` +
          `<span class="muted">${i.qty ? `${esc(i.qty)} ${esc(i.unit)}` : 'Capacity still to add'}</span></li>`,
      )
      .join('');
    tray.innerHTML =
      `<div class="dk-tray-head"><strong>Your docket</strong><span class="fig">${pad(all.length)}</span></div>` +
      (all.length
        ? `<ul>${rows}</ul>`
        : '<p class="dk-tray-empty">Empty for now. Add a code from the catalogue to start a quote.</p>') +
      '<div class="dk-tray-actions">' +
      (all.length ? '<a class="go" href="#docket">Review and send <span aria-hidden="true">→</span></a>' : '') +
      '<a href="#catalogue">Browse the catalogue</a></div>';
  }
  function setTray(open: boolean) {
    if (open === !tray.hidden) return;
    pillBtn!.setAttribute('aria-expanded', String(open));
    if (open) {
      fillTray();
      tray.hidden = false;
      if (!reduced) gsap.from(tray, { y: 16, autoAlpha: 0, duration: 0.35, ease: 'power3.out', clearProps: 'transform,opacity,visibility' });
    } else {
      tray.hidden = true;
    }
  }
  // Capture phase, so the page's smooth-scroll link handler never sees this click.
  pillBtn.addEventListener(
    'click',
    (e) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      setTray(Boolean(tray.hidden));
    },
    true,
  );
  tray.addEventListener('click', (e) => {
    if ((e.target as Element).closest('a')) setTray(false);
  });
  document.addEventListener('click', (e) => {
    if (!tray.hidden && !tray.contains(e.target as Node) && e.target !== pillBtn && !pillBtn.contains(e.target as Node))
      setTray(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !tray.hidden) {
      setTray(false);
      pillBtn.focus();
    }
  });

  // ---- adding a code: a chip flies from the row's button into the pill ----
  // Capture phase: measure the button before the page's script re-renders the rows.
  document.addEventListener(
    'click',
    (e) => {
      const btn = (e.target as Element).closest<HTMLButtonElement>('#rows [data-add]');
      if (!btn || reduced || btn.getAttribute('aria-pressed') === 'true') return;
      const from = btn.getBoundingClientRect();
      const to = pillBtn.getBoundingClientRect();
      const chip = document.createElement('span');
      chip.className = 'dk-fly';
      chip.setAttribute('aria-hidden', 'true');
      chip.textContent = btn.dataset.add ?? '';
      document.body.appendChild(chip);
      const w = chip.offsetWidth;
      const h = chip.offsetHeight;
      const x0 = from.left + from.width / 2 - w / 2;
      const y0 = from.top + from.height / 2 - h / 2;
      const x1 = to.left + to.width / 2 - w / 2;
      const y1 = to.top + to.height / 2 - h / 2;
      pillBtn.dataset.flying = '1';
      gsap.set(chip, { x: x0, y: y0 });
      // x eases straight across while y lifts first, then drops: an arc into the pill.
      gsap
        .timeline({
          onComplete: () => {
            chip.remove();
            delete pillBtn.dataset.flying;
            gsap.fromTo(pillBtn, { scale: 1.14 }, { scale: 1, duration: 0.5, ease: 'back.out(3)', clearProps: 'transform' });
          },
        })
        .to(chip, { x: x1, duration: 0.75, ease: 'power1.inOut' }, 0)
        .to(chip, { y: Math.min(y0, y1) - 120, duration: 0.3, ease: 'power2.out' }, 0)
        .to(chip, { y: y1, duration: 0.45, ease: 'power2.in' }, 0.3)
        .to(chip, { scale: 0.6, autoAlpha: 0.2, duration: 0.2, ease: 'power1.in' }, 0.55);
    },
    true,
  );

  new MutationObserver(sync).observe(list, { childList: true });
  list.addEventListener('input', sync);
  sync();
}
