import { NextRequest, NextResponse } from "next/server";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? "";

export async function POST(req: NextRequest) {
  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY not configured" },
      { status: 500 },
    );
  }

  try {
    const formData = await req.formData();
    const audio = formData.get("audio") as Blob | null;

    if (!audio) {
      return NextResponse.json({ error: "No audio provided" }, { status: 400 });
    }

    // Forward to OpenAI Whisper API
    const whisperForm = new FormData();
    whisperForm.append("file", audio, "audio.webm");
    whisperForm.append("model", "whisper-1");
    whisperForm.append("language", "en");
    // Lower temperature = more deterministic
    whisperForm.append("temperature", "0.0");

    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: whisperForm,
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[WordPets] Whisper API error:", res.status, err);
      return NextResponse.json(
        { error: "Whisper API error", detail: err },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json({ text: data.text ?? "" });
  } catch (err) {
    console.error("[WordPets] Transcribe route error:", err);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 },
    );
  }
}
