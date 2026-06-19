export function StatusPill({
  children,
  tone = "neutral"
}: {
  children: React.ReactNode;
  tone?: "neutral" | "red" | "dark";
}) {
  return <span className={`status-pill ${tone === "neutral" ? "" : tone}`}>{children}</span>;
}
