"use client";

import { useEffect, useState, useRef, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  Globe,
  Download,
  Loader2,
  Image as ImageIcon,
  ChevronDown,
  Edit,
  Save,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCoverLetter, updateCoverLetter } from "@/actions/cover-letter";
import CoverLetterDisplay from "../_components/CoverLetterDisplay";
import html2pdf from "html2pdf.js/dist/html2pdf.min.js";
import * as htmlToImage from "html-to-image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import MDEditor from "@uiw/react-md-editor";
import { toast } from "sonner";

import "../_components/cover-letter-styles.css";

export default function EditCoverLetterPage({ params }) {
  const exportRef = useRef(null);
  const { id } = use(params);
  const [coverLetter, setCoverLetter] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // State cho chế độ chỉnh sửa
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [editedTitle, setEditedTitle] = useState("");
  const [editedCompany, setEditedCompany] = useState("");

  useEffect(() => {
    if (id) {
      const fetchLetter = async () => {
        setIsLoading(true);
        try {
          const letter = await getCoverLetter(id);
          setCoverLetter(letter);
          // Khởi tạo giá trị cho các state chỉnh sửa
          if (letter) {
            setEditedContent(letter.content);
            setEditedTitle(letter.jobTitle);
            setEditedCompany(letter.companyName);
          }
        } catch (error) {
          console.error("Failed to fetch cover letter:", error);
          toast.error("Failed to fetch cover letter.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchLetter();
    }
  }, [id]);

  const handleEdit = () => {
    if (!coverLetter) return;
    setEditedContent(coverLetter.content);
    setEditedTitle(coverLetter.jobTitle);
    setEditedCompany(coverLetter.companyName);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    toast.info("Saving changes...");
    const result = await updateCoverLetter(id, {
      content: editedContent,
      jobTitle: editedTitle,
      companyName: editedCompany,
    });
    setIsSaving(false);

    if (result.success) {
      toast.success("Cover letter updated successfully!");
      setCoverLetter(result.data);
      setIsEditing(false);
    } else {
      toast.error(result.error || "Failed to save changes.");
    }
  };

  const generatePDF = async () => {
    if (!coverLetter || isProcessing) return;
    setIsProcessing(true);
    toast.info("Generating PDF...");
    const element = document.getElementById("pdf-content");
    const opt = {
      margin: [0.6, 0.7],
      filename: `Cover_Letter_${coverLetter.jobTitle.replace(/\s/g, "_")}.pdf`,
      image: { type: "jpeg", quality: 1.0 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
    };
    try {
      await html2pdf().from(element).set(opt).save();
    } catch (error) {
      toast.error("Failed to generate PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  const generateImage = async (qualityScale = 2) => {
    if (!exportRef.current) {
      toast.error("Không tìm thấy phần tử để xuất ảnh.");
      return;
    }

    setIsProcessing(true);
    toast.info(`Đang tạo ảnh chất lượng ${qualityScale}x...`);

    try {
      const element = exportRef.current;

      // Lấy kích thước thực của phần tử để tính toán
      const rect = element.getBoundingClientRect();

      // Bước 1: Chuyển đổi HTML thành SVG.

      const svgDataUrl = await htmlToImage.toSvg(element, {
        cacheBust: true, // Giúp tải lại các tài nguyên nếu cần
        width: rect.width,
        height: rect.height,
        backgroundColor: "#ffffff",
      });

      // Bước 2: Vẽ ảnh SVG đó lên một canvas ảo với độ phân giải cao hơn
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      // Phải dùng Promise để đợi ảnh SVG được tải xong
      await new Promise((resolve) => {
        img.onload = () => {
          // Đặt kích thước canvas theo độ phân giải mong muốn
          canvas.width = rect.width * qualityScale;
          canvas.height = rect.height * qualityScale;

          // Phóng to context trước khi vẽ để ảnh nét hơn
          ctx.scale(qualityScale, qualityScale);
          ctx.drawImage(img, 0, 0);
          resolve();
        };
        img.src = svgDataUrl;
      });

      // Bước 3: Xuất dữ liệu ảnh PNG từ canvas
      const pngDataUrl = canvas.toDataURL("image/png");

      if (!pngDataUrl || pngDataUrl === "data:,") {
        throw new Error("Dữ liệu ảnh tạo ra bị rỗng.");
      }

      // Tạo và tải link
      const link = document.createElement("a");
      link.href = pngDataUrl;
      link.download = `Cover_Letter_${coverLetter.jobTitle.replace(
        /\s/g,
        "_"
      )}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Tải ảnh thành công!");
    } catch (error) {
      console.error("Lỗi xuất ảnh:", error);
      toast.error("Không thể xuất ảnh. Vui lòng thử lại.");
    } finally {
      setIsProcessing(false); // Hoàn tất xử lý
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!coverLetter) {
    return <div className="text-center mt-10">Cover Letter not found.</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/ai-cover-letter">
            <Button variant="link" className="gap-2 pl-0 self-start">
              <ArrowLeft className="h-4 w-4" />
              Back to Cover Letters
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            {coverLetter?.sourceType === "JSearch" && coverLetter?.jobUrl && (
              <Button variant="outline" asChild>
                <a
                  href={coverLetter.jobUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Original Job Post
                </a>
              </Button>
            )}

            {isEditing ? (
              <>
                <Button
                  variant="ghost"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={handleEdit}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="default" disabled={isProcessing}>
                      {isProcessing ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="mr-2 h-4 w-4" />
                      )}
                      Export
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Export Options</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={generatePDF}>
                      <Download className="mr-2 h-4 w-4" />
                      <span>Download as PDF</span>
                    </DropdownMenuItem>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <ImageIcon className="mr-2 h-4 w-4" />
                        <span>Download as Image</span>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                          <DropdownMenuItem onClick={() => generateImage(2)}>
                            Standard Quality
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => generateImage(4)}>
                            High Quality
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => generateImage(6)}>
                            Ultra Quality
                          </DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>

        {isEditing ? (
          <div className="pb-6 space-y-4">
            <Input
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="text-4xl md:text-5xl font-bold h-auto p-0 border-0 shadow-none focus-visible:ring-0 gradient-title"
            />
            <div className="flex items-center gap-2">
              <span className="text-xl text-muted-foreground">at</span>
              <Input
                value={editedCompany}
                onChange={(e) => setEditedCompany(e.target.value)}
                className="text-xl h-auto p-0 border-0 shadow-none focus-visible:ring-0 text-muted-foreground"
              />
            </div>
          </div>
        ) : (
          <div className="pb-6">
            <h1 className="text-4xl md:text-5xl font-bold gradient-title">
              {coverLetter?.jobTitle}
            </h1>
            <div className="flex flex-wrap items-center gap-4 mt-2">
              <p className="text-xl text-muted-foreground">
                at {coverLetter?.companyName}
              </p>
              {coverLetter?.jobSource && (
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Globe className="h-4 w-4" /> {coverLetter.jobSource}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {isEditing ? (
        <div data-color-mode="light" className="mt-4">
          <MDEditor
            value={editedContent}
            onChange={setEditedContent}
            height={800}
            preview="live"
          />
        </div>
      ) : (
        <>
          <CoverLetterDisplay content={coverLetter?.content} />
          <div className="pdf-render-offscreen">
            <div id="pdf-content" ref={exportRef}>
              <CoverLetterDisplay content={coverLetter?.content} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
