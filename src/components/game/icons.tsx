/** Inline SVG icons copied from the original markup (stroke inherits currentColor). */

export function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6.8 4.4c0-1.3 1.45-2.05 2.5-1.32l10.5 7.25c.98.68.98 2.12 0 2.8L9.3 20.4c-1.05.73-2.5-.03-2.5-1.32V4.4z" />
    </svg>
  );
}

export function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" stroke="none">
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  );
}

export function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="8.5" cy="8.5" r="5.25" />
      <path d="m12.4 12.4 4 4" />
    </svg>
  );
}

export function SkipIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 4l10 8-10 8V4z" fill="currentColor" stroke="none" />
      <path d="M19 5v14" />
    </svg>
  );
}

export function RerollIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3.5 9.5A8.5 8.5 0 0 1 18 6.4" />
      <path d="M18 2.5v4h-4" />
      <path d="M20.5 14.5A8.5 8.5 0 0 1 6 17.6" />
      <path d="M6 21.5v-4h4" />
    </svg>
  );
}

export function FromStartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 5.6c0-.8.9-1.3 1.6-.9l8.4 5.4c.6.4.6 1.4 0 1.8l-8.4 5.4c-.7.4-1.6-.1-1.6-.9V5.6z" />
    </svg>
  );
}

export function ShuffleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M16 3h5v5" />
      <path d="M4 20 21 3" />
      <path d="M21 16v5h-5" />
      <path d="m15 15 6 6" />
      <path d="m4 4 5 5" />
    </svg>
  );
}

export function LibraryIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 4h4v16H4z" />
      <path d="M10 4h4v16h-4z" />
      <path d="m16.5 5 3.9-.9 3.6 15.6-3.9.9z" />
    </svg>
  );
}

export function SpotifyIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm4.59 14.42a.75.75 0 0 1-1.03.25c-2.82-1.72-6.37-2.11-10.55-1.16a.75.75 0 1 1-.33-1.46c4.57-1.04 8.5-.59 11.66 1.34.35.22.46.68.25 1.03Zm1.22-2.72a.94.94 0 0 1-1.29.31c-3.23-1.98-8.15-2.56-11.97-1.4a.94.94 0 1 1-.54-1.79c4.37-1.33 9.79-.68 13.5 1.59.44.27.58.85.3 1.29Zm.11-2.84c-3.87-2.3-10.26-2.51-13.96-1.39a1.12 1.12 0 1 1-.65-2.15C7.56 6.03 14.62 6.28 19.08 8.93a1.12 1.12 0 1 1-1.16 1.93Z" />
    </svg>
  );
}

export function TriangleIndicator() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="0"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="songspot-filter-indicator"
      aria-hidden="true"
    >
      <path d="M13.73 4a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    </svg>
  );
}
