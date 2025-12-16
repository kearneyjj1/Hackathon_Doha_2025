export function createRenderer(root) {
  root.innerHTML = `
    <main class="game">
      <section class="panel">
        <header class="header">
          <h1 class="title" id="title"></h1>
          <p class="subtitle">A text adventure of integrity and anti-corruption</p>
        </header>

        <div class="status">
          <span class="stat">Health: <strong id="hp"></strong></span>
          <span class="stat">Tokens: <strong id="tokens"></strong></span>
        </div>

        <hr />

        <div class="layout">
          <!-- LEFT: video window -->
          <aside class="media">
            <div class="media-frame">
              <video id="sceneVideo" class="media-video" autoplay playsinline></video>
              <div class="media-caption" id="mediaCaption"></div>
            </div>
          </aside>

          <!-- RIGHT: story -->
          <section class="story">
            <section class="log" id="log"></section>

            <footer class="controls">
              <input id="command" class="input" placeholder="Enter command…" autocomplete="off" />
              <button class="btn" id="submit">Submit</button>
            </footer>
          </section>
        </div>
      </section>
    </main>
  `;

  const el = {
    title: root.querySelector("#title"),
    log: root.querySelector("#log"),
    hp: root.querySelector("#hp"),
    tokens: root.querySelector("#tokens"),
    input: root.querySelector("#command"),
    submit: root.querySelector("#submit"),
    video: root.querySelector("#sceneVideo"),
    caption: root.querySelector("#mediaCaption"),
  };

  function print(text, className = "narration") {
    const p = document.createElement("p");
    p.className = className;
    p.textContent = text;
    el.log.appendChild(p);
    el.log.scrollTop = el.log.scrollHeight;
  }

  function setTitle(t) { el.title.textContent = t; }

    let prev = { hp: null, tokens: null };

    function flash(el, cls) {
    el.classList.remove("stat--pulse", "stat--up", "stat--down");
    // force reflow so the animation retriggers
    void el.offsetWidth;
    el.classList.add("stat--pulse", cls);
    }

    function renderStats(state) {
        const hp = state.player.hp;
        const tokens = state.player.tokens;

        el.hp.textContent = String(hp);
        el.tokens.textContent = String(tokens);

        if (prev.hp !== null && hp !== prev.hp) {
            flash(el.hp.closest(".stat"), hp > prev.hp ? "stat--up" : "stat--down");
        }
        if (prev.tokens !== null && tokens !== prev.tokens) {
            flash(el.tokens.closest(".stat"), tokens > prev.tokens ? "stat--up" : "stat--down");
        }
        prev = { hp, tokens };
    }


  // IMPORTANT: video swapping helper
  function setVideo({ src, poster, caption } = {}) {
    // Hide/clear if none
    if (!src) {
      el.video.removeAttribute("src");
      el.video.load();
      el.caption.textContent = "";
      return;
    }

    // If using a local file under /public/videos, reference it as "/videos/..."
    el.video.src = src;

    if (poster) el.video.poster = poster;
    else el.video.removeAttribute("poster");

    el.caption.textContent = caption ?? "";

    // Try to play (Safari can be picky; muted+playsinline helps)
    const p = el.video.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  }

  return { el, print, setTitle, renderStats, setVideo };
}
