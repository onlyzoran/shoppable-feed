type IconProps = {
  className?: string;
  size?: number;
};

export function VerifiedBadgeIcon({ className, size = 12 }: IconProps) {
  return (
    <svg
      aria-label="Подтверждённый аккаунт"
      className={className}
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
    >
      <path
        d="M19.998 3.094 14.638 0l-2.972 5.15H5.23v6.354L0 14.64 3.094 20 0 25.359l5.23 3.137v6.354h6.436L14.638 40l5.36-3.094L25.358 40l2.972-5.15h6.436v-6.354L40 25.358 36.905 20 40 14.641l-5.23-3.137V5.15h-6.437L25.358 0l-5.36 3.094Zm-1.595 22.078-7.22-7.22 2.122-2.121 5.098 5.098 10.12-10.12 2.122 2.121-12.242 12.242Z"
        fill="#0095F6"
      />
    </svg>
  );
}

export function InstagramIcon({ className, size = 16 }: IconProps) {
  return (
    <svg
      aria-hidden
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <rect
        x="2"
        y="2"
        width="20"
        height="20"
        rx="5"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.5" cy="6.5" r="1.25" fill="currentColor" />
    </svg>
  );
}

export function HeartIcon({ className, size = 24 }: IconProps) {
  return (
    <svg
      aria-hidden
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M16.792 3.904A4.989 4.989 0 0 0 12 6.707 4.989 4.989 0 0 0 7.208 3.904 5.003 5.003 0 0 0 3 8.108c0 3.583 3.292 6.5 9 11.392 5.708-4.892 9-8.809 9-11.392a5.003 5.003 0 0 0-4.208-4.204Z"
        stroke="currentColor"
        strokeWidth="1.75"
      />
    </svg>
  );
}

export function CommentIcon({ className, size = 24 }: IconProps) {
  return (
    <svg
      aria-hidden
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615L22 22l-1.344-4.992Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function RepostIcon({ className, size = 24 }: IconProps) {
  return (
    <svg
      aria-hidden
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M7 18V10.5M5.2 10.5 7 8.7 8.8 10.5M7 18H13.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17 6V13.5M15.2 13.5 17 15.3 18.8 13.5M17 6H10.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CalendarIcon({ className, size = 20 }: IconProps) {
  return (
    <svg
      aria-hidden
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <rect
        x="3"
        y="4"
        width="18"
        height="18"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path d="M3 10h18M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

export function PlayIcon({ className, size = 48 }: IconProps) {
  return (
    <svg
      aria-hidden
      className={className}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
    >
      <circle cx="24" cy="24" r="22" fill="rgba(0,0,0,0.45)" />
      <path d="M20 16.5v15l12-7.5-12-7.5Z" fill="#fff" />
    </svg>
  );
}
