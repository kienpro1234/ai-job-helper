"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Download,
  Edit,
  Loader2,
  Monitor,
  Save,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";
import MDEditor from "@uiw/react-md-editor";
import rehypeRaw from "rehype-raw";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { createResume, improveWithAI, updateResume } from "@/actions/resume"; // Import improveWithAI
import { EntryForm } from "./entry-form";
import useFetch from "@/hooks/use-fetch";
import { useUser } from "@clerk/nextjs";
import { resumeSchema } from "@/app/lib/schema";
import html2pdf from "html2pdf.js/dist/html2pdf.min.js";
import { Label } from "@/components/ui/label";
import "../resume-styles.css";

export default function ResumeBuilder({
  initialContent,
  initialData,
  resumeId,
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("edit");
  const [previewContent, setPreviewContent] = useState(initialContent);
  const { user } = useUser();
  const [resumeMode, setResumeMode] = useState("preview");

  // State để theo dõi mục nào đang được AI cải thiện
  const [improvingSection, setImprovingSection] = useState(null);

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    getValues, // Get getValues to read form state
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resumeSchema),
    defaultValues: {
      contactInfo: {},
      summary: "",
      skills: "",
      experience: [],
      education: [],
      projects: [],
    },
  });

  const {
    loading: isSaving,
    fn: saveResumeFn,
    data: saveResult,
    error: saveError,
  } = useFetch(createResume);

  const { loading: isUpdating, fn: updateResumeFn } = useFetch(updateResume);

  // Fetch hook for AI improvement
  const {
    loading: isImproving,
    fn: improveWithAIFn,
    data: improvedContent,
  } = useFetch(improveWithAI);

  const formValues = watch();

  useEffect(() => {
    if (initialData) {
      // Đặt lại form với dữ liệu ban đầu khi ở chế độ chỉnh sửa
      reset({
        title: initialData.title || "",
        contactInfo: initialData.contactInfo || {},
        summary: initialData.summary || "",
        skills: initialData.skills || "",
        experience: initialData.experience || [],
        education: initialData.education || [],
        projects: initialData.projects || [],
      });
    }
    if (initialContent) {
      // Vẫn giữ lại việc cập nhật preview content
      setPreviewContent(initialContent);
    }
  }, [initialContent, initialData, reset]);

  useEffect(() => {
    if (activeTab === "edit") {
      const newContent = getCombinedContent();
      setPreviewContent(newContent ? newContent : initialContent);
    }
  }, [formValues, activeTab]);

  useEffect(() => {
    if (saveResult && !isSaving) {
      toast.success(`Đã lưu CV "${saveResult.title}"!`);
      router.push(`/resume/${saveResult.id}`);
    }
    if (saveError) {
      toast.error(saveError.message || "Failed to save resume");
    }
  }, [saveResult, saveError, isSaving]);

  // Dùng useEffect để xử lý kết quả từ AI
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
      setImprovingSection(null); // Reset lại mục đang cải thiện
    }
  }, [improvedContent, isImproving, improvingSection, setValue]);

  // Handle AI improvement for a given section

  const handleImproveSection = async (section) => {
    const currentValue = getValues(section);
    if (!currentValue) {
      toast.error(`Vui lòng nhập nội dung cho mục ${section} trước.`);
      return;
    }
    setImprovingSection(section); // Đánh dấu mục đang được cải thiện
    await improveWithAIFn({
      current: currentValue,
      type: section,
    });
  };

  const getContactMarkdown = () => {
    const { contactInfo } = formValues;
    const parts = [];

    const email = contactInfo?.email || user?.emailAddresses?.[0]?.emailAddress;
    if (email) {
      parts.push(`📧 <a href="mailto:${email}">${email}</a>`);
    }
    if (contactInfo?.mobile) {
      parts.push(`📱 ${contactInfo.mobile}`);
    }
    if (contactInfo?.linkedin) {
      const linkedInUrl = contactInfo.linkedin.startsWith("http")
        ? contactInfo.linkedin
        : `https://${contactInfo.linkedin}`;
      parts.push(
        `💼 <a href="${linkedInUrl}" target="_blank" rel="noopener noreferrer">LinkedIn</a>`
      );
    }

    if (contactInfo?.twitter) {
      const twitterUrl = contactInfo.twitter.startsWith("http")
        ? contactInfo.twitter
        : `https://${contactInfo.twitter}`;
      parts.push(
        `🐦 <a href="${twitterUrl}" target="_blank" rel="noopener noreferrer">Twitter/X</a>`
      );
    }

    return `
<h1 class="resume-name">${user?.fullName || "Your Name"}</h1>
<div class="contact-info">
  ${parts.join("<span>&nbsp;|&nbsp;</span>")}
</div>
`;
  };

  const getCombinedContent = () => {
    const { summary, skills, experience, education, projects } = formValues;
    const createSection = (title, icon, content) =>
      content?.trim() ? `## ${icon} ${title}\n\n${content}` : "";
    const formatEntries = (entries, type, icon) => {
      if (!entries?.length) return "";
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
      createSection("Professional Summary", "📝", summary),
      createSection("Skills", "🔧", skills),
      formatEntries(experience, "Work Experience", "💼"),
      formatEntries(education, "Education", "🎓"),
      formatEntries(projects, "Projects", "🚀"),
    ].filter(Boolean);
    return [getContactMarkdown(), ...sections].join("\n\n<hr>\n\n");
  };
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      const element = document.getElementById("resume-pdf");
      const opt = {
        margin: [15, 15],
        filename: "resume.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      };

      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("PDF generation error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const onSubmit = async (data) => {
    const content = getCombinedContent();
    if (resumeId) {
      // Chế độ cập nhật
      await updateResumeFn(resumeId, data.title, content);
      toast.success(`Đã cập nhật CV "${data.title}"!`);
      router.push(`/resume/${resumeId}`);
      router.refresh();
    } else {
      // Chế độ tạo mới
      await saveResumeFn(data.title, content);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div data-color-mode="light" className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-2">
          <h1 className="font-bold gradient-title text-5xl md:text-6xl">
            {resumeId ? "Chỉnh sửa CV" : "Resume Builder"}
          </h1>
          <div className="space-x-2">
            {resumeId && (
              <Button
                variant="outline"
                type="button"
                onClick={() => router.push(`/resume/${resumeId}`)}
              >
                <X className="h-4 w-4 mr-2" />
                Hủy
              </Button>
            )}
            <Button
              variant="default"
              disabled={isSaving || isUpdating}
              type="submit"
            >
              {isSaving || isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isSaving ? "Đang lưu..." : "Đang cập nhật..."}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {resumeId ? "Cập nhật" : "Lưu"}
                </>
              )}
            </Button>
            <Button onClick={generatePDF} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Download PDF
                </>
              )}
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="edit">Form</TabsTrigger>
            <TabsTrigger value="preview">Markdown</TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
                <div className="space-y-2">
                  <Label htmlFor="title">Tên CV</Label>
                  <Input
                    id="title"
                    placeholder="Ví dụ: CV ứng tuyển vị trí Backend Developer"
                    {...register("title")}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-500">
                      {errors.title.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    {...register("contactInfo.email")}
                    type="email"
                    placeholder="your@email.com"
                    error={errors.contactInfo?.email}
                  />
                  {errors.contactInfo?.email && (
                    <p className="text-sm text-red-500">
                      {errors.contactInfo.email.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mobile Number</label>
                  <Input
                    {...register("contactInfo.mobile")}
                    type="tel"
                    placeholder="+1 234 567 8900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">LinkedIn URL</label>
                  <Input
                    {...register("contactInfo.linkedin")}
                    type="url"
                    placeholder="https://linkedin.com/in/your-profile"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Twitter/X Profile
                  </label>
                  <Input
                    {...register("contactInfo.twitter")}
                    type="url"
                    placeholder="https://twitter.com/your-handle"
                  />
                </div>
              </div>
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
                  {isImproving ? (
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
                render={({ field }) => (
                  <Textarea
                    {...field}
                    className="h-32"
                    placeholder="Write a compelling professional summary..."
                  />
                )}
              />
              {errors.summary && (
                <p className="text-sm text-red-500">{errors.summary.message}</p>
              )}
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
                  {isImproving ? (
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
                render={({ field }) => (
                  <Textarea
                    {...field}
                    className="h-32"
                    placeholder="List your key skills..."
                  />
                )}
              />
              {errors.skills && (
                <p className="text-sm text-red-500">{errors.skills.message}</p>
              )}
            </div>

            {/* Sections using EntryForm */}
            <div className="space-y-4">
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
            </div>
            <div className="space-y-4">
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
            </div>
            <div className="space-y-4">
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
            </div>
          </TabsContent>

          <TabsContent value="preview">
            <div className="resume-container">
              <MDEditor
                value={previewContent}
                onChange={setPreviewContent}
                height={800}
                preview="preview"
              />
            </div>
            <div className="pdf-render-offscreen">
              <div id="resume-pdf" className="resume-container">
                <MDEditor.Markdown
                  source={previewContent}
                  style={{
                    background: "white",
                    color: "black",
                  }}
                  rehypePlugins={[rehypeRaw]}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </form>
  );
}
