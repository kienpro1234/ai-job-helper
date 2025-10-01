import { getResume } from "@/actions/resume";
import { AnalysisHistory } from "../_components/analysis-history";
import { ResumeViewer } from "../_components/resume-viewer";
import { getAnalysisHistory } from "@/actions/analysis";

export default async function ResumeDetailPage({ params }) {
  const { id } = await params;
  const [resume, historyResult] = await Promise.all([
    getResume(id),
    getAnalysisHistory(id),
  ]);

  if (!resume) {
    return <div>Không tìm thấy CV hoặc bạn không có quyền truy cập.</div>;
  }

  // Lấy dữ liệu lịch sử từ kết quả
  const initialHistory = historyResult.success ? historyResult.data : [];

  return (
    <div className="container mx-auto py-6 space-y-8">
      {/* Component này hiển thị nội dung CV và khu vực phân tích */}
      <ResumeViewer resume={resume} />

      {/* Component này hiển thị lịch sử phân tích của CV này */}
      <AnalysisHistory resumeId={resume.id} initialHistory={initialHistory} />
    </div>
  );
}
