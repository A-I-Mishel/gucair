/** Initials avatar used when a university has no logoUrl yet. */
export function UniAvatar({ name, size = 56 }: { name: string; size?: number }) {
  const initials = name
    .split(/\s+/)
    .filter((w) => /[A-Za-z0-9]/.test(w[0] ?? ""))
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
  return (
    <div
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-xl bg-[#1e3a5f] font-bold text-teal-300"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials || "U"}
    </div>
  );
}
