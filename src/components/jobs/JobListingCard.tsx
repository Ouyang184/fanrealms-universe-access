import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

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
  isLast?: boolean;
}

export function JobListingCard({ listing, isLast }: JobListingCardProps) {
  const initials = (listing.category || "JB").slice(0, 2).toUpperCase();

  return (
    <Link
      to={`/jobs/${listing.id}`}
      className={`flex items-center gap-3 px-4 py-3.5 hover:bg-[#fafafa] transition-colors ${!isLast ? 'border-b border-[#f5f5f5]' : ''}`}
    >
      <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
      <div className="w-8 h-8 rounded-lg bg-[#f0f0f0] flex items-center justify-center text-[11px] font-bold text-[#888] flex-shrink-0">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold truncate">{listing.title}</div>
        <div className="text-[11px] text-[#aaa] mt-0.5">
          {listing.category} · {formatDistanceToNow(new Date(listing.created_at), { addSuffix: true })}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {listing.budget_type && (
          <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[#f5f5f5] text-[#555]">
            {listing.budget_type}
          </span>
        )}
        {listing.budget_min && (
          <span className="text-[13px] font-bold">${listing.budget_min}</span>
        )}
      </div>
    </Link>
  );
}
