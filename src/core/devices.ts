// Device profiles for the simulator (opens the page in a device-sized popup window).

export interface DeviceProfile {
  id: string;
  label: string;
  group: 'Phone' | 'Tablet' | 'Desktop' | 'Watch';
  width: number;
  height: number;
  dpr: number;
}

export const DEVICES: DeviceProfile[] = [
  { id: 'iphone-15', label: 'iPhone 15', group: 'Phone', width: 393, height: 852, dpr: 3 },
  { id: 'iphone-se', label: 'iPhone SE', group: 'Phone', width: 375, height: 667, dpr: 2 },
  { id: 'pixel-8', label: 'Pixel 8', group: 'Phone', width: 412, height: 915, dpr: 2.625 },
  { id: 'ipad', label: 'iPad', group: 'Tablet', width: 820, height: 1180, dpr: 2 },
  { id: 'ipad-pro', label: 'iPad Pro 11"', group: 'Tablet', width: 834, height: 1194, dpr: 2 },
  { id: 'laptop', label: 'Laptop', group: 'Desktop', width: 1280, height: 800, dpr: 1 },
  { id: 'desktop', label: 'Desktop', group: 'Desktop', width: 1440, height: 900, dpr: 1 },
  { id: 'watch', label: 'Apple Watch', group: 'Watch', width: 184, height: 224, dpr: 2 },
];

/** Swap width/height for landscape. */
export function orient(p: DeviceProfile, landscape: boolean): { width: number; height: number } {
  return landscape ? { width: p.height, height: p.width } : { width: p.width, height: p.height };
}
