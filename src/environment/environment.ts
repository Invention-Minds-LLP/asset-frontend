// Guard `window` with typeof — it does not exist during server-side rendering (SSR).
const isLan = typeof window !== 'undefined' && window.location.hostname.startsWith('192.168.');

export const environment = {
  production: false,
  // apiUrl: isLan
  //   ? 'http://192.168.14.36:3001/api'
  //   : '/api'
   apiUrl: 'http://localhost:3001/api'
};
