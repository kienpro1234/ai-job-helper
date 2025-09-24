// Trong file: app/(main)/resume/[id]/page.jsx

// Giữ nguyên import này, nó đã đúng
import { getResume } from "@/actions/resume";

// SỬA LỖI Ở 2 DÒNG IMPORT DƯỚI ĐÂY:
// Dùng đường dẫn tương đối để đi từ thư mục [id] ra ngoài rồi vào _components
import { AnalysisHistory } from "../_components/analysis-history";
import { ResumeViewer } from "../_components/resume-viewer";

export default async function ResumeDetailPage({ params }) {
  const { id } = await params;
  const resume = await getResume(id);

  if (!resume) {
    return <div>Không tìm thấy CV hoặc bạn không có quyền truy cập.</div>;
  }

  return (
    <div className="container mx-auto py-6 space-y-8">
      {/* Component này hiển thị nội dung CV và khu vực phân tích */}
      <ResumeViewer resume={resume} />

      {/* Component này hiển thị lịch sử phân tích của CV này */}
      <AnalysisHistory resumeId={resume.id} />
    </div>
  );
}
