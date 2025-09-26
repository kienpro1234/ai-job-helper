"use server";

import { db } from "@/lib/prisma";
import { checkUser } from "@/lib/checkUser";
import { revalidatePath } from "next/cache";

// Sửa 1: Dùng thư viện @google/generative-ai trực tiếp cho nhất quán
import { GoogleGenerativeAI } from "@google/generative-ai";

// Sửa 2: Khởi tạo model giống như các file actions/cover-letter.js, actions/resume.js
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Hàm tiện ích delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Hàm tìm việc bằng JSearch API
async function searchJobsWithJSearch(query, page = 1) {
  const JSEARCH_API_KEY = process.env.NEXT_PUBLIC_JSEARCH_API_KEY;
  if (!JSEARCH_API_KEY) {
    console.warn("JSearch API key is missing. Skipping JSearch.");
    return null;
  }

  const url = new URL("https://jsearch.p.rapidapi.com/search");
  url.searchParams.set("query", query);
  url.searchParams.set("page", page.toString());
  url.searchParams.set("country", "VN");

  const options = {
    method: "GET",
    headers: {
      "X-RapidAPI-Key": JSEARCH_API_KEY,
      "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
    },
  };

  const response = await fetch(url.toString(), options);
  if (!response.ok) {
    console.error(
      `JSearch API Error: ${response.status} ${response.statusText}`
    );
    return null;
  }
  const result = await response.json();
  return result.data;
}

// Hàm tìm việc bằng AI (Fallback)
async function searchJobsWithAI(query, page = 1) {
  const prompt = `
      Act as an expert job search engine. Find up to 10 REAL and RECENT job postings from prominent Vietnamese job sites (TopCV, VietnamWorks, ITviec, LinkedIn) based on the query "${query}".
      For page ${page}, find the next set of 10 jobs.
      Return the results as a valid JSON array. Each object must have these exact properties: "id", "title", "companyName", "location", "description", "url", "source".
      - "id": Create a unique ID string from the job title and company.
      - "title": The full, realistic job title.
      - "companyName": The real hiring company's name.
      - "location": The job location (e.g., "Ho Chi Minh City, Vietnam").
      - "description": A concise, one-sentence summary of the real job.
      - "source": The domain name of the job site (e.g., "topcv.vn").
      - "url": Generate a Google search URL to find this specific job. The search query must be the job title, the word "tại", the company name, and the source site. For example: "https://www.google.com/search?q=NestJS+Developer+tại+Awesome+Company+topcv.vn".
      Your entire response MUST be ONLY the JSON array, with no other text, comments, or markdown formatting.
    `;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const cleanedJson = text.replace(/```json\n?|\n?```/g, "").trim();
  return JSON.parse(cleanedJson);
}

// --- HÀM SEARCHJOBS CHÍNH ĐÃ ĐƯỢC NÂNG CẤP ---
export async function searchJobs(query, page = 1) {
  // === Logic JSearch với Retry ===
  let jobsFromAPI = null;
  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      jobsFromAPI = await searchJobsWithJSearch(query, page);
      if (jobsFromAPI && jobsFromAPI.length > 0) {
        // Nếu thành công, thoát khỏi vòng lặp
        break;
      }
      console.log(
        `JSearch attempt ${attempt} returned empty data. Retrying...`
      );
      if (attempt < maxRetries) {
        await delay(attempt * 1000); // Delay 1s, 2s, 3s
      }
    } catch (error) {
      console.error(`JSearch attempt ${attempt} failed:`, error);
      if (attempt < maxRetries) {
        await delay(attempt * 1000);
      }
    }
  }

  // === Xử lý kết quả ===
  try {
    // Ưu tiên kết quả từ JSearch
    if (jobsFromAPI && jobsFromAPI.length > 0) {
      console.log("Successfully fetched data from JSearch.");
      const formattedJobs = jobsFromAPI.map((job) => ({
        id: job.job_id,
        title: job.job_title,
        companyName: job.employer_name || "N/A",
        location: job.job_city || job.job_country,
        description: job.job_description,
        url: job.job_apply_link,
        source: job.employer_website
          ? new URL(job.employer_website).hostname.replace("www.", "")
          : "N/A",
        sourceType: "JSearch", // Gắn nhãn
      }));
      return { success: true, data: formattedJobs };
    }

    // Fallback: Nếu JSearch thất bại, dùng AI
    console.log("JSearch failed after retries. Falling back to AI search.");
    const jobsFromAI = await searchJobsWithAI(query, page);
    const formattedJobs = jobsFromAI.map((job) => ({
      ...job,
      sourceType: "Google Search", // Gắn nhãn
    }));
    return { success: true, data: formattedJobs };
  } catch (error) {
    console.error("Critical error in searchJobs function:", error);
    return { error: "Failed to fetch job listings from all sources." };
  }
}

// Cập nhật hàm saveJob để lưu cả sourceType
export async function saveJob(jobData) {
  const user = await checkUser();
  if (!user) throw new Error("Unauthorized");

  try {
    // Dùng URL làm khóa chính để tránh trùng lặp
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
        sourceType: jobData.sourceType, // <<< THÊM DÒNG NÀY
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
