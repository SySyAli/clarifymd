"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";

export default function ClarifyMD() {
  const [files, setFiles] = useState<File[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileUrl, setSelectedFileUrl] = useState("");
  const [chat, setChat] = useState<{ role: "user" | "ai"; message: string }[]>([
    { role: "ai", message: "Welcome! Upload a document to get started." },
  ]);
  const [loading, setLoading] = useState(false);
  const [userMessage, setUserMessage] = useState("");

  // Track which file names have already been summarized
  const [processedFiles, setProcessedFiles] = useState<string[]>([]);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // --- FILE LOGIC ---
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;

    // Convert FileList to an array
    const newFiles = Array.from(event.target.files);

    // Add the new files to our existing file list
    setFiles((prev) => [...prev, ...newFiles]);

    // We'll select the last newly uploaded file for immediate preview
    const lastFile = newFiles[newFiles.length - 1];
    if (lastFile) {
      setSelectedFile(lastFile);
      setSelectedFileUrl(URL.createObjectURL(lastFile));
    }

    // Summarize each newly uploaded file exactly once
    newFiles.forEach((file) => {
      if (!processedFiles.includes(file.name)) {
        // Mark it processed immediately to prevent double-summarizing
        setProcessedFiles((prev) => [...prev, file.name]);

        setChat((prev) => [
          ...prev,
          {
            role: "ai",
            message: `Processing document: ${file.name}...`,
          },
        ]);
        setLoading(true);

        // Simulate an async summary
        setTimeout(() => {
          setChat((prev) => [
            ...prev,
            {
              role: "ai",
              message: `${file.name} is summarized. You can now ask questions.`,
            },
          ]);
          setLoading(false);
        }, 2000);
      }
    });
  };

  // Switch displayed file without re-summarizing
  const handleFileSelection = (index: number) => {
    const file = files[index];
    setSelectedFile(file);
    setSelectedFileUrl(URL.createObjectURL(file));
    // No summarization triggered here
  };

  // --- CHAT LOGIC ---
  const handleChatSubmit = () => {
    if (!userMessage.trim()) return;
    setChat((prev) => [...prev, { role: "user", message: userMessage }]);
    setUserMessage("");
    setLoading(true);

    // Dummy response
    setTimeout(() => {
      setChat((prev) => [
        ...prev,
        { role: "ai", message: "This is a dummy response." },
      ]);
      setLoading(false);
    }, 1500);
  };

  useEffect(() => {
    // Scroll to bottom on new messages
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [chat]);

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden font-sans">
      {/* HEADER - smaller than before */}
      <header className="bg-gray-800 py-2 px-4 text-white text-xl font-semibold text-left shadow">
        ClarifyMD
      </header>

      {/* MAIN CONTENT */}
      <div className="flex flex-1 gap-4 p-4 overflow-hidden">
        {/* LEFT PANEL: Document Upload & Preview */}
        <div className="w-1/2 flex flex-col rounded-lg bg-white border shadow-md p-4 min-h-0">
          {/* Upload & File Selector */}
          <div className="mb-4">
            <label className="block bg-gray-200 text-gray-800 p-3 rounded-lg cursor-pointer text-center font-medium">
              Upload Document
              <input
                type="file"
                multiple
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>

            {files.length > 0 && (
              <select
                className="mt-4 w-full p-2 border rounded-lg bg-gray-100 text-gray-800"
                onChange={(e) => handleFileSelection(parseInt(e.target.value))}
              >
                {files.map((file, i) => (
                  <option key={i} value={i}>
                    {file.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Preview Area */}
          <div className="flex-1 overflow-auto bg-gray-100 border rounded-lg p-3 min-h-0">
            {selectedFile ? (
              selectedFile.type.startsWith("image/") ? (
                <Image
                  src={selectedFileUrl}
                  alt="Uploaded"
                  className="rounded-lg"
                  width={400}
                  height={400}
                />
              ) : selectedFile.type === "application/pdf" ? (
                <iframe
                  src={selectedFileUrl}
                  className="w-full h-full rounded-lg"
                  scrolling="auto"
                />
              ) : (
                <p className="text-gray-800">
                  Preview not available for this file type.
                </p>
              )
            ) : (
              <p className="text-gray-800">No file selected</p>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Chat Interface */}
        <div className="w-1/2 flex flex-col rounded-lg bg-white border shadow-md p-4 min-h-0">
          {/* Scrollable Chat Area */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto bg-gray-50 p-4 rounded-lg min-h-0"
          >
            {chat.map((msg, i) => (
              <div
                key={i}
                className={`my-2 flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <span
                  className={`px-3 py-2 rounded-lg text-sm text-black ${
                    msg.role === "user"
                      ? "bg-blue-100 self-end"
                      : "bg-green-100 self-start"
                  }`}
                >
                  {msg.message}
                </span>
              </div>
            ))}

            {loading && <p className="text-black">Loading...</p>}
          </div>

          {/* Chat Input at Bottom */}
          <div className="mt-2 flex">
            <input
              type="text"
              className="flex-1 border p-2 rounded-l-lg text-black bg-gray-50"
              placeholder="Ask a question..."
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleChatSubmit();
                }
              }}
            />
            <button
              className="p-2 bg-gray-200 text-gray-800 rounded-r-lg font-medium border-l"
              onClick={handleChatSubmit}
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
