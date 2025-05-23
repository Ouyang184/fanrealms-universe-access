
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function PopularTagsSection() {
  const popularTags = [
    "Digital Art",
    "Game Development",
    "Music Production",
    "Photography",
    "Creative Writing",
    "Cooking",
    "Fitness",
    "Web Development",
    "Animation",
    "Podcasting",
    "Graphic Design",
    "3D Modeling",
    "Video Editing",
    "Illustration",
    "UI/UX Design",
  ];

  return (
    <section className="mb-10">
      <h2 className="text-2xl font-bold mb-6">Popular Tags</h2>
      <div className="flex flex-wrap gap-3">
        {popularTags.map((tag, index) => (
          <Badge key={index} className="bg-gray-800 hover:bg-gray-700 cursor-pointer text-sm py-1.5 px-3">
            {tag}
          </Badge>
        ))}
        <Button variant="ghost" size="sm" className="text-purple-400">
          View All Tags
        </Button>
      </div>
    </section>
  );
}
