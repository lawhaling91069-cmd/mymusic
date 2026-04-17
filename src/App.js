import { useState } from "react";

function App() {
  const [query, setQuery] = useState("");
  const [songs, setSongs] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [loading, setLoading] = useState(false);

  async function searchSongs() {
    if (!query) return;
    setLoading(true);
    const res = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=20`
    );
    const data = await res.json();
    setSongs(data.results);
    setLoading(false);
  }

  function handleKey(e) {
    if (e.key === "Enter") searchSongs();
  }

  return (
    <div style={{ display: "flex", height: "100vh", background: "#0a0a0a", color: "white", fontFamily: "sans-serif" }}>

      {/* SIDEBAR */}
      <div style={{ width: "220px", background: "#121212", padding: "24px 16px", display: "flex", flexDirection: "column", gap: "8px", flexShrink: 0 }}>
        <h2 style={{ color: "#1db954", marginBottom: "24px" }}>🎵 MyMusic</h2>
        <div style={{ color: "white", padding: "10px", borderRadius: "8px", background: "#1db95422" }}>🏠 Home</div>
        <div style={{ color: "#aaa", padding: "10px", borderRadius: "8px" }}>🔍 Search</div>
        <div style={{ color: "#aaa", padding: "10px", borderRadius: "8px" }}>📚 Library</div>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, overflowY: "auto", padding: "32px", paddingBottom: "120px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "700", marginBottom: "24px" }}>Search Songs 🔍</h1>

        {/* SEARCH BAR */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "32px" }}>
          <input
            type="text"
            placeholder="Search for any song or artist..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKey}
            style={{ flex: 1, padding: "14px 20px", borderRadius: "50px", border: "1px solid #333", background: "#1a1a1a", color: "white", fontSize: "15px", outline: "none" }}
          />
          <button
            onClick={searchSongs}
            style={{ padding: "14px 28px", borderRadius: "50px", border: "none", background: "#1db954", color: "black", fontSize: "15px", fontWeight: "700", cursor: "pointer" }}>
            Search
          </button>
        </div>

        {/* LOADING */}
        {loading && (
          <p style={{ color: "#aaa", textAlign: "center" }}>Searching...</p>
        )}

        {/* RESULTS */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {songs.map((song) => (
            <div
              key={song.trackId}
              onClick={() => setCurrentSong(song)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                padding: "10px 12px",
                borderRadius: "8px",
                cursor: "pointer",
                background: currentSong?.trackId === song.trackId ? "#1db95422" : "transparent",
                transition: "background 0.15s"
              }}
            >
              <img
                src={song.artworkUrl100}
                alt={song.trackName}
                style={{ width: "48px", height: "48px", borderRadius: "6px", flexShrink: 0 }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: "500", color: currentSong?.trackId === song.trackId ? "#1db954" : "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {song.trackName}
                </div>
                <div style={{ fontSize: "13px", color: "#aaa" }}>{song.artistName}</div>
              </div>
              <div style={{ fontSize: "12px", color: "#aaa", flexShrink: 0 }}>
                {song.previewUrl ? "▶ Preview" : "No preview"}
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* PLAYER BAR */}
      {currentSong && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#181818", borderTop: "1px solid #333", padding: "12px 24px", display: "flex", alignItems: "center", gap: "16px" }}>
          <img
            src={currentSong.artworkUrl100}
            alt={currentSong.trackName}
            style={{ width: "52px", height: "52px", borderRadius: "8px", flexShrink: 0 }}
          />
          <div style={{ width: "200px", flexShrink: 0 }}>
            <div style={{ fontSize: "13px", fontWeight: "600", color: "#1db954", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{currentSong.trackName}</div>
            <div style={{ fontSize: "11px", color: "#aaa" }}>{currentSong.artistName}</div>
          </div>
          <audio
            key={currentSong.trackId}
            controls
            autoPlay
            src={currentSong.previewUrl}
            style={{ flex: 1 }}
          />
        </div>
      )}

    </div>
  );
}

export default App;