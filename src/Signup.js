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
    console.log("Trying to sign up with:", email, password);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      console.log("Success!", result);
      onSignup();
    } catch (err) {
      console.log("Error:", err.code, err.message);
      setError(err.message);
    }
    setLoading(false);
  }

  return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
      <div style={{ background: "#121212", padding: "48px", borderRadius: "16px", width: "100%", maxWidth: "400px" }}>

        <h1 style={{ color: "#1db954", textAlign: "center", fontSize: "28px", marginBottom: "8px" }}>🎵 MyMusic</h1>
        <p style={{ color: "#aaa", textAlign: "center", marginBottom: "32px" }}>Create your account</p>

        {error && (
          <p style={{ color: "#ff4444", textAlign: "center", marginBottom: "16px", fontSize: "13px" }}>{error}</p>
        )}

        <div style={{ marginBottom: "16px" }}>
          <p style={{ color: "#aaa", fontSize: "13px", marginBottom: "6px" }}>Email</p>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: "12px 16px", borderRadius: "8px", border: "1px solid #333", background: "#1a1a1a", color: "white", fontSize: "14px", outline: "none" }}
          />
        </div>

        <div style={{ marginBottom: "24px" }}>
          <p style={{ color: "#aaa", fontSize: "13px", marginBottom: "6px" }}>Password</p>
          <input
            type="password"
            placeholder="Min 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: "12px 16px", borderRadius: "8px", border: "1px solid #333", background: "#1a1a1a", color: "white", fontSize: "14px", outline: "none" }}
          />
        </div>

        <button
          onClick={handleSignup}
          disabled={loading}
          style={{ width: "100%", padding: "14px", borderRadius: "50px", border: "none", background: loading ? "#aaa" : "#1db954", color: "black", fontSize: "16px", fontWeight: "700", cursor: "pointer" }}>
          {loading ? "Creating account..." : "Create Account"}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "24px 0" }}>
          <div style={{ flex: 1, height: "1px", background: "#333" }}></div>
          <p style={{ color: "#aaa", fontSize: "13px" }}>or</p>
          <div style={{ flex: 1, height: "1px", background: "#333" }}></div>
        </div>

        <p style={{ color: "#aaa", textAlign: "center", fontSize: "14px" }}>
          Already have an account?{" "}
          <span
            onClick={onBack}
            style={{ color: "#1db954", cursor: "pointer", fontWeight: "600" }}>
            Log in
          </span>
        </p>

      </div>
    </div>
  );
}

export default Signup;