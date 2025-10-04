"use client";

import { useEffect, useState } from "react";
import { getResume } from "@/actions/resume";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, MessageSquareQuote, Edit } from "lucide-react";
import MDEditor from "@uiw/react-md-editor";
import rehypeRaw from "rehype-raw";
import { ResumeEditorWithFeedback } from "./resume-editor-with-feedback";
import "../resume-styles.css";

const FeedbackSection = ({ title, content }) => (
  <div className="p-4 my-4 bg-muted/50 rounded-lg border border-dashed border-primary/50 text-sm">
    <p className="font-semibold text-primary flex items-center gap-2 capitalize">
      <MessageSquareQuote className="h-4 w-4" />
      AI Feedback on {title}
    </p>
    <p className="text-muted-foreground mt-2">{content}</p>
  </div>
);

export function InlineFeedbackDialog({ analysis, open, onOpenChange }) {
  const [resumeContent, setResumeContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    // Chỉ fetch dữ liệu khi dialog mở và chưa có nội dung
    if (open && analysis?.resumeId) {
      setIsLoading(true);
      getResume(analysis.resumeId)
        .then((resume) => {
          if (resume) {
            setResumeContent(resume.content);
          } else {
            toast.error("Could not load resume content.");
            onOpenChange(false);
          }
        })
        .finally(() => setIsLoading(false));
    }

    // Reset về chế độ xem khi dialog đóng
    if (!open) {
      setIsEditMode(false);
    }
  }, [open, analysis, onOpenChange]);

  const feedback = analysis?.inlineFeedback;
  const resumeSections = resumeContent ? resumeContent.split(/\n(?=##\s)/) : [];

  const findFeedbackForSection = (sectionContent) => {
    if (!feedback) return null;
    const content = sectionContent.toLowerCase();
    if (content.includes("summary")) return feedback.summary;
    if (content.includes("skills")) return feedback.skills;
    if (content.includes("experience")) return feedback.experience;
    if (content.includes("education")) return feedback.education;
    if (content.includes("projects")) return feedback.projects;
    return null;
  };

  const getSectionTitle = (sectionContent) => {
    const content = sectionContent.toLowerCase();
    if (content.includes("summary")) return "Summary";
    if (content.includes("skills")) return "Skills";
    if (content.includes("experience")) return "Experience";
    if (content.includes("education")) return "Education";
    if (content.includes("projects")) return "Projects";
    return "Section";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Chỉnh sửa & Cải thiện CV" : "AI Inline Feedback"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? `Chỉnh sửa CV dựa trên gợi ý cho vị trí "${
                  analysis?.jobTitle || "N/A"
                }".`
              : `Nhận xét của AI cho CV của bạn với vị trí "${
                  analysis?.jobTitle || "N/A"
                }".`}
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto flex-grow pr-6 -mr-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-full min-h-[400px]">
              <Loader2 className="animate-spin h-8 w-8 text-primary" />
              <p className="ml-4">Đang tải nội dung CV...</p>
            </div>
          ) : isEditMode ? (
            <ResumeEditorWithFeedback
              analysis={analysis}
              initialContent={resumeContent} // Truyền nội dung CV đã fetch
              onSaveNew={() => onOpenChange(false)}
            />
          ) : (
            <>
              <div data-color-mode="light">
                <div className="resume-container">
                  {resumeSections.map((section, index) => {
                    const sectionFeedback = findFeedbackForSection(section);
                    const sectionTitle = getSectionTitle(section);
                    return (
                      <div key={index}>
                        <MDEditor.Markdown
                          source={section}
                          style={{ background: "white", color: "black" }}
                          rehypePlugins={[rehypeRaw]}
                        />
                        {sectionFeedback && (
                          <FeedbackSection
                            title={sectionTitle}
                            content={sectionFeedback}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              <DialogFooter className="pt-4 mt-4 border-t">
                <Button onClick={() => setIsEditMode(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Chỉnh sửa & Cải thiện
                </Button>
              </DialogFooter>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
