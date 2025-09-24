// import { getResume } from "@/actions/resume";
// import { AnalysisHistory } from "@/app/(main)/resume/_components/analysis-history";
// import ResumeAnalyzer from "@/app/(main)/resume/_components/resume-analyzer";
// import ResumeBuilder from "@/app/(main)/resume/_components/resume-builder";

// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// export default async function ResumePage() {
//   const resume = await getResume();

//   // Xử lý trường hợp người dùng chưa tạo CV nào (giữ nguyên)
//   if (!resume) {
//     return (
//       <div className="container mx-auto py-6">
//         <p className="text-center text-muted-foreground mb-4">
//           Bạn chưa có CV nào. Hãy tạo CV đầu tiên của bạn bên dưới.
//         </p>
//         <ResumeBuilder initialContent={""} />
//       </div>
//     );
//   }

//   // Bắt đầu chỉnh sửa từ đây
//   return (
//     <div className="container mx-auto py-6">
//       {/* Thay thế cấu trúc cũ bằng component Tabs */}
//       <Tabs defaultValue="editor" className="w-full">
//         {/* Thanh điều hướng giữa các Tab */}
//         <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
//           <TabsTrigger value="editor">Trình Soạn Thảo & Phân Tích</TabsTrigger>
//           <TabsTrigger value="history">Lịch Sử Phân Tích</TabsTrigger>
//         </TabsList>

//         {/* Nội dung của Tab "Trình Soạn Thảo & Phân Tích" */}
//         <TabsContent value="editor" className="mt-6">
//           {/* Đặt ResumeBuilder và ResumeAnalyzer vào đây */}
//           <div className="space-y-8">
//             <ResumeBuilder initialContent={resume.content} />
//             <ResumeAnalyzer resumeId={resume.id} />
//           </div>
//         </TabsContent>

//         {/* Nội dung của Tab "Lịch Sử Phân Tích" */}
//         <TabsContent value="history" className="mt-6">
//           {/* Đặt AnalysisHistory vào đây */}
//           <AnalysisHistory resumeId={resume.id} />
//         </TabsContent>
//       </Tabs>
//     </div>
//   );
// }

import ResumeBuilder from "@/app/(main)/resume/_components/resume-builder";
import { ResumeList } from "@/app/(main)/resume/_components/resume-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ResumePage() {
  return (
    <div className="container mx-auto py-6">
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
          <TabsTrigger value="list">Resumes Của Tôi</TabsTrigger>
          <TabsTrigger value="create">Tạo CV Mới</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-6">
          <ResumeList />
        </TabsContent>

        <TabsContent value="create" className="mt-6">
          <ResumeBuilder />
        </TabsContent>
      </Tabs>
    </div>
  );
}
