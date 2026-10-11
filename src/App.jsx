import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import confetti from "canvas-confetti";
import {
  ArrowLeft,
  ArrowRight,
  Hand,
  Heart,
  Moon,
  Sparkles,
} from "lucide-react";

const moments = [
  {
    number: "01",
    eyebrow: "A MOMENT TO CELEBRATE",
    title: "A fresh page",
    copy: "Take a moment to celebrate what you’ve done so far, enjoy the day as it comes, and look ahead to whatever you choose to do next.",
    art: "bloom",
    icon: "✳",
  },
  {
    number: "02",
    eyebrow: "A WISH FOR THE YEAR",
    title: "More of what matters",
    copy: "May the year ahead bring good company, time for the things that matter, and plenty of reasons to pause and enjoy the moment.",
    art: "moon",
    icon: "☾",
  },
  {
    number: "03",
    eyebrow: "A NEW CHAPTER",
    title: "Space for possibility",
    copy: "A new year opens the door to fresh ideas, unexpected turns, and chances to discover what feels right—one step at a time.",
    art: "sky",
    icon: "✧",
  },
];

function launchConfetti(party = false) {
  const colors = party
    ? ["#ff5cac", "#7a6cff", "#62f0d0", "#ffd48a", "#ffffff"]
    : ["#ffd48a", "#ff81b8", "#9b8cff", "#71e7e0", "#fff5d9"];

  confetti({
    particleCount: party ? 48 : 135,
    spread: party ? 75 : 105,
    startVelocity: party ? 30 : 46,
    origin: { y: party ? 0.78 : 0.63 },
    colors,
    scalar: party ? 0.9 : 1.1,
    zIndex: 20,
  });
  if (!party) {
    window.setTimeout(
      () =>
        confetti({
          particleCount: 65,
          spread: 130,
          startVelocity: 35,
          origin: { y: 0.65, x: 0.18 },
          colors,
          zIndex: 20,
        }),
      220,
    );
    window.setTimeout(
      () =>
        confetti({
          particleCount: 65,
          spread: 130,
          startVelocity: 35,
          origin: { y: 0.65, x: 0.82 },
          colors,
          zIndex: 20,
        }),
      340,
    );
  }
}

function App() {
  const [opened, setOpened] = useState(false);
  const [opening, setOpening] = useState(false);
  const [assetsState, setAssetsState] = useState("loading");
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [letterOpen, setLetterOpen] = useState(false);
  const [flipped, setFlipped] = useState({});
  const audioRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    let audio;
    let audioUrl;

    async function prepareAssets() {
      try {
        const [response] = await Promise.all([
          fetch("/music/bday-song.m4a", { signal: controller.signal }),
          document.fonts?.ready ?? Promise.resolve(),
        ]);
        if (!response.ok) {
          throw new Error(`Birthday music could not be loaded (${response.status}).`);
        }

        const music = await response.blob();
        if (cancelled) return;

        audioUrl = URL.createObjectURL(music);
        audio = new Audio();
        audio.preload = "auto";
        audio.loop = true;
        audio.src = audioUrl;
        audioRef.current = audio;

        await new Promise((resolve, reject) => {
          const onReady = () => {
            cleanup();
            resolve();
          };
          const onError = () => {
            cleanup();
            reject(new Error("Birthday music is not supported or could not be decoded."));
          };
          const cleanup = () => {
            audio.removeEventListener("loadeddata", onReady);
            audio.removeEventListener("error", onError);
          };

          audio.addEventListener("loadeddata", onReady, { once: true });
          audio.addEventListener("error", onError, { once: true });
          audio.load();

          if (audio.readyState >= 2) onReady();
        });

        if (!cancelled) setAssetsState("ready");
      } catch (error) {
        if (!cancelled && error.name !== "AbortError") {
          console.error("Unable to prepare the birthday experience:", error);
          setAssetsState("error");
        }
      }
    }

    prepareAssets();
    return () => {
      cancelled = true;
      controller.abort();
      audio?.pause();
      if (audio) {
        audio.removeAttribute("src");
        audio.load();
      }
      if (audioRef.current === audio) audioRef.current = null;
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [loadAttempt]);

  useEffect(() => {
    const move = (event) => {
      document.documentElement.style.setProperty("--pointer-x", `${event.clientX}px`);
      document.documentElement.style.setProperty("--pointer-y", `${event.clientY}px`);
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, []);

  useEffect(() => {
    if (!opened) return undefined;
    const timer = window.setInterval(() => launchConfetti(true), 2800);
    return () => window.clearInterval(timer);
  }, [opened]);

  function openGift() {
    if (opened || opening) return;
    setOpening(true);
    try {
      const playback = audioRef.current?.play();
      if (playback && typeof playback.catch === "function") {
        playback.catch((error) => {
          console.error("Birthday music could not be started:", error);
        });
      }
    } catch (error) {
      console.error("Birthday music could not be started:", error);
    }
    launchConfetti();
    window.setTimeout(() => setOpened(true), 650);
  }

  if (assetsState !== "ready") {
    return (
      <main className="party-mode loading-screen">
        <div className="ambient ambient-one" />
        <div className="ambient ambient-two" />
        <div className="ambient ambient-three" />
        <div className="grain" aria-hidden="true" />
        <div className="loading-content" role="status" aria-live="polite">
          <div className="loading-orbit"><span /></div>
          {assetsState === "loading" ? (
            <>
              <p className="loading-kicker">A LITTLE UNIVERSE, JUST FOR YOU</p>
              <h1>Getting your surprise ready<span>✦</span></h1>
              <p className="loading-copy">Warming up the music and sprinkling a little magic.</p>
              <div className="loading-track"><span /></div>
            </>
          ) : (
            <>
              <p className="loading-kicker">ONE LITTLE THING WENT AWRY</p>
              <h1>Your surprise is waiting<span>✦</span></h1>
              <p className="loading-copy">We couldn’t load the music. Check your connection and try again.</p>
              <button className="retry-button" onClick={() => {
                setAssetsState("loading");
                setLoadAttempt((attempt) => attempt + 1);
              }}>
                TRY AGAIN
              </button>
            </>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="party-mode">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="ambient ambient-three" />
      <div className="grain" aria-hidden="true" />
      <div className="star-field" aria-hidden="true">
        {Array.from({ length: 28 }, (_, index) => (
          <i
            className="star"
            key={index}
            style={{
              "--star-x": `${(index * 37 + 8) % 100}%`,
              "--star-y": `${(index * 53 + 4) % 100}%`,
              "--star-delay": `${(index % 8) * -0.7}s`,
              "--star-size": `${index % 5 === 0 ? 3 : 2}px`,
            }}
          />
        ))}
        {Array.from({ length: 9 }, (_, index) => (
          <i
            className="drifting-particle"
            key={`particle-${index}`}
            style={{
              "--particle-x": `${(index * 41 + 13) % 100}%`,
              "--particle-delay": `${(index % 6) * -1.9}s`,
              "--particle-duration": `${12 + (index % 5) * 3}s`,
            }}
          />
        ))}
        <i className="shooting-star shooting-star-one" />
        <i className="shooting-star shooting-star-two" />
      </div>

      <AnimatePresence>
        {!opened && (
          <motion.section
            className="hero"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.06, filter: "blur(16px)" }}
            transition={{ duration: 0.8 }}
          >
            <div className="hero-kicker"><span /> A LITTLE UNIVERSE, JUST FOR YOU <span /></div>
            <motion.h1
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.15 }}
            >
              HAPPY BIRTHDAY
              <span className="name-gradient">GLAIZA<span className="title-sparkle">✦</span></span>
            </motion.h1>
            <motion.p
              className="hero-subtitle"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.42, duration: 0.7 }}
            >
              A little corner of the universe, made just for you.
            </motion.p>

            <motion.div
              className={`gift-stage ${opening ? "is-opening" : ""}`}
              initial={{ opacity: 0, scale: 0.82, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 80, damping: 14, delay: 0.35 }}
            >
              <div className="orbit orbit-one" />
              <div className="orbit orbit-two" />
              <div className="orbit orbit-three" />
              <div className="gift-halo" />
              <motion.button
                className="gift-trigger"
                type="button"
                onClick={openGift}
                aria-label="Open your birthday gift and play the birthday music"
                aria-disabled={opening}
                whileHover={!opening ? { scale: 1.06 } : undefined}
                whileTap={!opening ? { scale: 0.93 } : undefined}
              >
                <div className="gift-box" aria-hidden="true">
                  <div className="gift-lid">
                    <span className="ribbon ribbon-lid" />
                    <span className="bow bow-left" />
                    <span className="bow bow-right" />
                    <span className="bow-knot" />
                  </div>
                  <div className="gift-body">
                    <span className="ribbon ribbon-body" />
                    <span className="gift-heart">✦</span>
                  </div>
                </div>
                <Hand className="gift-tap-hint" size={34} strokeWidth={1.7} aria-hidden="true" />
                <span className="tap-ripple tap-ripple-one" aria-hidden="true" />
                <span className="tap-ripple tap-ripple-two" aria-hidden="true" />
              </motion.button>
              <span className="float-sparkle sparkle-a">✧</span>
              <span className="float-sparkle sparkle-b">✦</span>
              <span className="float-sparkle sparkle-c">✧</span>
              <span className="float-sparkle sparkle-d">·</span>
            </motion.div>

            <motion.div
              className="scroll-hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              transition={{ delay: 1.2 }}
            >SOMETHING LOVELY IS WAITING</motion.div>
          </motion.section>
        )}
      </AnimatePresence>

      {opened && (
        <motion.div
          className="gift-shockwave"
          initial={{ scale: 0.03, opacity: 0.9 }}
          animate={{ scale: 10, opacity: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      )}

      <AnimatePresence>
        {opened && (
          <motion.div
            id="surprise"
            className="surprise-hub"
            initial={{ opacity: 0, y: 44 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <section className="welcome reveal-section">
              <h2>A whole little world<br />to <em>celebrate you.</em></h2>
              <div className="welcome-rule"><i /><Sparkles size={13} /><i /></div>
            </section>

            <section className="letter-section reveal-section" id="letter">
              <div className="section-label"> SOMETHING FROM THE HEART</div>
              <motion.button
                className={`letter-card glass-card ${letterOpen ? "letter-is-open" : ""}`}
                onClick={() => setLetterOpen((value) => !value)}
                aria-expanded={letterOpen}
                whileHover={{ y: -4 }}
              >
                {!letterOpen ? (
                  <div className="letter-front">
                    <div className="letter-stamp"><Heart size={17} fill="currentColor" /></div>
                    <span className="letter-small">A NOTE FOR YOU</span>
                    <span className="letter-title">A little birthday letter</span>
                    <span className="letter-action">TAP TO UNFOLD <span>↗</span></span>
                  </div>
                ) : (
                  <motion.div
                    className="letter-inside"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <span className="letter-small">DEAR GLAIZA,</span>
                    <p>
                      Today is a lovely excuse to remind you how much your presence matters.
                      The world is brighter for all the warmth, laughter, and unmistakably
                      <em> you</em> that you bring into it.
                    </p>
                    <p>
                      I hope this next trip around the sun brings gentle mornings, brave new
                      beginnings, belly laughs that last too long, and little surprises that
                      remind you how loved you are.
                    </p>
                    <p className="letter-signoff">You deserve every good thing. Today and always.</p>
                    <span className="letter-signature">With so much love <span>✦</span></span>
                    <span className="letter-action close-letter">TAP TO FOLD</span>
                  </motion.div>
                )}
              </motion.button>
            </section>

            <section className="gallery-section reveal-section">
              <div className="section-label"> LITTLE THINGS WORTH KEEPING</div>
              <div className="gallery-heading">
                <div><h3>A scrapbook of <em>good things.</em></h3>
                <p>Tap a card for the note tucked inside.</p></div>
                <div className="gallery-arrows">
                  <button className="icon-button" onClick={() => setFlipped({})} aria-label="Reset cards"><ArrowLeft size={16} /></button>
                  <span>THREE LITTLE NOTES</span>
                  <button className="icon-button" onClick={() => setFlipped((old) => ({ ...old, 0: true, 1: true, 2: true }))} aria-label="Turn over all cards"><ArrowRight size={16} /></button>
                </div>
              </div>
              <div className="memory-grid">
                {moments.map((moment, index) => (
                  <motion.button
                    key={moment.number}
                    className={`memory-card ${flipped[index] ? "is-flipped" : ""}`}
                    onClick={() => setFlipped((old) => ({ ...old, [index]: !old[index] }))}
                    whileHover={{ y: -7, rotate: index === 1 ? 0 : index === 0 ? -1 : 1 }}
                    aria-label={`${flipped[index] ? "Show front of" : "Read"} ${moment.title}`}
                  >
                    <div className="memory-card-inner">
                      <div className={`memory-front art-${moment.art}`}>
                        <div className="art-orb" />
                        <div className="art-sun" />
                        <span className="art-icon">{moment.icon}</span>
                        <span className="memory-number">{moment.number} / 03</span>
                        <div className="memory-caption">
                          <span>{moment.eyebrow}</span>
                          <strong>{moment.title}</strong>
                        </div>
                        <span className="flip-hint">FLIP FOR A NOTE ↗</span>
                      </div>
                      <div className="memory-back glass-card">
                        <span className="back-star">✧</span>
                        <span className="letter-small">{moment.eyebrow}</span>
                        <strong>{moment.title}</strong>
                        <p>{moment.copy}</p>

                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </section>

            <footer className="footer">
              <div className="footer-ornament"><i /><Sparkles size={14} /><i /></div>
              <p>Another year of <em>being wonderfully you.</em></p>
              <div className="footer-sign">MADE WITH LOVE <Heart size={12} fill="currentColor" /> FOR GLAIZA</div>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

export default App;
