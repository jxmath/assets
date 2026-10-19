const PER_PAGE = 30;
const base = document.baseURI;

const icons = {
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4v16l13-8z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>',
  heart: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7.5-4.6-9.5-9.2C1 8.3 3.2 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.8 0 6 3.8 4.5 7.3C19.5 16.4 12 21 12 21z"/></svg>',
  heartOutline: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s-7.5-4.6-9.5-9.2C1 8.3 3.2 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.8 0 6 3.8 4.5 7.3C19.5 16.4 12 21 12 21z"/></svg>',
  download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>',
  spin: '<span class="spinner"></span>'
};

let songs = [];
let liked = JSON.parse(localStorage.getItem("jx-music-liked") || "[]");
let view = "all";
let page = 1;
let queue = [];
let current = null;
let shuffle = false;
let repeat = false;

const audio = new Audio();
audio.hidden = true;
document.body.appendChild(audio);
const $ = (id) => document.getElementById(id);
const tip = $("tip");
const songUrl = (id) => new URL("assets/songs/" + id + ".mp3", base).href;
const imgUrl = (id) => new URL("assets/images/" + id + ".png", base).href;
const imgUrlJpeg = (id) => new URL("assets/images/" + id + ".jpeg", base).href;
const imgFallback = (el, id) => { el.onerror = null; el.src = imgUrlJpeg(id); };
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => "&#" + c.charCodeAt(0) + ";");

function fmt(t) {
  if (!isFinite(t)) return "0:00";
  return Math.floor(t / 60) + ":" + String(Math.floor(t % 60)).padStart(2, "0");
}

function visibleSongs() {
  const q = $("search").value.trim().toLowerCase();
  const list = view === "liked" ? songs.filter((s) => liked.includes(s.id)) : songs;
  if (!q) return list;
  return list.filter((s) => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q));
}

function swap() {
  const box = $("songs");
  box.classList.remove("swap");
  void box.offsetWidth;
  box.classList.add("swap");
}

function render() {
  const list = visibleSongs();
  const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
  if (page > pages) page = pages;
  const box = $("songs");

  if (!list.length) {
    box.innerHTML = '<p class="empty">' + (view === "liked" ? "no liked songs yet" : "no songs found") + "</p>";
  } else {
    box.innerHTML = list.slice((page - 1) * PER_PAGE, page * PER_PAGE).map((s) => {
      const on = liked.includes(s.id);
      return '<div class="song' + (current && current.id === s.id ? " playing" : "") + '" data-id="' + s.id + '">' +
        '<div class="cover" data-act="play" data-tip="play this song"><img src="' + imgUrl(s.id) + '" alt="" loading="lazy" onerror="imgFallback(this, \'" + s.id + "\')"><span class="spinner"></span></div>' +
        '<div class="info" data-act="play"><p>' + esc(s.title) + '</p><p class="artist">' + esc(s.artist) + "</p></div>" +
        '<button class="icon-btn" data-act="download" data-tip="download as mp3" aria-label="download">' + icons.download + "</button>" +
        '<button class="icon-btn' + (on ? " on" : "") + '" data-act="like" data-tip="' + (on ? "remove from liked songs" : "add to liked songs") + '" aria-label="like">' + (on ? icons.heart : icons.heartOutline) + "</button>" +
        "</div>";
    }).join("");
    if (current && audio.dataset.loading) setLoading(true);
  }

  const pag = $("pagination");
  pag.innerHTML = "";
  if (pages > 1) {
    for (let i = 1; i <= pages; i++) {
      const b = document.createElement("button");
      b.textContent = i;
      if (i === page) b.className = "active";
      b.onclick = () => {
        page = i;
        render();
        swap();
        window.scrollTo(0, 0);
      };
      pag.appendChild(b);
    }
  }
}

function download(id, btn) {
  const song = songs.find((s) => s.id === id);
  if (!song || btn.disabled) return;
  btn.disabled = true;
  btn.innerHTML = icons.spin;
  fetch(songUrl(id))
    .then((r) => {
      if (!r.ok) throw new Error(r.status);
      return r.blob();
    })
    .then((b) => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(b);
      a.download = (song.title + " - " + song.artist).replace(/[\/:*?"<>|]/g, "") + ".mp3";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    })
    .catch((e) => console.error("download failed", e))
    .finally(() => {
      btn.disabled = false;
      btn.innerHTML = icons.download;
    });
}

function setLoading(on) {
  if (on) audio.dataset.loading = "1";
  else delete audio.dataset.loading;
  $("play").classList.toggle("loading", on);
  if (on) $("play").innerHTML = icons.spin;
  else $("play").innerHTML = audio.paused ? icons.play : icons.pause;
  document.querySelectorAll(".song.loading").forEach((el) => el.classList.remove("loading"));
  const el = current && document.querySelector('.song[data-id="' + current.id + '"]');
  if (el && on) el.classList.add("loading");
}

function play(id) {
  const song = songs.find((s) => s.id === id);
  if (!song) return;
  queue = visibleSongs().map((s) => s.id);
  if (!queue.includes(id)) queue = songs.map((s) => s.id);
  current = song;
  audio.src = songUrl(id);
  setLoading(true);
  audio.play().catch(() => setLoading(false));
  $("now-img").onerror = () => imgFallback($("now-img"), id);
  $("now-img").src = imgUrl(id);
  $("now-title").textContent = song.title;
  $("now-artist").textContent = song.artist;
  updateLikeNow();
  updateMediaSession(song);
  document.querySelectorAll(".song.playing").forEach((el) => el.classList.remove("playing"));
  const el = document.querySelector('.song[data-id="' + id + '"]');
  if (el) el.classList.add("playing", "loading");
}

function step(dir) {
  if (!current || !queue.length) return;
  if (shuffle && queue.length > 1) {
    let next;
    do next = queue[Math.floor(Math.random() * queue.length)]; while (next === current.id);
    return play(next);
  }
  const i = queue.indexOf(current.id) + dir;
  if (i >= 0 && i < queue.length) play(queue[i]);
  else if (dir > 0) play(queue[0]);
}

function toggleLike(id) {
  liked = liked.includes(id) ? liked.filter((x) => x !== id) : liked.concat(id);
  localStorage.setItem("jx-music-liked", JSON.stringify(liked));
  render();
  updateLikeNow();
}

function updateLikeNow() {
  const on = current && liked.includes(current.id);
  $("like-now").innerHTML = on ? icons.heart : icons.heartOutline;
  $("like-now").classList.toggle("on", !!on);
  $("like-now").dataset.tip = current ? (on ? "remove from liked songs" : "add to liked songs") : "play a song to like it";
}

function updateMediaSession(song) {
  if (!("mediaSession" in navigator)) return;
  navigator.mediaSession.metadata = new MediaMetadata({
    title: song.title,
    artist: song.artist,
    artwork: [{ src: imgUrl(song.id), sizes: "640x640", type: "image/png" }]
  });
  navigator.mediaSession.setActionHandler("play", () => audio.play());
  navigator.mediaSession.setActionHandler("pause", () => audio.pause());
  navigator.mediaSession.setActionHandler("previoustrack", () => step(-1));
  navigator.mediaSession.setActionHandler("nexttrack", () => step(1));
}

$("songs").addEventListener("click", (e) => {
  const act = e.target.closest("[data-act]");
  if (!act) return;
  const id = act.closest(".song").dataset.id;
  if (act.dataset.act === "play") play(id);
  else if (act.dataset.act === "like") toggleLike(id);
  else if (act.dataset.act === "download") download(id, act);
});

document.querySelectorAll(".tab").forEach((t) => {
  t.onclick = () => {
    document.querySelector(".tab.active").classList.remove("active");
    t.classList.add("active");
    view = t.dataset.view;
    page = 1;
    render();
    swap();
  };
});

$("search").addEventListener("input", () => {
  page = 1;
  render();
});

$("play").onclick = () => {
  if (!current) return songs.length && play(visibleSongs()[0] ? visibleSongs()[0].id : songs[0].id);
  audio.paused ? audio.play() : audio.pause();
};
$("prev").onclick = () => (audio.currentTime > 3 ? (audio.currentTime = 0) : step(-1));
$("next").onclick = () => step(1);
$("shuffle").onclick = () => {
  $("shuffle").classList.toggle("on", (shuffle = !shuffle));
  $("shuffle").dataset.tip = "shuffle: " + (shuffle ? "on" : "off");
  showTip($("shuffle"));
};
$("repeat").onclick = () => {
  $("repeat").classList.toggle("on", (repeat = !repeat));
  $("repeat").dataset.tip = "repeat this song: " + (repeat ? "on" : "off");
  showTip($("repeat"));
};
$("like-now").onclick = () => current && toggleLike(current.id);
$("seek").oninput = () => audio.duration && (audio.currentTime = ($("seek").value / 100) * audio.duration);
function startVolume() {
  if (typeof window.__jmVol === "number") return window.__jmVol;
  const v = parseFloat(localStorage.getItem("jm-volume"));
  return isNaN(v) ? 1 : v;
}

function syncVolume() {
  const v = audio.muted ? 0 : audio.volume;
  $("volume").value = v;
  $("volume").dataset.tip = "volume " + Math.round(v * 100) + "% (synced with jaxsons math)";
}

audio.volume = startVolume();
syncVolume();
audio.addEventListener("volumechange", syncVolume);
$("volume").oninput = () => {
  const v = parseFloat($("volume").value);
  audio.volume = v;
  audio.muted = v === 0;
  window.__jmVol = v;
  try {
    const site = parent !== window && parent.document.getElementById("vol-slider");
    if (site) {
      site.value = String(Math.round(v * 100));
      site.dispatchEvent(new Event("input", { bubbles: true }));
    } else localStorage.setItem("jm-volume", String(v));
  } catch (e) {
    localStorage.setItem("jm-volume", String(v));
  }
  showTip($("volume"));
};

audio.addEventListener("waiting", () => setLoading(true));
audio.addEventListener("playing", () => setLoading(false));
audio.addEventListener("canplay", () => audio.dataset.loading && audio.paused && setLoading(false));
audio.addEventListener("error", () => setLoading(false));
audio.addEventListener("play", () => !audio.dataset.loading && ($("play").innerHTML = icons.pause));
audio.addEventListener("pause", () => {
  if (audio.dataset.loading) return;
  $("play").innerHTML = icons.play;
  $("play").dataset.tip = "play";
});
audio.addEventListener("playing", () => ($("play").dataset.tip = "pause"));
audio.addEventListener("timeupdate", () => {
  $("cur").textContent = fmt(audio.currentTime);
  $("dur").textContent = fmt(audio.duration);
  if (audio.duration) $("seek").value = (audio.currentTime / audio.duration) * 100;
});
audio.addEventListener("ended", () => {
  if (repeat) {
    audio.currentTime = 0;
    audio.play();
  } else step(1);
});

$("play").innerHTML = icons.play;
updateLikeNow();

fetch(new URL("songs.json", base))
  .then((r) => r.json())
  .then((data) => {
    const seen = new Set();
    songs = data.filter((s) => !seen.has(s.id) && seen.add(s.id));
    $("search").placeholder = "search through " + songs.length + " songs";
    render();
    swap();
  })
  .catch(() => {
    $("songs").innerHTML = '<p class="empty">could not load songs</p>';
  });

function showTip(el) {
  tip.textContent = el.dataset.tip;
  const r = el.getBoundingClientRect();
  const t = tip.getBoundingClientRect();
  let top = r.top - t.height - 8;
  if (top < 4) top = r.bottom + 8;
  const left = Math.min(Math.max(4, r.left + r.width / 2 - t.width / 2), innerWidth - t.width - 4);
  tip.style.transform = "translate(" + left + "px," + top + "px)";
  tip.classList.add("show");
}

document.addEventListener("mouseover", (e) => {
  const el = e.target.closest("[data-tip]");
  if (el) showTip(el);
  else tip.classList.remove("show");
});
document.addEventListener("mousedown", (e) => !e.target.closest("input[type=range]") && tip.classList.remove("show"));
