interface MarkProps {
  className?: string;
}

interface DonutMarkProps extends MarkProps {
  icingColor?: string;
  sprinkleColor?: string;
  size?: "sm" | "md" | "lg";
}

const DONUT_SIZE: Record<NonNullable<DonutMarkProps["size"]>, string> = {
  sm: "h-10 w-10",
  md: "h-14 w-14",
  lg: "h-16 w-16",
};

export function DonutMark({
  icingColor = "#f472b6",
  sprinkleColor = "#38bdf8",
  size = "md",
  className = "",
}: DonutMarkProps) {
  return (
    <span
      aria-hidden
      className={`relative inline-flex shrink-0 items-center justify-center rounded-full bg-amber-500 shadow-sm ring-2 ring-amber-700/15 ${DONUT_SIZE[size]} ${className}`}
    >
      <span
        className="absolute inset-[18%] rounded-full shadow-inner"
        style={{ backgroundColor: icingColor }}
      />
      <span className="absolute inset-[36%] rounded-full bg-amber-50 shadow-inner" />
      <span
        className="absolute left-[24%] top-[32%] h-1 w-2 rotate-12 rounded-full"
        style={{ backgroundColor: sprinkleColor }}
      />
      <span className="absolute right-[25%] top-[28%] h-1 w-2 -rotate-12 rounded-full bg-emerald-300" />
      <span className="absolute bottom-[29%] left-[31%] h-1 w-2 -rotate-45 rounded-full bg-yellow-200" />
      <span className="absolute bottom-[33%] right-[27%] h-1 w-2 rotate-45 rounded-full bg-white/90" />
    </span>
  );
}

export function CoinMark({ className = "" }: MarkProps) {
  return (
    <span
      aria-hidden
      className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-300 shadow-sm ring-2 ring-amber-500/25 ${className}`}
    >
      <span className="h-2.5 w-2.5 rounded-full border border-amber-600/50 bg-amber-100" />
    </span>
  );
}

export function CelebrationMark({ className = "" }: MarkProps) {
  return (
    <span
      aria-hidden
      className={`relative inline-flex h-20 w-20 items-center justify-center rounded-full bg-pink-100 shadow-sm ring-2 ring-pink-200 ${className}`}
    >
      <span className="h-9 w-9 rounded-full bg-purple-500 shadow-md" />
      <span className="absolute left-4 top-3 h-3 w-3 rounded-full bg-amber-300" />
      <span className="absolute right-4 top-5 h-2.5 w-2.5 rounded-full bg-teal-300" />
      <span className="absolute bottom-4 left-5 h-2.5 w-2.5 rounded-full bg-rose-400" />
      <span className="absolute bottom-5 right-4 h-3 w-3 rounded-full bg-orange-300" />
    </span>
  );
}

export function MicMark({ className = "" }: MarkProps) {
  return (
    <span
      aria-hidden
      className={`inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-purple-100 shadow-sm ring-2 ring-purple-200 ${className}`}
    >
      <span className="relative flex h-10 w-8 justify-center">
        <span className="h-7 w-5 rounded-full bg-purple-600" />
        <span className="absolute bottom-2 h-5 w-8 rounded-b-full border-b-4 border-l-4 border-r-4 border-purple-400" />
        <span className="absolute bottom-0 h-3 w-1.5 rounded-full bg-purple-600" />
      </span>
    </span>
  );
}

export function LetterTilesMark({ className = "" }: MarkProps) {
  return (
    <span aria-hidden className={`inline-flex items-center gap-1 ${className}`}>
      {["c", "a", "t"].map((letter, index) => (
        <span
          key={letter}
          className={`flex h-10 w-9 rotate-[-4deg] items-center justify-center rounded-xl border-2 text-xl font-extrabold shadow-sm ${
            index === 1
              ? "border-teal-300 bg-teal-100 text-teal-800"
              : "border-purple-300 bg-purple-100 text-purple-800"
          }`}
        >
          {letter}
        </span>
      ))}
    </span>
  );
}

export function WordBuildMark({ className = "" }: MarkProps) {
  return (
    <span
      aria-hidden
      className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 shadow-sm ring-2 ring-amber-300 ${className}`}
    >
      <span className="text-xl font-black text-amber-900">Aa</span>
    </span>
  );
}
