import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useCreateReply } from '@/hooks/useForum';

interface ReplyEditorProps {
  threadId: string;
  parentReplyId?: string;
  onSuccess?: () => void;
}

export function ReplyEditor({ threadId, parentReplyId, onSuccess }: ReplyEditorProps) {
  const [content, setContent] = useState('');
  const createReply = useCreateReply();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    createReply.mutate(
      {
        thread_id: threadId,
        content,
        parent_reply_id: parentReplyId,
      },
      {
        onSuccess: () => {
          setContent('');
          onSuccess?.();
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write a reply... Markdown supported."
        rows={4}
      />
      <div className="flex justify-end">
        <Button type="submit" disabled={createReply.isPending || !content.trim()}>
          {createReply.isPending ? 'Posting...' : 'Reply'}
        </Button>
      </div>
    </form>
  );
}
