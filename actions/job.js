"use server";

import { db } from "@/lib/prisma";
import { checkUser } from "@/lib/checkUser";
import { revalidatePath } from "next/cache";

// Sửa 1: Dùng thư viện @google/generative-ai trực tiếp cho nhất quán
import { GoogleGenerativeAI } from "@google/generative-ai";

// Sửa 2: Khởi tạo model giống như các file actions/cover-letter.js, actions/resume.js
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// export async function searchJobs(query, page = 1) {
//   try {
//     const prompt = `
//       Act as an expert job search aggregator. Find 10 recent job postings in Vietnam related to the query "${query}".
//       For page ${page}, find the next set of 10 jobs.

//       Return the results as a valid JSON array. Each object in the array must have these exact properties: "id", "title", "companyName", "location", "description", "url", "source".
//       - "id": Create a unique ID string from the job title and company.
//       - "title": The full job title.
//       - "companyName": The hiring company's name.
//       - "location": The job location (e.g., "Ho Chi Minh City, Vietnam"). Default to "Vietnam" if not specified.
//       - "description": A concise, one-sentence summary of the job.
//       - "url": A plausible, representative URL for the job posting on a major Vietnamese job site like TopCV, VietnamWorks, ITviec, or LinkedIn.
//       - "source": The domain name of the job site (e.g., "topcv.vn").

//       Prioritize real companies and realistic job titles.
//       Your entire response MUST be ONLY the JSON array, with no other text, comments, or markdown formatting like \`\`\`json.
//     `;

//     // Sửa 3: Dùng phương thức `generateContent` quen thuộc và đáng tin cậy
//     const result = await model.generateContent(prompt);
//     const text = result.response.text();

//     let formattedJobs = [];
//     try {
//       const cleanedJson = text.replace(/```json\n?|\n?```/g, "").trim();
//       if (cleanedJson) {
//         formattedJobs = JSON.parse(cleanedJson);
//       }
//     } catch (jsonError) {
//       console.error("AI returned non-JSON text that failed to parse:", text);
//       return { success: true, data: [] };
//     }

//     return { success: true, data: formattedJobs };
//   } catch (error) {
//     console.error("Detailed error in AI-based searchJobs function:", error);
//     return { error: "AI failed to generate job listings. Please try again." };
//   }
// }

// --- Các hàm còn lại giữ nguyên ---

export async function searchJobs(query, page = 1) {
  try {
    // *** ĐÂY LÀ PROMPT ĐÃ ĐƯỢC NÂNG CẤP ***
    const prompt = `
      Act as an expert job search aggregator. Find up to 10 REAL and RECENT job postings from prominent Vietnamese job sites (TopCV, VietnamWorks, ITviec, LinkedIn) based on the query "${query}".
      For page ${page}, find the next set of 10 jobs.

      Return the results as a valid JSON array. Each object in the array must have these exact properties: "id", "title", "companyName", "location", "description", "url", "source".
      - "id": Create a unique ID string from the job title and company.
      - "title": The full, realistic job title.
      - "companyName": The real hiring company's name.
      - "location": The job location (e.g., "Ho Chi Minh City, Vietnam").
      - "description": A concise, one-sentence summary of the real job.
      - "source": The domain name of the job site (e.g., "topcv.vn").
      - "url": **CRITICAL CHANGE**: Generate a Google search URL to find this specific job. The search query must be the job title, the word "tại", the company name, and the source site. For example: "https://www.google.com/search?q=NestJS+Developer+tại+Awesome+Company+topcv.vn".

      Your entire response MUST be ONLY the JSON array, with no other text, comments, or markdown formatting like \`\`\`json.
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    let formattedJobs = [];
    try {
      const cleanedJson = text.replace(/```json\n?|\n?```/g, "").trim();
      if (cleanedJson) {
        formattedJobs = JSON.parse(cleanedJson);
      }
    } catch (jsonError) {
      console.error("AI returned non-JSON text that failed to parse:", text);
      return { success: true, data: [] };
    }

    return { success: true, data: formattedJobs };
  } catch (error) {
    console.error("Detailed error in AI-based searchJobs function:", error);
    return { error: "AI failed to generate job listings. Please try again." };
  }
}

export async function saveJob(jobData) {
  const user = await checkUser();
  if (!user) throw new Error("Unauthorized");

  try {
    const existingJob = await db.savedJob.findFirst({
      where: {
        userId: user.id,
        url: jobData.url,
      },
    });

    if (existingJob) {
      return {
        success: true,
        message: "Job already saved.",
        data: existingJob,
      };
    }

    const savedJob = await db.savedJob.create({
      data: {
        userId: user.id,
        title: jobData.title,
        companyName: jobData.companyName,
        location: jobData.location,
        description: jobData.description,
        url: jobData.url,
        source: jobData.source,
      },
    });
    revalidatePath("/job-search");
    return { success: true, data: savedJob };
  } catch (error) {
    console.error("Error saving job:", error);
    return { error: "Failed to save job." };
  }
}

export async function getSavedJobs() {
  const user = await checkUser();
  if (!user) return { data: [] };

  const savedJobs = await db.savedJob.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return { success: true, data: savedJobs };
}

export async function deleteSavedJob(id) {
  const user = await checkUser();
  if (!user) throw new Error("Unauthorized");

  await db.savedJob.delete({
    where: {
      id: id,
      userId: user.id,
    },
  });

  revalidatePath("/job-search");
  return { success: true };
}
