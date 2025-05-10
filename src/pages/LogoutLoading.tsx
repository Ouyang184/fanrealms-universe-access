
import { Skeleton } from "@/components/ui/skeleton";
import { Logo } from "@/components/Logo";

export default function LogoutLoading() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="flex justify-center mb-8">
          <Logo />
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-8">
          <div className="flex flex-col items-center space-y-6">
            <Skeleton className="h-10 w-64 bg-gray-800" />
            <Skeleton className="h-5 w-80 bg-gray-800" />

            <div className="w-full max-w-xl mx-auto">
              <Skeleton className="h-4 w-full bg-gray-800 mb-2" />
              <Skeleton className="h-4 w-5/6 bg-gray-800 mb-2" />
              <Skeleton className="h-4 w-4/6 bg-gray-800 mb-6" />

              <div className="flex justify-center gap-4">
                <Skeleton className="h-10 w-32 bg-gray-800" />
                <Skeleton className="h-10 w-32 bg-gray-800" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-800 rounded-lg p-6">
                  <Skeleton className="h-12 w-12 rounded-full bg-gray-700 mx-auto mb-4" />
                  <Skeleton className="h-5 w-32 bg-gray-700 mx-auto mb-3" />
                  <Skeleton className="h-4 w-full bg-gray-700 mb-2" />
                  <Skeleton className="h-4 w-5/6 bg-gray-700 mx-auto" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
