import type { CvPalette } from '@store/cvs/single/types'

/**
 * One-click colour schemes in the design panel. Each sets all seven roles; the user can then
 * change any single role. Data, not app chrome, so the hex values live here rather than in
 * `src/styles/tokens.ts`.
 */
export type PalettePreset = { id: string; name: string; palette: CvPalette }

export const PALETTE_PRESETS: PalettePreset[] = [
  {
    id: 'ararat',
    name: 'Արարատ',
    palette: { accent: '#c2410c', background: '#ffffff', text: '#2f2a26', heading: '#1c1917', muted: '#78716c', sidebarBackground: '#292524', sidebarText: '#f5f5f4' },
  },
  {
    id: 'sevan',
    name: 'Սևան',
    palette: { accent: '#0369a1', background: '#ffffff', text: '#1e293b', heading: '#0c1a2b', muted: '#64748b', sidebarBackground: '#0c4a6e', sidebarText: '#e0f2fe' },
  },
  {
    id: 'apricot',
    name: 'Ծիրան',
    palette: { accent: '#f08a24', background: '#fffaf3', text: '#3b2f25', heading: '#2a1d12', muted: '#8d7b6a', sidebarBackground: '#fde7cc', sidebarText: '#3b2f25' },
  },
  {
    id: 'pomegranate',
    name: 'Նուռ',
    palette: { accent: '#b91c3c', background: '#ffffff', text: '#2f2326', heading: '#1f0f13', muted: '#7d6a6e', sidebarBackground: '#5f0f22', sidebarText: '#fde8ec' },
  },
  {
    id: 'dilijan',
    name: 'Դիլիջան',
    palette: { accent: '#15803d', background: '#ffffff', text: '#22302a', heading: '#10221a', muted: '#6b7c73', sidebarBackground: '#14532d', sidebarText: '#ecfdf3' },
  },
  {
    id: 'tuff',
    name: 'Տուֆ',
    palette: { accent: '#be6a4b', background: '#fbf5f1', text: '#3e302a', heading: '#2b1d17', muted: '#8f7c72', sidebarBackground: '#e9d2c5', sidebarText: '#3e302a' },
  },
  {
    id: 'night',
    name: 'Գիշեր',
    palette: { accent: '#818cf8', background: '#ffffff', text: '#272a3a', heading: '#11132a', muted: '#6c6f86', sidebarBackground: '#11132a', sidebarText: '#e3e5ff' },
  },
  {
    id: 'lavender',
    name: 'Նարդոս',
    palette: { accent: '#7c3aed', background: '#faf8ff', text: '#2f2a40', heading: '#1d1830', muted: '#857f99', sidebarBackground: '#ede9fe', sidebarText: '#2f2a40' },
  },
  {
    id: 'graphite',
    name: 'Գրաֆիտ',
    palette: { accent: '#404040', background: '#ffffff', text: '#2b2b2b', heading: '#111111', muted: '#7a7a7a', sidebarBackground: '#ececec', sidebarText: '#2b2b2b' },
  },
  {
    id: 'sunflower',
    name: 'Արևածաղիկ',
    palette: { accent: '#ca8a04', background: '#ffffff', text: '#292524', heading: '#1c1917', muted: '#78716c', sidebarBackground: '#1c1917', sidebarText: '#fef9c3' },
  },
]
