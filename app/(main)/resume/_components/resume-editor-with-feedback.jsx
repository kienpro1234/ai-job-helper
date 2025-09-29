// app/(main)/resume/_components/resume-editor-with-feedback.jsx
"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Loader2, Save, MessageSquareQuote, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createResume, improveWithAIFeedback } from "@/actions/resume";
import { EntryForm } from "./entry-form";
import useFetch from "@/hooks/use-fetch";
import { entrySchema } from "@/app/lib/schema";

// Schema for this editor form
const editorSchema = z.object({
  title: z.string().min(1, "Tên CV mới không được để trống."),
  summary: z.string().min(1, "Professional summary is required"),
  skills: z.string().min(1, "Skills are required"),
  experience: z.array(entrySchema),
  education: z.array(entrySchema),
  projects: z.array(entrySchema),
});

// Helper functions for parsing
// function parseEntries(sectionContent) {
//   if (!sectionContent) return [];
//   const entryParts = sectionContent.split(/\n?(?=###\s)/).filter(Boolean);
//   return entryParts
//     .map((part) => {
//       const lines = part.trim().split("\n");
//       const entry = {
//         title: "",
//         organization: "",
//         startDate: "",
//         endDate: "",
//         description: "",
//         current: false,
//       };
//       const headerMatch = lines[0]?.match(/###\s*\*\*(.+?)\*\* at \*(.+?)\*/);
//       if (headerMatch) {
//         entry.title = headerMatch[1]?.trim();
//         entry.organization = headerMatch[2]?.trim();
//       }
//       const dateMatch = lines[1]?.match(/\*(.+?)\*/);
//       if (dateMatch) {
//         const [startDate, endDate] = dateMatch[1]
//           .split(" - ")
//           .map((d) => d.trim());
//         entry.startDate = startDate;
//         if (endDate && endDate.toLowerCase() === "present") {
//           entry.endDate = "";
//           entry.current = true;
//         } else {
//           entry.endDate = endDate || "";
//           entry.current = false;
//         }
//       }
//       entry.description = lines.slice(2).join("\n").trim();
//       return entry;
//     })
//     .filter((e) => e.title);
// }

function parseEntries(sectionContent) {
  if (!sectionContent) return [];
  const entryParts = sectionContent.split(/\n?(?=###\s)/).filter(Boolean);

  return entryParts
    .map((part) => {
      const lines = part.trim().split("\n");
      const entry = {
        title: "",
        organization: "",
        startDate: "",
        endDate: "",
        description: "",
        current: false,
      };

      const headerMatch = lines[0]?.match(/###\s*\*\*(.+?)\*\* at \*(.+?)\*/);
      if (headerMatch) {
        entry.title = headerMatch[1]?.trim();
        entry.organization = headerMatch[2]?.trim();
      }

      const dateMatch = lines[1]?.match(/\*(.+?)\*/);
      if (dateMatch) {
        const [startDate, endDate] = dateMatch[1]
          .split(" - ")
          .map((d) => d.trim());
        entry.startDate = startDate;
        if (endDate && endDate.toLowerCase() === "present") {
          entry.endDate = "";
          entry.current = true;
        } else {
          entry.endDate = endDate || "";
          entry.current = false;
        }
      }

      entry.description = lines.slice(2).join("\n").trim();
      return entry;
    })
    .filter((e) => e.title);
}

function parseCvMarkdown(markdown) {
  if (!markdown || typeof markdown !== "string") return {};

  const result = {};
  const sections = markdown.split(/\n<hr>\n/i);
  let contactAndNameSection = sections.shift()?.trim() || "";

  // Kiểm tra xem trong contact có chứa luôn cả "## 📝 Professional Summary"
  const summaryMatch = contactAndNameSection.match(
    /(##\s*[^\n]+Professional Summary[\s\S]*)/i
  );
  if (summaryMatch) {
    // Cắt phần summary ra khỏi contact
    const summaryBlock = summaryMatch[1];
    contactAndNameSection = contactAndNameSection
      .replace(summaryBlock, "")
      .trim();

    // Xử lý lại phần summaryBlock giống như một section riêng
    const lines = summaryBlock.split("\n");
    const headerLine = lines.shift();
    const content = lines.join("\n").trim();
    result.summary = content;
  }

  result.contactAndNameSection = contactAndNameSection;

  const titleToKeyMap = {
    "professional summary": "summary",
    skills: "skills",
    "work experience": "experience",
    education: "education",
    projects: "projects",
  };

  sections.forEach((sectionText) => {
    const trimmedText = sectionText.trim();
    if (!trimmedText) return;
    const lines = trimmedText.split("\n");
    const headerLine = lines.shift() || "";

    const headerMatch = headerLine.match(
      /^##\s*(?:[\p{Emoji}\p{Symbol}\p{Punctuation}]+)?\s*(.*)$/u
    );
    if (!headerMatch) return;

    const title = headerMatch[1].trim().toLowerCase();
    const key = titleToKeyMap[title];
    if (!key) return;

    const content = lines.join("\n").trim();
    if (["experience", "education", "projects"].includes(key)) {
      result[key] = parseEntries(content);
    } else {
      result[key] = content;
    }
  });

  return result;
}

const FeedbackBox = ({ feedback }) => {
  if (!feedback) return null;
  return (
    <div className="mt-2 p-3 bg-muted/50 rounded-lg border-l-4 border-primary/50 text-sm text-muted-foreground">
      <p className="font-semibold text-primary flex items-center gap-2 mb-1">
        <MessageSquareQuote className="h-4 w-4" /> AI Gợi ý
      </p>
      {feedback}
    </div>
  );
};

export function ResumeEditorWithFeedback({
  analysis,
  initialContent,
  onSaveNew,
}) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [originalContactInfo, setOriginalContactInfo] = useState("");
  const [improvingSection, setImprovingSection] = useState(null);

  const {
    loading: isImproving,
    fn: improveWithAIFn,
    data: improvedContent,
  } = useFetch(improveWithAIFeedback);

  const {
    control,
    handleSubmit,
    reset,
    getValues,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(editorSchema),
    defaultValues: {
      title: "",
      summary: "",
      skills: "",
      experience: [],
      education: [],
      projects: [],
    },
  });

  useEffect(() => {
    if (initialContent) {
      const sections = parseCvMarkdown(initialContent);
      console.log("Sections:", sections);

      setOriginalContactInfo(sections.contactAndNameSection || "");
      reset({
        title: `CV cải thiện cho vị trí ${analysis?.jobTitle || "mới"}`,
        summary: sections.summary || "",
        skills: sections.skills || "",
        experience: sections.experience || [],
        education: sections.education || [],
        projects: sections.projects || [],
      });
    }
  }, [initialContent, analysis, reset]);

  // SỬA LỖI 2: Dùng useEffect để xử lý kết quả
  useEffect(() => {
    if (!isImproving && improvedContent && improvingSection) {
      if (
        typeof improvedContent === "string" &&
        improvedContent.trim() !== ""
      ) {
        setValue(improvingSection, improvedContent, { shouldValidate: true });
        toast.success(`Mục ${improvingSection} đã được cải thiện!`);
      } else {
        toast.error(
          "AI không thể cải thiện văn bản. Vui lòng thử lại với nội dung chi tiết hơn."
        );
      }
      setImprovingSection(null);
    }
  }, [improvedContent, isImproving, improvingSection, setValue]);

  // SỬA LỖI 3: Cập nhật lại hàm xử lý click
  const handleImproveSection = async (section) => {
    const currentValue = getValues(section);
    const feedback = analysis?.inlineFeedback?.[section];

    if (!currentValue) {
      toast.error(`Vui lòng nhập nội dung cho mục ${section} trước.`);
      return;
    }
    if (!feedback) {
      toast.info(`Không có gợi ý AI nào cho mục này.`);
      return;
    }
    setImprovingSection(section);
    await improveWithAIFn({
      current: currentValue,
      type: section,
      feedback: feedback,
    });
  };

  const getCombinedContent = () => {
    const values = getValues();
    const createSection = (title, icon, content) =>
      content && content.trim() ? `## ${icon} ${title}\n\n${content}` : "";

    const formatEntries = (entries, type, icon) => {
      if (!entries || entries.length === 0) return "";
      const title = `## ${icon} ${type}`;
      const content = entries
        .map((entry) => {
          const dateRange = entry.current
            ? `*${entry.startDate} - Present*`
            : `*${entry.startDate} - ${entry.endDate}*`;
          return `### **${entry.title}** at *${entry.organization}*\n${dateRange}\n\n${entry.description}`;
        })
        .join("\n\n");
      return `${title}\n\n${content}`;
    };

    const sections = [
      createSection("Professional Summary", "📝", values.summary),
      createSection("Skills", "🔧", values.skills),
      formatEntries(values.experience, "Work Experience", "💼"),
      formatEntries(values.education, "Education", "🎓"),
      formatEntries(values.projects, "Projects", "🚀"),
    ].filter(Boolean);

    return [originalContactInfo, ...sections].join("\n\n<hr>\n\n");
  };
  const onSubmit = async (data) => {
    setIsSaving(true);
    const newContent = getCombinedContent();
    try {
      const newResume = await createResume(data.title, newContent);
      toast.success(`Đã tạo CV mới: "${newResume.title}"`, {
        action: {
          label: "Xem ngay",
          onClick: () => {
            router.push(`/resume/${newResume.id}`);
            router.refresh();
          },
        },
      });
      onSaveNew();
    } catch (error) {
      toast.error(error.message || "Không thể tạo CV mới.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-1">
      <div className="space-y-2">
        <Label htmlFor="title" className="text-lg font-semibold">
          Tên CV Mới
        </Label>
        <Controller
          name="title"
          control={control}
          render={({ field }) => <Input {...field} id="title" />}
        />
        {errors.title && (
          <p className="text-sm text-red-500">{errors.title.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Professional Summary</h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleImproveSection("summary")}
            disabled={isImproving}
          >
            {isImproving && improvingSection === "summary" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Improve with AI
          </Button>
        </div>
        <Controller
          name="summary"
          control={control}
          render={({ field }) => <Textarea {...field} className="h-32" />}
        />
        {errors.summary && (
          <p className="text-sm text-red-500">{errors.summary.message}</p>
        )}
        <FeedbackBox feedback={analysis?.inlineFeedback?.summary} />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Skills</h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleImproveSection("skills")}
            disabled={isImproving}
          >
            {isImproving && improvingSection === "skills" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Improve with AI
          </Button>
        </div>
        <Controller
          name="skills"
          control={control}
          render={({ field }) => <Textarea {...field} className="h-32" />}
        />
        {errors.skills && (
          <p className="text-sm text-red-500">{errors.skills.message}</p>
        )}
        <FeedbackBox feedback={analysis?.inlineFeedback?.skills} />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Work Experience</h3>
        <Controller
          name="experience"
          control={control}
          render={({ field }) => (
            <EntryForm
              type="Experience"
              entries={field.value}
              onChange={field.onChange}
            />
          )}
        />
        <FeedbackBox feedback={analysis?.inlineFeedback?.experience} />
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-medium">Education</h3>
        <Controller
          name="education"
          control={control}
          render={({ field }) => (
            <EntryForm
              type="Education"
              entries={field.value}
              onChange={field.onChange}
            />
          )}
        />
        <FeedbackBox feedback={analysis?.inlineFeedback?.education} />
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-medium">Projects</h3>
        <Controller
          name="projects"
          control={control}
          render={({ field }) => (
            <EntryForm
              type="Project"
              entries={field.value}
              onChange={field.onChange}
            />
          )}
        />
        <FeedbackBox feedback={analysis?.inlineFeedback?.projects} />
      </div>
      <div className="flex justify-end pt-4 border-t">
        <Button type="submit" disabled={isSaving} size="lg">
          {isSaving ? (
            <Loader2 className="animate-spin mr-2" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Lưu thành CV mới
        </Button>
      </div>
    </form>
  );
}
