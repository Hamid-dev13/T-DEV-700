const isProd = import.meta.env.PROD;
const isDev = import.meta.env.DEV;

const config = {
  env: import.meta.env.MODE,
  isDev,
  isProd,
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000',
};

export default config;
