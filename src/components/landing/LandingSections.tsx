import { ArrowUp, Gauge, Headphones, Infinity as InfinityIcon, ListMusic, Search, SlidersHorizontal, Sparkles, TimerReset } from "lucide-react";

const HOW = [
  { icon: Headphones, title: "Play the shortest clip", text: "In songspot, press Play to hear the current clue from the beginning. The first clip lasts only 0.1 seconds, so headphones can help you notice a quiet pickup, drum hit, or vocal breath." },
  { icon: Search, title: "Search for the song", text: "Use songspot title search to enter the track and choose an answer from the suggestions. Sound, rhythm, melody, artist style, or production era can narrow your guess." },
  { icon: ListMusic, title: "Unlock more audio", text: "A wrong answer or Skip moves songspot to a longer clip. Solve the track as early as possible for the strongest score, then review the reveal and start another round." },
];

const FEATURES = [
  { icon: TimerReset, title: "Progressive audio clues", text: "songspot begins with a tiny sound and unlocks longer clips only when you need another clue." },
  { icon: Gauge, title: "Five difficulty levels", text: "Move from Easy to Impossible and match the music challenge to your listening confidence." },
  { icon: SlidersHorizontal, title: "Genre, era, and artist filters", text: "Shape the song library around favorite decades, musical styles, or performers before the next round." },
  { icon: InfinityIcon, title: "Unlimited browser play", text: "Keep playing songspot as a free online music quiz without waiting for tomorrow's puzzle or installing an app." },
  { icon: Search, title: "Fast title suggestions", text: "Type part of a song name, choose the intended track, and spend more time listening than spelling." },
  { icon: Sparkles, title: "Instant round results", text: "See whether the guess was correct, when it was solved, and what to listen for before trying another song." },
];

const FAQ = [
  { q: "Is songspot free to play?", a: "Yes. songspot is a free browser game with unlimited rounds. Open the page, choose your options, and begin guessing without buying an app or waiting for a daily reset." },
  { q: "How much of each song do I hear?", a: "songspot starts with a 0.1-second clue. Wrong guesses and skips progressively reveal longer audio, giving you more rhythm, melody, vocals, or instrumentation to identify the track." },
  { q: "Do I need an account or download?", a: "No signup or download is required for casual play. The game runs directly in a modern browser on desktop or mobile, so a new music quiz is only a press of the Play button away." },
  { q: "Can I choose genres, eras, artists, or difficulty?", a: "Yes. Use the filter reels and difficulty controls to focus on a musical era, genre, artist, or challenge level. A changed filter applies when the next song begins." },
  { q: "What does connecting Spotify do?", a: "Signing in with Spotify imports your top artists and tracks. Switch the library to “My Spotify” to play rounds built from the music you actually listen to, and your favourite artists appear in the Artists reel. Audio still comes from Apple Music previews, so it works without Spotify Premium." },
  { q: "Where does the audio come from?", a: "Every clue is cut from an official 30-second preview provided by Apple Music, played through the Web Audio API so a 0.1-second clip really lasts 0.1 seconds." },
];

export function LandingSections() {
  return (
    <div className="songspot-seo">
      <section id="what-is-song-spot" className="songspot-seo-section songspot-seo-intro" aria-labelledby="songspot-what-title">
        <div className="songspot-seo-copy">
          <p className="songspot-seo-eyebrow">The split-second music challenge</p>
          <h2 id="songspot-what-title">What Is songspot?</h2>
          <p>songspot is a free online song guessing game that turns the opening instant of a track into a music recognition challenge. Every round begins with a 0.1-second audio clip, asking you to catch a beat, vocal, instrument, or production detail before naming the song.</p>
          <p>Unlike a once-a-day Heardle-style puzzle, songspot offers unlimited rounds and flexible filters. Choose a difficulty, era, genre, or artist, then play this quick music quiz alone, compare scores with friends, or use it as a fast name-that-tune party game.</p>
        </div>
        <dl className="songspot-seo-stats">
          <div>
            <dt>0.1s</dt>
            <dd>opening audio clue</dd>
          </div>
          <div>
            <dt>5</dt>
            <dd>clip stages: 0.1 / 0.5 / 2 / 8 / 15s</dd>
          </div>
          <div>
            <dt>15s</dt>
            <dd>longest audio clue</dd>
          </div>
        </dl>
      </section>

      <section id="how-to-play" className="songspot-seo-section" aria-labelledby="songspot-how-title">
        <div className="songspot-seo-heading">
          <p className="songspot-seo-eyebrow">Listen. Guess. Reveal.</p>
          <h2 id="songspot-how-title">How to Play songspot</h2>
          <p>Learning how to play songspot takes one round. Listen closely, search for the title, and decide whether to lock in an answer or reveal a little more of the track.</p>
        </div>
        <ol className="songspot-how-grid">
          {HOW.map((step, i) => (
            <li key={step.title}>
              <span>{String(i + 1).padStart(2, "0")}</span>
              <step.icon aria-hidden="true" />
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="features" className="songspot-seo-section" aria-labelledby="songspot-features-title">
        <div className="songspot-seo-heading">
          <p className="songspot-seo-eyebrow">Built for music fans</p>
          <h2 id="songspot-features-title">songspot Features</h2>
          <p>songspot keeps the classic guess-the-song format quick and focused while giving casual listeners, music trivia fans, and competitive players control over each challenge.</p>
        </div>
        <div className="songspot-feature-grid">
          {FEATURES.map((f) => (
            <article key={f.title}>
              <f.icon aria-hidden="true" />
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="faq" className="songspot-seo-section songspot-seo-faq" aria-labelledby="songspot-faq-title">
        <div className="songspot-seo-heading">
          <p className="songspot-seo-eyebrow">Questions before you press play</p>
          <h2 id="songspot-faq-title">songspot FAQ</h2>
          <p>Quick answers about clips, accounts, filters, and how this browser-based music guessing game works.</p>
        </div>
        <div className="songspot-faq-list">
          {FAQ.map((item, i) => (
            <details key={item.q} open={i === 0}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="songspot-seo-cta" aria-labelledby="songspot-cta-title">
        <p className="songspot-seo-eyebrow">Your next song starts now</p>
        <h2 id="songspot-cta-title">Ready to Play songspot?</h2>
        <p>Return to songspot, turn the volume up, and see how little audio you need to recognize the track.</p>
        <a href="#songspot-game">
          Play the 0.1-second challenge
          <ArrowUp aria-hidden="true" />
        </a>
      </section>
    </div>
  );
}
