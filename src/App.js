import { useState, useEffect, useRef } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import Login from "./Login";
import Signup from "./Signup";
import YouTubePlayer from "./YouTubePlayer";

function Home({ user }) {
  const [query, setQuery] = useState("");
  const [songs, setSongs] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [currentQueue, setCurrentQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [videoId, setVideoId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState("home");
  const [artist, setArtist] = useState(null);
  const [artistSongs, setArtistSongs] = useState([]);
  const [album, setAlbum] = useState(null);
  const [albumSongs, setAlbumSongs] = useState([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [showFullPlayer, setShowFullPlayer] = useState(false);
  const [relatedSongs, setRelatedSongs] = useState([]);
  const [likedSongs, setLikedSongs] = useState(() => {
    const saved = localStorage.getItem("likedSongs");
    return saved ? JSON.parse(saved) : [];
  });
  const [recentlyPlayed, setRecentlyPlayed] = useState(() => {
    const saved = localStorage.getItem("recentlyPlayed");
    return saved ? JSON.parse(saved) : [];
  });
  const [playlists, setPlaylists] = useState(() => {
    const saved = localStorage.getItem("playlists");
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(null);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const playerRef = useRef(null);
  const timerRef = useRef(null);

  function toggleLike(song) {
    setLikedSongs((prev) => {
      const exists = prev.find((s) => s.trackId === song.trackId);
      const updated = exists ? prev.filter((s) => s.trackId !== song.trackId) : [...prev, song];
      localStorage.setItem("likedSongs", JSON.stringify(updated));
      return updated;
    });
  }

  function isLiked(song) {
    return likedSongs.some((s) => s.trackId === song.trackId);
  }

  function createPlaylist() {
    if (!newPlaylistName.trim()) return;
    const newPlaylist = { id: Date.now(), name: newPlaylistName.trim(), songs: [] };
    const updated = [...playlists, newPlaylist];
    setPlaylists(updated);
    localStorage.setItem("playlists", JSON.stringify(updated));
    setNewPlaylistName("");
    setShowPlaylistModal(false);
  }

  function addToPlaylist(playlistId, song) {
    const updated = playlists.map((p) => {
      if (p.id === playlistId) {
        const exists = p.songs.find((s) => s.trackId === song.trackId);
        if (exists) return p;
        return { ...p, songs: [...p.songs, song] };
      }
      return p;
    });
    setPlaylists(updated);
    localStorage.setItem("playlists", JSON.stringify(updated));
    setShowAddToPlaylist(null);
  }

  function removeFromPlaylist(playlistId, songId) {
    const updated = playlists.map((p) => {
      if (p.id === playlistId) {
        return { ...p, songs: p.songs.filter((s) => s.trackId !== songId) };
      }
      return p;
    });
    setPlaylists(updated);
    localStorage.setItem("playlists", JSON.stringify(updated));
  }

  function deletePlaylist(playlistId) {
    const updated = playlists.filter((p) => p.id !== playlistId);
    setPlaylists(updated);
    localStorage.setItem("playlists", JSON.stringify(updated));
    setSelectedPlaylist(null);
    setPage("library");
  }

  function startTimer() {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (playerRef.current) {
        const ct = playerRef.current.getCurrentTime() || 0;
        const dur = playerRef.current.getDuration() || 0;
        setCurrentTime(ct);
        setDuration(dur);
        if (dur > 0 && ct >= dur - 1) playNext();
      }
    }, 1000);
  }

  function formatTime(secs) {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  }

  async function fetchRelated(song) {
    try {
      const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(song.artistName)}&media=music&limit=10`);
      const data = await res.json();
      setRelatedSongs(data.results.filter((s) => s.trackId !== song.trackId));
    } catch (e) {}
  }

  async function fetchAndPlay(song) {
    setCurrentSong(song);
    setCurrentTime(0);
    setDuration(0);
    fetchRelated(song);
    setRecentlyPlayed((prev) => {
      const filtered = prev.filter((s) => s.trackId !== song.trackId);
      const updated = [song, ...filtered].slice(0, 20);
      localStorage.setItem("recentlyPlayed", JSON.stringify(updated));
      return updated;
    });
    try {
      const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(song.trackName + " " + song.artistName)}&key=AIzaSyBu33AChZxQMJUoWwn0JGBhbK2arc190Mk&maxResults=1&type=video`);
      const data = await res.json();
      if (data.items && data.items.length > 0) setVideoId(data.items[0].id.videoId);
    } catch (e) {}
  }

  async function playSong(song, queue) {
    const q = queue || currentQueue;
    const idx = q.findIndex((s) => s.trackId === song.trackId);
    setCurrentQueue(q);
    setCurrentIndex(idx >= 0 ? idx : 0);
    await fetchAndPlay(song);
  }

  function playNext() {
    if (currentQueue.length === 0) return;
    if (repeat) { playerRef.current?.seekTo(0, true); playerRef.current?.playVideo(); return; }
    const nextIndex = shuffle ? Math.floor(Math.random() * currentQueue.length) : (currentIndex + 1) % currentQueue.length;
    setCurrentIndex(nextIndex);
    fetchAndPlay(currentQueue[nextIndex]);
  }

  function playPrev() {
    if (currentQueue.length === 0) return;
    const prevIndex = shuffle ? Math.floor(Math.random() * currentQueue.length) : (currentIndex - 1 + currentQueue.length) % currentQueue.length;
    setCurrentIndex(prevIndex);
    fetchAndPlay(currentQueue[prevIndex]);
  }

  async function searchSongs() {
    if (!query) return;
    setLoading(true);
    setPage("search");
    const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=20`);
    const data = await res.json();
    setSongs(data.results);
    setLoading(false);
  }

  async function openArtist(song) {
    setArtist(song);
    setPage("artist");
    setLoading(true);
    const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(song.artistName)}&media=music&limit=20`);
    const data = await res.json();
    setArtistSongs(data.results);
    setLoading(false);
  }

  async function openAlbum(song) {
    setAlbum(song);
    setPage("album");
    setLoading(true);
    const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(song.collectionName)}&media=music&limit=20`);
    const data = await res.json();
    setAlbumSongs(data.results);
    setLoading(false);
  }

  function handleKey(e) { if (e.key === "Enter") searchSongs(); }

  function stopSong() {
    try { if (playerRef.current) { playerRef.current.stopVideo(); playerRef.current = null; } } catch (e) {}
    setCurrentSong(null);
    setVideoId(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setShowFullPlayer(false);
    clearInterval(timerRef.current);
  }

  function togglePlay() {
    if (isPlaying) {
      playerRef.current?.pauseVideo();
      setIsPlaying(false);
      clearInterval(timerRef.current);
    } else {
      playerRef.current?.playVideo();
      setIsPlaying(true);
      startTimer();
    }
  }

  function ProgressBar() {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ fontSize: "11px", color: "#b3b3b3", minWidth: "35px" }}>{formatTime(currentTime)}</span>
        <div style={{ flex: 1, height: "4px", background: "#404040", borderRadius: "2px", cursor: "pointer" }} onClick={(e) => { const rect = e.currentTarget.getBoundingClientRect(); const seekTo = ((e.clientX - rect.left) / rect.width) * duration; playerRef.current?.seekTo(seekTo, true); setCurrentTime(seekTo); }}>
          <div style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%`, height: "100%", background: "#1db954", borderRadius: "2px" }} />
        </div>
        <span style={{ fontSize: "11px", color: "#b3b3b3", minWidth: "35px", textAlign: "right" }}>{formatTime(duration)}</span>
      </div>
    );
  }

  function SongRow({ song, index, queue, playlistId }) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "8px 12px", borderRadius: "6px", background: currentSong?.trackId === song.trackId ? "#ffffff15" : "transparent", cursor: "pointer" }}
        onMouseEnter={(e) => { if (currentSong?.trackId !== song.trackId) e.currentTarget.style.background = "#ffffff10"; }}
        onMouseLeave={(e) => { if (currentSong?.trackId !== song.trackId) e.currentTarget.style.background = "transparent"; }}>
        {index !== undefined && <div style={{ width: "20px", textAlign: "center", color: "#b3b3b3", fontSize: "13px", flexShrink: 0 }}>{index + 1}</div>}
        <img src={song.artworkUrl100} alt={song.trackName} style={{ width: "48px", height: "48px", borderRadius: "4px", flexShrink: 0 }} onClick={() => playSong(song, queue)} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div onClick={() => playSong(song, queue)} style={{ fontWeight: "500", color: currentSong?.trackId === song.trackId ? "#1db954" : "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: "14px" }}>{song.trackName}</div>
          <div style={{ display: "flex", gap: "6px", marginTop: "2px", flexWrap: "wrap" }}>
            <span onClick={() => openArtist(song)} style={{ fontSize: "13px", color: "#b3b3b3", cursor: "pointer" }}>{song.artistName}</span>
            {song.collectionName && <><span style={{ fontSize: "13px", color: "#404040" }}>•</span><span onClick={() => openAlbum(song)} style={{ fontSize: "13px", color: "#b3b3b3", cursor: "pointer", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "120px" }}>{song.collectionName}</span></>}
          </div>
        </div>
        <button onClick={(e) => { e.stopPropagation(); toggleLike(song); }} style={{ background: "none", border: "none", fontSize: "16px", cursor: "pointer", flexShrink: 0, opacity: isLiked(song) ? 1 : 0.4 }}>{isLiked(song) ? "❤️" : "🤍"}</button>
        <button onClick={(e) => { e.stopPropagation(); setShowAddToPlaylist(song); }} style={{ background: "none", border: "none", fontSize: "16px", cursor: "pointer", flexShrink: 0, opacity: 0.5, color: "white" }}>➕</button>
        {playlistId && <button onClick={(e) => { e.stopPropagation(); removeFromPlaylist(playlistId, song.trackId); }} style={{ background: "none", border: "none", fontSize: "16px", cursor: "pointer", flexShrink: 0, opacity: 0.5, color: "white" }}>🗑️</button>}
        <button onClick={() => playSong(song, queue)} style={{ background: "none", border: "none", fontSize: "16px", flexShrink: 0, cursor: "pointer", color: "white", opacity: 0.6 }}>▶</button>
      </div>
    );
  }

  const backPage = ["artist", "album"].includes(page) ? "search" : "library";

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#000", color: "white", fontFamily: "Inter, sans-serif" }}>

      {videoId && <YouTubePlayer videoId={videoId} onReady={(p) => { playerRef.current = p; p.setVolume(volume); setIsPlaying(true); startTimer(); }} />}

      {/* FULL SCREEN PLAYER */}
      {showFullPlayer && currentSong && (
        <div style={{ position: "fixed", inset: 0, background: "#121212", zIndex: 200, display: "flex", flexDirection: "column", overflowY: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px", flexShrink: 0 }}>
            <button onClick={() => setShowFullPlayer(false)} style={{ background: "none", border: "none", color: "white", fontSize: "24px", cursor: "pointer" }}>↓</button>
            <p style={{ color: "#b3b3b3", fontSize: "12px", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase" }}>Now Playing</p>
            <div style={{ width: "24px" }} />
          </div>
          <div style={{ padding: "16px 32px", display: "flex", justifyContent: "center", flexShrink: 0 }}>
            <img src={currentSong.artworkUrl100.replace("100x100", "400x400")} alt={currentSong.trackName} style={{ width: "100%", maxWidth: "280px", borderRadius: "8px", boxShadow: "0 32px 64px rgba(0,0,0,0.8)" }} />
          </div>
          <div style={{ padding: "20px 24px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{currentSong.trackName}</h2>
              <p style={{ color: "#b3b3b3", fontSize: "14px" }}>{currentSong.artistName}</p>
            </div>
            <button onClick={() => toggleLike(currentSong)} style={{ background: "none", border: "none", fontSize: "26px", cursor: "pointer", flexShrink: 0, marginLeft: "16px" }}>{isLiked(currentSong) ? "❤️" : "🤍"}</button>
          </div>
          <div style={{ padding: "0 24px 16px", flexShrink: 0 }}><ProgressBar /></div>
          <div style={{ padding: "0 24px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
            <button onClick={() => setShuffle(!shuffle)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: shuffle ? "#1db954" : "#b3b3b3" }}>🔀</button>
            <button onClick={playPrev} style={{ background: "none", border: "none", color: "white", fontSize: "28px", cursor: "pointer" }}>⏮</button>
            <button onClick={togglePlay} style={{ width: "60px", height: "60px", borderRadius: "50%", background: "#fff", border: "none", color: "black", fontSize: "22px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>{isPlaying ? "⏸" : "▶"}</button>
            <button onClick={playNext} style={{ background: "none", border: "none", color: "white", fontSize: "28px", cursor: "pointer" }}>⏭</button>
            <button onClick={() => setRepeat(!repeat)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: repeat ? "#1db954" : "#b3b3b3" }}>🔁</button>
          </div>
          <div style={{ padding: "0 24px 24px", display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
            <span>🔈</span>
            <input type="range" min="0" max="100" value={volume} onChange={(e) => { const v = Number(e.target.value); setVolume(v); playerRef.current?.setVolume(v); }} style={{ flex: 1, accentColor: "#1db954" }} />
            <span>🔊</span>
          </div>
          <div style={{ padding: "0 20px 120px", flexShrink: 0 }}>
            <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px" }}>Related Songs</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {relatedSongs.map((song) => (
                <div key={song.trackId} onClick={() => playSong(song, relatedSongs)} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px", borderRadius: "6px", cursor: "pointer", background: currentSong?.trackId === song.trackId ? "#ffffff15" : "transparent" }}>
                  <img src={song.artworkUrl100} alt={song.trackName} style={{ width: "48px", height: "48px", borderRadius: "4px", flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: "500", fontSize: "14px", color: currentSong?.trackId === song.trackId ? "#1db954" : "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{song.trackName}</div>
                    <div style={{ fontSize: "12px", color: "#b3b3b3", marginTop: "2px" }}>{song.artistName}</div>
                  </div>
                  <span style={{ fontSize: "14px", color: "#b3b3b3" }}>▶</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ADD TO PLAYLIST MODAL */}
      {showAddToPlaylist && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "#282828", borderRadius: "8px", padding: "24px", width: "100%", maxWidth: "360px" }}>
            <h3 style={{ marginBottom: "16px", fontSize: "18px" }}>Add to Playlist</h3>
            {playlists.length === 0 ? <p style={{ color: "#b3b3b3", fontSize: "14px", marginBottom: "16px" }}>No playlists yet!</p> : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
                {playlists.map((p) => (
                  <div key={p.id} onClick={() => addToPlaylist(p.id, showAddToPlaylist)} style={{ padding: "12px 16px", background: "#3e3e3e", borderRadius: "6px", cursor: "pointer", fontSize: "14px" }}>🎵 {p.name} ({p.songs.length} songs)</div>
                ))}
              </div>
            )}
            <button onClick={() => setShowAddToPlaylist(null)} style={{ width: "100%", padding: "12px", borderRadius: "50px", border: "1px solid #727272", background: "transparent", color: "white", fontSize: "14px", cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      )}

      {/* CREATE PLAYLIST MODAL */}
      {showPlaylistModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "#282828", borderRadius: "8px", padding: "24px", width: "100%", maxWidth: "360px" }}>
            <h3 style={{ marginBottom: "16px", fontSize: "18px" }}>Create Playlist</h3>
            <input type="text" placeholder="Playlist name..." value={newPlaylistName} onChange={(e) => setNewPlaylistName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && createPlaylist()} style={{ width: "100%", padding: "12px 16px", borderRadius: "6px", border: "1px solid #727272", background: "#3e3e3e", color: "white", fontSize: "14px", outline: "none", marginBottom: "16px" }} />
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setShowPlaylistModal(false)} style={{ flex: 1, padding: "12px", borderRadius: "50px", border: "1px solid #727272", background: "transparent", color: "white", fontSize: "14px", cursor: "pointer" }}>Cancel</button>
              <button onClick={createPlaylist} style={{ flex: 1, padding: "12px", borderRadius: "50px", border: "none", background: "#1db954", color: "black", fontSize: "14px", fontWeight: "700", cursor: "pointer" }}>Create</button>
            </div>
          </div>
        </div>
      )}

      {/* TOP BAR */}
      <div style={{ background: "#000", padding: "16px 20px", display: "flex", alignItems: "center", gap: "12px", position: "sticky", top: 0, zIndex: 10, borderBottom: "1px solid #282828" }}>
        {["artist", "album", "playlist", "liked"].includes(page) && (
          <button onClick={() => setPage(backPage)} style={{ background: "none", border: "none", color: "white", fontSize: "22px", cursor: "pointer", flexShrink: 0 }}>←</button>
        )}
        <h2 style={{ color: "#1db954", fontSize: "20px", margin: 0, flexShrink: 0, fontWeight: "700" }}>🎵 MyMusic</h2>
        {!["artist", "album", "playlist", "liked"].includes(page) && (
          <>
            <div style={{ flex: 1, position: "relative" }}>
              <input type="text" placeholder="What do you want to listen to?" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={handleKey} style={{ width: "100%", padding: "10px 16px 10px 40px", borderRadius: "50px", border: "none", background: "#242424", color: "white", fontSize: "14px", outline: "none" }} />
              <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", fontSize: "14px", color: "#b3b3b3" }}>🔍</span>
            </div>
            <button onClick={searchSongs} style={{ padding: "10px 20px", borderRadius: "50px", border: "none", background: "#1db954", color: "black", fontSize: "14px", fontWeight: "700", cursor: "pointer", flexShrink: 0 }}>Search</button>
          </>
        )}
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, padding: "20px 16px", paddingBottom: currentSong ? "160px" : "80px" }}>

        {/* HOME */}
        {page === "home" && (
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "4px", letterSpacing: "-0.5px" }}>Good evening 👋</h1>
            <p style={{ color: "#b3b3b3", fontSize: "14px", marginBottom: "28px" }}>What do you want to listen to today?</p>

            {recentlyPlayed.length > 0 && (
              <div style={{ marginBottom: "32px" }}>
                <h2 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px" }}>Recently Played</h2>
                <div style={{ display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "8px" }}>
                  {recentlyPlayed.slice(0, 10).map((song) => (
                    <div key={song.trackId} onClick={() => playSong(song, recentlyPlayed)} style={{ flexShrink: 0, width: "130px", cursor: "pointer" }}>
                      <img src={song.artworkUrl100} alt={song.trackName} style={{ width: "130px", height: "130px", borderRadius: "8px", marginBottom: "8px", display: "block" }} />
                      <div style={{ fontSize: "13px", fontWeight: "600", color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{song.trackName}</div>
                      <div style={{ fontSize: "12px", color: "#b3b3b3", marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{song.artistName}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <h2 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px" }}>Browse Categories</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "32px" }}>
              {[
                { name: "Top Hits", emoji: "🔥", color: "#e13300", query: "top hits 2024" },
                { name: "Hip Hop", emoji: "🎤", color: "#8d67ab", query: "hip hop hits" },
                { name: "Pop", emoji: "🎵", color: "#1e3264", query: "pop hits 2024" },
                { name: "R&B", emoji: "💜", color: "#503750", query: "rnb soul hits" },
                { name: "Rock", emoji: "🎸", color: "#ba5d07", query: "rock hits" },
                { name: "K-Pop", emoji: "⭐", color: "#148a08", query: "kpop hits 2024" },
                { name: "Jazz", emoji: "🎷", color: "#0d3564", query: "jazz hits" },
                { name: "Classical", emoji: "🎻", color: "#006450", query: "classical music" },
              ].map((cat) => (
                <div key={cat.name} onClick={() => { setQuery(cat.query); setTimeout(() => searchSongs(), 100); }} style={{ background: cat.color, borderRadius: "8px", padding: "16px", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", position: "relative", overflow: "hidden", minHeight: "64px" }}>
                  <span style={{ fontSize: "14px", fontWeight: "700" }}>{cat.name}</span>
                  <span style={{ position: "absolute", right: "10px", bottom: "8px", fontSize: "28px", transform: "rotate(20deg)" }}>{cat.emoji}</span>
                </div>
              ))}
            </div>

            <h2 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px" }}>Popular Artists</h2>
            <div style={{ display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "8px" }}>
              {["Adele", "Taylor Swift", "Drake", "BTS", "Ed Sheeran", "Billie Eilish", "The Weeknd", "Ariana Grande"].map((a) => (
                <div key={a} onClick={() => { setQuery(a); setTimeout(() => searchSongs(), 100); }} style={{ flexShrink: 0, padding: "8px 16px", borderRadius: "50px", background: "#242424", cursor: "pointer", fontSize: "13px", fontWeight: "500", color: "white" }}>{a}</div>
              ))}
            </div>
          </div>
        )}

        {/* SEARCH */}
        {page === "search" && (
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "16px" }}>{loading ? "Searching..." : `Results for "${query}"`}</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {songs.map((song, index) => <SongRow key={song.trackId} song={song} index={index} queue={songs} />)}
            </div>
          </div>
        )}

        {/* LIBRARY */}
        {page === "library" && (
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "4px" }}>Your Library</h1>
            <p style={{ color: "#b3b3b3", fontSize: "13px", marginBottom: "24px" }}>{playlists.length} playlists</p>
            <div onClick={() => setPage("liked")} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "12px", background: "#121212", borderRadius: "8px", cursor: "pointer", marginBottom: "8px" }}>
              <div style={{ width: "52px", height: "52px", borderRadius: "6px", background: "linear-gradient(135deg, #450af5, #c4efd9)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }}>❤️</div>
              <div>
                <div style={{ fontWeight: "600", fontSize: "14px" }}>Liked Songs</div>
                <div style={{ fontSize: "12px", color: "#b3b3b3", marginTop: "2px" }}>Playlist • {likedSongs.length} songs</div>
              </div>
            </div>
            {playlists.map((playlist) => (
              <div key={playlist.id} onClick={() => { setSelectedPlaylist(playlist); setPage("playlist"); }} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "12px", background: "#121212", borderRadius: "8px", cursor: "pointer", marginBottom: "8px" }}>
                <div style={{ width: "52px", height: "52px", borderRadius: "6px", background: "#282828", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }}>🎵</div>
                <div>
                  <div style={{ fontWeight: "600", fontSize: "14px" }}>{playlist.name}</div>
                  <div style={{ fontSize: "12px", color: "#b3b3b3", marginTop: "2px" }}>Playlist • {playlist.songs.length} songs</div>
                </div>
              </div>
            ))}
            <div onClick={() => setShowPlaylistModal(true)} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "12px", background: "#121212", borderRadius: "8px", cursor: "pointer", border: "1px dashed #404040" }}>
              <div style={{ width: "52px", height: "52px", borderRadius: "6px", background: "#282828", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }}>➕</div>
              <div style={{ fontWeight: "600", fontSize: "14px", color: "#1db954" }}>Create Playlist</div>
            </div>
          </div>
        )}

        {/* LIKED SONGS */}
        {page === "liked" && (
          <div>
            <div style={{ background: "linear-gradient(135deg, #450af5, #c4efd9)", borderRadius: "12px", padding: "24px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ fontSize: "40px" }}>❤️</div>
              <div>
                <p style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>Playlist</p>
                <h1 style={{ fontSize: "22px", fontWeight: "700" }}>Liked Songs</h1>
                <p style={{ fontSize: "13px", opacity: 0.8, marginTop: "4px" }}>{likedSongs.length} songs</p>
              </div>
            </div>
            {likedSongs.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 0" }}>
                <p style={{ fontSize: "40px", marginBottom: "16px" }}>🤍</p>
                <p style={{ color: "#b3b3b3" }}>Songs you like will appear here</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                {likedSongs.map((song, index) => <SongRow key={song.trackId} song={song} index={index} queue={likedSongs} />)}
              </div>
            )}
          </div>
        )}

        {/* PLAYLIST PAGE */}
        {page === "playlist" && selectedPlaylist && (
          <div>
            <div style={{ background: "#282828", borderRadius: "12px", padding: "24px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "80px", height: "80px", borderRadius: "8px", background: "#3e3e3e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px", flexShrink: 0 }}>🎵</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", color: "#b3b3b3", marginBottom: "4px" }}>Playlist</p>
                <h1 style={{ fontSize: "22px", fontWeight: "700", marginBottom: "4px" }}>{selectedPlaylist.name}</h1>
                <p style={{ color: "#b3b3b3", fontSize: "13px" }}>{selectedPlaylist.songs.length} songs</p>
                <button onClick={() => deletePlaylist(selectedPlaylist.id)} style={{ marginTop: "8px", background: "none", border: "1px solid #727272", color: "#b3b3b3", padding: "6px 14px", borderRadius: "50px", fontSize: "12px", cursor: "pointer" }}>Delete Playlist</button>
              </div>
            </div>
            {selectedPlaylist.songs.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 0" }}>
                <p style={{ fontSize: "40px", marginBottom: "16px" }}>🎵</p>
                <p style={{ color: "#b3b3b3" }}>Add songs using the ➕ button</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                {selectedPlaylist.songs.map((song, index) => <SongRow key={song.trackId} song={song} index={index} queue={selectedPlaylist.songs} playlistId={selectedPlaylist.id} />)}
              </div>
            )}
          </div>
        )}

        {/* ALBUM PAGE */}
        {page === "album" && album && (
          <div>
            <div style={{ background: "linear-gradient(180deg, #333 0%, #121212 100%)", borderRadius: "12px", padding: "24px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "16px" }}>
              <img src={album.artworkUrl100.replace("100x100", "300x300")} alt={album.collectionName} style={{ width: "80px", height: "80px", borderRadius: "8px", flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", color: "#b3b3b3", marginBottom: "4px" }}>Album</p>
                <h1 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "4px" }}>{album.collectionName}</h1>
                <p onClick={() => openArtist(album)} style={{ fontSize: "13px", color: "#b3b3b3", cursor: "pointer" }}>{album.artistName}</p>
                <p style={{ fontSize: "12px", color: "#b3b3b3", marginTop: "4px" }}>{albumSongs.length} songs</p>
              </div>
            </div>
            {loading ? <p style={{ color: "#b3b3b3" }}>Loading...</p> : (
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                {albumSongs.map((song, index) => <SongRow key={song.trackId} song={song} index={index} queue={albumSongs} />)}
              </div>
            )}
          </div>
        )}

        {/* ARTIST PAGE */}
        {page === "artist" && artist && (
          <div>
            <div style={{ background: "linear-gradient(180deg, #333 0%, #121212 100%)", borderRadius: "12px", padding: "24px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "16px" }}>
              <img src={artist.artworkUrl100} alt={artist.artistName} style={{ width: "80px", height: "80px", borderRadius: "50%", flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", color: "#b3b3b3", marginBottom: "4px" }}>Artist</p>
                <h1 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "4px" }}>{artist.artistName}</h1>
                <p style={{ fontSize: "13px", color: "#b3b3b3" }}>{artistSongs.length} songs</p>
              </div>
            </div>
            <h2 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px" }}>Popular</h2>
            {loading ? <p style={{ color: "#b3b3b3" }}>Loading...</p> : (
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                {artistSongs.map((song, index) => <SongRow key={song.trackId} song={song} index={index} queue={artistSongs} />)}
              </div>
            )}
          </div>
        )}

        {/* PROFILE */}
        {page === "profile" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "40px", gap: "16px" }}>
            <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "#1db954", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px" }}>👤</div>
            <h2 style={{ fontSize: "20px", fontWeight: "700" }}>{user.email}</h2>
            <p style={{ color: "#b3b3b3", fontSize: "13px" }}>MyMusic Member</p>
            <div style={{ display: "flex", gap: "12px", marginTop: "8px", flexWrap: "wrap", justifyContent: "center" }}>
              <div style={{ background: "#121212", borderRadius: "8px", padding: "16px 24px", textAlign: "center", minWidth: "100px" }}>
                <p style={{ fontSize: "22px", fontWeight: "700", color: "#1db954" }}>{likedSongs.length}</p>
                <p style={{ fontSize: "12px", color: "#b3b3b3", marginTop: "4px" }}>Liked</p>
              </div>
              <div style={{ background: "#121212", borderRadius: "8px", padding: "16px 24px", textAlign: "center", minWidth: "100px" }}>
                <p style={{ fontSize: "22px", fontWeight: "700", color: "#1db954" }}>{playlists.length}</p>
                <p style={{ fontSize: "12px", color: "#b3b3b3", marginTop: "4px" }}>Playlists</p>
              </div>
              <div style={{ background: "#121212", borderRadius: "8px", padding: "16px 24px", textAlign: "center", minWidth: "100px" }}>
                <p style={{ fontSize: "22px", fontWeight: "700", color: "#1db954" }}>{recentlyPlayed.length}</p>
                <p style={{ fontSize: "12px", color: "#b3b3b3", marginTop: "4px" }}>Played</p>
              </div>
            </div>
            <button onClick={() => signOut(auth)} style={{ marginTop: "24px", padding: "14px 32px", borderRadius: "50px", border: "1px solid #727272", background: "transparent", color: "white", fontSize: "14px", cursor: "pointer", fontWeight: "600" }}>Log Out</button>
          </div>
        )}

      </div>

      {/* MINI PLAYER BAR */}
      {currentSong && !showFullPlayer && (
        <div style={{ position: "fixed", bottom: "60px", left: 0, right: 0, background: "#282828", borderTop: "1px solid #3e3e3e", padding: "10px 16px", display: "flex", flexDirection: "column", gap: "8px", zIndex: 50 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div onClick={() => setShowFullPlayer(true)} style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, cursor: "pointer", minWidth: 0 }}>
              <img src={currentSong.artworkUrl100} alt={currentSong.trackName} style={{ width: "44px", height: "44px", borderRadius: "4px", flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: "13px", fontWeight: "600", color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{currentSong.trackName}</div>
                <div style={{ fontSize: "11px", color: "#b3b3b3", marginTop: "2px" }}>{currentSong.artistName}</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
              <button onClick={() => toggleLike(currentSong)} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer" }}>{isLiked(currentSong) ? "❤️" : "🤍"}</button>
              <button onClick={playPrev} style={{ background: "none", border: "none", color: "white", fontSize: "20px", cursor: "pointer" }}>⏮</button>
              <button onClick={togglePlay} style={{ width: "38px", height: "38px", borderRadius: "50%", background: "#fff", border: "none", color: "black", fontSize: "15px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>{isPlaying ? "⏸" : "▶"}</button>
              <button onClick={playNext} style={{ background: "none", border: "none", color: "white", fontSize: "20px", cursor: "pointer" }}>⏭</button>
              <button onClick={stopSong} style={{ background: "none", border: "none", color: "#b3b3b3", fontSize: "16px", cursor: "pointer" }}>✕</button>
            </div>
          </div>
          <ProgressBar />
        </div>
      )}

      {/* BOTTOM NAV */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: "60px", background: "#000", borderTop: "1px solid #282828", display: "flex", alignItems: "center", justifyContent: "space-around", zIndex: 50 }}>
        {[
          { id: "home", icon: "🏠", label: "Home" },
          { id: "search", icon: "🔍", label: "Search" },
          { id: "library", icon: "📚", label: "Library" },
          { id: "profile", icon: "👤", label: "Profile" },
        ].map((tab) => (
          <div key={tab.id} onClick={() => setPage(tab.id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", cursor: "pointer", color: page === tab.id ? "#fff" : "#b3b3b3" }}>
            <span style={{ fontSize: "20px" }}>{tab.icon}</span>
            <span style={{ fontSize: "10px", fontWeight: page === tab.id ? "700" : "400" }}>{tab.label}</span>
          </div>
        ))}
      </div>

    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("login");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    onAuthStateChanged(auth, (u) => { setUser(u); setChecking(false); });
  }, []);

  if (checking) return (
    <div style={{ background: "#000", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px" }}>
      <div style={{ fontSize: "48px" }}>🎵</div>
      <h2 style={{ color: "#1db954", fontFamily: "Inter, sans-serif", fontWeight: "700", fontSize: "24px" }}>MyMusic</h2>
    </div>
  );

  if (user) return <Home user={user} />;
  if (page === "login") return <Login onLogin={() => {}} onSignup={() => setPage("signup")} />;
  if (page === "signup") return <Signup onSignup={() => {}} onBack={() => setPage("login")} />;
}

export default App;