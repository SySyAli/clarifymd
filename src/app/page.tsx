/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";

// Helper function to remove Markdown formatting for cleaner text display
const stripMarkdown = (text: string) => {
	return text
		.replace(/###/g, "") // Remove headers
		.replace(/####/g, "") // Remove sub-headers
		.replace(/-/g, "•") // Replace hyphens with bullets
		.replace(/\*\*(.*?)\*\*/g, "$1") // Remove bold formatting
		.replace(/`/g, ""); // Remove backticks
};

export default function ClarifyMD() {
	const [files, setFiles] = useState<File[]>([]);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [selectedFileUrl, setSelectedFileUrl] = useState("");
	const [fileSummaries, setFileSummaries] = useState<{ [key: string]: string }>(
		{}
	);
	const [chat, setChat] = useState<
		{ role: "user" | "ai" | "system"; message: string }[]
	>([{ role: "ai", message: "Welcome! Upload a document to get started." }]);
	const [loading, setLoading] = useState(false);
	const [userMessage, setUserMessage] = useState("");

	const chatContainerRef = useRef<HTMLDivElement>(null);

	// --- FILE UPLOAD LOGIC ---
	const handleFileUpload = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		if (!event.target.files) return;

		const newFiles = Array.from(event.target.files);
		setFiles((prev) => [...prev, ...newFiles]);

		// Select the last uploaded file for preview and reset chat
		const lastFile = newFiles[newFiles.length - 1];
		if (lastFile) {
			setSelectedFile(lastFile);
			setSelectedFileUrl(URL.createObjectURL(lastFile));
			setChat((prev) => [
				...prev,
				{ role: "ai", message: `Processing document: ${lastFile.name}...` },
			]);
			await summarizeFile(lastFile); // Summarize new file
		}
	};

	// --- SUMMARIZE FILE ---
	const summarizeFile = async (file: File) => {
		if (!file) return;
		setLoading(true);

		const formData = new FormData();
		formData.append("file", file);

		try {
			const response = await fetch("/api/summarize", {
				method: "POST",
				body: formData,
			});

			const data = await response.json();

			if (response.ok) {
				const summary = stripMarkdown(data.summary);

				setFileSummaries((prev) => ({
					...prev,
					[file.name]: summary,
				}));

				// Add summary to chat without deleting previous messages
				setChat((prev) => [
					...prev,
					{ role: "ai", message: `Summary of ${file.name}: ${summary}` },
				]);
			} else {
				setChat((prev) => [
					...prev,
					{
						role: "ai",
						message: `Error processing ${file.name}: ${data.error}`,
					},
				]);
			}
		} catch (error) {
			console.error("File summarization error:", error);
			setChat((prev) => [
				...prev,
				{ role: "ai", message: "Error communicating with API." },
			]);
		} finally {
			setLoading(false);
		}
	};

	// --- CHAT LOGIC ---
	const handleChatSubmit = async () => {
		if (!userMessage.trim() || !selectedFile) return;

		const userMsg = userMessage.trim();
		// Append the user's message
		setChat((prev) => [...prev, { role: "user", message: userMsg }]);
		setUserMessage("");
		setLoading(true);

		try {
			const response = await fetch("/api/chat", {
				method: "POST",
				body: JSON.stringify({
					// Send only user and assistant messages (filtering out any system messages)
					messages: chat.filter((msg) => msg.role !== "system"),
					fileSummary:
						fileSummaries[selectedFile.name] || "No summary available.",
				}),
				headers: { "Content-Type": "application/json" },
			});

			const data = await response.json();

			// Append the assistant's reply
			setChat((prev) => [
				...prev,
				{
					role: "ai",
					message: stripMarkdown(data.reply || "No response available."),
				},
			]);
		} catch (error) {
			console.error("🚨 Chat API Error:", error);
			setChat((prev) => [
				...prev,
				{ role: "ai", message: "Error communicating with AI." },
			]);
		} finally {
			setLoading(false);
		}
	};

	// Auto-scroll chat to latest message
	useEffect(() => {
		if (chatContainerRef.current) {
			chatContainerRef.current.scrollTo({
				top: chatContainerRef.current.scrollHeight,
				behavior: "smooth",
			});
		}
	}, [chat]);

	return (
		<div className="flex flex-col h-screen bg-gray-50 overflow-hidden font-sans">
			{/* HEADER */}
			<header className="bg-gray-800 py-2 px-4 text-white text-xl font-semibold shadow flex items-center gap-2">
				<Image
					src="/caduceus.svg"
					alt="Caduceus Icon"
					width={24}
					height={24}
					priority
				/>
				<span>ClarifyMD</span>
			</header>

			{/* MAIN CONTENT */}
			<div className="flex flex-1 gap-4 p-4 overflow-hidden">
				{/* LEFT PANEL: FILE UPLOAD & PREVIEW */}
				<div className="w-1/2 flex flex-col rounded-lg bg-white border shadow-md p-4 min-h-0">
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
					</div>

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
								<p className="text-gray-800">{selectedFile.name}</p>
							)
						) : (
							<p className="text-gray-800">No file selected</p>
						)}
					</div>
				</div>

				{/* RIGHT PANEL: CHAT INTERFACE */}
				<div className="w-1/2 flex flex-col rounded-lg bg-white border shadow-md p-4 min-h-0">
					<div
						ref={chatContainerRef}
						className="flex-1 overflow-y-auto bg-gray-50 p-4 rounded-lg min-h-0"
					>
						{/* Filter out system messages when rendering */}
						{chat
							.filter((msg) => msg.role !== "system")
							.map((msg, i) => (
								<div
									key={i}
									className={`my-2 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
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

					{/* CHAT INPUT BOX */}
					<div className="mt-2 flex">
						<input
							type="text"
							className="flex-1 border p-2 rounded-l-lg text-black bg-gray-50"
							placeholder="Ask a question..."
							value={userMessage}
							onChange={(e) => setUserMessage(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") handleChatSubmit();
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
