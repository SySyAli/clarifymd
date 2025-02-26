import { NextResponse } from "next/server";
import { getCompletion } from "@/lib/openai";

export async function POST(req: Request) {
	try {
		const { messages, fileSummary } = await req.json();
		console.log(messages);

		if (!messages || !Array.isArray(messages)) {
			return NextResponse.json({ error: "Invalid request" }, { status: 400 });
		}

		// ------------------
		// SYSTEM PROMPT
		// ------------------
		// This instructs the model to:
		// 1) Only respond in plain text (no Markdown or special formatting).
		// 2) Base all answers strictly on the provided file summary.
		// 3) Provide thorough, concise, and maximally helpful answers.
		// 4) Not ask clarifying questions or stray to other topics.
		// 5) Include a short disclaimer about professional medical advice.

		const chatSystemPrompt = `
You are an AI that answers questions based solely on the provided document summary.
You must respond in plain text only—no Markdown, HTML, or other formatting.
Use line breaks for paragraphs if necessary, but no bullet points or special syntax.
Be thorough, concise, and maximally helpful in your answer.
Do not ask clarifying questions or request additional information from the user.
Remain truthful and do not stray from the summary or introduce outside information.
If needed, define medical terms or acronyms in simple language.
If the user's question is not answerable with the summary, respond: "I'm sorry, but I don't have information about that."
Include a brief disclaimer at the end: "This content is for informational purposes only and does not replace professional medical advice."

Document Summary: ${fileSummary}
`;

		// Prepend the system message to the incoming user/assistant messages
		const chatMessages = [
			{ role: "system", content: chatSystemPrompt },
			...messages.map((msg) => ({
				role: msg.role,
				content: msg.message,
			})),
		];

		// Call your OpenAI helper with an empty "prompt" string but the full messages array
		const reply = await getCompletion("", chatMessages);

		return NextResponse.json({ reply });
	} catch (error) {
		console.error(error);
		return NextResponse.json(
			{ error: "Failed to generate response" },
			{ status: 500 }
		);
	}
}
