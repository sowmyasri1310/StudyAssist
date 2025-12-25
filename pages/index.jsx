import { useState, useRef, useEffect } from "react";

const LANGS = ["Semi-Telugu", "Telugu", "English"];
const MODES = ["Breakdown", "Summary", "Flashcards", "MCQs"];
const THEMES = ["Light", "Dark", "Evening"];

const headingFont = "font-serif tracking-wide";

function IconSparkle(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" {...props}>
      <path d="M12 2l1.9 4.8L19 9l-5 2.2L12 16l-2-4.8L5 9l5.1-2.2L12 2z" fill="currentColor" />
    </svg>
  );
}

function IconChevron() {
  return (
    <svg className="w-4 h-4 ml-auto opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function IconSpeaker({ isSpeaking }) {
  return (
    <svg className={`w-4 h-4 ${isSpeaking ? 'animate-pulse' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
    </svg>
  );
}

export default function Home() {
  const [text, setText] = useState("");
  const [lang, setLang] = useState("Semi-Telugu");
  const [mode, setMode] = useState("Breakdown");
  const [theme, setTheme] = useState("Light"); 
  const [wordcount, setWordcount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);

  const [langOpen, setLangOpen] = useState(false);
  const [modeOpen, setModeOpen] = useState(false);

  const textareaRef = useRef(null);

  useEffect(() => {
    const loadVoices = () => window.speechSynthesis.getVoices();
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const toggleSpeech = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    if (!result) return;
    const utterance = new SpeechSynthesisUtterance(result);
    const voices = window.speechSynthesis.getVoices();
    let selectedVoice = voices.find(v => v.name.includes('Google') && v.lang.startsWith(lang === "Telugu" ? 'te' : 'en'));
    if (!selectedVoice) selectedVoice = voices.find(v => v.lang.startsWith(lang === "Telugu" ? 'te' : 'en'));
    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.rate = 0.9; 
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  function autosize(el) {
    if (!el) return;
    el.style.height = "auto";
    const maxHeight = 250; 
    const newHeight = Math.min(Math.max(el.scrollHeight, 120), maxHeight);
    el.style.height = `${newHeight}px`;
  }

  useEffect(() => {
    autosize(textareaRef.current);
    const onResize = () => autosize(textareaRef.current);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.speechSynthesis.cancel();
    };
  }, [text]);

  const onText = (e) => {
    const v = e.target.value;
    setText(v);
    setWordcount(v.trim() ? v.trim().split(/\s+/).length : 0);
  };

  const clearAll = () => {
    setText(""); setResult(""); setWordcount(0); setError("");
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setTimeout(() => autosize(textareaRef.current), 0);
  };

  async function handleSubmit() {
    setError("");
    if (!text.trim()) { setError("Paste some text first! ✨"); return; }
    setLoading(true); setResult("");
    window.speechSynthesis.cancel();
    setIsSpeaking(false);

    try {
      const resp = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, mode, lang })
      });
      const rawText = await resp.text();
      if (!resp.ok) throw new Error(`Error ${resp.status}`);
      const data = JSON.parse(rawText);
      setResult((data.result || "No output.").replace(/\*/g, ""));
    } catch (e) {
      setError(e.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  const themeStyles = {
    Light: { 
      bg: "bg-[#FFFDF0]", text: "text-[#5B4636]", blobs: "bg-[#FFD93D] opacity-40", 
      card1: "bg-[#FFD93D] border-[#FFFDF0] text-[#5B4636]", 
      card2: "bg-white border-[#FFD93D] text-[#5B4636]", button: "bg-[#FF8C32]", icon: "☀️", dropBg: "bg-white text-slate-800" 
    },
    Dark: { bg: "bg-[#0F172A]", text: "text-[#E2E8F0]", blobs: "bg-[#38B2AC] opacity-20", card1: "bg-[#1E293B] border-[#334155] text-white", card2: "bg-[#334155] border-[#475569] text-[#F1F5F9]", button: "bg-[#38B2AC]", icon: "🌙", dropBg: "bg-slate-800 text-white" },
    Evening: { 
      bg: "bg-gradient-to-br from-[#FF9D6C] via-[#FF5F6D] to-[#FFC371]", 
      text: "text-[#431407]",
      blobs: "bg-white opacity-20", 
      card1: "bg-white/40 backdrop-blur-md border-white/50 text-[#431407]", 
      card2: "bg-white/20 backdrop-blur-md border-white/30 text-[#431407]", 
      button: "bg-[#FF5F6D]", icon: "🌇", dropBg: "bg-white/80 backdrop-blur-xl text-[#431407]" 
    }
  };

  const current = themeStyles[theme];

  return (
    <div className={`min-h-screen w-full ${current.bg} ${current.text} font-sans transition-all duration-700 overflow-x-hidden relative`}>
      <div className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] ${current.blobs} rounded-full filter blur-3xl`}></div>
      <div className={`absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] ${current.blobs} rounded-full filter blur-3xl`}></div>

      <header className="w-full py-4 relative z-10 mx-auto max-w-7xl px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 ${current.button} text-white rounded-xl shadow-lg transform -rotate-6`}>
            <IconSparkle />
          </div>
          <h1 className={`text-2xl md:text-3xl ${headingFont}`}>Study Assist</h1>
        </div>

        <div className="flex bg-white/10 backdrop-blur-md p-1 rounded-full border border-white/10">
          {THEMES.map((t) => (
            <button key={t} onClick={() => setTheme(t)} className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${theme === t ? `${current.button} text-white shadow-lg` : "opacity-50 hover:opacity-100"}`}>
              {themeStyles[t].icon} {t}
            </button>
          ))}
        </div>
      </header>

      <main className="w-full mt-10 relative z-10 max-w-7xl mx-auto px-6 pb-10">
        {/* responsiveness fix: use items-start to allow independent card scaling */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 items-start">
          
          {/* FIX: Changed flex-basis to w-full lg:w-[42%] for better resizing */}
          <section className={`w-full lg:w-[42%] ${current.card1} p-6 rounded-[2rem] shadow-2xl border-4 transition-all duration-500 self-start`}>
            <h2 className={`text-xl mb-4 ${headingFont}`}>Paste Lesson</h2>
            <textarea
              ref={textareaRef}
              className={`w-full p-4 border-none rounded-2xl shadow-inner resize-none focus:outline-none text-sm overflow-y-auto ${current.text} 
                ${theme === 'Light' ? 'bg-white/90 placeholder-slate-400' : 'bg-white/20 placeholder-current/50'} 
              `}
              value={text} onChange={onText} rows={4} placeholder="What are we learning today?"
            />
            
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="relative">
                <label className="text-[10px] uppercase font-bold opacity-70 ml-2 mb-1 block">Language</label>
                <button onClick={() => {setLangOpen(!langOpen); setModeOpen(false);}} className="w-full px-4 py-2 flex items-center bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-xs font-bold transition-all hover:bg-white/20">
                  <span className="truncate">{lang}</span> <IconChevron />
                </button>
                {langOpen && (
                  <div className={`absolute z-50 mt-2 w-full rounded-2xl shadow-xl overflow-hidden border border-white/20 ${current.dropBg}`}>
                    {LANGS.map(l => (
                      <button key={l} onClick={() => {setLang(l); setLangOpen(false);}} className={`w-full px-4 py-2 text-left text-xs hover:bg-white/20 transition-colors ${lang === l ? 'font-bold bg-white/10' : ''}`}>
                        {l}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <label className="text-[10px] uppercase font-bold opacity-70 ml-2 mb-1 block">Mode</label>
                <button onClick={() => {setModeOpen(!modeOpen); setLangOpen(false);}} className="w-full px-4 py-2 flex items-center bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-xs font-bold transition-all hover:bg-white/20">
                  <span className="truncate">{mode}</span> <IconChevron />
                </button>
                {modeOpen && (
                  <div className={`absolute z-50 mt-2 w-full rounded-2xl shadow-xl overflow-hidden border border-white/20 ${current.dropBg}`}>
                    {MODES.map(m => (
                      <button key={m} onClick={() => {setMode(m); setModeOpen(false);}} className={`w-full px-4 py-2 text-left text-xs hover:bg-white/20 transition-colors ${mode === m ? 'font-bold bg-white/10' : ''}`}>
                        {m}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button onClick={clearAll} className="px-4 py-2 bg-white/10 rounded-full text-xs font-bold hover:bg-white/20 transition-all">Clear</button>
              <button onClick={handleSubmit} disabled={loading} className={`flex-1 py-2 ${current.button} text-white rounded-full text-xs font-bold shadow-lg hover:scale-[1.02] active:scale-95 transition-all`}>
                {loading ? "✨ Processing..." : `✨ Run ${mode} ✨`}
              </button>
            </div>
            {error && <div className="mt-4 text-[10px] bg-red-500/20 p-2 rounded-lg text-center border border-red-500/40">{error}</div>}
          </section>
          
          {/* FIX: Changed flex-basis to w-full lg:w-[58%] for better resizing */}
          <aside className={`w-full lg:w-[58%] ${current.card2} p-6 rounded-[2rem] shadow-2xl border-4 transition-all duration-500 flex flex-col`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-xl ${headingFont}`}>Output</h3>
              <div className="flex gap-2 items-center">
                <button 
                  onClick={toggleSpeech} 
                  disabled={!result}
                  className={`p-2 rounded-full transition-all ${isSpeaking ? 'bg-red-500 text-white animate-pulse' : 'bg-white/20 hover:bg-white/40 disabled:opacity-20'}`}
                >
                  <IconSpeaker isSpeaking={isSpeaking} />
                </button>
                <span className="text-[10px] font-bold opacity-50 uppercase tracking-widest">{lang} • {mode}</span>
              </div>
            </div>
            <div id="resultBox" className={`flex-1 min-h-[250px] ${theme === 'Dark' ? 'bg-black/40' : 'bg-white/40'} backdrop-blur-sm rounded-[1.5rem] p-5 overflow-auto shadow-inner`}>
              {loading && <div className="h-full flex items-center justify-center animate-pulse text-sm font-bold italic">Asking the AI...</div>}
              {!loading && !result && <div className="h-full flex items-center justify-center opacity-30 italic text-sm">Magic appears here.</div>}
              {!loading && result && <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">{result}</pre>}
            </div>
            <div className="mt-4 flex gap-3">
              <button onClick={() => navigator.clipboard.writeText(result)} disabled={!result} className="flex-1 py-2 bg-white/10 rounded-full text-xs font-bold disabled:opacity-20 hover:bg-white/20 transition-all">Copy</button>
              <button onClick={() => {
                const blob = new Blob([result], {type:"text/plain"});
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url; a.download = "study-notes.txt"; a.click();
              }} disabled={!result} className={`flex-1 py-2 ${current.button} text-white rounded-full text-xs font-bold disabled:opacity-20 shadow-lg`}>Download</button>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}