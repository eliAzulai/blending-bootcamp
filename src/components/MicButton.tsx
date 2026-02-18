"use client";

interface MicButtonProps {
  state: "idle" | "listening" | "correct" | "incorrect" | "disabled";
  onTap: () => void;
  size?: "sm" | "lg";
  label?: string;
}

/** Inline SVG mic icon */
function MicIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Z" />
      <path d="M19 11a1 1 0 1 0-2 0 5 5 0 0 1-10 0 1 1 0 1 0-2 0 7 7 0 0 0 6 6.93V21h-2a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2h-2v-3.07A7 7 0 0 0 19 11Z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17Z" />
    </svg>
  );
}

const SIZE_CLASSES = {
  sm: "h-14 w-14",
  lg: "h-20 w-20",
} as const;

const ICON_SIZE = {
  sm: "h-6 w-6",
  lg: "h-9 w-9",
} as const;

export default function MicButton({
  state,
  onTap,
  size = "lg",
  label,
}: MicButtonProps) {
  const isClickable = state === "idle" || state === "incorrect";

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={isClickable ? onTap : undefined}
        disabled={!isClickable}
        className={[
          "relative flex items-center justify-center rounded-full border-4 transition-all duration-300",
          SIZE_CLASSES[size],
          // State-specific styling
          state === "idle" &&
            "border-purple-400 bg-purple-500 text-white shadow-lg hover:scale-105 active:scale-95 animate-mic-pulse cursor-pointer",
          state === "listening" &&
            "border-teal-400 bg-teal-500 text-white shadow-lg scale-110 animate-mic-listen cursor-default",
          state === "correct" &&
            "border-green-400 bg-green-500 text-white shadow-lg scale-110 cursor-default",
          state === "incorrect" &&
            "border-amber-400 bg-amber-500 text-white shadow-lg animate-mic-shake cursor-pointer",
          state === "disabled" &&
            "border-gray-300 bg-gray-200 text-gray-400 cursor-not-allowed",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {/* Sound wave rings when listening */}
        {state === "listening" && (
          <>
            <span className="absolute inset-0 rounded-full border-2 border-teal-300 animate-mic-wave-1" />
            <span className="absolute -inset-2 rounded-full border-2 border-teal-200 animate-mic-wave-2" />
            <span className="absolute -inset-4 rounded-full border-2 border-teal-100 animate-mic-wave-3" />
          </>
        )}

        {state === "correct" ? (
          <CheckIcon className={ICON_SIZE[size]} />
        ) : (
          <MicIcon className={ICON_SIZE[size]} />
        )}
      </button>

      {label && (
        <span
          className={[
            "text-sm font-semibold",
            state === "correct" && "text-green-600",
            state === "incorrect" && "text-amber-600",
            state === "listening" && "text-teal-600",
            state === "idle" && "text-purple-600",
            state === "disabled" && "text-gray-400",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {label}
        </span>
      )}
    </div>
  );
}
