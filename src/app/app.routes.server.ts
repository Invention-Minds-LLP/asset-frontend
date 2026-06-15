import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    renderMode: RenderMode.Prerender
  },
  {
    // Public QR scan landing — dynamic :assetId, so it must be server-rendered
    // (not prerendered) or a cold load from a scanned QR ships a non-hydrated
    // shell and the page's buttons (e.g. "Know More") don't work on mobile.
    path: 'assets/scan/:assetId',
    renderMode: RenderMode.Server,
  },
    {
    path: 'assets/edit/:id',
    renderMode: RenderMode.Server,
  },
  {
    path: 'warranty/edit/:id',
    renderMode: RenderMode.Server,
  },
  {
    path: 'ticket/edit/:id',
    renderMode: RenderMode.Server,
  },
];
