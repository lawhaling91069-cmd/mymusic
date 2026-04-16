import { useState } from "react";
import Login from "./Login";
import Signup from "./Signup";

function Home() {
  return (
    <div style={{ display: "flex", height: "100vh", background: "#0a0a0a", color: "white", fontFamily: "sans-serif" }}>
      <div style={{ width: "220px", background: "#121212", padding: "24px 16px", display: "flex", flexDirection: "column", gap: "8px" }}>
        <h2 style={{ color: "#1db954", marginBottom: "24px" }}>🎵 MyMusic</h2>
        <div style={{ color: "white", padding: "10px", borderRadius: "8px", background: "#1db95422" }}>🏠 Home</div>
        <div style={{ color: "#aaa", padding: "10px", borderRadius: "8px" }}>🔍 Search</div>
        <div style={{ color: "#aaa", padding: "10px", borderRadius: "8px" }}>📚 Library</div>
      </div>
      <div style={{ flex: 1, padding: "32px" }}>
        <h1 style={{ fontSize: "32px", fontWeight: "700", marginBottom: "8px" }}>Good evening 👋</h1>
        <p style={{ color: "#aaa", marginBottom: "32px" }}>What do you want to listen to?</p>
        <h2 style={{ fontSize: "18px", marginBottom: "16px" }}>Your Songs</h2>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "10px 12px", borderRadius: "8px", background: "#1db95422", marginBottom: "4px" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "8px", background: "#1a2e1a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" }}>🎵</div>
          <div>
            <div style={{ fontWeight: "500", color: "#1db954" }}>Free Music Sample</div>
            <div style={{ fontSize: "13px", color: "#aaa" }}>Test Artist</div>
          </div>
        </div>
        <div style={{ marginTop: "32px" }}>
          <audio controls style={{ width: "100%" }}>
            <source src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" type="audio/mpeg" />
          </audio>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [page, setPage] = useState("login");

  if (page === "login") {
    return <Login onLogin={() => setPage("home")} onSignup={() => setPage("signup")} />;
  }

  if (page === "signup") {
    return <Signup onSignup={() => setPage("home")} onBack={() => setPage("login")} />;
  }

  if (page === "home") {
    return <Home />;
  }
}

export default App;