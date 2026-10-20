import { gsap } from 'gsap';

const KEY = 'hz-desktop-note-dismissed';

// On narrow screens, a small card suggests the desktop site, where the index
// mosaic and the catalogue-and-docket workbench have room. Dismissed once, it
// stays dismissed (remembered in this browser, when storage is available).
export function initMobileNote(reduced: boolean) {
  if (!matchMedia('(max-width: 899px)').matches) return;
  try {
    if (localStorage.getItem(KEY)) return;
  } catch {}

  const note = document.createElement('aside');
  note.className = 'hz-note';
  note.setAttribute('aria-label', 'Viewing tip');
  note.innerHTML =
    '<p class="hz-note-text"><strong>Best on a bigger screen →</strong><em> the catalogue and docket are easier to work on a desktop.</em></p>' +
    '<div class="hz-note-actions">' +
    '<button type="button" class="hz-note-ok">Got it</button>' +
    '<button type="button" class="hz-note-x" aria-label="Dismiss this tip"><span aria-hidden="true">×</span></button>' +
    '</div>';
  document.body.appendChild(note);

  const dismiss = () => {
    try {
      localStorage.setItem(KEY, '1');
    } catch {}
    const done = () => note.remove();
    if (reduced) return done();
    gsap.to(note, { yPercent: -130, autoAlpha: 0, duration: 0.35, ease: 'power2.in', onComplete: done });
  };
  note.querySelectorAll('button').forEach((b) => b.addEventListener('click', dismiss));

  if (!reduced) gsap.from(note, { yPercent: -130, autoAlpha: 0, duration: 0.6, delay: 1.2, ease: 'power3.out' });
}
