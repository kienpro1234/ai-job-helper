"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import MDEditor from "@uiw/react-md-editor";
import rehypeRaw from "rehype-raw";
import "../../resume/resume-styles.css";

export function ResumePreviewDialog({ resume, open, onOpenChange }) {
  if (!resume) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Xem trước: {resume.title}</DialogTitle>
          <DialogDescription>
            Đây là nội dung chi tiết của CV bạn đã chọn.
          </DialogDescription>
        </DialogHeader>
        <div
          data-color-mode="light"
          className="border rounded-lg mt-4 overflow-y-auto flex-grow"
        >
          <div className="resume-container p-4">
            <MDEditor.Markdown
              source={resume.content}
              style={{ padding: "10px", background: "white", color: "black" }}
              rehypePlugins={[rehypeRaw]}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
