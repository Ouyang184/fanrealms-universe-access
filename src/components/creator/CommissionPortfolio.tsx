
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Images } from 'lucide-react';

interface PortfolioItem {
  id: string;
  title?: string;
  image_url: string;
  description?: string;
  commission_type?: {
    name: string;
  };
}

interface CommissionPortfolioProps {
  items: PortfolioItem[];
}

export function CommissionPortfolio({ items }: CommissionPortfolioProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Images className="h-5 w-5" />
          Commission Portfolio
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <div key={item.id} className="group cursor-pointer">
              <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                <img
                  src={item.image_url}
                  alt={item.title || 'Commission example'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              </div>
              {(item.title || item.commission_type) && (
                <div className="mt-2 space-y-1">
                  {item.title && (
                    <p className="text-sm font-medium truncate">{item.title}</p>
                  )}
                  {item.commission_type && (
                    <Badge variant="secondary" className="text-xs">
                      {item.commission_type.name}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
