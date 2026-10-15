export const paletteColors = {
  emeraude: ["#10B981", "#059669", "#047857"],
  orange: ["#F97316", "#EA580C", "#C2410C"],
  violet: ["#A855F7", "#9333EA", "#7E22CE"],
  rouge: ["#EF4444", "#DC2626", "#B91C1C"],
  ambre: ["#F59E0B", "#D97706", "#B45309"],
  framboise: ["#EC4899", "#DB2777", "#BE185D"],
  lime: ["#84CC16", "#65A30D", "#4D7C0F"],
  cuivre: ["#C87948", "#AD643B", "#8F4B2C"],
} as const;
export type PaletteName = keyof typeof paletteColors;
export const themes = ["SYSTEM", "LIGHT", "DARK"] as const;
export const variants = ["LIGHT", "STANDARD", "DARK"] as const;
export function isPalette(v: string): v is PaletteName {
  return Object.prototype.hasOwnProperty.call(paletteColors, v);
}
