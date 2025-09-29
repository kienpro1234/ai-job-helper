// app/(main)/resume/edit/[id]/page.jsx
import { getResume } from "@/actions/resume";
import ResumeBuilder from "@/app/(main)/resume/_components/resume-builder";
import { parseCvMarkdown } from "@/app/lib/parse-cv";

export default async function EditResumePage({ params }) {
  const { id } = params;
  const resume = await getResume(id);

  if (!resume) {
    return <div>Không tìm thấy CV hoặc bạn không có quyền truy cập.</div>;
  }

  // Phân tích nội dung markdown để lấy dữ liệu cho các section
  const initialData = parseCvMarkdown(resume.content);

  // THÊM VÀO: Gán title của CV vào initialData
  // Vì title được lưu riêng, không nằm trong content markdown
  initialData.title = resume.title;

  return (
    <div className="container mx-auto py-6">
      <ResumeBuilder
        initialContent={resume.content}
        initialData={initialData}
        resumeId={resume.id}
      />
    </div>
  );
}
