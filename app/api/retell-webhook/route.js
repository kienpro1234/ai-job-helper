// app/api/retell-webhook/route.js

import { NextResponse } from "next/server";
import { RetellClient } from "retell-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

const retellClient = new RetellClient({
  apiKey: process.env.RETELL_API_KEY,
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerative - ai({ model: "gemini-2.0-flash" });

export async function POST(req) {
  const { call_id, transcript } = await req.json();

  // Tạo response cho Retell AI
  const response = new retellClient.call.llm.LlmResponse();

  try {
    const chat = model.startChat({
      history: transcript.map((turn) => ({
        role: turn.role === "agent" ? "model" : "user",
        parts: [{ text: turn.content }],
      })),
    });

    const result = await chat.sendMessage("Please continue the conversation.");
    const text = result.response.text();

    response.addText(text);
  } catch (error) {
    console.error("Error with Retell webhook:", error);
    response.addText("Sorry, I'm having some trouble. Could you repeat that?");
  }

  return NextResponse.json(response.json());
}
