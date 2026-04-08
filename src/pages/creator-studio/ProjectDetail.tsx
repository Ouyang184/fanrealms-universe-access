import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, ExternalLink, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useProject, useProjectDevlogs } from "@/hooks/useProjects";
import { CreateDevlogDialog } from "@/components/projects/CreateDevlogDialog";
import { format } from "date-fns";

export default function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { project, isLoading: projectLoading } = useProject(projectId);
  const { devlogs, isLoading: devlogsLoading } = useProjectDevlogs(projectId);

  if (projectLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto p-6 text-center">
        <h2 className="text-xl font-semibold">Project not found</h2>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/creator-studio/projects')}>
          Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Back navigation */}
      <Button variant="ghost" className="gap-2" onClick={() => navigate('/creator-studio/projects')}>
        <ArrowLeft className="h-4 w-4" /> Back to Projects
      </Button>

      {/* Project Header */}
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{project.title}</h1>
            {project.description && (
              <p className="text-muted-foreground mt-2 max-w-2xl">{project.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            {project.website_url && (
              <Button variant="outline" size="sm" asChild>
                <a href={project.website_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-1" /> Website
                </a>
              </Button>
            )}
            {project.repository_url && (
              <Button variant="outline" size="sm" asChild>
                <a href={project.repository_url} target="_blank" rel="noopener noreferrer">
                  <Github className="h-4 w-4 mr-1" /> Repo
                </a>
              </Button>
            )}
          </div>
        </div>
        {project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {project.tags.map((tag) => (
              <Badge key={tag} variant="secondary">{tag}</Badge>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Devlogs Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Devlogs</h2>
          <CreateDevlogDialog projectId={project.id} />
        </div>

        {devlogsLoading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}><CardHeader><Skeleton className="h-5 w-48" /></CardHeader><CardContent><Skeleton className="h-4 w-full" /></CardContent></Card>
          ))
        ) : devlogs.length === 0 ? (
          <Card className="py-8">
            <div className="text-center">
              <h3 className="text-lg font-medium">No devlogs yet</h3>
              <p className="text-sm text-muted-foreground mt-1">Post your first development update for this project.</p>
              <div className="mt-4">
                <CreateDevlogDialog projectId={project.id} />
              </div>
            </div>
          </Card>
        ) : (
          devlogs.map((devlog) => (
            <Card key={devlog.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{devlog.title}</CardTitle>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(devlog.created_at), "MMM d, yyyy 'at' h:mm a")}
                  </span>
                </div>
                {devlog.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {devlog.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{devlog.content}</div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
