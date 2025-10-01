"use client";

import { useState } from "react";
import MDEditor from "@uiw/react-md-editor";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Edit, Trash2 } from "lucide-react";
import html2pdf from "html2pdf.js/dist/html2pdf.min.js";
import ResumeAnalyzer from "@/app/(main)/resume/_components/resume-analyzer";
import rehypeRaw from "rehype-raw";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteResume } from "@/actions/resume";
import "../resume-styles.css";

export const ResumeViewer = ({ resume }) => {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    setIsGenerating(true);
    const element = document.getElementById(`resume-pdf-${resume.id}`);
    const opt = {
      margin: [10, 5],
      filename: `${resume.title.replace(/ /g, "_")}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 4, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };
    await html2pdf().set(opt).from(element).save();
    setIsGenerating(false);
  };

  const handleDelete = async () => {
    toast.promise(deleteResume(resume.id), {
      loading: "Đang xóa CV...",
      success: () => {
        router.push("/resume");
        router.refresh(); // Đảm bảo trang danh sách được cập nhật
        return "Đã xóa CV thành công!";
      },
      error: "Không thể xóa CV.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="font-bold gradient-title text-4xl md:text-5xl">
          {resume.title}
        </h1>
        <div className="flex gap-2">
          <Button onClick={generatePDF} disabled={isGenerating}>
            Download PDF
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/resume/edit/${resume.id}`)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Chỉnh sửa
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Xóa
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Bạn có chắc chắn?</AlertDialogTitle>
                <AlertDialogDescription>
                  Hành động này sẽ xóa vĩnh viễn CV "{resume.title}". Bạn không
                  thể hoàn tác hành động này.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Hủy</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Xác nhận xóa
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Phần hiển thị nội dung CV */}

      <div data-color-mode="light" id={`resume-pdf`}>
        <div className="resume-container">
          <MDEditor.Markdown
            source={resume.content}
            style={{ padding: "10px", background: "white", color: "black" }}
            rehypePlugins={[rehypeRaw]}
          />
        </div>
      </div>
      {/* Phần ẩn để tạo PDF */}
      <div className="pdf-render-offscreen">
        <div id={`resume-pdf-${resume.id}`} className="resume-container">
          <MDEditor.Markdown
            source={resume.content}
            style={{ background: "white", color: "black" }}
            rehypePlugins={[rehypeRaw]}
          />
        </div>
      </div>

      <ResumeAnalyzer resumeId={resume.id} />
    </div>
  );
};
