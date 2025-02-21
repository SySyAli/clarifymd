import { NextResponse } from "next/server";
import pdf from "pdf-parse/lib/pdf-parse";
import { getCompletion } from "@/lib/openai"; // OpenAI helper

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file received" }, { status: 400 });
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
      return NextResponse.json({ error: "No text extracted from document" }, { status: 400 });
    }

    console.log("🔍 Extracted Text (first 500 chars):", extractedText.substring(0, 500));

    // Send extracted text to OpenAI for summarization
    const summary = await getCompletion("Summarize this document concisely:", [
      { role: "user", message: extractedText.substring(0, 2000) || "No meaningful content extracted." },
    ]);

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("🚨 Summarization Error:", error);
    return NextResponse.json({ error: "Failed to summarize document", details: (error as Error).message }, { status: 500 });
  }
}
