import Link from "next/link";

export type CollectionCard = { kind: "genre" | "decade" | "artist"; slug: string; label: string; total: number };

const GROUPS: { key: CollectionCard["kind"]; title: string; typeLabel: string; description: string }[] = [
  { key: "genre", title: "Genres", typeLabel: "Genre", description: "A focused round built around this sound." },
  { key: "decade", title: "Decades", typeLabel: "Decade", description: "Songs released across this decade." },
  { key: "artist", title: "Artists", typeLabel: "Artist", description: "Hits and collaborations from this artist." },
];

export function CollectionsSection({ collections, showBrowse = true, limitArtists = 24 }: { collections: CollectionCard[]; showBrowse?: boolean; limitArtists?: number }) {
  return (
    <section className="songspot-collection-discovery" aria-labelledby="songspot-collections-heading">
      <div className="songspot-collection-discovery-heading">
        <div>
          <p>Pick your playlist</p>
          <h2 id="songspot-collections-heading">Explore Music Quizzes</h2>
          <span>Choose a sound, an era, or a favorite artist and jump into a focused round.</span>
        </div>
        {showBrowse ? <Link href="/music-quizzes">Browse all quizzes</Link> : null}
      </div>
      <div className="songspot-collection-sections">
        {GROUPS.map((g) => {
          const items = collections.filter((c) => c.kind === g.key).slice(0, g.key === "artist" ? limitArtists : undefined);
          if (items.length === 0) return null;
          return (
            <section key={g.key} className="songspot-collection-row-section" aria-labelledby={`songspot-collections-${g.key}`}>
              <h3 id={`songspot-collections-${g.key}`}>{g.title}</h3>
              <div className="songspot-collection-row">
                {items.map((c) => (
                  <Link key={c.slug} href={`/music-quizzes/${c.slug}`} className="songspot-collection-card">
                    <span className="songspot-collection-card-type">{g.typeLabel}</span>
                    <strong>{c.label}</strong>
                    <span className="songspot-collection-card-description">{g.description}</span>
                    <span className="songspot-collection-card-count">
                      <b>{c.total}</b> songs
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}
