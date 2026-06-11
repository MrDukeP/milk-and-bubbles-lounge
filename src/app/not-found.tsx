import Link from "next/link";

export default function NotFound() {
  return (
    <main className="site-shell not-found-stage">
      <div className="ambient-grain" />
      <h1>Nothing Here</h1>
      <Link href="/">Milk &amp; Bubbles</Link>
    </main>
  );
}
