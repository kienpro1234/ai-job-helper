import { Loader2 } from "lucide-react";

export default function Loading() {
  // có thể tạo bất kỳ UI nào ở đây, ví dụ như một Skeleton nhưng hiện tại là spinner đơn giản ở giữa màn hình.
  return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}
