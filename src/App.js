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
  const [videoId, setVideoId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState("home");
  const [artist, setArtist] = useState(null);
  const [artistSongs, setArtistSongs] = useState([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [likedSongs, setLikedSongs] = useState(() => {
    const saved = localStorage.getItem("likedSongs");
    return saved ? JSON.parse(saved) : [];
  });
  const playerRef = useRef(null);
  const timerRef = useRef(null);

  function toggleLike(song) {
    setLikedSongs((prev) => {
      const exists = prev.find((s) => s.trackId === song.trackId);
      const updated = exists
        ? prev.filter((s) => s.trackId !== song.trackId)
        : [...prev, song];
      localStorage.setItem("likedSongs", JSON.stringify(updated));
      return updated;
    });
  }

  function isLiked(song) {
    return likedSongs.some((s) => s.trackId === song.trackId);
  }

  function startTimer() {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (playerRef.current) {
        setCurrentTime(playerRef.current.getCurrentTime() || 0);
        setDuration(playerRef.current.getDuration() || 0);
      }
    }, 1000);
  }

  function formatTime(secs) {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  }

  async function searchSongs() {
    if (!query) return;
    setLoading(true);
    setPage("search");
    const res = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=20`
    );
    const data = await res.json();
    setSongs(data.results);
    setLoading(false);
  }

  async function playSong(song) {
    setCurrentSong(song);
    setVideoId(null);
    setCurrentTime(0);
    setDuration(0);
    const searchQuery = `${song.trackName} ${song.artistName} official audio`;
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&key=AIzaSyBu33AChZxQMJUoWwn0JGBhbK2arc190Mk&maxResults=1&type=video`
    );
    const data = await res.json();
    if (data.items && data.items.length > 0) {
      setVideoId(data.items[0].id.videoId);
    }
  }

  async function openArtist(song) {
    setArtist(song);
    setPage("artist");
    setLoading(true);
    const res = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(song.artistName)}&media=music&limit=20`
    );
    const data = await res.json();
    setArtistSongs(data.results);
    setLoading(false);
  }

  function handleKey(e) {
    if (e.key === "Enter") searchSongs();
  }

  function stopSong() {
    setCurrentSong(null);
    setVideoId(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    clearInterval(timerRef.current);
  }

  function SongRow({ song, index }) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px", borderRadius: "8px", background: currentSong?.trackId === song.trackId ? "#1db95422" : "transparent" }}>
        {index !== undefined && (
          <div style={{ width: "20px", textAlign: "center", color: "#aaa", fontSize: "13px", flexShrink: 0 }}>{index + 1}</div>
        )}
        <img src={song.artworkUrl100} alt={song.trackName} style={{ width: "48px", height: "48px", borderRadius: "6px", flexShrink: 0, cursor: "pointer" }} onClick={() => playSong(song)} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div onClick={() => playSong(song)} style={{ fontWeight: "500", color: currentSong?.trackId === song.trackId ? "#1db954" : "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: "14px", cursor: "pointer" }}>{song.trackName}</div>
          <div onClick={() => openArtist(song)} style={{ fontSize: "12px", color: "#1db954", marginTop: "2px", cursor: "pointer" }}>{song.artistName} →</div>
        </div>
        <button
          onClick={() => toggleLike(song)}
          style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", flexShrink: 0 }}>
          {isLiked(song) ? "❤️" : "🤍"}
        </button>
        <div onClick={() => playSong(song)} style={{ fontSize: "18px", flexShrink: 0, cursor: "pointer" }}>▶</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#0a0a0a", color: "white", fontFamily: "sans-serif" }}>

      {videoId && (
        <YouTubePlayer
          videoId={videoId}
          onReady={(p) => {
            playerRef.current = p;
            setIsPlaying(true);
            startTimer();
          }}
        />
      )}

      {/* TOP BAR */}
      <div style={{ background: "#121212", padding: "16px 20px", display: "flex", alignItems: "center", gap: "12px", position: "sticky", top: 0, zIndex: 10, borderBottom: "1px solid #222" }}>
        {page === "artist" && (
          <button onClick={() => setPage("search")} style={{ background: "none", border: "none", color: "#aaa", fontSize: "20px", cursor: "pointer", flexShrink: 0 }}>←</button>
        )}
        <h2 style={{ color: "#1db954", fontSize: "20px", margin: 0, flexShrink: 0 }}>🎵 MyMusic</h2>
        {page !== "artist" && (
          <>
            <input
              type="text"
              placeholder="Search songs, artists..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKey}
              style={{ flex: 1, padding: "10px 16px", borderRadius: "50px", border: "1px solid #333", background: "#1a1a1a", color: "white", fontSize: "14px", outline: "none" }}
            />
            <button onClick={searchSongs} style={{ padding: "10px 20px", borderRadius: "50px", border: "none", background: "#1db954", color: "black", fontSize: "14px", fontWeight: "700", cursor: "pointer", flexShrink: 0 }}>Go</button>
          </>
        )}
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, padding: "20px 16px", paddingBottom: currentSong ? "160px" : "80px" }}>

       {/* HOME */}
        {page === "home" && (
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "4px" }}>Good evening 👋</h1>
            <p style={{ color: "#aaa", fontSize: "14px", marginBottom: "24px" }}>What do you want to listen to today?</p>
            {/* CATEGORIES */}
            <h2 style={{ fontSize: "16px", marginBottom: "16px" }}>🔥 Top Charts</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "32px" }}>
              {[
                { name: "Top Hits", emoji: "🔥", color: "#2e1a0a", query: "top hits 2024" },
                { name: "Hip Hop", emoji: "🎤", color: "#0a1a2e", query: "hip hop hits" },
                { name: "Pop Music", emoji: "🎵", color: "#1a0a2e", query: "pop hits 2024" },
                { name: "R&B Soul", emoji: "💜", color: "#2e0a1a", query: "rnb soul hits" },
                { name: "Rock", emoji: "🎸", color: "#2e2a0a", query: "rock hits" },
                { name: "K-Pop", emoji: "⭐", color: "#0a2e1a", query: "kpop hits 2024" },
              ].map((cat) => (
                <div
                  key={cat.name}
                  onClick={() => { setQuery(cat.query); setTimeout(() => searchSongs(), 100); }}
                  style={{ background: cat.color, border: "1px solid #333", borderRadius: "12px", padding: "20px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <span style={{ fontSize: "28px" }}>{cat.emoji}</span>
                  <span style={{ fontSize: "14px", fontWeight: "600" }}>{cat.name}</span>
                </div>
              ))}
            </div>

            {/* QUICK SEARCH */}
            <h2 style={{ fontSize: "16px", marginBottom: "16px" }}>🎤 Popular Artists</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {["Adele", "Taylor Swift", "Drake", "BTS", "Ed Sheeran", "Billie Eilish", "The Weeknd", "Ariana Grande"].map((a) => (
                <div key={a} onClick={() => { setQuery(a); setTimeout(() => searchSongs(), 100); }} style={{ padding: "10px 18px", borderRadius: "50px", background: "#1a1a1a", border: "1px solid #333", cursor: "pointer", fontSize: "14px", color: "#aaa" }}>{a}</div>
              ))}
            </div>
          </div>
        )}

        {/* SEARCH */}
        {page === "search" && (
          <div>
            <h2 style={{ fontSize: "18px", marginBottom: "16px" }}>{loading ? "Searching..." : `Results for "${query}"`}</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {songs.map((song, index) => (
                <SongRow key={song.trackId} song={song} index={index} />
              ))}
            </div>
          </div>
        )}

        {/* LIBRARY — LIKED SONGS */}
        {page === "library" && (
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "4px" }}>❤️ Liked Songs</h1>
            <p style={{ color: "#aaa", fontSize: "13px", marginBottom: "24px" }}>{likedSongs.length} songs</p>
            {likedSongs.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 0" }}>
                <p style={{ fontSize: "40px", marginBottom: "16px" }}>🤍</p>
                <p style={{ color: "#aaa", fontSize: "15px" }}>No liked songs yet!</p>
                <p style={{ color: "#555", fontSize: "13px", marginTop: "8px" }}>Press ❤️ on any song to save it here</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {likedSongs.map((song, index) => (
                  <SongRow key={song.trackId} song={song} index={index} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ARTIST PAGE */}
        {page === "artist" && artist && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "28px", padding: "20px", background: "#121212", borderRadius: "12px" }}>
              <img src={artist.artworkUrl100} alt={artist.artistName} style={{ width: "80px", height: "80px", borderRadius: "50%", flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: "12px", color: "#aaa", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Artist</p>
                <h1 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "4px" }}>{artist.artistName}</h1>
                <p style={{ fontSize: "13px", color: "#aaa" }}>{artistSongs.length} songs</p>
              </div>
            </div>
            <h2 style={{ fontSize: "16px", marginBottom: "16px" }}>Popular Songs</h2>
            {loading ? <p style={{ color: "#aaa" }}>Loading...</p> : (
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {artistSongs.map((song, index) => (
                  <SongRow key={song.trackId} song={song} index={index} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* PROFILE */}
        {page === "profile" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "40px", gap: "16px" }}>
            <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "#1db954", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px" }}>👤</div>
            <h2 style={{ fontSize: "20px", fontWeight: "700" }}>{user.email}</h2>
            <p style={{ color: "#aaa", fontSize: "13px" }}>Member of MyMusic</p>
            <div style={{ marginTop: "16px", background: "#121212", borderRadius: "12px", padding: "16px 24px", textAlign: "center" }}>
              <p style={{ fontSize: "24px", fontWeight: "700", color: "#1db954" }}>{likedSongs.length}</p>
              <p style={{ fontSize: "13px", color: "#aaa" }}>Liked Songs</p>
            </div>
            <button onClick={() => signOut(auth)} style={{ marginTop: "24px", padding: "14px 32px", borderRadius: "50px", border: "1px solid #333", background: "transparent", color: "white", fontSize: "15px", cursor: "pointer", fontWeight: "600" }}>Log Out</button>
          </div>
        )}

      </div>

      {/* PLAYER BAR */}
      {currentSong && (
        <div style={{ position: "fixed", bottom: "60px", left: 0, right: 0, background: "#181818", borderTop: "1px solid #222", padding: "10px 20px", display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <img src={currentSong.artworkUrl100} alt={currentSong.trackName} style={{ width: "48px", height: "48px", borderRadius: "8px", flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "14px", fontWeight: "600", color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{currentSong.trackName}</div>
              <div style={{ fontSize: "12px", color: "#1db954", marginTop: "2px" }}>{currentSong.artistName}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
              <button onClick={() => toggleLike(currentSong)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}>
                {isLiked(currentSong) ? "❤️" : "🤍"}
              </button>
              <button
                onClick={() => {
                  if (isPlaying) {
                    playerRef.current?.pauseVideo();
                    setIsPlaying(false);
                    clearInterval(timerRef.current);
                  } else {
                    playerRef.current?.playVideo();
                    setIsPlaying(true);
                    startTimer();
                  }
                }}
                style={{ width: "44px", height: "44px", borderRadius: "50%", background: "#1db954", border: "none", color: "black", fontSize: "18px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {isPlaying ? "⏸" : "▶"}
              </button>
              <button onClick={stopSong} style={{ background: "none", border: "none", color: "#aaa", fontSize: "20px", cursor: "pointer" }}>✕</button>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "11px", color: "#aaa", minWidth: "35px" }}>{formatTime(currentTime)}</span>
            <div
              style={{ flex: 1, height: "4px", background: "#333", borderRadius: "2px", cursor: "pointer" }}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                const seekTo = percent * duration;
                playerRef.current?.seekTo(seekTo, true);
                setCurrentTime(seekTo);
              }}
            >
              <div style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%`, height: "100%", background: "#1db954", borderRadius: "2px" }} />
            </div>
            <span style={{ fontSize: "11px", color: "#aaa", minWidth: "35px", textAlign: "right" }}>{formatTime(duration)}</span>
          </div>
        </div>
      )}

      {/* BOTTOM NAV */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: "60px", background: "#121212", borderTop: "1px solid #222", display: "flex", alignItems: "center", justifyContent: "space-around" }}>
        <div onClick={() => setPage("home")} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", cursor: "pointer", color: page === "home" ? "#1db954" : "#aaa" }}>
          <span style={{ fontSize: "20px" }}>🏠</span>
          <span style={{ fontSize: "10px" }}>Home</span>
        </div>
        <div onClick={() => setPage("search")} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", cursor: "pointer", color: page === "search" ? "#1db954" : "#aaa" }}>
          <span style={{ fontSize: "20px" }}>🔍</span>
          <span style={{ fontSize: "10px" }}>Search</span>
        </div>
        <div onClick={() => setPage("library")} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", cursor: "pointer", color: page === "library" ? "#1db954" : "#aaa" }}>
          <span style={{ fontSize: "20px" }}>❤️</span>
          <span style={{ fontSize: "10px" }}>Liked</span>
        </div>
        <div onClick={() => setPage("profile")} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", cursor: "pointer", color: page === "profile" ? "#1db954" : "#aaa" }}>
          <span style={{ fontSize: "20px" }}>👤</span>
          <span style={{ fontSize: "10px" }}>Profile</span>
        </div>
      </div>

    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("login");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    onAuthStateChanged(auth, (u) => {
      setUser(u);
      setChecking(false);
    });
  }, []);

  if (checking) return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <h2 style={{ color: "#1db954", fontFamily: "sans-serif" }}>🎵 Loading...</h2>
    </div>
  );

  if (user) return <Home user={user} />;
  if (page === "login") return <Login onLogin={() => {}} onSignup={() => setPage("signup")} />;
  if (page === "signup") return <Signup onSignup={() => {}} onBack={() => setPage("login")} />;
}

export default App;