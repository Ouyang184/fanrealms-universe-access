
import { Github, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const SocialLoginOptions = () => {
  return (
    <div className="mt-6">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full bg-gray-800" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-gray-900 px-2 text-gray-400">Or continue with</span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Button variant="outline" className="bg-gray-800 border-gray-700 hover:bg-gray-700">
          <Github className="mr-2 h-4 w-4" />
          GitHub
        </Button>
        <Button variant="outline" className="bg-gray-800 border-gray-700 hover:bg-gray-700">
          <Twitter className="mr-2 h-4 w-4" />
          Twitter
        </Button>
      </div>
    </div>
  );
};

export default SocialLoginOptions;
