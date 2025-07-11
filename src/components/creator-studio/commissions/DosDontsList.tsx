
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';

interface DosListProps {
  dos: string[];
  currentDo: string;
  onCurrentDoChange: (value: string) => void;
  onAddDo: () => void;
  onRemoveDo: (index: number) => void;
}

interface DontsListProps {
  donts: string[];
  currentDont: string;
  onCurrentDontChange: (value: string) => void;
  onAddDont: () => void;
  onRemoveDont: (index: number) => void;
}

export function DosList({ dos, currentDo, onCurrentDoChange, onAddDo, onRemoveDo }: DosListProps) {
  return (
    <div>
      <Label>Will Do</Label>
      <div className="flex gap-2 mt-2">
        <Input
          value={currentDo}
          onChange={(e) => onCurrentDoChange(e.target.value)}
          placeholder="Add something you will do..."
          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), onAddDo())}
        />
        <Button type="button" onClick={onAddDo} size="sm">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        {dos.map((item, index) => (
          <Badge key={index} variant="secondary" className="flex items-center gap-1">
            {item}
            <X 
              className="h-3 w-3 cursor-pointer" 
              onClick={() => onRemoveDo(index)}
            />
          </Badge>
        ))}
      </div>
    </div>
  );
}

export function DontsList({ donts, currentDont, onCurrentDontChange, onAddDont, onRemoveDont }: DontsListProps) {
  return (
    <div>
      <Label>Won't Do</Label>
      <div className="flex gap-2 mt-2">
        <Input
          value={currentDont}
          onChange={(e) => onCurrentDontChange(e.target.value)}
          placeholder="Add something you won't do..."
          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), onAddDont())}
        />
        <Button type="button" onClick={onAddDont} size="sm">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        {donts.map((item, index) => (
          <Badge key={index} variant="destructive" className="flex items-center gap-1">
            {item}
            <X 
              className="h-3 w-3 cursor-pointer" 
              onClick={() => onRemoveDont(index)}
            />
          </Badge>
        ))}
      </div>
    </div>
  );
}
