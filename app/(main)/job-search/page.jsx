import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import JobSearchTab from "./_components/job-search-tab";
import SavedJobsTab from "./_components/saved-jobs-tab";
import { getSavedJobs } from "@/actions/job";

export default async function JobSearchPage() {
  const savedJobsResult = await getSavedJobs();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row gap-2 items-center justify-between">
        <h1 className="text-5xl md:text-6xl font-bold gradient-title">
          AI Job Assistant
        </h1>
      </div>

      <Tabs defaultValue="search" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
          <TabsTrigger value="search">Search Jobs</TabsTrigger>
          <TabsTrigger value="saved">My Saved Jobs</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="mt-6">
          <JobSearchTab />
        </TabsContent>

        <TabsContent value="saved" className="mt-6">
          <SavedJobsTab initialSavedJobs={savedJobsResult.data} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
