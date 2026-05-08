import { useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useUserDevlogs, useDeleteDevlog } from '@/hooks/useDevlogs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, FileText, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function DashboardDevlogsPage() {
  const { data: devlogs, isLoading } = useUserDevlogs();
  const del = useDeleteDevlog();

  return (
    <DashboardLayout>
      <div className="w-full space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[20px] font-bold tracking-[-0.5px]">Devlogs</h1>
            <p className="text-[13px] text-[#888] mt-0.5">Updates & posts attached to your projects</p>
          </div>
          <Button asChild className="bg-primary hover:bg-[#3a7aab] text-white text-[13px] font-semibold">
            <Link to="/dashboard/devlogs/new"><Plus className="w-4 h-4 mr-2" />New devlog</Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        ) : (devlogs ?? []).length > 0 ? (
          <div className="bg-white border border-[#eee] rounded-xl overflow-hidden">
            {devlogs!.map((d: any, i: number) => (
              <div key={d.id} className={`flex items-center gap-4 px-4 py-3.5 ${i < devlogs!.length - 1 ? 'border-b border-[#f5f5f5]' : ''}`}>
                <div className="flex-1 min-w-0">
                  <Link to={`/dashboard/devlogs/${d.id}/edit`} className="text-[13px] font-semibold hover:text-primary truncate block">{d.title}</Link>
                  <div className="text-[11px] text-[#aaa]">
                    {d.projects?.title ?? 'Project deleted'} · {formatDistanceToNow(new Date(d.created_at), { addSuffix: true })}
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${d.status === 'published' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-[#f5f5f5] text-[#888] border border-[#ddd]'}`}>
                  {d.status === 'published' ? 'LIVE' : 'DRAFT'}
                </span>
                <button onClick={() => { if (confirm('Delete this devlog?')) del.mutate(d.id); }} className="text-[#aaa] hover:text-red-500 p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-[#e5e5e5] rounded-2xl p-16 text-center">
            <FileText className="w-8 h-8 text-[#ccc] mx-auto mb-3" />
            <p className="text-[14px] font-semibold text-[#111] mb-1">No devlogs yet</p>
            <p className="text-[12px] text-[#999] mb-4">Share progress on your projects.</p>
            <Button asChild className="bg-primary hover:bg-[#3a7aab] text-white text-[13px] font-semibold">
              <Link to="/dashboard/devlogs/new"><Plus className="w-4 h-4 mr-2" />Write your first devlog</Link>
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
