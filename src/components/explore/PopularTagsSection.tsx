import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePopularTags, useTags } from "@/hooks/useTags";

export function PopularTagsSection() {
  const [showAll, setShowAll] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: popularTags = [] } = usePopularTags(20);
  const { data: allTags = [] } = useTags();

  const allTagNames = useMemo(() => allTags.map((t) => t.name), [allTags]);
  const tagsToShow = showAll ? allTagNames : popularTags;

  const handleTagClick = (tag: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("tag", tag);
    setSearchParams(next);
  };

  return (
    <section className="mb-10">
      <h2 className="text-2xl font-bold mb-6 text-white">Popular Tags</h2>
      <div className="flex flex-wrap gap-3 items-center">
        {tagsToShow.map((tag, index) => (
          <Badge
            key={index}
            onClick={() => handleTagClick(tag)}
            className="bg-gray-800 hover:bg-gray-700 cursor-pointer text-sm py-1.5 px-3 text-white"
          >
            {tag}
          </Badge>
        ))}
        <Button
          variant="ghost"
          size="sm"
          className="text-purple-400"
          onClick={() => setShowAll((s) => !s)}
        >
          {showAll ? "Show Less" : "View All Tags"}
        </Button>
      </div>
    </section>
  );
}
