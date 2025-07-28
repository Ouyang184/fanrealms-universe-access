import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Flag, Shield, Trash2, Search, Hash } from 'lucide-react';
import { useFlagTag } from '@/hooks/useTags';

export function TagModerationPanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const { mutate: flagTag } = useFlagTag();

  // Fetch all tags with usage statistics
  const { data: tags = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('usage_count', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const filteredTags = tags.filter(tag => 
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFlagTag = (tagId: string) => {
    flagTag({ tagId, reason: 'Inappropriate content' }, {
      onSuccess: () => refetch()
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            Tag Moderation
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{tags.length}</div>
              <div className="text-sm text-muted-foreground">Total Tags</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {tags.filter(t => t.is_flagged).length}
              </div>
              <div className="text-sm text-muted-foreground">Flagged</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {tags.filter(t => t.is_moderated).length}
              </div>
              <div className="text-sm text-muted-foreground">Moderated</div>
            </div>
          </div>

          {/* Tags Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tag</TableHead>
                <TableHead>Usage Count</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTags.map((tag) => (
                <TableRow key={tag.id}>
                  <TableCell>
                    <Badge variant={tag.is_flagged ? "destructive" : "secondary"}>
                      {tag.name}
                    </Badge>
                  </TableCell>
                  <TableCell>{tag.usage_count}</TableCell>
                  <TableCell>
                    {tag.is_flagged ? (
                      <Badge variant="destructive">Flagged</Badge>
                    ) : tag.is_moderated ? (
                      <Badge variant="default">Moderated</Badge>
                    ) : (
                      <Badge variant="outline">Active</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(tag.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {!tag.is_flagged && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleFlagTag(tag.id)}
                        >
                          <Flag className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}