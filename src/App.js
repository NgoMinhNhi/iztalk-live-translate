import logo from './logo.svg';
import './App.css';
import {useCallback, useEffect, useState} from "react";
import {useSocket} from "./hooks/useSocket";
function App() {
  const [recording, setRecording] = useState(false);
  const [audioContext, setAudioContext] = useState(null);
  const [microphoneSource, setMicrophoneSource] = useState(null);
  const [scriptNode, setScriptNode] = useState(null);
  const { socket } = useSocket();
  const [texts, setTexts] = useState([]);

  const setupAudioProcessing = async () => {
    try {
      // Set up WebRTC with echo cancellation
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, sampleRate: 16000, } });
      // Set up Web Audio API for noise suppression
      const _audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 16000, // Set the sample rate to 16000
      });
      const _microphoneSource = _audioContext.createMediaStreamSource(stream);
      const _scriptNode = _audioContext.createScriptProcessor(4096, 1, 1);
      _scriptNode.onaudioprocess = function(event) {
        const inputData = event.inputBuffer.getChannelData(0);
        const buffer = new Int16Array(inputData.length);

        for (let i = 0; i < inputData.length; i++) {
          buffer[i] = inputData[i] * 0x7fff;
        }

        // Convert audio data to Uint8Array
        const uint8ArrayData = new Uint8Array(buffer.buffer);

        // Convert Uint8Array to base64
        let binary = '';
        uint8ArrayData.forEach(function(byte) {
          binary += String.fromCharCode(byte);
        });
        const base64Data = btoa(binary);
        console.log('1111', base64Data.length)
        socket.emit('audio_stream', { audio: base64Data, end: false });
        // Your base64 audio data is now available for processing or handling
      };


      _microphoneSource.connect(_scriptNode);
      _scriptNode.connect(_audioContext.destination);
      setAudioContext(_audioContext);
      setMicrophoneSource(_microphoneSource);
      setScriptNode(_scriptNode);
    } catch (error) {
      console.error('Error accessing microphone or setting up audio processing:', error);
    }
  };

  const playAudioFile = useCallback((base64Data) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const decodedData = atob(base64Data);
    const arrayBuffer = new ArrayBuffer(decodedData.length);
    const view = new Uint8Array(arrayBuffer);
    for (let i = 0; i < decodedData.length; i++) {
      view[i] = decodedData.charCodeAt(i);
    }
    audioContext.decodeAudioData(arrayBuffer, function(buffer) {
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      source.start(0);
    }, function(err) {
      console.error('Error decoding audio data:', err);
    });
  }, [audioContext]);

  const onClick = () => {
    if (recording) {
      // stop recording
      socket.emit('audio_stream', { audio: '', end: true });
      microphoneSource?.disconnect();
      scriptNode?.disconnect();
      audioContext?.close();
    } else {
      // start recording
      setupAudioProcessing();
    }
    setRecording(!recording);
  };

  useEffect(() => {
    if (socket) {
      socket.on('data', (data) => {
        console.log('data received:');
        console.log(data)
        if (data?.audio) {
          // playAudioFile(data.audio);
        }
        if (data?.text_translate) {
          setTexts((prev) => [...prev, data.text_translate]);
        }
      });
    }
  }, [socket])
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        {
          texts.reverse().map((text, index) => (
            <p key={index}>
              {text}
            </p>
          ))
        }
        <button onClick={onClick} style={{
          padding: '10px 20px',
          backgroundColor: recording ? 'red' : 'blue',
        }}>
          {recording ? "Stop" : "Start"} Recording
        </button>
      </header>
    </div>
  );
}

export default App;
