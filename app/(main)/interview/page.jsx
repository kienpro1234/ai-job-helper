import { Suspense } from "react";
import QuizList from "./_components/quiz-list";
import StatsCards from "./_components/stats-cards";

import VoiceInterviewStarter from "./_components/voice-interview-starter";
import { getResumesForInterview } from "@/actions/interview";

export default async function InterviewPage() {
  // Lấy danh sách CV từ server
  const resumes = await getResumesForInterview();

  return (
    <div className="p-4 md:p-6 lg:p-10">
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-6">
        Interview Preparation
      </h1>
      <div className="grid gap-8">
        <Suspense fallback={<div>Loading Interview Practice...</div>}>
          <VoiceInterviewStarter resumes={resumes} />
        </Suspense>

        <div className="grid md:grid-cols-2 gap-8">
          <Suspense fallback={<div>Loading Stats...</div>}>
            <StatsCards />
          </Suspense>
          <Suspense fallback={<div>Loading Quizzes...</div>}>
            <QuizList />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
