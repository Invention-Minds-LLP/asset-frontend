// Guard `window` with typeof — it does not exist during server-side rendering (SSR).
const isLan = typeof window !== 'undefined' && window.location.hostname.startsWith('192.168.');

export const environment = {
  production: false,
  // apiUrl: isLan
  //   ? 'http://192.168.14.36:3001/api'
  //   : '/api'
   // Served behind Nginx, which reverse-proxies /api to the backend on the same host.
   apiUrl: '/api'
  //  apiUrl: 'http://localhost:3001/api'
    // apiUrl:'https://smart-assets-812956739285.us-east4.run.app/api'

};
