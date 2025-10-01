"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { checkUser } from "@/lib/checkUser";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const getAnalysisHistory = async (resumeId) => {
  const user = await checkUser();
  if (!resumeId) return { data: [] };

  const history = await db.resumeAnalysis.findMany({
    where: {
      userId: user.id,
      resumeId: resumeId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return { success: true, data: history };
};

export const saveResumeAnalysis = async (
  analysisData,
  jobDescription,
  resumeId,
  jobDetails = {},
  inlineFeedback
) => {
  const user = await checkUser();
  if (!user) throw new Error("Unauthorized");
  if (!resumeId) throw new Error("Resume ID is required");

  const formattedJD = await formatJDWithAI(jobDescription);

  try {
    const savedAnalysis = await db.resumeAnalysis.create({
      data: {
        userId: user.id,
        resumeId: resumeId,
        jobDescription,
        formattedJobDescription: formattedJD,
        matchScore: analysisData.matchScore,
        missingKeywords: analysisData.missingKeywords,
        summary: analysisData.summary,
        suggestions: analysisData.suggestions,
        inlineFeedback: inlineFeedback || {},
        jobTitle: jobDetails?.title,
        companyName: jobDetails?.companyName,
        jobSource: jobDetails?.source,
        jobUrl: jobDetails?.url,
        sourceType: jobDetails?.sourceType,
      },
    });
    revalidatePath(`/resume/${resumeId}`);
    return { success: true, data: savedAnalysis };
  } catch (error) {
    console.error("Lỗi khi lưu kết quả phân tích:", error);
    return { error: "Không thể lưu kết quả phân tích." };
  }
};

export const deleteResumeAnalysis = async (analysisId) => {
  const user = await checkUser();
  if (!user) throw new Error("Unauthorized");

  if (!analysisId) {
    return { error: "Analysis ID is required." };
  }

  try {
    await db.resumeAnalysis.delete({
      where: {
        id: analysisId,

        userId: user.id,
      },
    });
    return { success: true };
  } catch (error) {
    console.error("Lỗi khi xóa kết quả phân tích:", error);
    return { error: "Không thể xóa kết quả phân tích." };
  }
};

export async function deleteMultipleResumeAnalyses(ids) {
  const user = await checkUser();
  if (!user) {
    return { error: "Unauthorized" };
  }
  if (!ids || ids.length === 0) {
    return { error: "No analysis IDs provided." };
  }

  try {
    const result = await db.resumeAnalysis.deleteMany({
      where: {
        id: {
          in: ids,
        },
        userId: user.id,
      },
    });

    return { success: true, count: result.count };
  } catch (error) {
    console.error("Error deleting multiple analyses:", error);
    return { error: "Không thể xóa các mục phân tích đã chọn." };
  }
}

async function formatJDWithAI(plainTextJD) {
  if (!plainTextJD) return null;
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = `
    You are an expert web developer. Your task is to convert a plain text job description into a clean, semantic, and readable HTML snippet.

    RULES:
    1.  Use simple HTML tags: <h2> for main sections (like 'Responsibilities', 'Requirements', 'Benefits'), <ul> and <li> for bullet points, <p> for paragraphs, and <strong> for emphasis.
    2.  DO NOT include <html>, <head>, or <body> tags.
    3.  DO NOT include any <style> tags or inline "style" attributes.
    4.  Your entire output MUST be ONLY the raw HTML string snippet. Do not wrap it in markdown backticks or add any explanations.

    Plain Text Job Description:
    ---
    ${plainTextJD}
    ---
  `;
  try {
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error("Lỗi định dạng JD bằng AI:", error);

    return `<pre>${plainTextJD}</pre>`;
  }
}

export const analyzeResumeWithJD = async (jobDescription, resumeId) => {
  const user = await checkUser();
  if (!resumeId) {
    return { error: "Resume ID is required." };
  }

  const userResume = await db.resume.findUnique({
    where: { id: resumeId, userId: user.id },
  });

  if (!userResume || !userResume.content) {
    return { error: "Không tìm thấy nội dung CV của bạn." };
  }

  const resumeText = userResume.content;

  const prompt = `
    As an elite career coach, analyze the resume against the job description.
    Your primary task is to generate DETAILED, section-by-section inline feedback.
    You will also provide a match score, missing keywords, and a summary.

    **Job Description:**
    ---
    ${jobDescription}
    ---
    **User's Resume (in Markdown):**
    ---
    ${resumeText}
    ---

    Your entire response MUST be a single, valid JSON object with the following top-level keys: "matchScore", "missingKeywords", "summary", and "inlineFeedback".

    1.  **matchScore**: An integer from 0 to 100.
    2.  **missingKeywords**: An array of important keywords missing from the resume.
    3.  **summary**: A brief, one-paragraph summary of the analysis.
    4.  **inlineFeedback**: An object where each key is a resume section ('summary', 'skills', 'experience', 'education', 'projects') and the value is a DETAILED, constructive comment for that section. Follow these specific instructions:
        - **summary**: Analyze alignment with the JD. Suggest specific phrases to incorporate.
        - **skills**: Directly compare with JD requirements. Identify SPECIFIC missing skills and explain their importance.
        - **experience**: Critique bullet points for being achievement-oriented. Suggest rewrites with metrics.
        - **education**: Mention relevant coursework or academic projects.
        - **projects**: Suggest quantifying outcomes and adding links.

    Do NOT generate a "suggestions" array. It will be derived from your inlineFeedback.
  `;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleanedText = text.replace(/```json\n?|\n?```/g, "").trim();

    const aiResult = JSON.parse(cleanedText);

    const finalResult = {
      generalAnalysis: {
        matchScore: aiResult.matchScore,
        missingKeywords: aiResult.missingKeywords,
        summary: aiResult.summary,

        suggestions: Object.values(aiResult.inlineFeedback).filter(Boolean),
      },
      inlineFeedback: aiResult.inlineFeedback,
    };

    return { success: true, data: finalResult };
  } catch (error) {
    console.error("Error analyzing resume with Gemini:", error);
    return { error: "Đã có lỗi xảy ra khi phân tích." };
  }
};

export const getInlineFeedback = async (analysisId) => {
  const user = await checkUser();
  if (!user) throw new Error("Unauthorized");

  try {
    const analysis = await db.resumeAnalysis.findUnique({
      where: { id: analysisId, userId: user.id },
      select: {
        inlineFeedback: true,
      },
    });

    if (!analysis || !analysis.inlineFeedback) {
      throw new Error("Saved inline feedback not found.");
    }

    return { success: true, data: analysis.inlineFeedback };
  } catch (error) {
    console.error("Error fetching saved inline feedback:", error);
    return { error: "Failed to fetch saved inline feedback." };
  }
};
