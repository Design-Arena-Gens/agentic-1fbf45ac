"use client";

import React, { useRef, useState } from "react";
import { DoorCamCanvas } from "@/components/DoorCamCanvas";

export default function Page() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<BlobPart[]>([]);

  const startRecording = () => {
    if (!canvasRef.current) return;
    const stream = (canvasRef.current as HTMLCanvasElement).captureStream(30);
    const recorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9" });

    recordedChunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        recordedChunksRef.current.push(e.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      setRecordedUrl(url);
      setIsRecording(false);
    };

    recorder.start();
    mediaRecorderRef.current = recorder;
    setIsRecording(true);

    // Auto-stop after 6 seconds
    setTimeout(() => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    }, 6000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  return (
    <main className="container">
      <header className="header">
        <h1>Door Cam</h1>
        <p>Dog eating burger outside the door ? simulated door camera feed.</p>
      </header>

      <section className="canvasWrap">
        <DoorCamCanvas canvasRef={canvasRef} width={960} height={540} />
      </section>

      <section className="controls">
        <button onClick={startRecording} disabled={isRecording}>
          {isRecording ? "Recording..." : "Record 6s"}
        </button>
        <button onClick={stopRecording} disabled={!isRecording}>
          Stop
        </button>
        {recordedUrl && (
          <a className="download" href={recordedUrl} download={`door-cam-dog-burger-${Date.now()}.webm`}>
            Download Recording
          </a>
        )}
      </section>

      {recordedUrl && (
        <section className="playback">
          <h2>Playback</h2>
          <video src={recordedUrl} controls playsInline></video>
        </section>
      )}

      <footer className="footer">
        <span>REC is simulated. No real footage.</span>
      </footer>
    </main>
  );
}
