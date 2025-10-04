"use server";

import { createClient } from "@deepgram/sdk";
import { checkUser } from "@/lib/checkUser";

export async function getTemporaryApiKey() {
  const user = await checkUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;
  const DEEPGRAM_PROJECT_ID = process.env.DEEPGRAM_PROJECT_ID;

  if (!DEEPGRAM_API_KEY || !DEEPGRAM_PROJECT_ID) {
    console.error("Deepgram API Key or Project ID is missing from .env");
    return {
      success: false,
      error: "Server configuration error for Deepgram.",
    };
  }

  try {
    const deepgram = createClient(DEEPGRAM_API_KEY);

    const { result, error } = await deepgram.manage.createProjectKey(
      DEEPGRAM_PROJECT_ID,
      {
        comment: "Temporary key for voice interview",
        scopes: ["member"],
        timeToLiveInSeconds: 600,
      }
    );

    if (error) {
      console.error("Deepgram SDK manage error:", error);
      throw new Error("Failed to create key using Deepgram SDK.");
    }

    return { success: true, key: result.key };
  } catch (error) {
    console.error("Error creating Deepgram temporary key:", error.message);
    return { success: false, error: "Could not create temporary API key." };
  }
}

export async function getAudioFromText(text) {
  try {
    const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

    const response = await deepgram.speak.request(
      { text },
      {
        model: "aura-luna-en",
        encoding: "mp3",
      }
    );

    const stream = await response.getStream();
    if (!stream) {
      throw new Error("Deepgram returned empty audio stream.");
    }

    // Sử dụng reader để đọc dữ liệu từ ReadableStream
    const reader = stream.getReader();
    const chunks = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      chunks.push(value);
    }

    // Ghép các chunk lại thành một Buffer
    const buffer = Buffer.concat(chunks);
    const base64Audio = buffer.toString("base64");

    return { success: true, audio: base64Audio };
  } catch (error) {
    console.error("Full error getting audio from Deepgram:", error);
    const errorMessage = error.message || "An unknown error with Deepgram TTS.";
    return {
      success: false,
      error: `Failed to generate audio: ${errorMessage}`,
    };
  }
}
