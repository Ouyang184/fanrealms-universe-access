
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function PopularTagsSection() {
  // Updated to match the tags from ProfileInfoForm
  const popularTags = [
    "Art",
    "Music", 
    "Gaming",
    "Education",
    "Writing",
    "Photography",
    "Fitness",
    "Cooking",
    "Technology",
    "Travel",
    "Fashion",
    "Design",
    "Podcasting",
    "Comedy",
    "Film",
    "Dance",
    "Science",
    "Finance",
    "Business",
    "Crafts"
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
