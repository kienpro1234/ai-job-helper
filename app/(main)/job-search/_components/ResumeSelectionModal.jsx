"use client";

import { useState, useEffect, useTransition } from "react";
import { getResumesWithPagination } from "@/actions/resume";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  FileText,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Eye,
} from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import ResumeAnalyzer from "../../resume/_components/resume-analyzer";
import MDEditor from "@uiw/react-md-editor";
import rehypeRaw from "rehype-raw";
import "../../resume/resume-styles.css";

export function ResumeSelectionModal({ job, open, onOpenChange }) {
  const [viewMode, setViewMode] = useState("list");
  const [resumes, setResumes] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [selectedResume, setSelectedResume] = useState(null);
  // const [showAnalyzer, setShowAnalyzer] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Fetch resumes only when the modal is open and in list view
    if (open && viewMode === "list") {
      startTransition(async () => {
        const { resumes, total } = await getResumesWithPagination({
          page,
          limit: 6,
        });
        setResumes(resumes);
        setTotalPages(Math.ceil(total / 6));
      });
    }
  }, [page, open, viewMode]);

  // const handleSelectResume = (resume) => {
  //   setSelectedResume(resume);
  //   setShowAnalyzer(true);
  // };

  // if (showAnalyzer && selectedResume) {
  //   return (
  //     <Dialog open={open} onOpenChange={onOpenChange}>
  //       <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
  //         <DialogHeader>
  //           <div className="flex items-center gap-4">
  //             <Button
  //               variant="outline"
  //               size="icon"
  //               onClick={() => setShowAnalyzer(false)}
  //               className="flex-shrink-0"
  //             >
  //               <ArrowLeft className="h-4 w-4" />
  //               <span className="sr-only">Back</span>
  //             </Button>
  //             <DialogTitle className="truncate">
  //               Đánh giá CV cho vị trí "{job.title}"
  //             </DialogTitle>
  //           </div>
  //         </DialogHeader>
  //         <div className="overflow-y-auto">
  //           <ResumeAnalyzer
  //             resumeId={selectedResume.id}
  //             initialJd={job.description}
  //           />
  //         </div>
  //       </DialogContent>
  //     </Dialog>
  //   );
  // }

  // HANDLERS
  const handlePreview = (resume) => {
    setSelectedResume(resume);
    setViewMode("preview");
  };

  const handleSelectForAnalysis = (resume) => {
    setSelectedResume(resume);
    setViewMode("analyzer");
  };

  const handleBackToList = () => {
    setSelectedResume(null);
    setViewMode("list");
  };

  const handleOpenChange = (isOpen) => {
    if (!isOpen) {
      // Reset all state on close
      setViewMode("list");
      setSelectedResume(null);
      setPage(1);
    }
    onOpenChange(isOpen);
  };

  // RENDER LOGIC
  const renderContent = () => {
    if (isPending && viewMode === "list") {
      return (
        <div className="flex justify-center items-center h-48">
          <Loader2 className="animate-spin h-8 w-8 text-primary" />
        </div>
      );
    }

    // Chế độ xem trước CV
    if (viewMode === "preview" && selectedResume) {
      return (
        <>
          <div
            data-color-mode="light"
            className="border rounded-lg mt-4 max-h-[60vh] overflow-y-auto"
          >
            <div className="resume-container">
              <MDEditor.Markdown
                source={selectedResume.content}
                style={{ padding: "10px", background: "white", color: "black" }}
                rehypePlugins={[rehypeRaw]}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={handleBackToList}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại danh sách
            </Button>
            <Button onClick={() => handleSelectForAnalysis(selectedResume)}>
              Phân tích CV này
            </Button>
          </div>
        </>
      );
    }

    // Chế độ phân tích CV
    if (viewMode === "analyzer" && selectedResume) {
      return (
        <div className="overflow-y-auto pr-4 -mr-2 max-h-[75vh]">
          <ResumeAnalyzer
            resumeId={selectedResume.id}
            initialJd={job.description}
            job={job}
          />
        </div>
      );
    }

    // Chế độ danh sách CV (mặc định)
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[75vh] overflow-y-auto p-1">
          {resumes.map((resume) => (
            <Card
              key={resume.id}
              className="hover:border-primary transition-colors flex flex-col justify-between"
            >
              <CardHeader>
                <div className="flex items-start gap-4">
                  <FileText className="h-6 w-6 mt-1 text-primary flex-shrink-0" />
                  <div>
                    <CardTitle className="leading-snug">
                      {resume.title}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Cập nhật:{" "}
                      {format(new Date(resume.updatedAt), "dd/MM/yyyy")}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardFooter className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePreview(resume)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Xem trước
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleSelectForAnalysis(resume)}
                >
                  Chọn
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        {totalPages > 1 && (
          <div className="flex justify-between items-center pt-2">
            <Button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || isPending}
              size="sm"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || isPending}
              size="sm"
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    );
  };

  const getTitle = () => {
    switch (viewMode) {
      case "preview":
        return `Xem trước CV: "${selectedResume?.title}"`;
      case "analyzer":
        return `Đánh giá CV cho vị trí "${job.title}"`;
      default:
        return `Chọn CV để đánh giá cho vị trí "${job.title}"`;
    }
  };

  return (
    // <Dialog open={open} onOpenChange={onOpenChange}>
    //   <DialogContent className="sm:max-w-3xl">
    //     <DialogHeader>
    //       <DialogTitle>
    //         Chọn CV để đánh giá cho vị trí "{job.title}"
    //       </DialogTitle>
    //     </DialogHeader>
    //     {isPending ? (
    //       <div className="flex justify-center items-center h-40">
    //         <Loader2 className="animate-spin" />
    //       </div>
    //     ) : (
    //       <div className="space-y-4">
    //         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    //           {resumes.map((resume) => (
    //             <Card
    //               key={resume.id}
    //               className="cursor-pointer hover:border-primary"
    //             >
    //               <CardHeader onClick={() => handleSelectResume(resume)}>
    //                 <div className="flex items-start gap-4">
    //                   <FileText className="h-6 w-6 mt-1 text-primary" />
    //                   <div>
    //                     <CardTitle>{resume.title}</CardTitle>
    //                     <CardDescription>
    //                       Cập nhật:{" "}
    //                       {format(new Date(resume.updatedAt), "dd/MM/yyyy")}
    //                     </CardDescription>
    //                   </div>
    //                 </div>
    //               </CardHeader>
    //             </Card>
    //           ))}
    //         </div>
    //         <div className="flex justify-between items-center">
    //           <Button
    //             onClick={() => setPage((p) => Math.max(1, p - 1))}
    //             disabled={page === 1}
    //           >
    //             <ChevronLeft /> Previous
    //           </Button>
    //           <span>
    //             Page {page} of {totalPages}
    //           </span>
    //           <Button
    //             onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
    //             disabled={page === totalPages}
    //           >
    //             Next <ChevronRight />
    //           </Button>
    //         </div>
    //         <div className="text-center">
    //           <Button
    //             variant="link"
    //             onClick={() => router.push(`/resume/${selectedResume.id}`)}
    //           >
    //             Xem chi tiết CV
    //           </Button>
    //         </div>
    //       </div>
    //     )}
    //   </DialogContent>
    // </Dialog>
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <div className="flex items-center gap-4">
            {/* Luôn hiển thị nút Back nếu không phải ở màn hình danh sách */}
            {viewMode !== "list" && (
              <Button
                variant="outline"
                size="icon"
                onClick={handleBackToList}
                className="flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back to list</span>
              </Button>
            )}
            <DialogTitle className="truncate">{getTitle()}</DialogTitle>
          </div>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
