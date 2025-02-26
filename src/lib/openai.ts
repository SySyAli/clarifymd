/* eslint-disable @typescript-eslint/no-explicit-any */
import OpenAI from "openai";

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY, // Ensure API key is set in .env
});

export async function getCompletion(
	prompt: string,
	messages: any[],
	systemPrompt?: string
) {
	try {
		console.log(
			"📜 OpenAI API Messages BEFORE processing:",
			JSON.stringify(messages, null, 2)
		);

		// Ensure roles are correctly set and prevent empty messages
		const fixedMessages = messages
			.map((msg) => ({
				role: msg.role === "ai" ? "assistant" : msg.role,
				content: msg.content?.trim() || "No meaningful content provided.",
			}))
			.filter((msg) => msg.content.length > 0);

		console.log(
			"✅ Fixed Messages Sent to OpenAI:",
			JSON.stringify(fixedMessages, null, 2)
		);

		if (fixedMessages.length === 0) {
			return "No valid content available to process.";
		}

		const defaultSystemPrompt =
			systemPrompt ||
			`
      You are an AI that provides concise, structured summaries for uploaded documents.
      For medical documents, extract relevant information including patient details, diagnosis, test results, and treatment instructions.
      For other documents, extract key findings, main topics, and conclusions.
      Output the summary in a structured format with clear sections. DO NOT ask for more documents or user input.
    `;

		const hasSystemMessage = fixedMessages[0]?.role === "system";
		const finalMessages = hasSystemMessage
			? fixedMessages
			: [{ role: "system", content: defaultSystemPrompt }, ...fixedMessages];

		const response = await openai.chat.completions.create({
			model: "gpt-4o-mini",
			messages: finalMessages,
		});

		const reply = response.choices[0]?.message?.content || "No response.";
		console.log("🔹 OpenAI Response:", reply);

		return reply;
	} catch (error) {
		console.error("🚨 OpenAI API Error:", error);
		throw error;
	}
}
