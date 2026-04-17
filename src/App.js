import { useState } from "react";

function App() {
  const [query, setQuery] = useState("");
  const [songs, setSongs] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState("home");

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

  function handleKey(e) {
    if (e.key === "Enter") searchSongs();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#0a0a0a", color: "white", fontFamily: "sans-serif" }}>

      {/* TOP BAR */}
      <div style={{ background: "#121212", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10, borderBottom: "1px solid #222" }}>
        <h2 style={{ color: "#1db954", fontSize: "20px", margin: 0 }}>🎵 MyMusic</h2>
        <div style={{ display: "flex", gap: "8px", flex: 1, margin: "0 16px" }}>
          <input
            type="text"
            placeholder="Search songs, artists..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKey}
            style={{ flex: 1, padding: "10px 16px", borderRadius: "50px", border: "1px solid #333", background: "#1a1a1a", color: "white", fontSize: "14px", outline: "none" }}
          />
          <button
            onClick={searchSongs}
            style={{ padding: "10px 20px", borderRadius: "50px", border: "none", background: "#1db954", color: "black", fontSize: "14px", fontWeight: "700", cursor: "pointer" }}>
            Go
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, padding: "20px 16px", paddingBottom: currentSong ? "140px" : "80px" }}>

        {/* HOME PAGE */}
        {page === "home" && (
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "8px" }}>Good evening 👋</h1>
            <p style={{ color: "#aaa", marginBottom: "32px", fontSize: "14px" }}>Search for any song above to start listening!</p>

            <h2 style={{ fontSize: "16px", marginBottom: "16px" }}>Try searching for:</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {["Adele", "Taylor Swift", "Drake", "BTS", "Ed Sheeran", "Billie Eilish", "The Weeknd", "Ariana Grande"].map((artist) => (
                <div
                  key={artist}
                  onClick={() => { setQuery(artist); setTimeout(searchSongs, 100); }}
                  style={{ padding: "10px 18px", borderRadius: "50px", background: "#1a1a1a", border: "1px solid #333", cursor: "pointer", fontSize: "14px", color: "#aaa" }}
                >
                  {artist}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SEARCH RESULTS */}
        {page === "search" && (
          <div>
            <h2 style={{ fontSize: "18px", marginBottom: "16px" }}>
              {loading ? "Searching..." : `Results for "${query}"`}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {songs.map((song) => (
                <div
                  key={song.trackId}
                  onClick={() => setCurrentSong(song)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "10px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    background: currentSong?.trackId === song.trackId ? "#1db95422" : "transparent",
                  }}
                >
                  <img
                    src={song.artworkUrl100}
                    alt={song.trackName}
                    style={{ width: "48px", height: "48px", borderRadius: "6px", flexShrink: 0 }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: "500", color: currentSong?.trackId === song.trackId ? "#1db954" : "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: "14px" }}>
                      {song.trackName}
                    </div>
                    <div style={{ fontSize: "12px", color: "#aaa", marginTop: "2px" }}>{song.artistName}</div>
                  </div>
                  {song.previewUrl && (
                    <div style={{ fontSize: "18px", flexShrink: 0 }}>▶</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* PLAYER BAR */}
      {currentSong && (
        <div style={{ position: "fixed", bottom: "60px", left: 0, right: 0, background: "#181818", borderTop: "1px solid #333", padding: "10px 16px", display: "flex", alignItems: "center", gap: "12px" }}>
          <img
            src={currentSong.artworkUrl100}
            alt={currentSong.trackName}
            style={{ width: "44px", height: "44px", borderRadius: "6px", flexShrink: 0 }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "13px", fontWeight: "600", color: "#1db954", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{currentSong.trackName}</div>
            <div style={{ fontSize: "11px", color: "#aaa" }}>{currentSong.artistName}</div>
          </div>
          <audio
            key={currentSong.trackId}
            controls
            autoPlay
            src={currentSong.previewUrl}
            style={{ width: "140px" }}
          />
        </div>
      )}

      {/* BOTTOM NAV */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: "60px", background: "#121212", borderTop: "1px solid #222", display: "flex", alignItems: "center", justifyContent: "space-around" }}>
        <div
          onClick={() => setPage("home")}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", cursor: "pointer", color: page === "home" ? "#1db954" : "#aaa" }}>
          <span style={{ fontSize: "20px" }}>🏠</span>
          <span style={{ fontSize: "10px" }}>Home</span>
        </div>
        <div
          onClick={() => setPage("search")}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", cursor: "pointer", color: page === "search" ? "#1db954" : "#aaa" }}>
          <span style={{ fontSize: "20px" }}>🔍</span>
          <span style={{ fontSize: "10px" }}>Search</span>
        </div>
        <div
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", cursor: "pointer", color: "#aaa" }}>
          <span style={{ fontSize: "20px" }}>📚</span>
          <span style={{ fontSize: "10px" }}>Library</span>
        </div>
        <div
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", cursor: "pointer", color: "#aaa" }}>
          <span style={{ fontSize: "20px" }}>👤</span>
          <span style={{ fontSize: "10px" }}>Profile</span>
        </div>
      </div>

    </div>
  );
}

export default App;