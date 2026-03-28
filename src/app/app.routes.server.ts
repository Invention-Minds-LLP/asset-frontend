import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    renderMode: RenderMode.Prerender
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
