
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";

export function DashboardHeader() {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
      <div>
        <h1 className="text-3xl font-bold">Creator Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's an overview of your creator account.</p>
      </div>
      <div className="flex items-center gap-3">
        <Button asChild className="gap-2">
          <Link to="/creator-studio/posts">
            <Plus className="h-4 w-4" />
            Create New Post
          </Link>
        </Button>
      </div>
    </div>
  );
}
