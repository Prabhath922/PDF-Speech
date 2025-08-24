import React, { useState, useEffect } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.js?worker";

// Set the PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export default function PDFReader() {
  const [text, setText] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);
  const [fileName, setFileName] = useState("");

  useEffect(() => {
    const loadVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      setVoices(allVoices);
      if (allVoices.length > 0) {
        const defaultVoice = allVoices.find(v => v.name.includes("Google")) || allVoices[0];
        setSelectedVoice(defaultVoice.name);
      }
    };

    if (typeof window !== "undefined") {
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = async () => {
      const typedArray = new Uint8Array(reader.result);
      const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;

      let extractedText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map((item) => item.str).join(" ");
        extractedText += pageText + "\n\n";
      }

      setText(extractedText);
    };

    reader.readAsArrayBuffer(file);
  };

  const speak = () => {
    if (!text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = voices.find(v => v.name === selectedVoice);
    if (voice) utterance.voice = voice;

    utterance.rate = parseFloat(rate);
    utterance.pitch = parseFloat(pitch);
    utterance.volume = parseFloat(volume);

    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>PDF Text-to-Speech Reader</h1>
        <p style={styles.subtitle}>Upload a PDF and listen to its content</p>
      </header>
      
      <div style={styles.card}>
        <div style={styles.uploadArea}>
          <input 
            type="file" 
            accept=".pdf" 
            onChange={handleFile} 
            id="file-upload"
            style={styles.fileInput}
          />
          <label htmlFor="file-upload" style={styles.fileInputLabel}>
            <div style={styles.uploadBox}>
              <svg style={styles.uploadIcon} viewBox="0 0 24 24" width="48" height="48">
                <path fill="currentColor" d="M14,13V17H10V13H7L12,8L17,13M19.35,10.03C18.67,6.59 15.64,4 12,4C9.11,4 6.6,5.64 5.35,8.03C2.34,8.36 0,10.9 0,14A6,6 0 0,0 6,20H19A5,5 0 0,0 24,15C24,12.36 21.95,10.22 19.35,10.03Z" />
              </svg>
              <p style={styles.uploadText}>Choose PDF file</p>
              {fileName && <p style={styles.fileName}>{fileName}</p>}
            </div>
          </label>
        </div>

        {text && (
          <div style={styles.controls}>
            <div style={styles.playbackControls}>
              <button 
                onClick={isSpeaking ? stop : speak} 
                style={isSpeaking ? styles.stopButton : styles.playButton}
              >
                {isSpeaking ? (
                  <>
                    <svg style={styles.buttonIcon} viewBox="0 0 24 24" width="20" height="20">
                      <path fill="currentColor" d="M6,19H10V5H6M14,5V19H18V5" />
                    </svg>
                    Stop Reading
                  </>
                ) : (
                  <>
                    <svg style={styles.buttonIcon} viewBox="0 0 24 24" width="20" height="20">
                      <path fill="currentColor" d="M8,5.14V19.14L19,12.14L8,5.14Z" />
                    </svg>
                    Read Aloud
                  </>
                )}
              </button>
            </div>

            <div style={styles.settings}>
              <div style={styles.settingGroup}>
                <label style={styles.settingLabel}>Voice</label>
                <select
                  value={selectedVoice || ""}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  style={styles.select}
                >
                  {voices.map((voice, idx) => (
                    <option key={idx} value={voice.name}>
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.settingGroup}>
                <label style={styles.settingLabel}>Speed: {rate}x</label>
                <input 
                  type="range" 
                  min="0.5" 
                  max="2" 
                  step="0.1" 
                  value={rate} 
                  onChange={e => setRate(e.target.value)} 
                  style={styles.slider}
                />
              </div>

              <div style={styles.settingGroup}>
                <label style={styles.settingLabel}>Pitch: {pitch}</label>
                <input 
                  type="range" 
                  min="0" 
                  max="2" 
                  step="0.1" 
                  value={pitch} 
                  onChange={e => setPitch(e.target.value)} 
                  style={styles.slider}
                />
              </div>

              <div style={styles.settingGroup}>
                <label style={styles.settingLabel}>Volume: {volume}</label>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.1" 
                  value={volume} 
                  onChange={e => setVolume(e.target.value)} 
                  style={styles.slider}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {text && (
        <div style={styles.textCard}>
          <h3 style={styles.textTitle}>Extracted Text</h3>
          <div style={styles.textContent}>{text}</div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    maxWidth: '800px',
    margin: '0 auto',
    color: '#333',
    lineHeight: '1.6'
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px'
  },
  title: {
    fontSize: '2.2rem',
    fontWeight: '700',
    color: '#2d3748',
    margin: '0 0 10px 0'
  },
  subtitle: {
    fontSize: '1rem',
    color: '#718096',
    margin: '0'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.04)',
    padding: '24px',
    marginBottom: '24px'
  },
  uploadArea: {
    marginBottom: '20px'
  },
  fileInput: {
    display: 'none'
  },
  fileInputLabel: {
    cursor: 'pointer'
  },
  uploadBox: {
    border: '2px dashed #cbd5e0',
    borderRadius: '8px',
    padding: '40px 20px',
    textAlign: 'center',
    transition: 'all 0.2s ease',
    backgroundColor: '#fafafa',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '180px'
  },
  uploadIcon: {
    color: '#4a5568',
    marginBottom: '16px'
  },
  uploadText: {
    fontSize: '18px',
    fontWeight: '500',
    color: '#4a5568',
    margin: '0 0 8px 0'
  },
  fileName: {
    fontSize: '14px',
    color: '#718096',
    margin: '8px 0 0 0'
  },
  controls: {
    borderTop: '1px solid #e2e8f0',
    paddingTop: '24px'
  },
  playbackControls: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '24px'
  },
  playButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4299e1',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 4px rgba(66, 153, 225, 0.3)'
  },
  stopButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e53e3e',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 4px rgba(229, 62, 62, 0.3)'
  },
  buttonIcon: {
    marginRight: '8px'
  },
  settings: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px'
  },
  settingGroup: {
    marginBottom: '15px'
  },
  settingLabel: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '500',
    color: '#4a5568'
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid #cbd5e0',
    backgroundColor: 'white',
    fontSize: '14px'
  },
  slider: {
    width: '100%',
    height: '6px',
    borderRadius: '3px',
    background: '#e2e8f0',
    outline: 'none',
    opacity: '0.7',
    transition: 'opacity .2s',
    WebkitAppearance: 'none',
    
    '::-webkit-slider-thumb': {
      WebkitAppearance: 'none',
      appearance: 'none',
      width: '18px',
      height: '18px',
      borderRadius: '50%',
      background: '#4299e1',
      cursor: 'pointer'
    },
    
    '::-moz-range-thumb': {
      width: '18px',
      height: '18px',
      borderRadius: '50%',
      background: '#4299e1',
      cursor: 'pointer',
      border: 'none'
    }
  },
  textCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.04)',
    padding: '24px',
    marginBottom: '24px'
  },
  textTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#2d3748',
    margin: '0 0 16px 0'
  },
  textContent: {
    whiteSpace: 'pre-wrap',
    maxHeight: '400px',
    overflow: 'auto',
    padding: '16px',
    backgroundColor: '#f7fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    fontSize: '14px',
    lineHeight: '1.5'
  }
};