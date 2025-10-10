export const navigate = (path) => {
  if (location.hash !== '#' + path) location.hash = path
}
export function useHashLocation(setter) {
  function handler() { setter(location.hash.slice(1) || '/login') }
  window.addEventListener('hashchange', handler)
  return () => window.removeEventListener('hashchange', handler)
}