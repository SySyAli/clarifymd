import { NextResponse } from "next/server";
import pdf from "pdf-parse/lib/pdf-parse";
import { getCompletion } from "@/lib/openai"; // Your OpenAI helper

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file received" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    let extractedText = "";

    if (file.type === "application/pdf") {
      console.log("📄 Processing as PDF...");
      const pdfData = await pdf(fileBuffer);
      extractedText = pdfData.text?.trim() || ""; // Ensure a valid string
    } else {
      console.log("📝 Processing as plain text...");
      extractedText = fileBuffer.toString("utf-8").trim() || "";
    }

    if (!extractedText) {
      return NextResponse.json(
        { error: "No text extracted from document" },
        { status: 400 }
      );
    }

    console.log(
      "🔍 Extracted Text (first 500 chars):",
      extractedText.substring(0, 500)
    );

    // ------------------------------------------
    // SYSTEM PROMPT
    // ------------------------------------------
    const systemPromptForSummaries = `
You are a specialized AI assistant for summarizing medical documents.
Your task is to produce a concise, user-friendly summary of the provided text,
tailored for patients with limited medical background.

You must respond with plain text only—no Markdown formatting, 
no bullet points, no code blocks, no HTML tags. 
Use only plain text and line breaks.

1. Highlight the most important points (e.g., diagnoses, procedures, key findings, 
   relevant dates, and medical terminology). 
2. Use simple, clear language. Avoid excessive medical jargon—if needed, briefly 
   define medical terms and acronyms. 
3. Do NOT provide personal opinions, diagnoses, or treatment advice. 
4. Keep the summary as factual as possible, based on the given text alone. 
5. End with a note: "This summary is for informational purposes and does not replace 
   professional medical advice."

Important: Do not add details that are not explicitly stated in the original document.
    `;

    // Create messages array for your OpenAI helper
    const messages = [
      {
        role: "system",
        content: systemPromptForSummaries,
      },
      {
        role: "user",
        content:
          extractedText.substring(0, 2000) ||
          "No meaningful content extracted.",
      },
    ];

    // ------------------------------------------
    // CALL YOUR OPENAI HELPER
    // ------------------------------------------
    const summary = await getCompletion("", messages);

    // Return the JSON response with the summary
    return NextResponse.json({ summary });
  } catch (error) {
    console.error("🚨 Summarization Error:", error);
    return NextResponse.json(
      {
        error: "Failed to summarize document",
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
