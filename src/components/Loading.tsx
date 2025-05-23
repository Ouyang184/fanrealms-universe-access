
import { Spinner } from "@/components/ui/spinner";

export default function Loading() {
  return (
    <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center">
      <Spinner className="h-12 w-12" />
    </div>
  );
}
