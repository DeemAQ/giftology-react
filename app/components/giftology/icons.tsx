import type { SVGProps } from 'react';

/** Inline icons for the Giftology sections. Decorative: always `aria-hidden`. */
type IconProps = SVGProps<SVGSVGElement>;

const stroke = (props: IconProps, width = 1.8): IconProps => ({
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: width,
  'aria-hidden': true,
  ...props,
});

export const SearchIcon = (p: IconProps) => (
  <svg {...stroke(p)}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

export const BurgerIcon = (p: IconProps) => (
  <svg {...stroke(p, 1.9)}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

export const CloseIcon = (p: IconProps) => (
  <svg {...stroke(p, 2)}>
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
);

export const ChevronDownIcon = (p: IconProps) => (
  <svg {...stroke(p, 2)}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const GlobeIcon = (p: IconProps) => (
  <svg {...stroke(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z" />
  </svg>
);

export const ArrowIcon = (p: IconProps) => (
  <svg {...stroke(p, 2)}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const ArrowDownIcon = (p: IconProps) => (
  <svg {...stroke(p, 2)}>
    <path d="M12 5v14M6 13l6 6 6-6" />
  </svg>
);

export const SparkIcon = (p: IconProps) => (
  <svg {...stroke(p)}>
    <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />
  </svg>
);

export const StarIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}>
    <path d="M12 0l2.5 9.5L24 12l-9.5 2.5L12 24l-2.5-9.5L0 12l9.5-2.5z" />
  </svg>
);

export const TruckIcon = (p: IconProps) => (
  <svg {...stroke(p, 1.7)} strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 6h11v10H2z" />
    <path d="M13 9h4l4 4v3h-8z" />
    <circle cx="6.5" cy="17.5" r="1.8" />
    <circle cx="17" cy="17.5" r="1.8" />
  </svg>
);

export const MailIcon = (p: IconProps) => (
  <svg {...stroke(p, 1.7)}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </svg>
);

export const InstagramIcon = (p: IconProps) => (
  <svg {...stroke(p, 1.7)}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
  </svg>
);

export const WhatsAppIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}>
    <path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2Zm5 13.6c-.2.6-1.2 1.2-1.7 1.2-.5.1-1 .1-3-.8-2.5-1.1-4-3.7-4.2-3.9-.1-.2-1-1.3-1-2.5s.6-1.7.8-2c.2-.2.5-.3.6-.3h.5c.2 0 .4 0 .6.5l.7 1.7c.1.2.1.4 0 .5l-.4.5c-.1.2-.3.3-.1.6.1.3.7 1.1 1.4 1.7.9.8 1.6 1 1.9 1.2.2.1.4 0 .5-.1l.6-.7c.2-.2.3-.2.6-.1l1.6.8c.2.1.4.2.5.3.1.3.1.7-.1 1.2Z" />
  </svg>
);

export const WhatsAppBubbleIcon = (p: IconProps) => (
  <svg viewBox="0 0 32 32" fill="currentColor" aria-hidden {...p}>
    <path d="M16 3C9.4 3 4 8.4 4 15c0 2.1.6 4.2 1.6 6L4 29l8.2-1.6c1.7.9 3.7 1.4 5.8 1.4 6.6 0 12-5.4 12-12S22.6 3 16 3zm0 21.8c-1.8 0-3.5-.5-5-1.4l-.4-.2-4.8.9.9-4.7-.3-.4c-1-1.6-1.5-3.4-1.5-5.3C5 9.5 9.9 4.7 16 4.7S27 9.5 27 15.6 22.1 24.8 16 24.8zm6.1-7.3c-.3-.2-2-1-2.3-1.1-.3-.1-.5-.2-.8.2-.2.3-.9 1.1-1.1 1.3-.2.2-.4.2-.7.1-1.8-.9-3-1.6-4.2-3.6-.3-.5.3-.5.9-1.6.1-.2 0-.4 0-.5-.1-.2-.8-1.8-1-2.5-.3-.7-.5-.6-.8-.6h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.2 3.4 5.3 4.7 2 .8 2.7.9 3.7.8.6-.1 2-.8 2.3-1.6.3-.8.3-1.4.2-1.6-.1-.1-.3-.2-.6-.3z" />
  </svg>
);
