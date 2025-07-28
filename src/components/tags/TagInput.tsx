import React, { useState, useRef, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Plus, Hash } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

interface TagInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  maxTags?: number;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
}

export function TagInput({ 
  tags, 
  onTagsChange, 
  maxTags = 10, 
  placeholder = "Add tags...",
  disabled = false,
  label = "Tags"
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch popular tags for autocomplete
  const { data: popularTags = [] } = useQuery({
    queryKey: ['popularTags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tags')
        .select('name, usage_count')
        .eq('is_flagged', false)
        .order('usage_count', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data.map(tag => tag.name);
    }
  });

  // Filter suggestions based on input
  const filteredSuggestions = popularTags.filter(tag => 
    tag.toLowerCase().includes(inputValue.toLowerCase()) && 
    !tags.includes(tag)
  ).slice(0, 8);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setShowSuggestions(value.length > 0);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue.trim());
    } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      // Remove last tag when backspacing on empty input
      onTagsChange(tags.slice(0, -1));
    }
  };

  const addTag = (tagName: string) => {
    if (!tagName || tags.includes(tagName) || tags.length >= maxTags) return;
    
    // Clean and normalize tag
    const cleanTag = tagName.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
    if (cleanTag && cleanTag.length <= 30) {
      onTagsChange([...tags, cleanTag]);
    }
    
    setInputValue('');
    setShowSuggestions(false);
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSuggestionClick = (tag: string) => {
    addTag(tag);
    inputRef.current?.focus();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <Hash className="h-4 w-4" />
        {label} ({tags.length}/{maxTags})
      </Label>
      
      {/* Tag Display */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((tag) => (
            <Badge 
              key={tag} 
              variant="secondary" 
              className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
            >
              {tag}
              {!disabled && (
                <button
                  onClick={() => removeTag(tag)}
                  className="ml-1 hover:text-destructive"
                  type="button"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="relative">
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          onFocus={() => setShowSuggestions(inputValue.length > 0)}
          placeholder={tags.length >= maxTags ? `Maximum ${maxTags} tags reached` : placeholder}
          disabled={disabled || tags.length >= maxTags}
          className="pr-10"
        />
        
        {inputValue && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => addTag(inputValue.trim())}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
            disabled={!inputValue.trim() || tags.includes(inputValue.trim()) || tags.length >= maxTags}
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}

        {/* Suggestions Dropdown */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border rounded-md shadow-lg max-h-48 overflow-auto">
            {filteredSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground text-sm"
                type="button"
              >
                <span className="flex items-center gap-2">
                  <Hash className="h-3 w-3 text-muted-foreground" />
                  {suggestion}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Add up to {maxTags} tags to help people discover your content. Use comma or Enter to add tags.
      </p>
    </div>
  );
}