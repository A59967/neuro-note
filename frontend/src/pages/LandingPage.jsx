import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

// Custom Native Hooks Setup
function useTypewriter(words, speed = 100, pause = 2000) {
  const [text, setText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);

  useEffect(() => {
    let timer;
    const currentWord = words[loopNum % words.length];

    if (isDeleting) {
      timer = setTimeout(() => {
        setText(currentWord.substring(0, text.length - 1));
        if (text.length === 0) {
          setIsDeleting(false);
          setLoopNum(loopNum + 1);
        }
      }, speed / 2);
    } else {
      timer = setTimeout(() => {
        setText(currentWord.substring(0, text.length + 1));
        if (text.length === currentWord.length) {
          setTimeout(() => setIsDeleting(true), pause);
        }
      }, speed);
    }
    return () => clearTimeout(timer);
  }, [text, isDeleting, loopNum, words, speed, pause]);

  return text;
}

function useScrollFadeIn() {
  const ref = useRef(null);
  const [isVisible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.1 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return { ref, className: `fade-in-section ${isVisible ? 'is-visible' : ''}` };
}

export default function LandingPage() {
  const navigate = useNavigate();
  const typewriterText = useTypewriter(["Smart Notes", "Study Guides", "Flashcards"], 120, 2500);

  const heroScroll = useScrollFadeIn();
  const featuresScroll = useScrollFadeIn();

  return (
    <div className="page-fade-in" style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      
      {/* Background Blobs */}
      <div className="blob" style={{ background: 'var(--primary)', width: '600px', height: '600px', top: '-10%', left: '-10%' }}></div>
      <div className="blob" style={{ background: 'var(--secondary)', width: '500px', height: '500px', top: '40%', right: '-5%', animationDelay: '-3s' }}></div>

      <Navbar />
      
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '80px 20px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div {...heroScroll} style={{ padding: '60px 0' }}>
          <h1 style={{ fontSize: '76px', marginBottom: '24px', fontWeight: '800', lineHeight: '1.2', color: 'var(--text-dark)' }}>
            Turn Lectures into <br />
            <span style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', minHeight: '90px', display: 'inline-block' }}>
              {typewriterText}<span style={{ borderRight: '4px solid var(--primary)', animation: 'blink 1s step-end infinite' }}>&nbsp;</span>
            </span>
          </h1>
          <p style={{ fontSize: '22px', color: 'var(--text-muted)', maxWidth: '650px', margin: '0 auto 40px auto', lineHeight: '1.6' }}>
            Upload audio, paste YouTube links, or record live. Our AI processes your class material perfectly in seconds.
          </p>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <button 
              onClick={() => navigate('/dashboard')}
              className="btn-primary shine"
              style={{ padding: '18px 36px', fontSize: '18px' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              Try Fast Demo
            </button>
            <Link to="/signup" style={{ textDecoration: 'none' }}>
              <button className="pill-btn inactive" style={{ padding: '18px 36px', fontSize: '18px', background: 'white' }}>
                Create Free Account
              </button>
            </Link>
          </div>
        </div>

        <div {...featuresScroll} style={{ marginTop: '120px' }}>
          <h2 style={{ fontSize: '36px', marginBottom: '60px', fontWeight: '800', color: 'var(--text-dark)' }}>Platform Capabilities</h2>
          
          <div className="grid-3-col">
            
            {/* Feature 1 */}
            <div className="card feature-card shine-card" style={{ padding: '40px 24px', textAlign: 'center', animationDelay: '0.0s' }}>
               <div style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                  <span className="emoji-float">🎧</span>
               </div>
               <h3 style={{ fontSize: '24px', margin: '0 0 12px 0', color: 'var(--text-dark)' }}>High-Fidelity Audio</h3>
               <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: '1.6', fontSize: '16px' }}>Record live lectures or upload audio files instantly</p>
            </div>

            {/* Feature 2 */}
            <div className="card feature-card shine-card" style={{ padding: '40px 24px', textAlign: 'center', animationDelay: '0.2s' }}>
               <div style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                  <span className="emoji-float">🤖</span>
               </div>
               <h3 style={{ fontSize: '24px', margin: '0 0 12px 0', color: 'var(--text-dark)' }}>AI Tutor Chatbot</h3>
               <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: '1.6', fontSize: '16px' }}>Ask questions strictly based on your generated notes</p>
            </div>

            {/* Feature 3 */}
            <div className="card feature-card shine-card" style={{ padding: '40px 24px', textAlign: 'center', animationDelay: '0.4s' }}>
               <div style={{ background: 'linear-gradient(135deg, #f97316, #eab308)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                  <span className="emoji-float">⚡</span>
               </div>
               <h3 style={{ fontSize: '24px', margin: '0 0 12px 0', color: 'var(--text-dark)' }}>Dynamic Quizzing</h3>
               <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: '1.6', fontSize: '16px' }}>Auto-generated MCQ quizzes from your lecture notes</p>
            </div>

          </div>
        </div>
      </main>

      <style>{`
        @keyframes blink { 50% { border-color: transparent } }
        @keyframes floatEmoji { 0% { transform: translateY(0px) } 50% { transform: translateY(-10px) } 100% { transform: translateY(0px) } }
        .emoji-float { font-size: 48px; display: inline-block; animation: floatEmoji 3s ease-in-out infinite; }
        .feature-card { transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.4s cubic-bezier(0.4, 0, 0.2, 1); position: relative; overflow: hidden; }
        .feature-card:hover { transform: translateY(-10px); box-shadow: 0 20px 40px rgba(108,99,255,0.15) !important; }
        .shine-card::after { content: ''; position: absolute; top: 0; left: -100%; width: 50%; height: 100%; background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0) 100%); transform: skewX(-20deg); transition: all 0.7s ease; }
        .shine-card:hover::after { left: 150%; }
        [data-theme="dark"] .shine-card::after { background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0) 100%); }
      `}</style>
    </div>
  );
}
