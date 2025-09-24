"use server";

import { db } from "@/lib/prisma";
// import { revalidatePath } from "next/cache";
import { GoogleGenerativeAI } from "@google/generative-ai";
// Import hàm checkUser để sử dụng nhất quán
import { checkUser } from "@/lib/checkUser";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// =================================================================
// CÁC ACTION ĐÃ ĐƯỢC SỬA LỖI VÀ ĐỒNG BỘ
// =================================================================

export async function createResume(title, content) {
  // Sửa ở đây: Dùng checkUser()
  const user = await checkUser();

  const newResume = await db.resume.create({
    data: {
      userId: user.id, // Dùng user.id từ checkUser
      title,
      content,
    },
  });

  // revalidatePath("/resume");
  return newResume;
}

export async function getResumes() {
  // Sửa ở đây: Dùng checkUser()
  const user = await checkUser();

  return await db.resume.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getResume(id) {
  // Sửa ở đây: Dùng checkUser()
  const user = await checkUser();
  if (!id) return null;

  return await db.resume.findUnique({
    where: {
      id: id,
      userId: user.id, // Đảm bảo an toàn
    },
  });
}

export const improveWithAI = async ({ current, type }) => {
  // Hàm này đã đúng, giữ nguyên
  const user = await checkUser();

  const prompt = `
    As an expert resume writer, improve the following "${type}" description for a professional in the "${user.industry}" industry.
    Make it more impactful, quantifiable, and aligned with industry standards.
    Current content: "${current}"

    Requirements:
    1. Use action verbs.
    2. Include metrics and results where possible.
    3. Highlight relevant technical skills.
    4. Keep it concise but detailed.
    5. Focus on achievements over responsibilities.
    6. Use industry-specific keywords.

    Your response must be ONLY the improved paragraph, without any additional text, explanations, or introductory phrases like "Here's the improved version:".
  `;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const improvedContent = response.text().trim();

    return improvedContent;
  } catch (error) {
    console.error("Error improving content:", error);
    throw new Error("Failed to improve content");
  }
};
