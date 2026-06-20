import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? "";

export async function POST(req: NextRequest) {
  // Auth gate FIRST. This route relays a recording to a third party (OpenAI
  // Whisper) using the server's OPENAI_API_KEY. The recordings are children's
  // voices. Without an authenticated-session check it is (a) an open relay that
  // burns OPENAI_API_KEY for any anonymous caller, and (b) an unconsented
  // egress of kids' audio. Only signed-in users (the practice runner) may call it.
  // Consent/retention boundary: audio is streamed straight to OpenAI for
  // transcription and is NOT persisted by this route; OpenAI API inputs are not
  // used for training and are retained per OpenAI's API data policy. Sending a
  // child's voice to OpenAI must remain covered by the parent consent captured
  // at join time; see docs/non-negotiable-rules.md and the join flow.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
