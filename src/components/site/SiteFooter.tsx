import Link from "next/link";

export function SiteFooter({ stats }: { stats?: { tracks: number; artists: number } }) {
  return (
    <footer className="songspot-site-footer">
      <div className="songspot-footer-main">
        <section className="songspot-footer-brand">
          <span className="songspot-footer-wordmark">songspot</span>
          <p className="songspot-footer-kicker">Hear less. Know more.</p>
          <h2>A music challenge measured in moments.</h2>
          <p>Start with 0.1 seconds, trust what you hear, and reveal only as much of the track as you need.</p>
        </section>
        <nav className="songspot-footer-nav" aria-label="Songspot footer navigation">
          <section>
            <h3>Play</h3>
            <Link href="/">Normal</Link>
            <Link href="/daily">Daily Challenge</Link>
            <Link href="/music-quizzes">Music Quizzes</Link>
          </section>
          <section>
            <h3>Discover</h3>
            <Link href="/#how-to-play">How to play</Link>
            <Link href="/#features">Features</Link>
            <Link href="/#faq">FAQ</Link>
          </section>
          <section>
            <h3>Library</h3>
            <span>{stats ? `${stats.tracks.toLocaleString("en-US")} songs` : "Thousands of songs"}</span>
            <span>{stats ? `${stats.artists.toLocaleString("en-US")} artists` : "Hundreds of artists"}</span>
            <span>Previews via Apple Music</span>
          </section>
        </nav>
      </div>
      <div className="songspot-footer-bottom">
        <Link href="/">songspot</Link>
        <span />
        <span>© {new Date().getFullYear()} songspot · personal project, not affiliated with songspot.co</span>
      </div>
    </footer>
  );
}
