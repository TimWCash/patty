/* Service Physics S mark: two interlocking chevron forms. */
export function Logo({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size * 1.45} viewBox="0 0 100 145" xmlns="http://www.w3.org/2000/svg" aria-label="Service Physics">
      <path d="M58 0 L92 0 L52 48 L18 48 Z M18 48 L52 48 L52 90 L18 55 Z" fill="#0b2e3c" />
      <path d="M42 145 L8 145 L48 97 L82 97 Z M82 97 L48 97 L48 55 L82 90 Z" fill="#124559" />
    </svg>
  );
}

/* Patty mark: twin Patagonia-style peaks with an orange sun. */
export function PattyMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-label="Patty">
      <rect width="48" height="48" rx="13" fill="#022b3b" />
      <circle cx="33" cy="15" r="5" fill="#cf5c36" />
      <path d="M4 38 L17 16 L24 27 L29 20 L44 38 Z" fill="#628c93" />
      <path d="M4 38 L17 16 L26 38 Z" fill="#f9f8f8" opacity="0.92" />
    </svg>
  );
}
