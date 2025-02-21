import { NextResponse } from "next/server";
import { getCompletion } from "@/lib/openai";

export async function POST(req: Request) {
	try {
		const { messages, fileSummary } = await req.json();
		console.log(messages);
		if (!messages || !Array.isArray(messages)) {
			return NextResponse.json({ error: "Invalid request" }, { status: 400 });
		}

		// Build a combined system prompt that includes the file summary and instructs the AI to not ask any questions.
		const chatSystemPrompt = `You are an AI that answers questions based solely on the provided document summary. Use the summary as context to provide accurate and concise answers. Do not ask any clarifying questions or request additional information from the user.
Document Summary: ${fileSummary}`;

		// Prepend the system message to the messages array
		const chatMessages = [
			{ role: "system", message: chatSystemPrompt },
			...messages,
		];

		const reply = await getCompletion(
			"Answer based on previous messages:",
			chatMessages
		);

		return NextResponse.json({ reply });
	} catch (error) {
		console.error(error);
		return NextResponse.json(
			{ error: "Failed to generate response" },
			{ status: 500 }
		);
	}
}
