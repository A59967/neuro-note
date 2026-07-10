import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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

const stripMarkdown = (text) => {
  if (!text) return "";
  return text.replace(/^[#\*\-=\s]+/gm, '').replace(/\*\*/g, '').replace(/<[^>]*>?/gm, '');
};

const getWordCount = (html) => {
  if (!html) return 0;
  return html.replace(/<[^>]*>?/gm, '').split(/\s+/).filter(w => w).length;
};

// --- Animated Counter Hook ---
const AnimatedCounter = ({ value, duration = 1500 }) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let startTime = null;
    let animationFrame;
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);
      const easeOut = 1 - Math.pow(1 - percentage, 4);
      setCount(Math.floor(easeOut * value));
      if (percentage < 1) animationFrame = requestAnimationFrame(animate);
      else setCount(value);
    };
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);
  
  return <>{count}</>;
};

// --- Custom SVGs ---
const BrainIcon = () => <svg className="logo-svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>;
const SparkleIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>;
const IconDash = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>;
const IconNotes = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>;
const IconChat = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>;
const IconQuiz = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>;
const IconHome = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>;
const IconMoon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>;
const IconSun = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>;

export default function Dashboard() {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  }, []);

  const [lectureText, setLectureText] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("AI is carefully restructuring your transcript...");
  const [loadingProgress, setLoadingProgress] = useState(0);
  const abortControllerRef = useRef(null);

  const cancelGeneration = () => {
     if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        setLoading(false);
        setLoadingText("Generation cancelled.");
     }
  };

  const [quizLoading, setQuizLoading] = useState(false);
  const [quizData, setQuizData] = useState(null);
  
  const [isListening, setIsListening] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [activeTab, setActiveTab] = useState("text");
  const [pdfLoading, setPdfLoading] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSubject, setActiveSubject] = useState("All Notes");
  const [subjectFolder, setSubjectFolder] = useState("");

  const [currentView, setCurrentView] = useState("dashboard");
  const [showTutorial, setShowTutorial] = useState(false);

  const [notesList, setNotesList] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [chatMessage, setChatMessage] = useState("");
  
  // Note actions state
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  // Quiz specific states
  const [mcqCount, setMcqCount] = useState(20);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizFinished, setQuizFinished] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  // Profile specific states
  const [profileName, setProfileName] = useState("");
  const [profileBio, setProfileBio] = useState("");
  const [profileAvatar, setProfileAvatar] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);

  const [timeNow, setTimeNow] = useState(Date.now());
  
  const recognitionRef = useRef(null);
  const navigate = useNavigate();

  const API_URL = "https://neuro-note-production.up.railway.app/api";

  useEffect(() => {
    if (localStorage.getItem("isFirstLogin") === "true") {
      setShowTutorial(true);
    }
    const int = setInterval(() => setTimeNow(Date.now()), 60000);
    return () => clearInterval(int);
  }, []);

  const closeTutorial = () => {
    setShowTutorial(false);
    localStorage.removeItem("isFirstLogin");
  };

  const fetchMyNotes = async () => {
    if (!auth.currentUser) return;
    try {
      const res = await fetch(`${API_URL}/notes?userId=${auth.currentUser.uid}`);
      if (res.ok) {
        const data = await res.json();
        setNotesList(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchMyNotes();
    if (auth.currentUser) {
       setProfileName(localStorage.getItem(`profileName_${auth.currentUser.uid}`) || auth.currentUser.displayName || "");
       setProfileBio(localStorage.getItem(`profileBio_${auth.currentUser.uid}`) || "");
       setProfileAvatar(localStorage.getItem(`profileAvatar_${auth.currentUser.uid}`) || "");
    }
  }, [auth.currentUser]);

  const deleteNote = async (noteId) => {
    if (!window.confirm("Are you sure you want to delete this note?")) return;
    try {
      await fetch(`${API_URL}/notes/${noteId}`, { method: "DELETE" });
      if (selectedNote && selectedNote._id === noteId) {
        setSelectedNote(null);
        setChatHistory([]);
      }
      fetchMyNotes();
    } catch (e) {
      console.error("Failed to delete note", e);
    }
  };

  const getYoutubeTranscriptImpl = async () => {
    if (!youtubeUrl) return alert("Please paste a YouTube URL!");
    setTranscribing(true);
    setLectureText("Getting transcript...");
    const videoId = youtubeUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i)?.[1];
    if (!videoId) {
      alert("Invalid YouTube URL! Example: https://youtube.com/watch?v=abc123");
      setTranscribing(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/transcript/youtube`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to fetch transcript");
      setLectureText(data.transcript);
    } catch (error) {
      setLectureText(`Error: ${error.message}`);
    } finally {
      setTranscribing(false);
    }
  };

  const handleFileUpload = async (e) => {
    alert("Audio upload requires third party integrations like AssemblyAI which we bypassed to focus on Youtube and Notes generation.");
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Please use Google Chrome for microphone!");
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setLectureText(transcript);
    };
    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const generateNotes = async () => {
    let finalLectureText = lectureText;

    if (activeTab === "youtube" && youtubeUrl && (!finalLectureText || finalLectureText.includes("Getting"))) {
      setLoading(true);
      const videoId = youtubeUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i)?.[1];
      if (!videoId) {
        setLoading(false);
        return alert("Invalid YouTube URL!");
      }
      try {
        const response = await fetch(`${API_URL}/transcript/youtube`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoId })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to fetch transcript");
        finalLectureText = data.transcript;
        setLectureText(finalLectureText);
      } catch (error) {
        setLoading(false);
        return alert(`Error extracting transcript: ${error.message}`);
      }
    }

    if (!finalLectureText || finalLectureText.includes("Error") || finalLectureText.trim() === "") {
      setLoading(false);
      return alert("Please add valid lecture content first!");
    }

    if (!auth.currentUser) return alert("You must be logged in!");

    setLoading(true);
    setLoadingText("AI is carefully restructuring your transcript...");
    setLoadingProgress(0);

    try {
      const titleSnippet = finalLectureText.substring(0, 30).trim() + "...";
      const title = `Note: ${titleSnippet}`;
      const folderToSave = subjectFolder.trim() || 'All Notes';

      abortControllerRef.current = new AbortController();
      const response = await fetch(`${API_URL}/notes/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({
          transcript: finalLectureText,
          userId: auth.currentUser.uid,
          title,
          folderName: folderToSave
        })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let generatedNote = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); 
        
        for (const line of lines) {
           if (line.trim()) {
              try {
                  const data = JSON.parse(line);
                  if (data.progress) {
                     setLoadingText(data.progress);
                     if (data.total) setLoadingProgress((data.current / data.total) * 100);
                  } else if (data.note) {
                     generatedNote = data.note;
                  } else if (data.error) {
                     throw new Error(data.error);
                  }
              } catch (e) {}
           }
        }
      }
      
      if (buffer.trim()) {
          try {
              const data = JSON.parse(buffer);
              if (data.note) generatedNote = data.note;
              if (data.error) throw new Error(data.error);
          } catch(e){}
      }

      if (generatedNote) {
          setSelectedNote(generatedNote); 
          fetchMyNotes();
          setCurrentView("notes");
          setSubjectFolder("");
      }
    } catch (error) {
      if (error.name === 'AbortError') {
         console.log('Fetch aborted');
      } else {
         alert(`Error generating notes: ${error.message}`);
      }
    }
    setLoading(false);
  };

  const askChatbot = async () => {
    if (!selectedNote) return;
    if (!chatMessage.trim()) return;

    const userMsg = chatMessage;
    setChatMessage("");
    setChatHistory(prev => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, noteId: selectedNote._id })
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      setChatHistory(prev => [...prev, { role: "bot", text: data.aiResponse }]);
    } catch (e) {
      setChatHistory(prev => [...prev, { role: "bot", text: "Failed reaching AI tutor. Try again." }]);
    }
    setLoading(false);
  };

  const generateQuiz = async (note) => {
    if (!note) return;
    setSelectedNote(note);
    setCurrentView("quiz");
    setQuizLoading(true);
    setQuizData(null);
    setCurrentQIndex(0);
    setSelectedAnswers({});
    setQuizFinished(false);
    setQuizScore(0);

    try {
      const response = await fetch(`${API_URL}/quiz/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noteId: note._id, mcqCount })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setQuizData(data);
    } catch (e) {
      alert("Failed to generate quiz. Please try again.");
    }
    setQuizLoading(false);
  };

  const handleAnswerSelect = (option) => {
    if (quizFinished) return;
    if (selectedAnswers[currentQIndex]) return; 
    
    const newAnswers = { ...selectedAnswers, [currentQIndex]: option };
    setSelectedAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (!quizData?.mcqs) return;
    if (currentQIndex < quizData.mcqs.length - 1) {
      setCurrentQIndex(currentQIndex + 1);
    } else {
      let score = 0;
      quizData.mcqs.forEach((q, i) => {
        if (selectedAnswers[i] === q.answer) score++;
      });
      setQuizScore(score);
      setQuizFinished(true);
    }
  };

  const downloadPDF = async () => {
    if (!selectedNote) return;
    const element = document.getElementById("pdf-content");
    if (!element) return;

    setPdfLoading(true);
    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: "#ffffff", windowWidth: element.scrollWidth });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      let heightLeft = pdfHeight;
      let position = 0;
      const pageHeight = pdf.internal.pageSize.getHeight();
      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;
      while (heightLeft >= 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }
      pdf.save(`${selectedNote.title || 'NeuroNote'}.pdf`);
    } catch (e) {
      alert("Failed to generate PDF.");
    }
    setPdfLoading(false);
  };

  const logout = () => {
    auth.signOut();
    navigate('/login');
  };

  // --- Note View Actions ---
  const handleHighlight = async () => {
    const selection = window.getSelection();
    if (!selection || !selection.toString().trim()) return;
    const selectedText = selection.toString();
    
    const updatedContent = selectedNote.content.replace(selectedText, `<mark>${selectedText}</mark>`);
    const updatedNote = { ...selectedNote, content: updatedContent };
    
    setSelectedNote(updatedNote);
    setNotesList(prev => prev.map(n => n._id === updatedNote._id ? updatedNote : n));

    try {
      await fetch(`${API_URL}/notes/${selectedNote._id}`, {
         method: "PUT", headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ content: updatedContent })
      });
    } catch (e) { console.error(e); }
  };

  const handleCopy = () => {
    const raw = selectedNote.content.replace(/<[^>]*>?/gm, '');
    navigator.clipboard.writeText(raw);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/note/${selectedNote._id}`);
    setShared(true); setTimeout(() => setShared(false), 2000);
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
       const reader = new FileReader();
       reader.onloadend = () => setProfileAvatar(reader.result);
       reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    if (auth.currentUser) {
      localStorage.setItem(`profileName_${auth.currentUser.uid}`, profileName);
      localStorage.setItem(`profileBio_${auth.currentUser.uid}`, profileBio);
      localStorage.setItem(`profileAvatar_${auth.currentUser.uid}`, profileAvatar);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    }
  };

  const getFuzzyTime = (dateStr) => {
    const diff = Math.floor((timeNow - new Date(dateStr).getTime()) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff} min ago`;
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${Math.floor(hours / 24)} days ago`;
  };

  const subjects = ["All Notes", ...new Set(notesList.map(n => n.folderName || "All Notes"))].filter((v, i, a) => a.indexOf(v) === i);

  const filteredNotes = notesList.filter(n => {
    const matchesSearch = decodeEntities(n.title).toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (n.content && n.content.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesSubject = activeSubject === "All Notes" || (n.folderName || "All Notes") === activeSubject;
    return matchesSearch && matchesSubject;
  });

  const totalNotesCount = notesList.length;
  const wordsProcessed = notesList.reduce((acc, n) => acc + getWordCount(n.content), 0);
  const quizzesTaken = 0; 

  const SidebarItem = ({ viewId, Icon, text, customClick }) => {
    const isActive = currentView === viewId;
    return (
      <div 
        className={`nav-sidebar-item ${isActive ? 'active' : ''}`}
        onClick={() => customClick ? customClick() : setCurrentView(viewId)}
        style={{
          display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
          borderRadius: '12px', cursor: 'pointer', marginBottom: '8px',
          color: isActive ? 'var(--primary)' : 'var(--text-muted)',
          fontWeight: '600',
          transition: 'transform 0.2s ease, color 0.2s ease, background 0.2s ease',
          background: isActive ? 'var(--hover-purple)' : 'transparent',
          transform: 'translateX(0px)'
        }}
        onMouseOver={e => !isActive && (e.currentTarget.style.transform = 'translateY(-2px)')}
        onMouseOut={e => !isActive && (e.currentTarget.style.transform = 'translateY(0px)')}
      >
        <Icon />
        <span>{text}</span>
      </div>
    );
  };

  return (
    <div className="dashboard-container">

      {/* FULL SCREEN OVERLAY FOR GENERATION */}
      {loading && currentView === "dashboard" && (
        <div className="overlay-full page-fade-in">
           <div className="overlay-brain" style={{ marginBottom: '24px' }}>
             <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>
           </div>
           <h2 style={{ fontSize: '32px', color: 'var(--text-dark)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
             <SparkleIcon /> Extracting Intelligence <SparkleIcon />
           </h2>
           <p style={{ color: 'var(--text-muted)', fontSize: '18px' }}>{loadingText}</p>
           {loadingProgress > 0 && (
             <div style={{ width: '300px', height: '6px', background: 'var(--border-light)', borderRadius: '99px', marginTop: '20px', overflow: 'hidden' }}>
                <div style={{ width: `${loadingProgress}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.3s ease' }}></div>
             </div>
           )}
           <button onClick={cancelGeneration} className="pill-btn inactive" style={{ marginTop: '24px', borderColor: '#ef4444', color: '#ef4444' }}>
             Cancel Generation
           </button>
        </div>
      )}

      {/* SIDEBAR */}
      <div className="slide-in-left sidebar-container" style={{ width: '240px', minWidth: '240px', background: '#ffffff', borderRight: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', padding: '24px 20px', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px', paddingLeft: '8px' }}>
          <BrainIcon />
          <span style={{ fontSize: '20px', fontWeight: '800', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Neuro Note
          </span>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <SidebarItem customClick={() => navigate('/')} viewId="home" Icon={IconHome} text="Home" />
          <SidebarItem viewId="dashboard" Icon={IconDash} text="Dashboard" />
          <SidebarItem viewId="notes" Icon={IconNotes} text="My Notes" />
          <SidebarItem viewId="chatbot" Icon={IconChat} text="Chatbot" />
          <SidebarItem viewId="quiz" Icon={IconQuiz} text="Quizzes" />
        </div>
        


        <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '20px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', transition: 'transform 0.2s ease' }} onClick={() => setCurrentView('profile')} onMouseOver={e=>e.currentTarget.style.transform='translateY(-2px)'} onMouseOut={e=>e.currentTarget.style.transform='translateY(0)'}>
           <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: profileAvatar ? `url(${profileAvatar}) center/cover` : 'linear-gradient(135deg, #EEF2FF, var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>
             {!profileAvatar && (profileName?.[0]?.toUpperCase() || auth.currentUser?.email?.[0]?.toUpperCase() || "U")}
           </div>
           <div style={{ overflow: 'hidden' }}>
             <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: 'var(--text-dark)', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>{profileName || auth.currentUser?.displayName || "Student User"}</p>
             <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>View Profile</p>
           </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="dashboard-main-content">

        {/* DASHBOARD */}
        {currentView === "dashboard" && (
          <div className="page-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '36px', fontWeight: '800', margin: '0 0 10px', background: 'linear-gradient(135deg, var(--text-dark), var(--primary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Turn Lectures into Smart Notes
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '16px', marginBottom: '32px' }}>Upload your materials below and let AI structure your knowledge.</p>
            
            {/* Stats Row */}
            <div className="grid-3-col" style={{ marginBottom: '40px' }}>
               <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                 <div style={{ background: '#EEF2FF', padding: '16px', borderRadius: '12px', color: 'var(--primary)' }}><IconNotes /></div>
                 <div>
                   <h3 style={{ margin: 0, fontSize: '28px', fontWeight: '800', color: 'var(--primary)' }}>
                     <AnimatedCounter value={totalNotesCount} />
                   </h3>
                   <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: '500' }}>Total Notes</span>
                 </div>
               </div>
               <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                 <div style={{ background: 'rgba(6,182,212,0.1)', padding: '16px', borderRadius: '12px', color: 'var(--secondary)' }}><IconDash /></div>
                 <div>
                   <h3 style={{ margin: 0, fontSize: '28px', fontWeight: '800', color: 'var(--secondary)' }}>
                     <AnimatedCounter value={wordsProcessed} duration={2000} />
                   </h3>
                   <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: '500' }}>Words Processed</span>
                 </div>
               </div>
               <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                 <div style={{ background: '#F0EEFF', padding: '16px', borderRadius: '12px', color: 'var(--primary)' }}><IconQuiz /></div>
                 <div>
                   <h3 style={{ margin: 0, fontSize: '28px', fontWeight: '800', color: 'var(--text-dark)' }}>
                     <AnimatedCounter value={quizzesTaken} />
                   </h3>
                   <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: '500' }}>Quizzes Taken</span>
                 </div>
               </div>
            </div>

            <div className="card" style={{ position: 'relative', marginBottom: '40px' }}>
              <div className="dashboard-tabs" style={{ position: 'relative', display: 'flex', gap: '32px', marginBottom: '32px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
                <div style={{ padding: '8px 12px', cursor: 'pointer', fontWeight: activeTab === 'text' ? '600' : '500', color: activeTab === 'text' ? 'var(--primary)' : 'var(--text-muted)' }} onClick={() => setActiveTab("text")}>Paste Text</div>
                <div style={{ padding: '8px 12px', cursor: 'pointer', fontWeight: activeTab === 'youtube' ? '600' : '500', color: activeTab === 'youtube' ? 'var(--primary)' : 'var(--text-muted)' }} onClick={() => setActiveTab("youtube")}>YouTube Link</div>
                <div style={{ padding: '8px 12px', cursor: 'pointer', fontWeight: activeTab === 'file' ? '600' : '500', color: activeTab === 'file' ? 'var(--primary)' : 'var(--text-muted)' }} onClick={() => setActiveTab("file")}>Upload Audio</div>
                <div style={{ padding: '8px 12px', cursor: 'pointer', fontWeight: activeTab === 'mic' ? '600' : '500', color: activeTab === 'mic' ? 'var(--primary)' : 'var(--text-muted)' }} onClick={() => setActiveTab("mic")}>Microphone</div>
                
                <div style={{ position: 'absolute', bottom: '-1px', height: '2px', background: 'var(--primary)', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
                  left: activeTab === 'text' ? '12px' 
                      : activeTab === 'youtube' ? '122px' 
                      : activeTab === 'file' ? '244px' 
                      : '372px',
                  width: activeTab === 'text' ? '70px'
                       : activeTab === 'youtube' ? '98px'
                       : activeTab === 'file' ? '96px'
                       : '86px'
                }}></div>
              </div>

              {activeTab === "text" && (
                <div className="page-fade-in"><textarea rows={8} className="input-modern" placeholder="Paste your lecture text summary here..." value={lectureText} onChange={(e) => setLectureText(e.target.value)} /></div>
              )}
              {activeTab === "youtube" && (
                <div className="page-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <input type="url" className="input-modern" placeholder="https://youtube.com/watch?v=..." value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} />
                  <button onClick={getYoutubeTranscriptImpl} disabled={transcribing} className="pill-btn inactive" style={{ width: 'fit-content' }}>
                    {transcribing ? <span style={{display:'flex', alignItems:'center', gap:'8px'}}><div className="spinner dark"></div>Extracting...</span> : "Extract Transcript"}
                  </button>
                  {lectureText && !transcribing && <p style={{ color: '#10b981', fontSize: '14px', fontWeight: 'bold' }}>Transcript loaded successfully!</p>}
                </div>
              )}
              {activeTab === "file" && (
                <div className="page-fade-in" style={{ textAlign: "center", padding: "40px", border: "2px dashed var(--border-light)", borderRadius: "16px", background: 'transparent' }}>
                  <h3 style={{ color: "var(--text-dark)", margin: "0 0 10px" }}>Upload Media</h3>
                  <label className="btn-primary" style={{ display: 'inline-flex', cursor: 'pointer' }}>
                    Choose File <input type="file" accept="audio/*,video/*" onChange={handleFileUpload} style={{ display: "none" }} />
                  </label>
                </div>
              )}
              {activeTab === "mic" && (
                <div className="page-fade-in" style={{ textAlign: "center", padding: "40px", border: "2px solid var(--border-light)", borderRadius: "16px", background: 'transparent' }}>
                  <h3 style={{ margin: "0 0 20px" }}>{isListening ? "Recording Live..." : "Record Lecture directly"}</h3>
                  <button onClick={isListening ? stopListening : startListening} className={isListening ? "btn-primary pulse-glow" : "pill-btn inactive"} style={{ background: isListening ? '#ef4444' : '', boxShadow: isListening ? '0 0 0 8px rgba(239,68,68,0.2)' : 'none' }}>
                    {isListening ? "Stop Recording" : "Start Microphone"}
                  </button>
                </div>
              )}

              <div style={{ marginTop: '24px', display: 'flex', gap: '16px' }}>
                 <input type="text" className="input-modern" placeholder="Subject Folder (e.g., Physics, History)" value={subjectFolder} onChange={e=>setSubjectFolder(e.target.value)} style={{ flex: 1 }} />
                 <button
                   onClick={generateNotes}
                   disabled={loading}
                   className="btn-primary btn-pulse shine"
                   style={{ flex: 2 }}
                 >
                   Generate AI Notes
                 </button>
              </div>
            </div>

            {/* Recent Activity */}
            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px', color: 'var(--text-dark)' }}>Recent Activity</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '40px' }}>
               {notesList.slice(0, 5).map(n => (
                  <div key={n._id} className="card" style={{ padding: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                     <div style={{ background: 'rgba(22, 163, 74, 0.1)', padding: '10px', borderRadius: '50%', color: '#16a34a' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                     </div>
                     <div>
                        <p style={{ margin: 0, fontWeight: '600', color: 'var(--text-dark)' }}>Note generated - {decodeEntities(n.title)}</p>
                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>{getFuzzyTime(n.createdAt)}</p>
                     </div>
                  </div>
               ))}
               {notesList.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No recent activity.</p>}
            </div>
          </div>
        )}

        {/* MY NOTES */}
        {currentView === "notes" && (
          <div className="page-fade-in" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {!selectedNote && (
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                 <h1 style={{ fontSize: '32px', fontWeight: '800', margin: 0, color: 'var(--text-dark)' }}>My Notes</h1>
                 <div className="floating-group" style={{ margin: 0, width: '280px' }}>
                    <input 
                      type="text" id="search" className="floating-input" placeholder=" " 
                      style={{ borderRadius: '99px', padding: '16px 20px 6px 20px' }}
                      value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <label htmlFor="search" className="floating-label" style={{ left: '20px', top: '12px' }}>Search contents & titles...</label>
                 </div>
               </div>
            )}

            {/* Folder Tabs */}
            {!selectedNote && subjects.length > 0 && (
               <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', marginBottom: '32px', paddingBottom: '8px' }}>
                 {subjects.map(sub => (
                   <button 
                     key={sub} 
                     onClick={() => setActiveSubject(sub)}
                     className={`pill-btn ${activeSubject === sub ? 'active' : 'inactive'}`}
                   >
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                     {sub}
                   </button>
                 ))}
               </div>
            )}
            
            {/* Detail View */}
            {selectedNote ? (
              <div className="card page-fade-in" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', borderBottom: '1px solid var(--border-light)', paddingBottom: '16px' }}>
                   <div style={{ display: 'flex', gap: '12px' }}>
                     <button className="pill-btn inactive" onClick={() => setSelectedNote(null)}>Back to List</button>
                   </div>
                   <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                     <button className="pill-btn inactive" style={{ borderColor: '#eab308', color: '#ca8a04' }} onClick={handleHighlight}>
                       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg> 
                       Highlight
                     </button>
                     <button className="pill-btn inactive" onClick={handleCopy}>
                       {copied ? "Copied!" : "Copy"}
                     </button>
                     <button className="pill-btn inactive" onClick={handleShare}>
                       {shared ? "Link Copied!" : "Share Link"}
                     </button>
                     <button className="pill-btn inactive" onClick={() => { setSelectedNote(selectedNote); setCurrentView('quiz'); setQuizData(null); setQuizLoading(false); }}>Test Knowledge</button>
                     <button className="pill-btn inactive" onClick={() => { setCurrentView('chatbot'); setChatHistory([]); }}>Discuss with AI</button>
                     <button className="btn-primary shine" onClick={downloadPDF} disabled={pdfLoading}>{pdfLoading ? "Generating..." : "Download PDF"}</button>
                   </div>
                </div>
                <div id="pdf-content" style={{ padding: '0 20px 20px' }} className="markdown-content">
                  <h2 style={{ fontSize: '32px', marginBottom: '8px' }}>{decodeEntities(selectedNote.title)}</h2>
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
                    <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{new Date(selectedNote.createdAt).toLocaleDateString()}</span>
                    <span style={{ background: '#EEF2FF', padding: '2px 10px', borderRadius: '4px', color: 'var(--primary)', fontSize: '13px', fontWeight: '600' }}>{getWordCount(selectedNote.content)} words</span>
                    <span style={{ background: 'rgba(6, 182, 212, 0.1)', padding: '2px 10px', borderRadius: '4px', color: 'var(--secondary)', fontSize: '13px', fontWeight: '600' }}>{Math.ceil(getWordCount(selectedNote.content) / 200)} min read</span>
                  </div>
                  <div dangerouslySetInnerHTML={formatMarkdown(selectedNote.content)} />
                </div>
              </div>
            ) : (
              <>
                {filteredNotes.length === 0 ? (
                  <div className="page-fade-in" style={{ textAlign: "center", padding: "100px 0", color: "var(--text-muted)" }}>
                    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 20px" }}><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M9 16l2 2 4-4"/></svg>
                    <h3>No notes found</h3>
                    <p>Go to the Dashboard to create your first note.</p>
                  </div>
                ) : (
                  <div className="grid-3-col">
                    {filteredNotes.map((n) => (
                      <div key={n._id} className="card page-fade-in" style={{ display: 'flex', flexDirection: 'column', padding: '24px', cursor: 'pointer', transition: 'all 0.3s' }}
                           onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(108,99,255,0.12)'; }}
                           onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--card-shadow)'; }}
                           onClick={() => setSelectedNote(n)}>
                        <h4 style={{ fontSize: '18px', color: 'var(--text-dark)', marginBottom: '8px', lineHeight: '1.4' }}>{decodeEntities(n.title)}</h4>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px' }}>
                          <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                          <span style={{ background: '#EEF2FF', padding: '2px 8px', borderRadius: '4px', color: 'var(--primary)' }}>{getWordCount(n.content)} words</span>
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.5', flex: 1, textOverflow: 'ellipsis', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                          {stripMarkdown(n.content)}
                        </p>
                        <div className="notes-card-buttons" style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
                          <button className="pill-btn inactive" style={{ flex: 1, fontSize: '13px' }} onClick={(e) => { e.stopPropagation(); setSelectedNote(n); }}>View Note</button>
                          <button className="pill-btn inactive" style={{ border: '1px solid #fee2e2', color: '#ef4444', flex: 1 }} onClick={(e) => { e.stopPropagation(); deleteNote(n._id); }}>Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* CHATBOT */}
        {currentView === "chatbot" && (
           <div className={`page-fade-in ${selectedNote ? 'chatbot-container-active-chat' : 'chatbot-container-no-chat'}`} style={{ display: 'flex', height: '100%', gap: '24px' }}>
             <div className="card chatbot-left-pane" style={{ width: '320px', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)', padding: '20px 12px' }}>
               <h3 style={{ padding: '0 8px 16px', borderBottom: '1px solid var(--border-light)', marginBottom: '16px', color: 'var(--text-dark)' }}>Select Reference Note</h3>
               <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                 {notesList.map(n => (
                   <div key={n._id} 
                        onClick={() => { setSelectedNote(n); setChatHistory([]); }}
                        style={{ padding: '16px', borderRadius: '12px', cursor: 'pointer', background: selectedNote?._id === n._id ? 'var(--hover-purple)' : 'transparent', border: selectedNote?._id === n._id ? '1px solid var(--primary)' : '1px solid var(--border-light)' }}>
                     <p style={{ margin: 0, fontWeight: '600', fontSize: '14px', color: selectedNote?._id === n._id ? 'var(--primary)' : 'var(--text-dark)' }}>{decodeEntities(n.title)}</p>
                   </div>
                 ))}
                 {notesList.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No notes available.</p>}
               </div>
             </div>

             <div className="card chatbot-right-pane" style={{ flex: 1, height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column', padding: '0', background: 'transparent' }}>
               {!selectedNote ? (
                 <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--text-muted)' }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px' }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    <h2>Select a note to start chatting</h2>
                    <p>The AI Chatbot requires context from your specific lecture notes.</p>
                 </div>
               ) : (
                 <>
                   <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-light)', background: 'var(--hover-purple)', borderTopLeftRadius: '16px', borderTopRightRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                     <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text-dark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Discussing: <span style={{ color: 'var(--primary)', fontWeight: '600' }}>{selectedNote.title}</span></h3>
                     <button className="pill-btn inactive chatbot-mobile-back-btn" onClick={() => setSelectedNote(null)}>Change Note</button>
                   </div>
                   <div className="chat-container" id="chat-scroller" style={{ borderRadius: 0, border: 'none', background: 'transparent' }}>
                     {chatHistory.length === 0 ? (
                       <p className="page-fade-in" style={{ textAlign: 'center', color: 'var(--text-muted)', margin: 'auto' }}>Ask specific questions about this lecture. The AI will strictly use your note context.</p>
                     ) : (
                       chatHistory.map((msg, i) => (
                         <div key={i} className={`chat-bubble page-fade-in ${msg.role === 'user' ? 'user' : 'ai'}`}>
                           {msg.text.includes("Sorry,") || msg.text.includes("Warning") ? <span style={{ color: '#d97706', fontWeight: '600' }}>⚠ Warning: {msg.text}</span> : msg.text}
                         </div>
                       ))
                     )}
                     {loading && (
                       <div className="chat-bubble ai page-fade-in">
                         <div className="typing-dots"><span></span><span></span><span></span></div>
                       </div>
                     )}
                   </div>
                   <div style={{ padding: '20px', borderTop: '1px solid var(--border-light)', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px' }}>
                      <div className="chatbot-input-wrapper" style={{ display: 'flex', gap: '12px', background: 'var(--hover-purple)', padding: '8px', borderRadius: '99px', border: '1px solid var(--border-light)' }}>
                       <input type="text" placeholder="Ask a question..." value={chatMessage} onChange={e => setChatMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && askChatbot()} style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', padding: '10px 16px', fontSize: '15px', color: 'var(--text-dark)' }} />
                       <button onClick={askChatbot} disabled={loading || !chatMessage.trim()} className="btn-primary shine" style={{ padding: '10px 24px', borderRadius: '99px', opacity: (loading || !chatMessage.trim()) ? 0.5 : 1 }}>Send Query</button>
                     </div>
                   </div>
                 </>
               )}
             </div>
           </div>
        )}

        {/* QUIZ */}
        {currentView === "quiz" && (
          <div className="page-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
            {quizLoading ? (
               <div className="card" style={{ textAlign: 'center', padding: '80px 40px' }}>
                 <div className="spinner dark" style={{ margin: '0 auto 24px', width: '40px', height: '40px' }}></div>
                 <h2 style={{ color: 'var(--primary)' }}>Curating unique questions...</h2>
                 <p style={{ color: 'var(--text-muted)' }}>Analyzing your note context to generate a precise evaluation.</p>
               </div>
            ) : quizData ? (
              <div className="page-fade-in">
                 {!quizFinished ? (
                    <div className="card">
                       {/* Progress Bar */}
                       <div style={{ marginBottom: '24px' }}>
                         <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)' }}>
                           <span>Question {currentQIndex + 1} of {quizData.mcqs?.length || 0}</span>
                         </div>
                         <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                           <div style={{ width: `${((currentQIndex + 1) / (quizData.mcqs?.length || 1)) * 100}%`, height: '100%', background: 'linear-gradient(90deg, var(--secondary), var(--primary))', transition: 'width 0.4s ease-out' }}></div>
                         </div>
                       </div>
                       
                       {quizData.mcqs && quizData.mcqs[currentQIndex] && (() => {
                         const q = quizData.mcqs[currentQIndex];
                         const hasAnswered = !!selectedAnswers[currentQIndex];
                         return (
                           <div className="page-fade-in" key={currentQIndex} style={{ minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
                             <h2 style={{ fontSize: '24px', lineHeight: '1.4', marginBottom: '32px', color: 'var(--text-dark)' }}>{q.question}</h2>
                             
                             <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                               {q.options.map((opt, i) => {
                                 let extraStyle = {};
                                 if (hasAnswered) {
                                   if (opt === q.answer) {
                                     extraStyle = { background: '#f0fdf4', color: '#166534', borderColor: '#22c55e', transform: 'scale(1.02)' };
                                   } else if (selectedAnswers[currentQIndex] === opt) {
                                     extraStyle = { background: '#fef2f2', color: '#991b1b', borderColor: '#ef4444' };
                                   }
                                 }
                                 return (
                                   <button 
                                     key={i} 
                                     onClick={() => handleAnswerSelect(opt)}
                                     disabled={hasAnswered}
                                     className="pill-btn inactive"
                                     style={{ justifyContent: 'flex-start', padding: '16px 24px', fontSize: '16px', textAlign: 'left', fontWeight: '500', transition: 'all 0.3s', ...extraStyle }}
                                   >
                                     {opt}
                                   </button>
                                 );
                               })}
                             </div>

                             {hasAnswered && (
                               <div className="page-fade-in" style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                                 <button onClick={handleNextQuestion} className="btn-primary shine" style={{ padding: '12px 32px' }}>{currentQIndex < quizData.mcqs.length - 1 ? "Next Question" : "View Results"}</button>
                               </div>
                             )}
                           </div>
                         );
                       })()}
                    </div>
                 ) : (
                    <div className="card page-fade-in" style={{ textAlign: 'center', padding: '60px 40px' }}>
                      <h2 style={{ fontSize: '36px', marginBottom: '16px', color: 'var(--text-dark)' }}>Quiz Complete! 🎉</h2>
                      <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'linear-gradient(135deg, #EEF2FF, var(--primary))', margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontSize: '40px', fontWeight: '800' }}>
                        <AnimatedCounter value={quizScore} duration={1000} /> <span style={{ fontSize: '20px', opacity: 0.8, color: 'var(--text-dark)' }}>&nbsp;/ {quizData.mcqs?.length}</span>
                      </div>
                      <p style={{ color: 'var(--text-muted)', fontSize: '18px', marginBottom: '32px' }}>
                        {quizScore === quizData.mcqs?.length ? "Perfect score! Exceptional retention!" : "Great job reviewing your materials."}
                      </p>
                      <button onClick={() => setCurrentView('notes')} className="btn-primary shine" style={{ marginRight: '16px' }}>Back to Notes</button>
                      <button onClick={() => generateQuiz(selectedNote)} className="pill-btn inactive" style={{ padding: '14px 28px', fontSize: '16px' }}>Retry Quiz</button>
                    </div>
                 )}
              </div>
            ) : selectedNote ? (
              <div className="card page-fade-in" style={{ textAlign: 'center', padding: '60px 40px' }}>
                <h2 style={{ color: 'var(--text-dark)', marginBottom: '16px' }}>Quiz Settings</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>How many questions would you like to generate for <strong>{selectedNote.title}</strong>?</p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '32px' }}>
                  {[10, 20, 30].map(num => (
                    <button key={num} onClick={() => setMcqCount(num)} className={`pill-btn ${mcqCount === num ? 'active' : 'inactive'}`}>{num} Questions</button>
                  ))}
                </div>
                <button onClick={() => generateQuiz(selectedNote)} className="btn-primary shine">Generate Quiz</button>
              </div>
            ) : (
              <div className="card" style={{ textAlign: 'center', padding: '60px 40px' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px' }}><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                <h2 style={{ color: 'var(--text-dark)' }}>No quiz generated yet</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Select a note from your library and click Test Knowledge.</p>
                <button onClick={() => setCurrentView("notes")} className="btn-primary shine">Browse My Notes</button>
              </div>
            )}
          </div>
        )}

        {/* PROFILE PAGE */}
        {currentView === "profile" && (
          <div className="page-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h1 style={{ fontSize: '32px', fontWeight: '800', margin: 0, color: 'var(--text-dark)' }}>My Profile</h1>
                <button onClick={logout} className="pill-btn inactive" style={{ borderColor: '#ef4444', color: '#ef4444' }}>
                   Sign Out
                </button>
             </div>

             <div className="card" style={{ display: 'flex', gap: '40px', padding: '40px', flexWrap: 'wrap' }}>
                
                {/* Avatar Section */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                   <div style={{ position: 'relative', width: '140px', height: '140px', borderRadius: '50%', background: profileAvatar ? `url(${profileAvatar}) center/cover` : 'var(--hover-purple)', border: '4px solid #fff', boxShadow: 'var(--card-shadow)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: 'pointer' }}>
                      {!profileAvatar && <span style={{ fontSize: '48px', color: 'var(--primary)', fontWeight: 'bold' }}>{(profileName?.[0] || auth.currentUser?.email?.[0] || 'U').toUpperCase()}</span>}
                      
                      {/* Hover Overlay */}
                      <div className="avatar-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.3s' }}>
                         <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                      </div>
                      <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                   </div>
                   <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Click to upload</span>
                </div>

                {/* Form Elements */}
                <div style={{ flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                   <div style={{ display: 'flex', gap: '20px' }}>
                     <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>Display Name</label>
                        <input type="text" className="input-modern" value={profileName} onChange={e=>setProfileName(e.target.value)} placeholder="Your Name" />
                     </div>
                     <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>Email Address (Firebase)</label>
                        <input type="email" className="input-modern" value={auth.currentUser?.email || ''} readOnly style={{ background: 'var(--border-light)', color: 'var(--text-muted)' }} />
                     </div>
                   </div>
                   <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>Short Bio</label>
                      <textarea rows={4} className="input-modern" value={profileBio} onChange={e=>setProfileBio(e.target.value)} placeholder="Student mapping out the universe..." />
                   </div>
                   
                   {/* Inline Stats */}
                   <div style={{ padding: '20px', background: 'var(--hover-purple)', borderRadius: '12px', display: 'flex', gap: '40px', marginTop: '10px' }}>
                      <div>
                         <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Notes</span>
                         <span style={{ fontSize: '24px', fontWeight: '800', color: 'var(--primary)' }}>{totalNotesCount}</span>
                      </div>
                      <div>
                         <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Member Since</span>
                         <span style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-dark)', marginTop: '6px', display: 'block' }}>{new Date(auth.currentUser?.metadata?.creationTime || Date.now()).toLocaleDateString()}</span>
                      </div>
                   </div>

                   <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <button onClick={handleSaveProfile} className="btn-primary shine">Save Changes</button>
                      {profileSaved && <span className="page-fade-in" style={{ color: '#10b981', fontWeight: '600', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg> Profile updated successfully!</span>}
                   </div>
                </div>
             </div>
             {/* Small inline style for avatar overlay hover */}
             <style>{`.avatar-overlay:hover { opacity: 1 !important; }`}</style>
          </div>
        )}

      </div>

      {/* BOTTOM NAVIGATION FOR MOBILE */}
      <div className="mobile-bottom-nav">
        <div className={`mobile-nav-item ${currentView === 'home' ? 'active' : ''}`} onClick={() => navigate('/')}>
          <IconHome />
          <span>Home</span>
        </div>
        <div className={`mobile-nav-item ${currentView === 'dashboard' ? 'active' : ''}`} onClick={() => { setCurrentView('dashboard'); setSelectedNote(null); }}>
          <IconDash />
          <span>Generate</span>
        </div>
        <div className={`mobile-nav-item ${currentView === 'notes' ? 'active' : ''}`} onClick={() => { setCurrentView('notes'); setSelectedNote(null); }}>
          <IconNotes />
          <span>My Notes</span>
        </div>
        <div className={`mobile-nav-item ${currentView === 'chatbot' ? 'active' : ''}`} onClick={() => setCurrentView('chatbot')}>
          <IconChat />
          <span>Chatbot</span>
        </div>
        <div className={`mobile-nav-item ${currentView === 'profile' ? 'active' : ''}`} onClick={() => setCurrentView('profile')}>
          <div className="mobile-profile-avatar" style={{ 
            width: '20px', 
            height: '20px', 
            borderRadius: '50%', 
            background: profileAvatar ? `url(${profileAvatar}) center/cover` : 'linear-gradient(135deg, #EEF2FF, var(--primary))', 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: '#fff', 
            fontWeight: 'bold',
            fontSize: '9px'
          }}>
            {!profileAvatar && (profileName?.[0]?.toUpperCase() || auth.currentUser?.email?.[0]?.toUpperCase() || "U")}
          </div>
          <span>Profile</span>
        </div>
      </div>

    </div>
  );
}
