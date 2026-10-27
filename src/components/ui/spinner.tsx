/** Small loading ring for buttons. Uses the text color; still for reduced motion. */
export function Spinner() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="size-3.5 motion-safe:animate-spin"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1.5" />
      <path d="M14.5 8A6.5 6.5 0 0 0 8 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
