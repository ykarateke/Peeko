// Mock data for the Styles panel. Replaced by real page extraction in M2/M4.

export const COLORS: string[] = [
  '#eef2f7', '#3a3f45', '#1f2228', '#9aa0a6', '#5b8cff',
  '#ffffff', '#4b74ff', '#3f8a3f', '#3c6186', '#d2563c',
];

export const ACCENTS: string[] = [
  '#2aa6c4', '#5a616b', '#c89a78', '#e6d04e', '#0a0a0a', '#f0b7a6', '#9b6be6',
];

export interface FontToken {
  name: string;
  role: string;
  css: string;
  tw: string;
  weights: number[];
}

export const FONTS: FontToken[] = [
  {
    name: 'Mona Sans VF',
    role: 'Headings, Sans Serif',
    css: "font-family: 'Mona Sans VF', sans-serif;",
    tw: "font-['Mona_Sans_VF']",
    weights: [300, 400, 500, 600],
  },
  {
    name: 'sans-serif',
    role: 'Sans Serif',
    css: "font-family: 'sans-serif', sans-serif;",
    tw: "font-['sans-serif']",
    weights: [400],
  },
  {
    name: 'Monospace Neon',
    role: 'Monospace',
    css: "font-family: 'Monospace Neon', sans-serif;",
    tw: "font-['Monospace_Neon']",
    weights: [400],
  },
];

export const ASSET_COUNT = 64;
export const ELEMENT_COUNT = 855;
