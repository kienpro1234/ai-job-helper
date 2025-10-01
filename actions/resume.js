"use server";

import { db } from "@/lib/prisma";

import { GoogleGenerativeAI } from "@google/generative-ai";

import { checkUser } from "@/lib/checkUser";
import { revalidatePath } from "next/cache";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function getResumesWithPagination({ page = 1, limit = 10 }) {
  const user = await checkUser();
  if (!user) {
    return { resumes: [], total: 0 };
  }

  const where = { userId: user.id };
  const total = await db.resume.count({ where });
  const resumes = await db.resume.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    skip: (page - 1) * limit,
    take: limit,
  });

  return { resumes, total };
}

export async function createResume(title, content) {
  const user = await checkUser();

  const newResume = await db.resume.create({
    data: {
      userId: user.id,
      title,
      content,
    },
  });

  return newResume;
}

export async function updateResume(id, title, content) {
  const user = await checkUser();

  const updatedResume = await db.resume.update({
    where: {
      id: id,
      userId: user.id,
    },
    data: {
      title,
      content,
    },
  });

  revalidatePath(`/resume`);
  revalidatePath(`/resume/${id}`);
  return updatedResume;
}

export async function deleteResume(id) {
  const user = await checkUser();

  try {
    await db.resume.delete({
      where: {
        id: id,
        userId: user.id,
      },
    });

    revalidatePath("/resume");
    return { success: true };
  } catch (error) {
    console.error("Lỗi xóa CV:", error);
    return { success: false, error: "Không thể xóa CV." };
  }
}

export async function deleteMultipleResumes(ids) {
  const user = await checkUser();

  try {
    await db.resume.deleteMany({
      where: {
        id: {
          in: ids,
        },
        userId: user.id,
      },
    });

    revalidatePath("/resume");
    return { success: true };
  } catch (error) {
    console.error("Lỗi xóa nhiều CV:", error);
    return { success: false, error: "Không thể xóa các CV đã chọn." };
  }
}

export async function getResumes() {
  const user = await checkUser();

  return await db.resume.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getResume(id) {
  const user = await checkUser();
  if (!id) return null;

  return await db.resume.findUnique({
    where: {
      id: id,
      userId: user.id,
    },
  });
}

export const improveWithAI = async ({ current, type }) => {
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

export const improveWithAIFeedback = async ({ current, type, feedback }) => {
  const user = await checkUser();

  const prompt = `
    As an expert resume writer, improve the following "${type}" description for a professional in the "${user.industry}" industry,
    taking into account the provided AI feedback.

    **AI Feedback to address:**
    "${feedback}"

    **Current content to improve:**
    "${current}"

    **Instructions:**
    - Rewrite the "Current content" to directly address the "AI Feedback".
    - Make it more impactful, quantifiable, and aligned with industry best practices.
    - Use action verbs and include metrics where possible.
    - Your response MUST be ONLY the improved paragraph, without any additional text, explanations, or introductory phrases.
  `;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const improvedContent = response.text().trim();

    return improvedContent;
  } catch (error) {
    console.error("Error improving content with feedback:", error);
    throw new Error("Failed to improve content with feedback.");
  }
};
