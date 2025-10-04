"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getResumes as fetchResumes } from "./resume";
import { checkUser } from "@/lib/checkUser";
import { RetellClient } from "retell-sdk";

const retellClient = new RetellClient({
  apiKey: process.env.RETELL_API_KEY,
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export async function generateQuiz() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    select: {
      industry: true,
      skills: true,
    },
  });

  if (!user) throw new Error("User not found");

  const prompt = `
    Generate 10 technical interview questions for a ${
      user.industry
    } professional${
    user.skills?.length ? ` with expertise in ${user.skills.join(", ")}` : ""
  }.
    
    Each question should be multiple choice with 4 options.
    
    Return the response in this JSON format only, no additional text:
    {
      "questions": [
        {
          "question": "string",
          "options": ["string", "string", "string", "string"],
          "correctAnswer": "string",
          "explanation": "string"
        }
      ]
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();
    const quiz = JSON.parse(cleanedText);

    return quiz.questions;
  } catch (error) {
    console.error("Error generating quiz:", error);
    throw new Error("Failed to generate quiz questions");
  }
}

export async function saveQuizResult(questions, answers, score) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  const questionResults = questions.map((q, index) => ({
    question: q.question,
    answer: q.correctAnswer,
    userAnswer: answers[index],
    isCorrect: q.correctAnswer === answers[index],
    explanation: q.explanation,
  }));

  const wrongAnswers = questionResults.filter((q) => !q.isCorrect);

  let improvementTip = null;
  if (wrongAnswers.length > 0) {
    const wrongQuestionsText = wrongAnswers
      .map(
        (q) =>
          `Question: "${q.question}"\nCorrect Answer: "${q.answer}"\nUser Answer: "${q.userAnswer}"`
      )
      .join("\n\n");

    const improvementPrompt = `
      The user got the following ${user.industry} technical interview questions wrong:

      ${wrongQuestionsText}

      Based on these mistakes, provide a concise, specific improvement tip.
      Focus on the knowledge gaps revealed by these wrong answers.
      Keep the response under 2 sentences and make it encouraging.
      Don't explicitly mention the mistakes, instead focus on what to learn/practice.
    `;

    try {
      const tipResult = await model.generateContent(improvementPrompt);

      improvementTip = tipResult.response.text().trim();
      console.log(improvementTip);
    } catch (error) {
      console.error("Error generating improvement tip:", error);
    }
  }

  try {
    const assessment = await db.assessment.create({
      data: {
        userId: user.id,
        quizScore: score,
        questions: questionResults,
        category: "Technical",
        improvementTip,
      },
    });

    return assessment;
  } catch (error) {
    console.error("Error saving quiz result:", error);
    throw new Error("Failed to save quiz result");
  }
}

export async function getAssessments() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  try {
    const assessments = await db.assessment.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return assessments;
  } catch (error) {
    console.error("Error fetching assessments:", error);
    throw new Error("Failed to fetch assessments");
  }
}

export async function getResumesForInterview() {
  const user = await checkUser();
  if (!user) return [];
  return fetchResumes();
}

export async function getAiInterviewResponse(
  chatHistory,
  jobDescription,
  jobTitle,
  workExperienceAndProjects
) {
  const user = await checkUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    const prompt = `You are an expert interviewer named 'Alex' for the position of ${jobTitle}.
      Your goal is to assess the candidate's suitability based on their resume and the job description.
      The conversation history is provided below. Your task is to generate the next response for 'Alex'.

      JOB DESCRIPTION:
      ---
      ${jobDescription}
      ---

      CANDIDATE'S RESUME (Work Experience & Projects only):
      ---
      ${workExperienceAndProjects}
      ---

      RULES:
      1. Keep the conversation natural and professional. Ask one question at a time.
      2. Ask specific questions about the projects and work experience to verify their claims.
      3. Ask behavioral and technical questions based on the requirements in the job description.
      4. If the conversation has just begun (history is short), introduce yourself briefly as 'Alex' and ask the first question.
      5. After about 5-7 questions, end the interview gracefully by saying something like "That's all the questions I have for you. Thank you for your time."
      6. Do NOT use markdown formatting in your response. Just plain text.`;

    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: prompt }] },
        {
          role: "model",
          parts: [{ text: "Okay, I am ready to start the interview as Alex." }],
        },
        // Lịch sử chat
        ...chatHistory,
      ],
      generationConfig: {
        maxOutputTokens: 150,
      },
    });

    // Lấy tin nhắn cuối cùng của người dùng để gửi
    const lastUserMessage = chatHistory[chatHistory.length - 1].parts[0].text;
    const result = await chat.sendMessage(lastUserMessage);
    const response = result.response;
    const text = response.text();

    return { success: true, message: text };
  } catch (error) {
    console.error("Error getting AI response:", error);
    return { success: false, error: "An internal server error occurred." };
  }
}
