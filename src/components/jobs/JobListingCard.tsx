import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Briefcase } from 'lucide-react';

interface JobListing {
  id: string;
  title: string;
  category?: string;
  budget_type?: string;
  budget_min?: number;
  created_at: string;
}

interface JobListingCardProps {
  listing: JobListing;
}

export function JobListingCard({ listing }: JobListingCardProps) {
  return (
    <Link
      to={`/jobs/${listing.id}`}
      className="group bg-white rounded-xl border border-[#eee] hover:border-[#ccc] p-4 transition-colors flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        {listing.category && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            {listing.category}
          </span>
        )}
        <Briefcase className="w-4 h-4 text-[#ccc]" />
      </div>
      <div className="text-[14px] font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors min-h-[42px]">
        {listing.title}
      </div>
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-[#f5f5f5]">
        <div className="text-[11px] text-[#888]">
          {formatDistanceToNow(new Date(listing.created_at), { addSuffix: true })}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {listing.budget_type && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#f5f5f5] text-[#555]">
              {listing.budget_type}
            </span>
          )}
          {listing.budget_min && (
            <span className="text-[13px] font-bold">${listing.budget_min}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
