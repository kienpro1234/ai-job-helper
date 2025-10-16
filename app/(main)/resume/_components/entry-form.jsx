// "use client";

// import { useEffect, useState } from "react";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { format, parse } from "date-fns";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import {
//   Card,
//   CardContent,
//   CardFooter,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { entrySchema } from "@/app/lib/schema";
// import { Sparkles, PlusCircle, X, Pencil, Save, Loader2 } from "lucide-react";
// import { improveWithAI } from "@/actions/resume";
// import { toast } from "sonner";
// import useFetch from "@/hooks/use-fetch";

// // Helper to parse date string from form (e.g., "2023-05") to display format ("May 2023")
// const formatDisplayDate = (dateString) => {
//   if (!dateString || typeof dateString !== "string") return "";
//   // If it's already in "MMM yyyy" format, return it
//   if (/^[A-Za-z]{3}\s\d{4}$/.test(dateString)) return dateString;
//   // Otherwise, parse it from "yyyy-MM"
//   try {
//     const date = parse(dateString, "yyyy-MM", new Date());
//     return format(date, "MMM yyyy");
//   } catch (e) {
//     return dateString; // Return original if parsing fails
//   }
// };

// // Helper to convert display format back to form format for editing
// const parseToFormDate = (dateString) => {
//   if (!dateString || typeof dateString !== "string") return "";
//   try {
//     const date = parse(dateString, "MMM yyyy", new Date());
//     return format(date, "yyyy-MM");
//   } catch (e) {
//     return ""; // Return empty if parsing fails
//   }
// };

// export function EntryForm({ type, entries, onChange }) {
//   // State to track if the user is adding a new entry or editing an existing one
//   // null = not editing/adding, -1 = adding, index = editing
//   const [editIndex, setEditIndex] = useState(null);

//   const {
//     register,
//     handleSubmit: handleValidation,
//     formState: { errors },
//     reset,
//     watch,
//     setValue,
//   } = useForm({
//     resolver: zodResolver(entrySchema),
//     defaultValues: {
//       title: "",
//       organization: "",
//       startDate: "",
//       endDate: "",
//       description: "",
//       current: false,
//     },
//   });

//   const current = watch("current");

//   // Handlers for starting to add or edit
//   const handleAddNew = () => {
//     reset({
//       title: "",
//       organization: "",
//       startDate: "",
//       endDate: "",
//       description: "",
//       current: false,
//     });
//     setEditIndex(-1); // Use -1 to signify "adding new"
//   };

//   const handleEdit = (index) => {
//     const entryToEdit = entries[index];
//     reset({
//       ...entryToEdit,
//       startDate: parseToFormDate(entryToEdit.startDate),
//       endDate: parseToFormDate(entryToEdit.endDate),
//     });
//     setEditIndex(index);
//   };

//   const handleCancel = () => {
//     setEditIndex(null);
//   };

//   // Handle form submission (for both add and edit)
//   const onSubmit = handleValidation((data) => {
//     const formattedEntry = {
//       ...data,
//       startDate: formatDisplayDate(data.startDate),
//       endDate: data.current ? "" : formatDisplayDate(data.endDate),
//     };

//     const newEntries = [...entries];
//     if (editIndex === -1) {
//       // Adding a new entry
//       newEntries.push(formattedEntry);
//     } else {
//       // Updating an existing entry
//       newEntries[editIndex] = formattedEntry;
//     }

//     onChange(newEntries);
//     handleCancel(); // Close form after submission
//   });

//   const handleDelete = (index) => {
//     const newEntries = entries.filter((_, i) => i !== index);
//     onChange(newEntries);
//   };

//   const {
//     loading: isImproving,
//     fn: improveWithAIFn,
//     data: improvedContent,
//     error: improveError,
//   } = useFetch(improveWithAI);

//   useEffect(() => {
//     if (
//       improvedContent &&
//       typeof improvedContent === "string" &&
//       improvedContent.trim() !== "" &&
//       !isImproving
//     ) {
//       setValue("description", improvedContent);
//       toast.success("Description improved successfully!");
//     } else if (improvedContent !== undefined && !isImproving) {
//       toast.error(
//         "AI could not improve the text. Please try rephrasing or adding more details."
//       );
//     }

//     if (improveError) {
//       toast.error(improveError.message || "Failed to improve description");
//     }
//   }, [improvedContent, improveError, isImproving, setValue]);

//   const handleImproveDescription = async () => {
//     const description = watch("description");
//     if (!description) {
//       toast.error("Please enter a description first");
//       return;
//     }

//     await improveWithAIFn({
//       current: description,
//       type: type.toLowerCase(),
//     });
//   };

//   // Show the form if we are adding or editing
//   const isFormVisible = editIndex !== null;

//   return (
//     <div className="space-y-4">
//       {/* Display existing entries */}
//       <div className="space-y-4">
//         {entries.map((item, index) => (
//           <Card key={index}>
//             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//               <CardTitle className="text-sm font-medium">
//                 {item.title} @ {item.organization}
//               </CardTitle>
//               <div className="flex space-x-2">
//                 <Button
//                   variant="outline"
//                   size="icon"
//                   type="button"
//                   onClick={() => handleEdit(index)}
//                 >
//                   <Pencil className="h-4 w-4" />
//                 </Button>
//                 <Button
//                   variant="outline"
//                   size="icon"
//                   type="button"
//                   onClick={() => handleDelete(index)}
//                 >
//                   <X className="h-4 w-4" />
//                 </Button>
//               </div>
//             </CardHeader>
//             <CardContent>
//               <p className="text-sm text-muted-foreground">
//                 {item.current
//                   ? `${item.startDate} - Present`
//                   : `${item.startDate} - ${item.endDate}`}
//               </p>
//               <p className="mt-2 text-sm whitespace-pre-wrap">
//                 {item.description}
//               </p>
//             </CardContent>
//           </Card>
//         ))}
//       </div>

//       {/* Form for adding/editing */}
//       {isFormVisible && (
//         <Card>
//           <CardHeader>
//             <CardTitle>
//               {editIndex === -1 ? "Add" : "Edit"} {type}
//             </CardTitle>
//           </CardHeader>
//           <CardContent className="space-y-4">
//             <div className="grid grid-cols-2 gap-4">
//               <div className="space-y-2">
//                 <Input
//                   placeholder="Title/Position"
//                   {...register("title")}
//                   error={errors.title}
//                 />
//                 {errors.title && (
//                   <p className="text-sm text-red-500">{errors.title.message}</p>
//                 )}
//               </div>
//               <div className="space-y-2">
//                 <Input
//                   placeholder="Organization/Company"
//                   {...register("organization")}
//                   error={errors.organization}
//                 />
//                 {errors.organization && (
//                   <p className="text-sm text-red-500">
//                     {errors.organization.message}
//                   </p>
//                 )}
//               </div>
//             </div>

//             <div className="grid grid-cols-2 gap-4">
//               <div className="space-y-2">
//                 <Input
//                   type="month"
//                   {...register("startDate")}
//                   error={errors.startDate}
//                 />
//                 {errors.startDate && (
//                   <p className="text-sm text-red-500">
//                     {errors.startDate.message}
//                   </p>
//                 )}
//               </div>
//               <div className="space-y-2">
//                 <Input
//                   type="month"
//                   {...register("endDate")}
//                   disabled={current}
//                   error={errors.endDate}
//                 />
//                 {errors.endDate && (
//                   <p className="text-sm text-red-500">
//                     {errors.endDate.message}
//                   </p>
//                 )}
//               </div>
//             </div>

//             <div className="flex items-center space-x-2">
//               <input
//                 type="checkbox"
//                 id={`current-${type}`}
//                 {...register("current")}
//               />
//               <label htmlFor={`current-${type}`}>Current {type}</label>
//             </div>

//             <div className="space-y-2">
//               <Textarea
//                 placeholder={`Description of your ${type.toLowerCase()}`}
//                 className="h-32"
//                 {...register("description")}
//                 error={errors.description}
//               />
//               {errors.description && (
//                 <p className="text-sm text-red-500">
//                   {errors.description.message}
//                 </p>
//               )}
//             </div>
//             <Button
//               type="button"
//               variant="ghost"
//               size="sm"
//               onClick={handleImproveDescription}
//               disabled={isImproving || !watch("description")}
//             >
//               {isImproving ? (
//                 <>
//                   <Loader2 className="h-4 w-4 mr-2 animate-spin" />
//                   Improving...
//                 </>
//               ) : (
//                 <>
//                   <Sparkles className="h-4 w-4 mr-2" />
//                   Improve with AI
//                 </>
//               )}
//             </Button>
//           </CardContent>
//           <CardFooter className="flex justify-end space-x-2">
//             <Button type="button" variant="outline" onClick={handleCancel}>
//               Cancel
//             </Button>
//             <Button type="button" onClick={onSubmit}>
//               <Save className="h-4 w-4 mr-2" />
//               {editIndex === -1 ? "Add Entry" : "Save Changes"}
//             </Button>
//           </CardFooter>
//         </Card>
//       )}

//       {/* Show "Add" button only when the form is hidden */}
//       {!isFormVisible && (
//         <Button className="w-full" variant="outline" onClick={handleAddNew}>
//           <PlusCircle className="h-4 w-4 mr-2" />
//           Add {type}
//         </Button>
//       )}
//     </div>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, parse } from "date-fns";
import MDEditor from "@uiw/react-md-editor";
import rehypeRaw from "rehype-raw";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { entrySchema } from "@/app/lib/schema";
import { Sparkles, PlusCircle, X, Pencil, Save, Loader2 } from "lucide-react";
import { improveWithAI } from "@/actions/resume";
import { toast } from "sonner";
import useFetch from "@/hooks/use-fetch";
import "../resume-styles.css"; // Đảm bảo đã import file css

// Helper to parse date string from form (e.g., "2023-05") to display format ("May 2023")
const formatDisplayDate = (dateString) => {
  if (!dateString || typeof dateString !== "string") return "";
  if (/^[A-Za-z]{3}\s\d{4}$/.test(dateString)) return dateString;
  try {
    const date = parse(dateString, "yyyy-MM", new Date());
    return format(date, "MMM yyyy");
  } catch (e) {
    return dateString;
  }
};

// Helper to convert display format back to form format for editing
const parseToFormDate = (dateString) => {
  if (!dateString || typeof dateString !== "string") return "";
  try {
    const date = parse(dateString, "MMM yyyy", new Date());
    return format(date, "yyyy-MM");
  } catch (e) {
    return "";
  }
};

export function EntryForm({ type, entries, onChange }) {
  const [editIndex, setEditIndex] = useState(null);

  const {
    register,
    handleSubmit: handleValidation,
    formState: { errors },
    reset,
    watch,
    setValue,
    control,
  } = useForm({
    resolver: zodResolver(entrySchema),
    defaultValues: {
      title: "",
      organization: "",
      startDate: "",
      endDate: "",
      description: "",
      current: false,
    },
  });

  const current = watch("current");

  const handleAddNew = () => {
    reset({
      title: "",
      organization: "",
      startDate: "",
      endDate: "",
      description: "",
      current: false,
    });
    setEditIndex(-1);
  };

  const handleEdit = (index) => {
    const entryToEdit = entries[index];
    reset({
      ...entryToEdit,
      startDate: parseToFormDate(entryToEdit.startDate),
      endDate: parseToFormDate(entryToEdit.endDate),
    });
    setEditIndex(index);
  };

  const handleCancel = () => {
    setEditIndex(null);
  };

  const onSubmit = handleValidation((data) => {
    const formattedEntry = {
      ...data,
      startDate: formatDisplayDate(data.startDate),
      endDate: data.current ? "" : formatDisplayDate(data.endDate),
    };

    const newEntries = [...entries];
    if (editIndex === -1) {
      newEntries.push(formattedEntry);
    } else {
      newEntries[editIndex] = formattedEntry;
    }

    onChange(newEntries);
    handleCancel();
  });

  const handleDelete = (index) => {
    const newEntries = entries.filter((_, i) => i !== index);
    onChange(newEntries);
  };

  const {
    loading: isImproving,
    fn: improveWithAIFn,
    data: improvedContent,
    error: improveError,
  } = useFetch(improveWithAI);

  useEffect(() => {
    if (
      improvedContent &&
      typeof improvedContent === "string" &&
      improvedContent.trim() !== "" &&
      !isImproving
    ) {
      setValue("description", improvedContent);
      toast.success("Description improved successfully!");
    } else if (improvedContent !== undefined && !isImproving) {
      toast.error(
        "AI could not improve the text. Please try rephrasing or adding more details."
      );
    }

    if (improveError) {
      toast.error(improveError.message || "Failed to improve description");
    }
  }, [improvedContent, improveError, isImproving, setValue]);

  const handleImproveDescription = async () => {
    const description = watch("description");
    if (!description) {
      toast.error("Please enter a description first");
      return;
    }

    await improveWithAIFn({
      current: description,
      type: type.toLowerCase(),
    });
  };

  const isFormVisible = editIndex !== null;

  return (
    <div className="space-y-4">
      {/* Display existing entries */}
      <div className="space-y-4">
        {entries.map((item, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {item.title} @ {item.organization}
              </CardTitle>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  type="button"
                  onClick={() => handleEdit(index)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  type="button"
                  onClick={() => handleDelete(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {item.current
                  ? `${item.startDate} - Present`
                  : `${item.startDate} - ${item.endDate}`}
              </p>
              {/* === SỬA LỖI XUỐNG DÒNG TẠI ĐÂY === */}
              <div className="mt-2 text-sm">
                <MDEditor.Markdown
                  source={item.description}
                  style={{ background: "transparent" }}
                  rehypePlugins={[rehypeRaw]}
                  className="markdown-preserve-line-breaks"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Form for adding/editing */}
      {isFormVisible && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editIndex === -1 ? "Add" : "Edit"} {type}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Input
                  placeholder="Title/Position"
                  {...register("title")}
                  error={errors.title}
                />
                {errors.title && (
                  <p className="text-sm text-red-500">{errors.title.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Input
                  placeholder="Organization/Company"
                  {...register("organization")}
                  error={errors.organization}
                />
                {errors.organization && (
                  <p className="text-sm text-red-500">
                    {errors.organization.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Input
                  type="month"
                  {...register("startDate")}
                  error={errors.startDate}
                />
                {errors.startDate && (
                  <p className="text-sm text-red-500">
                    {errors.startDate.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Input
                  type="month"
                  {...register("endDate")}
                  disabled={current}
                  error={errors.endDate}
                />
                {errors.endDate && (
                  <p className="text-sm text-red-500">
                    {errors.endDate.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`current-${type}`}
                {...register("current")}
              />
              <label htmlFor={`current-${type}`}>Current {type}</label>
            </div>

            <div className="space-y-2">
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <div data-color-mode="light">
                    <MDEditor {...field} height={200} preview="edit" />
                  </div>
                )}
              />
              {errors.description && (
                <p className="text-sm text-red-500">
                  {errors.description.message}
                </p>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleImproveDescription}
              disabled={isImproving || !watch("description")}
            >
              {isImproving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Improving...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Improve with AI
                </>
              )}
            </Button>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="button" onClick={onSubmit}>
              <Save className="h-4 w-4 mr-2" />
              {editIndex === -1 ? "Add Entry" : "Save Changes"}
            </Button>
          </CardFooter>
        </Card>
      )}

      {!isFormVisible && (
        <Button className="w-full" variant="outline" onClick={handleAddNew}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add {type}
        </Button>
      )}
    </div>
  );
}
