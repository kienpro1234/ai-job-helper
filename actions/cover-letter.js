"use server";

import { db } from "@/lib/prisma";
import { checkUser } from "@/lib/checkUser";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { revalidatePath } from "next/cache";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export async function generateCoverLetter(data) {
  const user = await checkUser();

  if (!user) throw new Error("User not found");

  const yourName = data.yourName || user.name;
  const yourAddress = data.yourAddress || user.address;
  const yourPhone = data.yourPhone || user.phone;
  const yourEmail = data.yourEmail || user.email;

  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const prompt = `
    Write a professional cover letter for a ${data.jobTitle} position at ${
    data.companyName
  }.
    The response MUST be in Markdown format.

    **Candidate's Information (Use these exactly):**
    - Name: ${yourName}
    - Address: ${yourAddress}
    - Phone: ${yourPhone}
    - Email: ${yourEmail}
    - Today's Date: ${today}

    **Candidate's Professional Background:**
    - Industry: ${user.industry}
    - Years of Experience: ${user.experience}
    - Skills: ${user.skills?.join(", ")}
    - Bio: ${user.bio}
    
    **Job Description:**
    ---
    ${data.jobDescription}
    ---
    
    **Instructions:**
    1.  Start with the candidate's full contact information block (Name, Address, Phone, Email), followed by the date.
    2.  Include a placeholder for the Hiring Manager's details.
    3.  The body of the letter should be professional, enthusiastic, and concise (max 400 words).
    4.  Directly reference keywords and requirements from the provided job description.
    5.  Highlight the candidate's relevant skills and background.
    6.  End with a professional closing.
    7.  The entire output must be a single block of Markdown text. Do not use JSON or add extra notes.
  `;

  try {
    const result = await model.generateContent(prompt);
    const content = result.response.text().trim();

    const coverLetter = await db.coverLetter.create({
      data: {
        content,
        jobDescription: data.jobDescription,
        companyName: data.companyName,
        jobTitle: data.jobTitle,
        status: "completed",
        userId: user.id,
        jobUrl: data.url,
        jobSource: data.source,
        sourceType: data.sourceType,
      },
    });

    // Thêm revalidatePath để cập nhật danh sách ngay lập tức
    revalidatePath("/ai-cover-letter");
    return coverLetter;
  } catch (error) {
    console.error("Error generating cover letter:", error.message);
    throw new Error("Failed to generate cover letter");
  }
}

export async function getCoverLetters() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  return await db.coverLetter.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getCoverLetter(id) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  return await db.coverLetter.findUnique({
    where: {
      id,
      userId: user.id,
    },
  });
}

export async function deleteCoverLetter(id) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  try {
    await db.coverLetter.delete({
      where: {
        id,
        userId: user.id,
      },
    });
    revalidatePath("/ai-cover-letter");
    return { success: true }; // Trả về object để client dễ xử lý
  } catch (error) {
    console.error("Lỗi xóa cover letter:", error);
    return { success: false, error: "Không thể xóa cover letter." };
  }
}

// HÀM MỚI ĐỂ XÓA HÀNG LOẠT
export async function deleteMultipleCoverLetters(ids) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  try {
    await db.coverLetter.deleteMany({
      where: {
        id: {
          in: ids,
        },
        userId: user.id,
      },
    });

    revalidatePath("/ai-cover-letter");
    return { success: true };
  } catch (error) {
    console.error("Lỗi xóa nhiều cover letter:", error);
    return { success: false, error: "Không thể xóa các cover letter đã chọn." };
  }
}
