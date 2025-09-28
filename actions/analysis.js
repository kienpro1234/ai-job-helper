"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { checkUser } from "@/lib/checkUser";
import { db } from "@/lib/prisma";

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
    // Không cần include resume ở đây nữa
  });
  return { success: true, data: history };
};

// THAY ĐỔI 2: Cập nhật `saveResumeAnalysis` để lưu thêm `inlineFeedback`
export const saveResumeAnalysis = async (
  analysisData,
  jobDescription,
  resumeId,
  jobDetails = {},
  inlineFeedback // Thêm tham số mới
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

        // Lưu cả inlineFeedback vào DB
        inlineFeedback: inlineFeedback || {},

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

// Sửa lại hàm này để nhận resumeId
// export const analyzeResumeWithJD = async (jobDescription, resumeId) => {
//   const user = await checkUser();
//   if (!resumeId) {
//     return { error: "Resume ID is required." };
//   }

//   // Tìm CV bằng ID của nó, và đảm bảo nó thuộc về user hiện tại
//   const userResume = await db.resume.findUnique({
//     where: {
//       id: resumeId,
//       userId: user.id, // Đảm bảo an toàn
//     },
//   });

//   if (!userResume || !userResume.content) {
//     return { error: "Không tìm thấy nội dung CV của bạn." };
//   }

//   const resumeText = userResume.content;

//   const prompt = `
//     As an expert ATS (Applicant Tracking System) and professional career coach, analyze the following resume against the provided job description.
//     **Job Description:**
//     ---
//     ${jobDescription}
//     ---
//     **User's Resume (in Markdown):**
//     ---
//     ${resumeText}
//     ---
//     Based on the analysis, provide the following in JSON format:
//     1.  **matchScore**: An integer from 0 to 100.
//     2.  **missingKeywords**: An array of important keywords missing from the resume.
//     3.  **summary**: A brief summary of the analysis.
//     4.  **suggestions**: An array of actionable suggestions for improvement.
//     Your entire response MUST be a single, valid JSON object.
//   `;

//   try {
//     const model = genAI.getGenerativeModel({
//       model: "gemini-2.0-flash",
//     });
//     const result = await model.generateContent(prompt);
//     const response = await result.response;
//     const text = response.text();
//     const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();
//     const parsedResult = JSON.parse(cleanedText);
//     return { success: true, data: parsedResult };
//   } catch (error) {
//     console.error("Error analyzing resume with Gemini:", error);
//     return { error: "Đã có lỗi xảy ra khi phân tích." };
//   }
// };

// THAY ĐỔI 1: Tối ưu `analyzeResumeWithJD` để tạo cả 2 loại nhận xét trong 1 lần gọi AI
// export const analyzeResumeWithJD = async (jobDescription, resumeId) => {
//   const user = await checkUser();
//   if (!resumeId) {
//     return { error: "Resume ID is required." };
//   }

//   const userResume = await db.resume.findUnique({
//     where: { id: resumeId, userId: user.id },
//   });

//   if (!userResume || !userResume.content) {
//     return { error: "Không tìm thấy nội dung CV của bạn." };
//   }

//   const resumeText = userResume.content;

//   // Prompt mới, yêu cầu AI trả về một JSON chứa cả 2 loại phân tích
//   const prompt = `
//     As an expert ATS and career coach, analyze the resume against the job description.
//     Provide a complete analysis in a single JSON object.

//     **Job Description:**
//     ---
//     ${jobDescription}
//     ---
//     **User's Resume (in Markdown):**
//     ---
//     ${resumeText}
//     ---

//     Your entire response MUST be a single, valid JSON object with two main keys: "generalAnalysis" and "inlineFeedback".

//     1.  **generalAnalysis**: An object with these keys:
//         - "matchScore": An integer from 0 to 100.
//         - "missingKeywords": An array of important keywords missing from the resume.
//         - "summary": A brief, one-paragraph summary of the analysis.
//         - "suggestions": An array of actionable suggestions for improvement (at least 5).

//     2.  **inlineFeedback**: An object where each key is a resume section ('summary', 'skills', 'experience', 'education', 'projects') and the value is a concise, actionable comment for that specific section. If a section is good, provide positive reinforcement.

//     Example of the final JSON structure:
//     {
//       "generalAnalysis": {
//         "matchScore": 85,
//         "missingKeywords": ["GraphQL", "CI/CD"],
//         "summary": "The resume is strong...",
//         "suggestions": ["Quantify achievements...", "Add a projects section..."]
//       },
//       "inlineFeedback": {
//         "summary": "Your summary could be strengthened by adding a quantifiable achievement.",
//         "skills": "Consider adding 'GraphQL' as it is mentioned in the job description.",
//         "experience": "For your role at 'Tech Corp', quantify the impact...",
//         "education": "This section is clear. No changes needed.",
//         "projects": "Add a link to the live demo or GitHub repository if possible."
//       }
//     }
//   `;

//   try {
//     const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
//     const result = await model.generateContent(prompt);
//     const text = result.response.text();
//     const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();
//     const parsedResult = JSON.parse(cleanedText);

//     // Trả về toàn bộ object chứa cả 2 loại phân tích
//     return { success: true, data: parsedResult };
//   } catch (error) {
//     console.error("Error analyzing resume with Gemini:", error);
//     return { error: "Đã có lỗi xảy ra khi phân tích." };
//   }
// };

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

  // --- PROMPT ĐƯỢC TỐI ƯU HÓA ĐỂ ĐỒNG BỘ HÓA DỮ LIỆU ---
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

    // Dữ liệu thô từ AI
    const aiResult = JSON.parse(cleanedText);

    // TỰ ĐỘNG TẠO RA DỮ LIỆU ĐỒNG BỘ
    // Biến đổi kết quả từ AI để tạo ra cấu trúc dữ liệu cuối cùng
    const finalResult = {
      generalAnalysis: {
        matchScore: aiResult.matchScore,
        missingKeywords: aiResult.missingKeywords,
        summary: aiResult.summary,
        // suggestions được tạo trực tiếp từ các giá trị của inlineFeedback
        // Điều này đảm bảo chúng luôn đồng bộ 100%
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

// THAY ĐỔI 3: `getInlineFeedback` giờ chỉ đọc từ DB, không gọi AI nữa
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
