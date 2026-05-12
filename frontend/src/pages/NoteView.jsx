import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

// Helpers
const decodeEntities = (html) => {
  if (!html) return "";
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
};

const formatMarkdown = (text) => {
  if (!text) return { __html: "" };
  let safeText = text.replace(/</g, "&lt;").replace(/>/g, "&gt;")
                     .replace(/&lt;mark&gt;/g, "<mark>").replace(/&lt;\/mark&gt;/g, "</mark>");
  const lines = safeText.split('\n');
  let htmlResult = '';
  let inList = false;

  lines.forEach((line) => {
    let trimmed = line.trim();
    if (/^={3,}$/.test(trimmed)) return;
    if (/^-{3,}$/.test(trimmed)) { htmlResult += `<hr>`; return; }

    if (/^###\s+(.*)$/.test(trimmed)) {
       if (inList) { htmlResult += '</ul>'; inList = false; }
       htmlResult += `<h3>${trimmed.replace(/^###\s+/, '')}</h3>`; return;
    }
    if (/^##\s+(.*)$/.test(trimmed)) {
       if (inList) { htmlResult += '</ul>'; inList = false; }
       htmlResult += `<h2>${trimmed.replace(/^##\s+/, '')}</h2>`; return;
    }
    if (/^#\s+(.*)$/.test(trimmed)) {
       if (inList) { htmlResult += '</ul>'; inList = false; }
       htmlResult += `<h1>${trimmed.replace(/^#\s+/, '')}</h1>`; return;
    }

    if (/^[\*\-]\s+(.*)$/.test(trimmed)) {
       if (!inList) { htmlResult += '<ul>'; inList = true; }
       htmlResult += `<li>${trimmed.replace(/^[\*\-]\s+/, '')}</li>`; return;
    }

    if (inList && trimmed === '') { htmlResult += '</ul>'; inList = false; return; }
    if (inList && !/^[\*\-]\s+(.*)$/.test(trimmed)) { htmlResult += '</ul>'; inList = false; }

    if (trimmed === '') htmlResult += '<br>';
    else htmlResult += `${trimmed}<br>`;
  });

  if (inList) htmlResult += '</ul>';
  htmlResult = htmlResult.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  return { __html: htmlResult };
};

const getWordCount = (html) => {
  if (!html) return 0;
  return html.replace(/<[^>]*>?/gm, '').split(/\s+/).filter(w => w).length;
};

export default function NoteView() {
  const { id } = useParams();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`https://neuro-note-production.up.railway.app/api/notes/${id}`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) setNote(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' }}><div className="spinner dark large"></div></div>;

  if (!note) return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', justifyContent: 'center', alignItems: 'center' }}>
      <h2 style={{ color: 'var(--text-dark)' }}>Note not found</h2>
      <Link to="/" className="btn-primary" style={{ marginTop: '20px' }}>Go Home</Link>
    </div>
  );

  const wordCount = getWordCount(note.content);
  const readingTime = Math.ceil(wordCount / 200);

  return (
    <div className="page-fade-in" style={{ padding: '40px', maxWidth: '900px', margin: '0 auto', minHeight: '100vh' }}>
      
      <div style={{ marginBottom: '20px' }}>
        <Link to="/" style={{ textDecoration: 'none', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
           <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg> Back to Neuro Note
        </Link>
      </div>

      <div className="card" style={{ padding: '40px' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '20px', marginBottom: '24px' }}>
            <h1 style={{ fontSize: '36px', color: 'var(--text-dark)', margin: 0 }}>{decodeEntities(note.title)}</h1>
         </div>
         
         <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{new Date(note.createdAt).toLocaleDateString()}</span>
            <span style={{ background: '#EEF2FF', padding: '2px 10px', borderRadius: '4px', color: 'var(--primary)', fontSize: '13px', fontWeight: '600' }}>{wordCount} words</span>
            <span style={{ background: 'rgba(6, 182, 212, 0.1)', padding: '2px 10px', borderRadius: '4px', color: 'var(--secondary)', fontSize: '13px', fontWeight: '600' }}>{readingTime} min read</span>
         </div>

         <div className="markdown-content" dangerouslySetInnerHTML={formatMarkdown(note.content)} />
      </div>
    </div>
  );
}
