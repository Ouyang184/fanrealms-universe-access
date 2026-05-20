import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageSquarePlus, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

type FeedbackType = 'bug' | 'suggestion' | 'other';

const TYPES: { value: FeedbackType; label: string }[] = [
  { value: 'bug',        label: 'Bug' },
  { value: 'suggestion', label: 'Suggestion' },
  { value: 'other',      label: 'Other' },
];

export function FeedbackButton() {
  const { user } = useAuth();
  const location = useLocation();

  const [open, setOpen]       = useState(false);
  const [type, setType]       = useState<FeedbackType>('suggestion');
  const [message, setMessage] = useState('');
  const [email, setEmail]     = useState(user?.email ?? '');
  const [sending, setSending] = useState(false);

  const reset = () => {
    setType('suggestion');
    setMessage('');
    setEmail(user?.email ?? '');
  };

  const handleClose = () => {
    setOpen(false);
    reset();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSending(true);
    const { error } = await supabase.from('feedback').insert({
      type,
      message:  message.trim(),
      email:    email.trim() || null,
      user_id:  user?.id ?? null,
      page_url: location.pathname + location.search,
    });
    setSending(false);

    if (error) {
      toast.error('Failed to send feedback. Please try again.');
      return;
    }

    toast.success('Thanks for the feedback!');
    handleClose();
  };

  return (
    <>
      {/* Floating trigger */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-full bg-primary text-primary-foreground text-[13px] font-semibold shadow-lg hover:bg-primary/90 transition-colors"
        aria-label="Send feedback"
      >
        <MessageSquarePlus className="w-4 h-4" />
        Feedback
      </button>

      {/* Dialog overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end p-4 sm:p-6">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30"
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <div className="relative w-full sm:w-[360px] bg-background border border-border rounded-2xl shadow-xl p-5 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-semibold">Send feedback</h2>
              <button
                onClick={handleClose}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type selector */}
              <div className="flex gap-2">
                {TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setType(t.value)}
                    className={`flex-1 py-1.5 rounded-lg text-[13px] font-medium border transition-colors ${
                      type === t.value
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border text-muted-foreground hover:border-foreground/30'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Message */}
              <Textarea
                placeholder={
                  type === 'bug'
                    ? 'What went wrong? What did you expect to happen?'
                    : type === 'suggestion'
                    ? 'What would make FanRealms better?'
                    : 'What\'s on your mind?'
                }
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                required
                className="resize-none text-[13px]"
              />

              {/* Email — pre-filled if logged in */}
              <Input
                type="email"
                placeholder="Email (optional — so I can follow up)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-[13px]"
              />

              <Button
                type="submit"
                className="w-full"
                disabled={sending || !message.trim()}
              >
                {sending ? 'Sending…' : (
                  <><Send className="w-4 h-4 mr-2" />Send feedback</>
                )}
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
