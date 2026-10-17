import type { ComponentType } from 'react';
// Type after brand.dropbox.com: a sharp variable grotesk for headings and
// figures, a neutral grotesk for text (both OFL, served with the site).
import '@fontsource-variable/bricolage-grotesque/standard.css';
import '@fontsource-variable/instrument-sans/standard.css';
import './motion';

// One entry per animation: placeholder id in index.html -> island component.
// Islands (and React itself) load only when their placeholder scrolls near the
// viewport, so the Remotion code never slows down the first page view.
const islands: Record<string, () => Promise<ComponentType>> = {
  // 'anim-etp': () => import('./islands/EtpPlayer').then((m) => m.EtpPlayer),
};

const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const el = entry.target as HTMLElement;
      observer.unobserve(el);
      Promise.all([import('react-dom/client'), islands[el.id]()]).then(([{ createRoot }, Island]) =>
        createRoot(el).render(<Island />),
      );
    }
  },
  { rootMargin: '200px' },
);

for (const id of Object.keys(islands)) {
  const el = document.getElementById(id);
  if (el) observer.observe(el);
}
