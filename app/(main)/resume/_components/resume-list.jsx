// File: ai-job-help/app/(main)/resume/_components/resume-list.jsx

"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import { FileText, Trash2, Loader2, X, CheckCheck } from "lucide-react";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { deleteResume, deleteMultipleResumes } from "@/actions/resume";

export function ResumeList({ initialResumes }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [resumes, setResumes] = useState(initialResumes);
  const [isBulkDeleteMode, setIsBulkDeleteMode] = useState(false);
  const [selectedResumes, setSelectedResumes] = useState(new Set());

  const handleSingleDelete = (id) => {
    startTransition(async () => {
      const result = await deleteResume(id);
      if (result.success) {
        toast.success("Đã xóa CV thành công!");
        setResumes((prev) => prev.filter((r) => r.id !== id));
      } else {
        toast.error(result.error || "Không thể xóa CV.");
      }
    });
  };

  const handleBulkDelete = () => {
    if (selectedResumes.size === 0) {
      toast.info("Vui lòng chọn ít nhất một CV để xóa.");
      return;
    }
    startTransition(async () => {
      const idsToDelete = Array.from(selectedResumes);
      const result = await deleteMultipleResumes(idsToDelete);
      if (result.success) {
        toast.success(`Đã xóa ${idsToDelete.length} CV thành công!`);
        setResumes((prev) => prev.filter((r) => !idsToDelete.includes(r.id)));
        setIsBulkDeleteMode(false);
        setSelectedResumes(new Set());
      } else {
        toast.error(result.error || "Không thể xóa các CV đã chọn.");
      }
    });
  };

  const toggleBulkDeleteMode = () => {
    setIsBulkDeleteMode(!isBulkDeleteMode);
    setSelectedResumes(new Set());
  };

  const handleToggleSelection = (id) => {
    const newSelection = new Set(selectedResumes);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedResumes(newSelection);
  };

  if (resumes.length === 0 && initialResumes.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">Bạn chưa tạo CV nào.</p>
        <p>Hãy chuyển qua tab "Tạo CV Mới" để bắt đầu.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        {resumes.length > 0 &&
          (isBulkDeleteMode ? (
            <>
              <Button
                variant="ghost"
                onClick={toggleBulkDeleteMode}
                disabled={isPending}
              >
                <X className="mr-2 h-4 w-4" /> Hủy
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    disabled={isPending || selectedResumes.size === 0}
                  >
                    {isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="mr-2 h-4 w-4" />
                    )}
                    Xóa ({selectedResumes.size}) mục
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Bạn có chắc chắn?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Hành động này sẽ xóa vĩnh viễn {selectedResumes.size} CV
                      đã chọn và không thể hoàn tác.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                    <AlertDialogAction onClick={handleBulkDelete}>
                      Xác nhận xóa
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : (
            <Button variant="outline" onClick={toggleBulkDeleteMode}>
              <CheckCheck className="mr-2 h-4 w-4" /> Xóa nhiều resume
            </Button>
          ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {resumes.map((resume) => {
          const isSelected = selectedResumes.has(resume.id);

          // Nội dung bên trong card, dùng chung cho cả 2 chế độ
          const CardInnerContent = (
            <CardHeader className="flex-grow">
              <div className="flex items-start gap-4">
                {isBulkDeleteMode && (
                  <Checkbox checked={isSelected} className="mt-1" />
                )}
                <FileText className="h-6 w-6 mt-1 text-primary flex-shrink-0" />
                <div>
                  <CardTitle>{resume.title}</CardTitle>
                  <CardDescription>
                    Cập nhật: {format(new Date(resume.updatedAt), "dd/MM/yyyy")}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          );

          return (
            <div key={resume.id} className="relative group h-full">
              <Card
                className={`transition-colors h-full flex flex-col ${
                  isBulkDeleteMode ? "cursor-pointer" : "" // Bỏ hover effect khi không ở chế độ bulk
                } ${isSelected ? "border-primary border-2" : ""}`}
                // Chỉ thêm onClick để chọn khi ở chế độ bulk delete
                onClick={
                  isBulkDeleteMode
                    ? () => handleToggleSelection(resume.id)
                    : undefined
                }
              >
                {/* === SỬA LỖI QUAN TRỌNG TẠI ĐÂY === */}
                {isBulkDeleteMode ? (
                  // Ở chế độ xóa: render nội dung trực tiếp, không có Link
                  <div className="flex flex-col flex-grow">
                    {CardInnerContent}
                  </div>
                ) : (
                  // Chế độ thường: render nội dung bên trong Link
                  <Link
                    href={`/resume/${resume.id}`}
                    className="flex flex-col flex-grow hover:bg-accent/50 rounded-lg"
                  >
                    {CardInnerContent}
                  </Link>
                )}
              </Card>

              {/* Nút xóa đơn lẻ vẫn nằm ngoài và được định vị tuyệt đối */}
              {!isBulkDeleteMode && (
                <div className="absolute top-2 right-2 z-10">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
                        disabled={isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Xóa CV này?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Bạn có chắc chắn muốn xóa vĩnh viễn CV "{resume.title}
                          "? Hành động này không thể hoàn tác.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleSingleDelete(resume.id)}
                        >
                          Xác nhận
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
