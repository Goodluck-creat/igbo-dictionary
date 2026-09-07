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

function WordCard({ entry }) {
  const dialects = entry.dialects || [];
  const examples = entry.examples || [];

  return (
    <article className={`${styles.card} fade-in`}>
      <div className={styles.cardHead}>
        <h2 className={styles.headword}>{entry.word}</h2>
        {entry.wordClass ? <span className={styles.wordClass}>{entry.wordClass}</span> : null}
        <PlayButton src={entry.pronunciation} label={entry.word} />
      </div>

      {entry.definitions && entry.definitions.length > 0 ? (
        <ol className={styles.definitions}>
          {entry.definitions.map((def, i) => (
            <li key={i}>{def}</li>
          ))}
        </ol>
      ) : (
        <p className={styles.tagline}>No definition on file for this entry.</p>
      )}

      {examples.length > 0 ? (
        <>
          <p className={styles.sectionLabel}>Example sentences</p>
          <div className={styles.examples}>
            {examples.slice(0, 3).map((ex) => (
              <div className={styles.example} key={ex.id || ex.igbo}>
                <p className={styles.exampleIgbo}>{ex.igbo}</p>
                <p className={styles.exampleEnglish}>{ex.english}</p>
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
                  {(d.dialects || []).join(", ") || "Variant"}
                </span>
                <span className={styles.dialectWord}>{d.word}</span>
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
          placeholder="Type an Igbo or English word, e.g. ​mma, water, biko"
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
          {results.map((entry) => (
            <WordCard entry={entry} key={entry.id} />
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
