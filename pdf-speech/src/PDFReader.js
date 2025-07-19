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

  useEffect(() => {
    const loadVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      setVoices(allVoices);
      if (allVoices.length > 0) {
        // Default: Google US English if available
        const defaultVoice = allVoices.find(v => v.name.includes("Google")) || allVoices[0];
        setSelectedVoice(defaultVoice.name);
      }
    };

    // Some browsers require `onvoiceschanged`
    if (typeof window !== "undefined") {
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

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
    <div style={{ padding: 20 }}>
      <h2>📄 PDF Text-to-Speech Reader</h2>
      <input type="file" accept=".pdf" onChange={handleFile} />
      <div style={{ marginTop: 20 }}>
        <button onClick={isSpeaking ? stop : speak}>
          {isSpeaking ? "⏹ Stop Reading" : "▶️ Read Aloud"}
        </button>

        <div style={{ marginTop: 10 }}>
          <label>🗣 Voice:&nbsp;
            <select
              value={selectedVoice || ""}
              onChange={(e) => setSelectedVoice(e.target.value)}
            >
              {voices.map((voice, idx) => (
                <option key={idx} value={voice.name}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
          </label>
        </div>

        <div style={{ marginTop: 10 }}>
          <label>🎚 Rate: {rate}</label>
          <input type="range" min="0.5" max="2" step="0.1" value={rate} onChange={e => setRate(e.target.value)} />
        </div>

        <div>
          <label>🎵 Pitch: {pitch}</label>
          <input type="range" min="0" max="2" step="0.1" value={pitch} onChange={e => setPitch(e.target.value)} />
        </div>

        <div>
          <label>🔊 Volume: {volume}</label>
          <input type="range" min="0" max="1" step="0.1" value={volume} onChange={e => setVolume(e.target.value)} />
        </div>
      </div>

      <pre style={{ whiteSpace: "pre-wrap", marginTop: 20 }}>{text}</pre>
    </div>
  );
}
