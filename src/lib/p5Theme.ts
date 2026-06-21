export function getP5Theme(isDark: boolean) {
  return isDark ? {
    bg: 15,        // #0f172a
    surface: 30,   // #1e293b
    text: 241,     // #f1f5f9
    textSec: 203,  // #cbd5e1
    grid: 51,      // #334155
    border: 51,
  } : {
    bg: 255,
    surface: 255,
    text: 26,
    textSec: 74,
    grid: 226,
    border: 226,
  }
}
