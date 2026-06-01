import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../firebase";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    if(name && email && password) {
      setLoading(true);
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        localStorage.setItem("isFirstLogin", "true");
        navigate('/dashboard');
      } catch (err) {
        setError(err.message || "Failed to create account. Please try again.");
      }
      setLoading(false);
    } else {
      setError("Please fill in all fields.");
    }
  };

  return (
    <div className="auth-container">
      {/* Left Pane */}
      <div className="auth-left-pane signup-gradient page-fade-in">
        <div className="blob" style={{ background: '#f472b6', width: '300px', height: '300px', top: '20%', left: '30%' }}></div>
        <div className="blob" style={{ background: 'var(--primary)', width: '400px', height: '400px', bottom: '5%', right: '5%', animationDelay: '-2s' }}></div>
        
        <div style={{ zIndex: 1, position: 'relative' }}>
          <Link to="/" style={{ textDecoration: 'none', color: 'white', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>
            <span style={{ fontSize: '24px', fontWeight: '800' }}>Neuro Note</span>
          </Link>
        </div>

        <div style={{ zIndex: 1, position: 'relative', marginTop: '40px' }}>
          <h1 style={{ fontSize: '48px', fontWeight: '800', lineHeight: '1.2', marginBottom: '24px' }}>Join the Future of Learning.</h1>
          <p style={{ fontSize: '20px', opacity: 0.9, lineHeight: '1.6', maxWidth: '400px', marginBottom: '40px' }}>Sign up strictly takes less than 30 seconds. Dive instantly into AI-powered retention structuring.</p>
          
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
             <li style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '16px' }}><div style={{ padding: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '50%' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg></div> Lifetime Free Demo</li>
             <li style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '16px' }}><div style={{ padding: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '50%' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg></div> Gemini Pro Accelerated</li>
          </ul>
        </div>
        <div></div>
      </div>

      {/* Right Pane Form */}
      <div className="auth-right-pane slide-in-left">
        <div className="auth-form-wrapper">
          <h2 style={{ fontSize: '32px', marginBottom: '8px', color: 'var(--text-dark)' }}>Create an account</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '40px' }}>Get started right now.</p>
          
          {error && <div style={{ background: '#fef2f2', borderLeft: '4px solid #ef4444', color: '#991b1b', padding: '12px 16px', borderRadius: '4px', marginBottom: '24px', fontSize: '14px' }}>{error}</div>}

          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column' }}>
            
            <div className="floating-group">
              <input 
                type="text" 
                id="name"
                className="floating-input"
                placeholder=" " 
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <label htmlFor="name" className="floating-label">Full Name</label>
            </div>

            <div className="floating-group">
              <input 
                type="email" 
                id="email"
                className="floating-input"
                placeholder=" " 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <label htmlFor="email" className="floating-label">Email Address</label>
            </div>
            
            <div className="floating-group">
              <input 
                type="password" 
                id="password"
                className="floating-input"
                placeholder=" " 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <label htmlFor="password" className="floating-label">Password</label>
            </div>

            <button disabled={loading} type="submit" className="btn-primary shine" style={{ marginTop: '10px', width: '100%', padding: '16px' }}>
              {loading ? <span style={{display:'flex', alignItems:'center', gap:'8px'}}><div className="spinner"></div>Creating...</span> : "Create Account"}
            </button>
          </form>

          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '32px', fontSize: '14px' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}>Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
