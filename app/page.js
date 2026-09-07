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
