import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";

function Login({ onLogin, onSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onLogin();
    } catch (err) {
      setError("Wrong email or password. Try again!");
    }
    setLoading(false);
  }

  return (
    <div style={{ background: "#000", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif", padding: "20px" }}>
      <div style={{ width: "100%", maxWidth: "380px" }}>

        {/* LOGO */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{ fontSize: "48px", marginBottom: "8px" }}>🎵</div>
          <h1 style={{ fontSize: "28px", fontWeight: "700", letterSpacing: "-0.5px" }}>MyMusic</h1>
          <p style={{ color: "#b3b3b3", fontSize: "14px", marginTop: "8px" }}>Millions of songs. Free.</p>
        </div>

        {error && (
          <div style={{ background: "#e91429", color: "white", padding: "12px 16px", borderRadius: "8px", fontSize: "13px", marginBottom: "16px", textAlign: "center" }}>{error}</div>
        )}

        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "8px", color: "#fff" }}>Email address</label>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            style={{ width: "100%", padding: "14px 16px", borderRadius: "6px", border: "1px solid #727272", background: "#121212", color: "white", fontSize: "15px", outline: "none", transition: "border-color 0.15s" }}
            onFocus={(e) => e.target.style.borderColor = "#fff"}
            onBlur={(e) => e.target.style.borderColor = "#727272"}
          />
        </div>

        <div style={{ marginBottom: "24px" }}>
          <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "8px", color: "#fff" }}>Password</label>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            style={{ width: "100%", padding: "14px 16px", borderRadius: "6px", border: "1px solid #727272", background: "#121212", color: "white", fontSize: "15px", outline: "none", transition: "border-color 0.15s" }}
            onFocus={(e) => e.target.style.borderColor = "#fff"}
            onBlur={(e) => e.target.style.borderColor = "#727272"}
          />
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{ width: "100%", padding: "15px", borderRadius: "50px", border: "none", background: loading ? "#1ed760aa" : "#1ed760", color: "#000", fontSize: "15px", fontWeight: "700", cursor: "pointer", letterSpacing: "0.5px", transition: "transform 0.1s, background 0.15s" }}
          onMouseEnter={(e) => e.target.style.transform = "scale(1.02)"}
          onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
        >
          {loading ? "Logging in..." : "Log In"}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "24px 0" }}>
          <div style={{ flex: 1, height: "1px", background: "#292929" }} />
          <span style={{ color: "#727272", fontSize: "13px" }}>or</span>
          <div style={{ flex: 1, height: "1px", background: "#292929" }} />
        </div>

        <p style={{ color: "#b3b3b3", textAlign: "center", fontSize: "14px" }}>
          Don't have an account?{" "}
          <span onClick={onSignup} style={{ color: "#fff", cursor: "pointer", fontWeight: "600", textDecoration: "underline" }}>Sign up</span>
        </p>

      </div>
    </div>
  );
}

export default Login;