import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";

function Signup({ onSignup, onBack }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    setError("");
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      onSignup();
    } catch (err) {
      setError(err.message);
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
          <p style={{ color: "#b3b3b3", fontSize: "14px", marginTop: "8px" }}>Join millions of music lovers</p>
        </div>

        {error && (
          <div style={{ background: "#e91429", color: "white", padding: "12px 16px", borderRadius: "8px", fontSize: "13px", marginBottom: "16px", textAlign: "center" }}>{error}</div>
        )}

        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "8px" }}>Email address</label>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: "14px 16px", borderRadius: "6px", border: "1px solid #727272", background: "#121212", color: "white", fontSize: "15px", outline: "none" }}
            onFocus={(e) => e.target.style.borderColor = "#fff"}
            onBlur={(e) => e.target.style.borderColor = "#727272"}
          />
        </div>

        <div style={{ marginBottom: "24px" }}>
          <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "8px" }}>Password</label>
          <input
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: "14px 16px", borderRadius: "6px", border: "1px solid #727272", background: "#121212", color: "white", fontSize: "15px", outline: "none" }}
            onFocus={(e) => e.target.style.borderColor = "#fff"}
            onBlur={(e) => e.target.style.borderColor = "#727272"}
          />
        </div>

        <button
          onClick={handleSignup}
          disabled={loading}
          style={{ width: "100%", padding: "15px", borderRadius: "50px", border: "none", background: loading ? "#1ed760aa" : "#1ed760", color: "#000", fontSize: "15px", fontWeight: "700", cursor: "pointer", letterSpacing: "0.5px" }}
          onMouseEnter={(e) => e.target.style.transform = "scale(1.02)"}
          onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
        >
          {loading ? "Creating account..." : "Create Account"}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "24px 0" }}>
          <div style={{ flex: 1, height: "1px", background: "#292929" }} />
          <span style={{ color: "#727272", fontSize: "13px" }}>or</span>
          <div style={{ flex: 1, height: "1px", background: "#292929" }} />
        </div>

        <p style={{ color: "#b3b3b3", textAlign: "center", fontSize: "14px" }}>
          Already have an account?{" "}
          <span onClick={onBack} style={{ color: "#fff", cursor: "pointer", fontWeight: "600", textDecoration: "underline" }}>Log in</span>
        </p>

      </div>
    </div>
  );
}

export default Signup;