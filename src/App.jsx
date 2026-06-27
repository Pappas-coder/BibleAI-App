import React, { useState, useEffect, useRef } from 'react'
import { GoogleGenerativeAI } from '@google/generative-ai'
import ReactMarkdown from 'react-markdown'

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

const BOOKS = [
  "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra", "Nehemiah", "Esther", "Job", "Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi",
  "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians", "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians", "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James", "1 Peter", "2 Peter", "1 John", "2 John", "3 John", "Jude", "Revelation"
];

const DAILY_VERSES = [
  { text: '"For I know the plans I have for you," declares the LORD, "plans to prosper you and not to harm you, plans to give you hope and a future."', reference: "Jeremiah 29:11" },
  { text: '"I can do all this through him who gives me strength."', reference: "Philippians 4:13" },
  { text: '"Trust in the LORD with all your heart and lean not on your own understanding."', reference: "Proverbs 3:5" },
  { text: '"Be strong and courageous. Do not be afraid; do not be discouraged, for the LORD your God will be with you wherever you go."', reference: "Joshua 1:9" },
  { text: '"The LORD is my shepherd, I lack nothing."', reference: "Psalm 23:1" },
  { text: '"But the fruit of the Spirit is love, joy, peace, forbearance, kindness, goodness, faithfulness, gentleness and self-control."', reference: "Galatians 5:22-23" },
  { text: '"Cast all your anxiety on him because he cares for you."', reference: "1 Peter 5:7" },
  { text: '"And we know that in all things God works for the good of those who love him, who have been called according to his purpose."', reference: "Romans 8:28" },
  { text: '"Therefore do not worry about tomorrow, for tomorrow will worry about itself. Each day has enough trouble of its own."', reference: "Matthew 6:34" },
  { text: '"Let all that you do be done in love."', reference: "1 Corinthians 16:14" }
];

function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Welcome! How can I help you today?" }
  ]);
  const [input, setInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingChatId, setEditingChatId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isLoading && inputRef.current && activeTab === 'chat') {
      inputRef.current.focus();
    }
  }, [isLoading, activeTab]);

  useEffect(() => {
    const savedHistory = localStorage.getItem('bibleAIChatHistory');
    if (savedHistory) {
      const parsedHistory = JSON.parse(savedHistory);
      setChatHistory(parsedHistory);
      if (parsedHistory.length > 0) {
        setCurrentChatId(parsedHistory[0].id);
        setMessages(parsedHistory[0].messages);
      }
    } else {
      const newChat = { id: Date.now(), title: 'New Chat', messages: [{ role: 'assistant', text: "Welcome! How can I help you today?" }], date: new Date().toLocaleDateString() };
      setChatHistory([newChat]);
      setCurrentChatId(newChat.id);
    }
  }, []);

  useEffect(() => {
    if (currentChatId && messages.length > 0) {
      setChatHistory(prev => {
        const updatedHistory = prev.map(chat => {
          if (chat.id === currentChatId) {
            let newTitle = chat.title;
            if (newTitle === 'New Chat' && messages.length > 1) {
              newTitle = messages[1].text.slice(0, 30) + (messages[1].text.length > 30 ? '...' : '');
            }
            return { ...chat, messages, title: newTitle };
          }
          return chat;
        });
        localStorage.setItem('bibleAIChatHistory', JSON.stringify(updatedHistory));
        return updatedHistory;
      });
    }
  }, [messages, currentChatId]);

  const startNewChat = () => {
    const newChat = { id: Date.now(), title: 'New Chat', messages: [{ role: 'assistant', text: "Welcome! How can I help you today?" }], date: new Date().toLocaleDateString() };
    setChatHistory(prev => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
    setMessages(newChat.messages);
    setIsDrawerOpen(false);
  };

  const switchChat = (id) => {
    const chat = chatHistory.find(c => c.id === id);
    if (chat) {
      setCurrentChatId(id);
      setMessages(chat.messages);
      setIsDrawerOpen(false);
    }
  };

  const saveTitle = (id) => {
    if (!editTitle.trim()) return;
    setChatHistory(prev => {
      const updated = prev.map(chat => chat.id === id ? { ...chat, title: editTitle } : chat);
      localStorage.setItem('bibleAIChatHistory', JSON.stringify(updated));
      return updated;
    });
    setEditingChatId(null);
  };

  const deleteChat = (id, e) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this chat?")) {
      setChatHistory(prev => {
        let updated = prev.filter(chat => chat.id !== id);
        
        if (updated.length === 0) {
          const newChat = { id: Date.now(), title: 'New Chat', messages: [{ role: 'assistant', text: "Welcome! How can I help you today?" }], date: new Date().toLocaleDateString() };
          updated = [newChat];
        }
        
        localStorage.setItem('bibleAIChatHistory', JSON.stringify(updated));
        
        if (currentChatId === id) {
          setCurrentChatId(updated[0].id);
          setMessages(updated[0].messages);
        }
        
        return updated;
      });
    }
  };

  // Bible Reader State
  const [selectedBook, setSelectedBook] = useState('John');
  const [selectedChapter, setSelectedChapter] = useState('1');
  const [chapterText, setChapterText] = useState(null);
  const [isLoadingChapter, setIsLoadingChapter] = useState(false);
  const [studyNotes, setStudyNotes] = useState(null);
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);
  const [sectionHeadings, setSectionHeadings] = useState({});

  useEffect(() => {
    if (activeTab === 'read') {
      fetchChapter();
    }
  }, [selectedBook, selectedChapter, activeTab]);

  const fetchChapter = async () => {
    setIsLoadingChapter(true);
    setChapterText(null);
    setStudyNotes(null);
    setSectionHeadings({});
    try {
      const response = await fetch(`https://bible-api.com/${selectedBook}+${selectedChapter}`);
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setChapterText(data.verses);
      fetchSectionHeadings();
    } catch (error) {
      setChapterText([{ verse: 0, text: "Error loading chapter. It may not exist." }]);
    } finally {
      setIsLoadingChapter(false);
    }
  };

  const fetchSectionHeadings = async () => {
    const cacheKey = `headings_${selectedBook}_${selectedChapter}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        setSectionHeadings(JSON.parse(cached));
        return;
      } catch (e) { /* ignore bad cache */ }
    }
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const prompt = `For ${selectedBook} chapter ${selectedChapter} of the Bible, provide the standard section headings that would appear in a typical study Bible. Return ONLY a valid JSON object where each key is a verse number (as a string) and the value is the section heading that starts at that verse. Example format: {"1": "The Genealogy of Jesus", "18": "The Birth of Jesus Christ"}. Do not include any other text, markdown formatting, or code fences. Just the raw JSON object.`;
      const result = await model.generateContent(prompt);
      let text = result.response.text().trim();
      // Strip markdown code fences if present
      if (text.startsWith('```')) {
        text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
      }
      const headings = JSON.parse(text);
      setSectionHeadings(headings);
      localStorage.setItem(cacheKey, JSON.stringify(headings));
    } catch (error) {
      console.error('Error fetching section headings:', error);
    }
  };

  const generateStudyNotes = async () => {
    setIsGeneratingNotes(true);
    setStudyNotes(null);
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const prompt = `Provide a brief, practical study bible explanation for ${selectedBook} chapter ${selectedChapter} in Afrikaans. The style should be practical, focused on life application and historical context, similar to a Study Bible like 'Die Bybel in Praktyk'. Do not be overly verbose, but give enough to understand the chapter's core message. Write exclusively in Afrikaans. Use markdown for formatting.`;
      const result = await model.generateContent(prompt);
      setStudyNotes(result.response.text());
    } catch (error) {
      console.error('Error generating notes:', error);
      setStudyNotes('Sorry, there was an error generating the study notes. Please try again.\n\n*(Debug Error: ' + error.message + ')*');
    } finally {
      setIsGeneratingNotes(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    const maxRetries = 3;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const history = messages.slice(1).map(msg => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.text }]
        }));
        const chat = model.startChat({ history });
        const result = await chat.sendMessage(currentInput);
        const responseText = result.response.text();
        setMessages(prev => [...prev, { role: 'assistant', text: responseText }]);
        setIsLoading(false);
        return;
      } catch (error) {
        console.error(`AI Error (attempt ${attempt + 1}):`, error);
        
        const isRateLimit = error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED');
        
        if (isRateLimit && attempt < maxRetries) {
          // Wait before retrying (10s, 20s, 30s)
          await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 10000));
          continue;
        }
        
        setMessages(prev => [...prev, { role: 'assistant', text: `I'm a little busy right now! Please wait a moment and try again. 🙏\n\n*(Debug Error: ${error.message})*` }]);
        setIsLoading(false);
        return;
      }
    }
  };

  return (
    <>
      <button className="menu-btn" onClick={() => setIsDrawerOpen(true)}>☰</button>
      
      <div className={`drawer-overlay ${isDrawerOpen ? 'open' : ''}`} onClick={() => setIsDrawerOpen(false)}></div>
      <div className={`drawer ${isDrawerOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <h2>History</h2>
          <button className="close-btn" onClick={() => setIsDrawerOpen(false)}>✕</button>
        </div>
        <button onClick={startNewChat} style={{ marginBottom: '20px', width: '100%' }}>+ New Chat</button>
        <div className="history-list">
          {chatHistory.map(chat => (
            <div key={chat.id} className={`history-item ${chat.id === currentChatId ? 'active' : ''}`}>
              <div className="history-item-content" onClick={() => { if (editingChatId !== chat.id) switchChat(chat.id); }}>
                {editingChatId === chat.id ? (
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={() => saveTitle(chat.id)}
                    onKeyPress={(e) => e.key === 'Enter' && saveTitle(chat.id)}
                    autoFocus
                    style={{ width: '100%', padding: '5px', borderRadius: '5px', border: '1px solid var(--border)' }}
                  />
                ) : (
                  <>
                    <h4 className="history-title">{chat.title}</h4>
                    <p className="history-date">{chat.date}</p>
                  </>
                )}
              </div>
              {editingChatId !== chat.id && (
                <div style={{ display: 'flex', gap: '5px' }}>
                  <button 
                    className="edit-btn" 
                    title="Rename"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingChatId(chat.id);
                      setEditTitle(chat.title);
                    }}
                  >
                    ✎
                  </button>
                  <button 
                    className="delete-btn" 
                    title="Delete"
                    onClick={(e) => deleteChat(chat.id, e)}
                  >
                    🗑
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <header>
        <h1>Bible</h1>
      </header>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', justifyContent: 'center' }}>
        <button onClick={() => setActiveTab('chat')}>
          Chat with AI
        </button>
        <button onClick={() => setActiveTab('read')}>
          Read the Bible
        </button>
      </div>
      {activeTab === 'chat' && (
        <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
          <div className="card" style={{ padding: '15px', marginBottom: '15px' }}>
            {(() => {
              const todayIndex = Math.floor(Date.now() / 86400000);
              const verseOfTheDay = DAILY_VERSES[todayIndex % DAILY_VERSES.length];
              return (
                <>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '1.2rem' }}>Verse of the Day</h3>
                  <p style={{ margin: 0, fontSize: '0.95rem' }}><em>{verseOfTheDay.text}</em> - {verseOfTheDay.reference}</p>
                </>
              );
            })()}
          </div>

          <div className="chat-container">
            <div style={{ flexGrow: 1, overflowY: 'auto', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {messages.map((msg, index) => (
                <div key={index} className="chat-bubble" style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  background: msg.role === 'user' ? 'var(--accent)' : 'var(--bg)',
                  color: msg.role === 'user' ? '#fff' : msg.text.includes('Error:') ? '#d93025' : 'var(--text)',
                  padding: '10px 15px',
                  borderRadius: '15px',
                  border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none',
                  maxWidth: '80%'
                }}>
                  {msg.role === 'user' ? msg.text : <ReactMarkdown>{msg.text}</ReactMarkdown>}
                </div>
              ))}
              {isLoading && (
                <div className="chat-bubble" style={{ alignSelf: 'flex-start', padding: '10px 15px', background: 'var(--bg)', borderRadius: '15px', border: '1px solid var(--border)' }}>
                  <em>Thinking...</em>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input 
                ref={inputRef}
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask a question..."
                disabled={isLoading}
                style={{
                  flexGrow: 1,
                  minWidth: 0,
                  padding: '12px 20px',
                  borderRadius: '30px',
                  border: '1px solid var(--border)',
                  outline: 'none',
                  fontSize: '1rem',
                  opacity: isLoading ? 0.7 : 1
                }}
              />
              <button onClick={handleSend} disabled={isLoading} style={{ opacity: isLoading ? 0.7 : 1, padding: '12px 20px' }}>Send</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'read' && (
        <div className="card" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <select 
              value={selectedBook} 
              onChange={(e) => setSelectedBook(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '1rem', outline: 'none' }}
            >
              {BOOKS.map(book => <option key={book} value={book}>{book}</option>)}
            </select>
            <input 
              type="number" 
              min="1" 
              value={selectedChapter} 
              onChange={(e) => setSelectedChapter(e.target.value)}
              style={{ padding: '8px 12px', width: '80px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '1rem', outline: 'none' }}
            />
          </div>

          <div style={{ overflowY: 'auto', flexGrow: 1, paddingRight: '10px', fontSize: '1.1rem', lineHeight: '1.6' }}>
            {isLoadingChapter ? (
              <p>Loading chapter...</p>
            ) : chapterText ? (
              <div>
                <h2 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '10px', marginBottom: '20px' }}>
                  {selectedBook} {selectedChapter}
                </h2>
                {chapterText.map(v => (
                  <React.Fragment key={v.verse}>
                    {sectionHeadings[String(v.verse)] && (
                      <h3 style={{
                        marginTop: '25px',
                        marginBottom: '10px',
                        fontSize: '1.15rem',
                        fontWeight: 700,
                        color: 'var(--accent)',
                        borderLeft: '3px solid var(--accent)',
                        paddingLeft: '10px'
                      }}>
                        {sectionHeadings[String(v.verse)]}
                      </h3>
                    )}
                    <p style={{ marginBottom: '10px' }}>
                      <sup style={{ color: 'var(--accent)', fontWeight: 'bold', marginRight: '5px' }}>{v.verse}</sup>
                      {v.text}
                    </p>
                  </React.Fragment>
                ))}

                <div style={{ marginTop: '30px', borderTop: '2px dashed var(--border)', paddingTop: '20px' }}>
                  {!studyNotes && !isGeneratingNotes && (
                    <button onClick={generateStudyNotes} style={{ width: '100%', padding: '15px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1.2rem' }}>📖</span> Kry Studie Aantekeninge
                    </button>
                  )}
                  
                  {isGeneratingNotes && (
                    <div className="card" style={{ background: 'var(--accent-bg)', border: '1px solid var(--accent)', margin: '0', padding: '15px' }}>
                      <em style={{ color: 'var(--accent)' }}>Dink na oor {selectedBook} {selectedChapter}...</em>
                    </div>
                  )}

                  {studyNotes && !isGeneratingNotes && (
                    <div className="card" style={{ background: 'var(--bg)', border: '1px solid var(--accent)', margin: '0', padding: '20px' }}>
                      <h3 style={{ marginTop: 0, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span>📖</span> Studie Aantekeninge
                      </h3>
                      <div className="chat-bubble" style={{ background: 'transparent', padding: 0, boxShadow: 'none' }}>
                        <ReactMarkdown>{studyNotes}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p>Select a book and chapter.</p>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default App
