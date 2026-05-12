import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

const IconMoon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>;
const IconSun = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>;

export default function Navbar() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '24px 40px',
      background: 'transparent'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6C63FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>
        <Link to="/" style={{ textDecoration: 'none', fontSize: '24px', fontWeight: '800', background: 'linear-gradient(135deg, #6C63FF, #8a84ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Neuro Note
        </Link>
      </div>
      <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '8px', background: 'var(--border-light)', padding: '4px', borderRadius: '99px' }}>
           <button onClick={() => setTheme('light')} style={{ cursor: 'pointer', border: 'none', padding: '6px 12px', borderRadius: '99px', background: theme === 'light' ? '#fff' : 'transparent', color: theme === 'light' ? 'var(--primary)' : 'var(--text-muted)', display: 'flex', justifyContent: 'center', transition: 'all 0.3s', boxShadow: theme === 'light' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none' }}>
             <IconSun />
           </button>
           <button onClick={() => setTheme('dark')} style={{ cursor: 'pointer', border: 'none', padding: '6px 12px', borderRadius: '99px', background: theme === 'dark' ? '#1A1A2E' : 'transparent', color: theme === 'dark' ? 'var(--primary)' : 'var(--text-muted)', display: 'flex', justifyContent: 'center', transition: 'all 0.3s', boxShadow: theme === 'dark' ? '0 2px 8px rgba(0,0,0,0.2)' : 'none' }}>
             <IconMoon />
           </button>
        </div>
        <Link to="/login" style={{ textDecoration: 'none', color: 'var(--text-muted)', fontWeight: '600', transition: 'color 0.2s' }}>
          Login
        </Link>
        <Link to="/signup" className="btn-primary" style={{ padding: '10px 24px', fontSize: '15px', textDecoration: 'none' }}>
          Sign Up
        </Link>
      </div>
    </nav>
  );
}
