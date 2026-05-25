import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

import { useCreatorProjects, useDeleteProject } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, FileText, ExternalLink, Trash2 } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { safeHref } from '@/lib/safeHref';

export default function DashboardProjectsPage() {
  return (
    <DashboardLayout>
      <ProjectsList />
    </DashboardLayout>
  );
}

function ProjectsList() {
  const { projects, isLoading } = useCreatorProjects();
  const deleteProject = useDeleteProject();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold tracking-[-0.5px]">Projects</h1>
          <p className="text-[13px] text-[#888] mt-0.5">Showcase your games & creative work</p>
        </div>
        <Button asChild className="bg-primary hover:bg-[#3a7aab] text-white text-[13px] font-semibold">
          <Link to="/dashboard/projects/new">
            <Plus className="w-4 h-4 mr-2" />
            Upload new project
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : projects.length > 0 ? (
        <div className="bg-white border border-[#eee] rounded-xl overflow-hidden">
          {projects.map((p, i) => (
            <div
              key={p.id}
              className={`flex items-center gap-4 px-4 py-3.5 ${i < projects.length - 1 ? 'border-b border-[#f5f5f5]' : ''}`}
            >
              <Link
                to={`/dashboard/projects/${p.id}`}
                className="flex items-center gap-4 flex-1 min-w-0 group"
              >
                <div className="w-12 h-12 rounded-lg bg-[#f5f5f5] overflow-hidden flex-shrink-0">
                  {p.cover_image_url && (
                    <img src={p.cover_image_url} className="w-full h-full object-cover" alt="" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold truncate group-hover:text-primary transition-colors">
                    {p.title}
                  </div>
                  <div className="text-[11px] text-[#aaa] truncate">{p.description ?? 'No description'}</div>
                </div>
              </Link>
              {p.website_url && (
                <a
                  href={p.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#777] hover:text-primary"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-[#777] hover:text-red-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete project?</AlertDialogTitle>
                    <AlertDialogDescription>
                      "{p.title}" will be permanently removed.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-red-500 hover:bg-red-600"
                      onClick={() => deleteProject.mutate(p.id)}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
        </div>
      ) : (
        <div className="border border-dashed border-[#e5e5e5] rounded-2xl p-16 text-center">
          <FileText className="w-10 h-10 text-[#ccc] mx-auto mb-4" />
          <p className="text-[16px] font-bold text-[#111] mb-1">No projects yet</p>
          <p className="text-[13px] text-[#888] mb-6 max-w-xs mx-auto">
            Create a project page to showcase your game, tool, or experiment.
          </p>
          <Button asChild className="bg-primary hover:bg-[#3a7aab] text-white">
            <Link to="/dashboard/projects/new">
              <Plus className="w-4 h-4 mr-2" />
              Upload your first project
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
