"use client";

import { useRef, useState } from "react";
import styles from "./page.module.css";

function Motif() {
  return (
    <svg className={styles.motif} viewBox="0 0 900 260" fill="none" aria-hidden="true">
      <g stroke="#c9982f" strokeWidth="1.2" opacity="0.35">
        <path d="M40 200 Q 130 60 220 200 T 400 200" />
        <path d="M500 200 Q 590 60 680 200 T 860 200" />
      </g>
      <g fill="#c9982f">
        <circle cx="40" cy="200" r="3.5" />
        <circle cx="220" cy="200" r="3.5" />
        <circle cx="400" cy="200" r="3.5" />
        <circle cx="500" cy="200" r="3.5" />
        <circle cx="680" cy="200" r="3.5" />
        <circle cx="860" cy="200" r="3.5" />
      </g>
      <g stroke="#a85436" strokeWidth="1" opacity="0.3">
        <path d="M0 230 L 900 230" strokeDasharray="1 11" />
      </g>
    </svg>
  );
}

function PlayButton({ src, label }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  if (!src) return null;

  return (
    <>
      <button
        type="button"
        className={styles.playButton}
        aria-label={`Play pronunciation of ${label}`}
        onClick={() => {
          if (!audioRef.current) return;
          if (playing) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
          } else {
            audioRef.current.play().catch(() => {});
          }
        }}
      >
        {playing ? "❚❚" : "▶"}
      </button>
      <audio
        ref={audioRef}
        src={src}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />
    </>
  );
}

// The API can hand back plain strings in some places and small objects in
// others (e.g. a definition group, or a field that changed shape). This
// makes sure we never try to render a raw object as text, which is what
// caused the earlier crash — instead we pull out something sensible or
// skip it quietly.
function safeText(value) {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(safeText).filter(Boolean).join("; ");
  if (typeof value === "object") {
    return value.text || value.definition || value.igbo || value.english || value.word || "";
  }
  return "";
}

// Real definitions come back grouped by word class, like:
//   { wordClass: "noun", definitions: ["hunger", "desire"], nsibidi: "..." }
// but some entries (or older data) may just be a plain string. Normalize
// both into { wordClass, items } so rendering doesn't have to care.
function normalizeDefinitionGroups(rawDefinitions) {
  if (!Array.isArray(rawDefinitions)) return [];

  return rawDefinitions
    .map((group) => {
      if (typeof group === "string") {
        return { wordClass: null, items: [group] };
      }
      if (group && typeof group === "object") {
        const items = Array.isArray(group.definitions)
          ? group.definitions.map(safeText).filter(Boolean)
          : [safeText(group)].filter(Boolean);
        return { wordClass: group.wordClass || null, items };
      }
      return { wordClass: null, items: [] };
    })
    .filter((group) => group.items.length > 0);
}

function WordCard({ entry }) {
  const dialects = Array.isArray(entry.dialects) ? entry.dialects : [];
  const examples = Array.isArray(entry.examples) ? entry.examples : [];
  const definitionGroups = normalizeDefinitionGroups(entry.definitions);

  return (
    <article className={`${styles.card} fade-in`}>
      <div className={styles.cardHead}>
        <h2 className={styles.headword}>{safeText(entry.word)}</h2>
        <PlayButton src={entry.pronunciation} label={safeText(entry.word)} />
      </div>

      {definitionGroups.length > 0 ? (
        <div className={styles.definitionGroups}>
          {definitionGroups.map((group, gi) => (
            <div key={gi} className={styles.definitionGroup}>
              {group.wordClass ? (
                <span className={styles.wordClass}>{group.wordClass}</span>
              ) : null}
              <ol className={styles.definitions}>
                {group.items.map((def, i) => (
                  <li key={i}>{def}</li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      ) : (
        <p className={styles.tagline}>No definition on file for this entry.</p>
      )}

      {examples.length > 0 ? (
        <>
          <p className={styles.sectionLabel}>Example sentences</p>
          <div className={styles.examples}>
            {examples.slice(0, 3).map((ex, i) => (
              <div className={styles.example} key={ex.id || i}>
                <p className={styles.exampleIgbo}>{safeText(ex.igbo)}</p>
                <p className={styles.exampleEnglish}>{safeText(ex.english)}</p>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {dialects.length > 0 ? (
        <>
          <p className={styles.sectionLabel}>Dialect variations</p>
          <div className={styles.dialects}>
            {dialects.map((d, i) => (
              <span className={styles.dialectChip} key={i}>
                <span className={styles.dialectRegion}>
                  {Array.isArray(d.dialects) && d.dialects.length > 0
                    ? d.dialects.join(", ")
                    : "Variant"}
                </span>
                <span className={styles.dialectWord}>{safeText(d.word)}</span>
              </span>
            ))}
          </div>
        </>
      ) : null}
    </article>
  );
}

// Shows /author.jpg if it's been added to the /public folder; otherwise
// falls back to a set of initials so the layout never shows a broken image.
function AuthorPhoto({ initials }) {
  const [broken, setBroken] = useState(false);

  if (broken) {
    return (
      <div className={styles.avatarFallback} aria-hidden="true">
        {initials}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/igodictionary.jpg"
      alt="Oguchi Michael Chinedu"
      className={styles.avatarImg}
      onError={() => setBroken(true)}
    />
  );
}

function AboutDeveloper() {
  return (
    <section className={styles.about} aria-label="About the developer">
      <div className={styles.aboutHead}>
        <div className={styles.avatar}>
          <AuthorPhoto initials="OC" />
        </div>
        <div>
          <h2 className={styles.aboutName}>Oguchi Michael Chinedu</h2>
          <p className={styles.aboutRole}>
            Computer scientist &amp; author of this Igbo dictionary
          </p>
        </div>
      </div>

      <div className={styles.aboutBody}>
        <h3 className={styles.aboutHeading}>Biographical background</h3>
        <p>
          Oguchi Michael Chinedu is from Nnewi South Local Government of Anambra State,
          Amichi precisely. He is a student and emerging computer scientist who studied at
          Nnamdi Azikiwe University from 2021 to 2026. During his time at the university, he
          developed a strong interest in African language technology, particularly the
          documentation and digital processing of Igbo, one of Nigeria&rsquo;s major
          indigenous languages. His academic training combined language studies with
          practical computing skills, which prepared him to create structured linguistic
          resources.
        </p>

        <h3 className={styles.aboutHeading}>Major work and approach</h3>
        <p>
          Chinedu is the author of an Igbo machine-readable dictionary. This digital
          resource organizes Igbo words, meanings, parts of speech, and related linguistic
          information in a structured, computer-friendly format. Unlike traditional printed
          dictionaries, a machine-readable dictionary is designed so that computers and
          language software can easily read, search, and use the data. This makes it useful
          for applications such as translation tools, spell-checkers, educational apps, and
          natural language processing systems for Igbo.
        </p>
        <p>
          His work focuses on accuracy, clear organization, and accessibility. By presenting
          Igbo vocabulary in a format that both humans and machines can use, the dictionary
          helps preserve the language while supporting modern technology.
        </p>

        <h3 className={styles.aboutHeading}>Influences and impact</h3>
        <p>
          Chinedu&rsquo;s project was influenced by the growing need for digital resources in
          African languages and by the academic environment at Nnamdi Azikiwe University.
          The dictionary contributes to language preservation and technological inclusion.
          It can serve students, researchers, software developers, and everyday Igbo
          speakers who want better digital tools for their language.
        </p>

        <h3 className={styles.aboutHeading}>Personal reflection</h3>
        <p>
          As the author, Chinedu&rsquo;s work shows how a university student can combine
          classroom learning with practical innovation. Creating a machine-readable Igbo
          dictionary demonstrates both technical skill and cultural commitment. The project
          highlights the importance of developing digital tools for indigenous languages so
          they remain relevant and usable in the modern world.
        </p>
      </div>
    </section>
  );
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | error | done
  const [error, setError] = useState("");
  const [results, setResults] = useState([]);

  async function runSearch(e) {
    e.preventDefault();
    const keyword = query.trim();
    if (!keyword) return;

    setStatus("loading");
    setError("");

    try {
      const res = await fetch(`/api/search?keyword=${encodeURIComponent(keyword)}`);
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setError(data.error || "Something went wrong.");
        setResults([]);
        return;
      }

      setResults(Array.isArray(data.results) ? data.results : []);
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setError("Could not reach the dictionary right now. Please try again.");
    }
  }

  return (
    <main className={styles.shell}>
      <Motif />

      <header className={styles.header}>
        <p className={styles.wordmark}>Ọkọwa Okwu</p>
        <p className={styles.tagline}>An Igbo dictionary — search a word to see its meaning</p>
      </header>

      <form className={styles.searchForm} onSubmit={runSearch} role="search">
        <input
          className={styles.searchInput}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type an Igbo or English word, e.g. mma, water, biko"
          aria-label="Search for a word"
          autoFocus
        />
        <button className={styles.searchButton} type="submit" disabled={status === "loading"}>
          {status === "loading" ? "Searching…" : "Search"}
        </button>
      </form>
      <p className={styles.hint}>Works with Igbo spellings or English meanings.</p>

      {status === "loading" ? <p className={styles.status}>Looking that up…</p> : null}

      {status === "error" ? <p className={styles.errorBox}>{error}</p> : null}

      {status === "done" && results.length === 0 ? (
        <p className={styles.status}>No entries found for “{query.trim()}”. Try another spelling.</p>
      ) : null}

      {results.length > 0 ? (
        <section className={styles.results} aria-label="Search results">
          {results.map((entry, i) => (
            <WordCard entry={entry} key={entry.id || i} />
          ))}
        </section>
      ) : null}

      <AboutDeveloper />

      <footer className={styles.footer}>
        Word data from{" "}
        <a href="https://igboapi.com" target="_blank" rel="noreferrer">
          IgboAPI
        </a>
        .
      </footer>
    </main>
  );
}
