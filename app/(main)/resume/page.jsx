import { getResumes } from "@/actions/resume";
import ResumeBuilder from "@/app/(main)/resume/_components/resume-builder";
import { ResumeList } from "@/app/(main)/resume/_components/resume-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function ResumePage() {
  const resumes = await getResumes(); // Lấy dữ liệu CV

  return (
    <div className="container mx-auto py-6">
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
          <TabsTrigger value="list">Resumes Của Tôi</TabsTrigger>
          <TabsTrigger value="create">Tạo CV Mới</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-6">
          {/* Truyền dữ liệu CV ban đầu vào component */}
          <ResumeList initialResumes={resumes} />
        </TabsContent>

        <TabsContent value="create" className="mt-6">
          <ResumeBuilder />
        </TabsContent>
      </Tabs>
    </div>
  );
}
