// Inline stroke icons (lucide-style), no icon dependency. Color via currentColor.
import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 20, children, ...rest }: P & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const CursorIcon = (p: P) => (
  <Svg {...p}>
    <path d="M4 3l7 17 2.5-6.5L20 11z" />
  </Svg>
);
export const PhoneIcon = (p: P) => (
  <Svg {...p}>
    <rect x="7" y="3" width="10" height="18" rx="2" />
    <path d="M11 18h2" />
  </Svg>
);
export const RulerIcon = (p: P) => (
  <Svg {...p}>
    <path d="M3 15l6 6 12-12-6-6z" />
    <path d="M9 9l1.5 1.5M12 6l1.5 1.5M6 12l1.5 1.5" />
  </Svg>
);
export const RefreshIcon = (p: P) => (
  <Svg {...p}>
    <path d="M21 12a9 9 0 1 1-2.6-6.4" />
    <path d="M21 3v4h-4" />
  </Svg>
);
export const BookmarkIcon = (p: P) => (
  <Svg {...p}>
    <path d="M6 3h12v18l-6-4-6 4z" />
  </Svg>
);
export const CollapseIcon = (p: P) => (
  <Svg {...p}>
    <path d="M3 12h7M21 12h-7" />
    <path d="M7 8l-4 4 4 4M17 8l4 4-4 4" />
  </Svg>
);
export const PaletteIcon = (p: P) => (
  <Svg {...p}>
    <path d="M12 3a9 9 0 1 0 0 18c1 0 1.5-.8 1.5-1.5 0-1 .9-1.5 1.8-1.5H18a3 3 0 0 0 3-3 8 8 0 0 0-9-9z" />
    <circle cx="7.5" cy="12" r="1" />
    <circle cx="10" cy="8" r="1" />
    <circle cx="15" cy="8" r="1" />
  </Svg>
);
export const TypeIcon = (p: P) => (
  <Svg {...p}>
    <path d="M4 6V5h16v1M9 19h6M12 5v14" />
  </Svg>
);
export const HeartIcon = (p: P) => (
  <Svg {...p}>
    <path d="M12 20s-7-4.5-9.5-9A4.5 4.5 0 0 1 12 6a4.5 4.5 0 0 1 9.5 5c-2.5 4.5-9.5 9-9.5 9z" />
  </Svg>
);
export const EyedropperIcon = (p: P) => (
  <Svg {...p}>
    <path d="M13 7l4 4M15 5l4 4-9 9H6v-4z" />
  </Svg>
);
export const DownloadIcon = (p: P) => (
  <Svg {...p}>
    <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
  </Svg>
);
export const SearchIcon = (p: P) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4-4" />
  </Svg>
);
