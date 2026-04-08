import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

interface JobListingCardProps {
  listing: {
    id: string;
    title: string;
    description?: string | null;
    category: string;
    budget_min?: number | null;
    budget_max?: number | null;
    budget_type: string;
    deadline?: string | null;
    tags?: string[] | null;
    created_at: string;
    users?: { username: string; profile_picture?: string | null } | null;
  };
}

export function JobListingCard({ listing }: JobListingCardProps) {
  const budgetDisplay = () => {
    if (listing.budget_min && listing.budget_max) {
      return `$${listing.budget_min} - $${listing.budget_max}`;
    }
    if (listing.budget_min) return `From $${listing.budget_min}`;
    if (listing.budget_max) return `Up to $${listing.budget_max}`;
    return 'Negotiable';
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-base truncate">{listing.title}</h3>
              <Badge variant="outline">{listing.category}</Badge>
              <Badge variant="secondary" className="capitalize">{listing.budget_type}</Badge>
            </div>
            {listing.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{listing.description}</p>
            )}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />{budgetDisplay()}
              </span>
              {listing.deadline && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />Due {format(new Date(listing.deadline), 'MMM d, yyyy')}
                </span>
              )}
              <span>Posted {format(new Date(listing.created_at), 'MMM d')}</span>
            </div>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link to={`/jobs/${listing.id}`}>View</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
