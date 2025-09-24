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
} from "lucide-react";
import { toast } from "sonner";
import MDEditor from "@uiw/react-md-editor";
import rehypeRaw from "rehype-raw";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { createResume, saveResume } from "@/actions/resume";
import { EntryForm } from "./entry-form";
import useFetch from "@/hooks/use-fetch";
import { useUser } from "@clerk/nextjs";
import { entriesToMarkdown } from "@/app/lib/helper";
import { resumeSchema } from "@/app/lib/schema";
import html2pdf from "html2pdf.js/dist/html2pdf.min.js";
import { Label } from "@/components/ui/label";
import "../resume-styles.css";

export default function ResumeBuilder({ initialContent }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("edit");
  const [previewContent, setPreviewContent] = useState(initialContent);
  const { user } = useUser();
  const [resumeMode, setResumeMode] = useState("preview");

  const {
    control,
    register,
    handleSubmit,
    watch,
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
  } = useFetch(createResume); // <-- Dùng createResume thay vì saveResume cũ

  // Watch form fields for preview updates
  const formValues = watch();

  useEffect(() => {
    if (initialContent) setActiveTab("preview");
  }, [initialContent]);

  // Update preview content when form values change
  useEffect(() => {
    if (activeTab === "edit") {
      const newContent = getCombinedContent();
      setPreviewContent(newContent ? newContent : initialContent);
    }
  }, [formValues, activeTab]);

  // Handle save result
  useEffect(() => {
    if (saveResult && !isSaving) {
      toast.success(`Đã lưu CV "${saveResult.title}"!`);
      // Chuyển người dùng đến trang chi tiết CV vừa tạo
      router.push(`/resume/${saveResult.id}`);
    }
    if (saveError) {
      toast.error(saveError.message || "Failed to save resume");
    }
  }, [saveResult, saveError, isSaving]);

  // Hiển thị

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

    // Cấu trúc này sẽ đảm bảo h1 và div.contact-info được style đúng bởi file CSS
    return `
<h1 class="resume-name">${user?.fullName || "Your Name"}</h1>
<div class="contact-info">
  ${parts.join("<span>&nbsp;|&nbsp;</span>")}
</div>
`;
  };

  const getCombinedContent = () => {
    const { summary, skills, experience, education, projects } = formValues;

    // Helper nội bộ để thêm icon và đường kẻ
    const createSection = (title, icon, content) => {
      if (!content || content.trim() === "") return "";
      // Thêm đường kẻ ngang <hr> trước mỗi mục (trừ mục đầu tiên)
      // return `\n\n<hr>\n\n## ${icon} ${title}\n\n${content}`;
      return `\n\n## ${icon} ${title}\n\n${content}`;
    };

    // Helper để format lại markdown cho các mục có entry
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
      // return `\n\n<hr>\n\n${title}\n\n${content}`;
      return `\n\n${title}\n\n${content}`;
    };

    return [
      getContactMarkdown(),
      createSection("Professional Summary", "📝", summary),
      createSection("Skills", "🔧", skills),
      formatEntries(experience, "Work Experience", "💼"),
      formatEntries(education, "Education", "🎓"),
      formatEntries(projects, "Projects", "🚀"),
    ]
      .filter(Boolean)
      .join(""); // Nối trực tiếp không cần "\n\n" vì đã có trong helper
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
    await saveResumeFn(data.title, content);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div data-color-mode="light" className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-2">
          <h1 className="font-bold gradient-title text-5xl md:text-6xl">
            Resume Builder
          </h1>
          <div className="space-x-2">
            <Button variant="default" disabled={isSaving} type="submit">
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save
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

          <TabsContent value="edit">
            {/* Contact Information */}
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
                  {errors.contactInfo?.mobile && (
                    <p className="text-sm text-red-500">
                      {errors.contactInfo.mobile.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">LinkedIn URL</label>
                  <Input
                    {...register("contactInfo.linkedin")}
                    type="url"
                    placeholder="https://linkedin.com/in/your-profile"
                  />
                  {errors.contactInfo?.linkedin && (
                    <p className="text-sm text-red-500">
                      {errors.contactInfo.linkedin.message}
                    </p>
                  )}
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
                  {errors.contactInfo?.twitter && (
                    <p className="text-sm text-red-500">
                      {errors.contactInfo.twitter.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Professional Summary</h3>
              <Controller
                name="summary"
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    className="h-32"
                    placeholder="Write a compelling professional summary..."
                    error={errors.summary}
                  />
                )}
              />
              {errors.summary && (
                <p className="text-sm text-red-500">{errors.summary.message}</p>
              )}
            </div>

            {/* Skills */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Skills</h3>
              <Controller
                name="skills"
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    className="h-32"
                    placeholder="List your key skills..."
                    error={errors.skills}
                  />
                )}
              />
              {errors.skills && (
                <p className="text-sm text-red-500">{errors.skills.message}</p>
              )}
            </div>

            {/* Experience */}
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
              {errors.experience && (
                <p className="text-sm text-red-500">
                  {errors.experience.message}
                </p>
              )}
            </div>

            {/* Education */}
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
              {errors.education && (
                <p className="text-sm text-red-500">
                  {errors.education.message}
                </p>
              )}
            </div>

            {/* Projects */}
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
              {errors.projects && (
                <p className="text-sm text-red-500">
                  {errors.projects.message}
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="preview">
            {activeTab === "preview" && (
              <Button
                variant="link"
                type="button"
                className="mb-2"
                onClick={() =>
                  setResumeMode(resumeMode === "preview" ? "edit" : "preview")
                }
              >
                {resumeMode === "preview" ? (
                  <>
                    <Edit className="h-4 w-4" />
                    Edit Resume
                  </>
                ) : (
                  <>
                    <Monitor className="h-4 w-4" />
                    Show Preview
                  </>
                )}
              </Button>
            )}

            {activeTab === "preview" && resumeMode !== "preview" && (
              <div className="flex p-3 gap-2 items-center border-2 border-yellow-600 text-yellow-600 rounded mb-2">
                <AlertTriangle className="h-5 w-5" />
                <span className="text-sm">
                  You will lose editied markdown if you update the form data.
                </span>
              </div>
            )}
            <div className="resume-container">
              <MDEditor
                value={previewContent}
                onChange={setPreviewContent}
                height={800}
                preview={resumeMode}
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
