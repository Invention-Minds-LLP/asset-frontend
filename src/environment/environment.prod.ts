// Detect where the app is being accessed from.
// Guard `window` with typeof — it does not exist during server-side rendering (SSR).
const host = typeof window !== 'undefined' ? window.location.hostname : '';
const isLan = host.startsWith('192.168.');
const isLocal = host === 'localhost' || host === '127.0.0.1';

export const environment = {
    production: true,
  // apiUrl: isLan
  //   ? 'http://192.168.14.36:3001/api'
  //   : '/api'
  // Served behind Nginx, which reverse-proxies /api to the backend on the same host.
  apiUrl: '/api'
  // apiUrl: 'http://localhost:3001/api'
  // apiUrl:'https://smart-assets-812956739285.us-east4.run.app/api'
};
