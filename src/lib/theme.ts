export const THEME_STORAGE_KEY = 'theme'

// Runs in <head> before first paint (see the public layout) so a stored "dark"
// preference never flashes light. Default is light; no OS-preference detection.
export const themeInitScript = `try{if(localStorage.getItem('${THEME_STORAGE_KEY}')==='dark'){document.documentElement.classList.add('dark')}}catch(e){}`
