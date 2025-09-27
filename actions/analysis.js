"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { checkUser } from "@/lib/checkUser";
import { db } from "@/lib/prisma";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const getAnalysisHistory = async (resumeId) => {
  const user = await checkUser();
  if (!resumeId) return { data: [] }; // Trả về mảng rỗng nếu không có resumeId

  const history = await db.resumeAnalysis.findMany({
    where: {
      userId: user.id,
      resumeId: resumeId,
    },
    orderBy: {
      createdAt: "desc", // Sắp xếp theo ngày tạo mới nhất
    },
  });
  return { success: true, data: history };
};

export const saveResumeAnalysis = async (
  analysisData,
  jobDescription,
  resumeId,
  jobDetails = {}
) => {
  const user = await checkUser();
  if (!user) throw new Error("Unauthorized");

  if (!resumeId) throw new Error("Resume ID is required");

  try {
    const savedAnalysis = await db.resumeAnalysis.create({
      data: {
        userId: user.id,
        resumeId: resumeId,
        jobDescription,
        matchScore: analysisData.matchScore,
        missingKeywords: analysisData.missingKeywords,
        summary: analysisData.summary,
        suggestions: analysisData.suggestions,

        jobTitle: jobDetails.title,
        companyName: jobDetails.companyName,
        jobSource: jobDetails.source,
        jobUrl: jobDetails.url,
        sourceType: jobDetails.sourceType,
      },
    });
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
        // Đảm bảo người dùng chỉ có thể xóa phân tích của chính họ
        userId: user.id,
      },
    });
    return { success: true };
  } catch (error) {
    console.error("Lỗi khi xóa kết quả phân tích:", error);
    return { error: "Không thể xóa kết quả phân tích." };
  }
};

//Action cho server, thao tác với database, chạy model, hệ thống AI, ...
// Sửa lại hàm này để nhận resumeId
export const analyzeResumeWithJD = async (jobDescription, resumeId) => {
  const user = await checkUser();
  if (!resumeId) {
    return { error: "Resume ID is required." };
  }

  // Tìm CV bằng ID của nó, và đảm bảo nó thuộc về user hiện tại
  const userResume = await db.resume.findUnique({
    where: {
      id: resumeId,
      userId: user.id, // Đảm bảo an toàn
    },
  });

  if (!userResume || !userResume.content) {
    return { error: "Không tìm thấy nội dung CV của bạn." };
  }

  const resumeText = userResume.content;

  const prompt = `
    As an expert ATS (Applicant Tracking System) and professional career coach, analyze the following resume against the provided job description.
    **Job Description:**
    ---
    ${jobDescription}
    ---
    **User's Resume (in Markdown):**
    ---
    ${resumeText}
    ---
    Based on the analysis, provide the following in JSON format:
    1.  **matchScore**: An integer from 0 to 100.
    2.  **missingKeywords**: An array of important keywords missing from the resume.
    3.  **summary**: A brief summary of the analysis.
    4.  **suggestions**: An array of actionable suggestions for improvement.
    Your entire response MUST be a single, valid JSON object.
  `;

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
    });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();
    const parsedResult = JSON.parse(cleanedText);
    return { success: true, data: parsedResult };
  } catch (error) {
    console.error("Error analyzing resume with Gemini:", error);
    return { error: "Đã có lỗi xảy ra khi phân tích." };
  }
};
