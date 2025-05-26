
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { cn } from "@/lib/utils";

interface ContentCardProps {
  title: string;
  description: string;
  image?: string;
  authorName: string;
  authorAvatar?: string;
  date: string;
  className?: string;
}

export function ContentCard({
  title,
  description,
  image,
  authorName,
  authorAvatar,
  date,
  className,
}: ContentCardProps) {
  return (
    <Card className={cn("overflow-hidden transition-all hover:shadow-md", className)}>
      {image && (
        <div className="relative">
          <AspectRatio ratio={16 / 9}>
            <img 
              src={image} 
              alt={title} 
              className="object-cover w-full h-full"
            />
          </AspectRatio>
        </div>
      )}
      <CardHeader className="p-4">
        <div className="flex items-center gap-3 mb-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={authorAvatar || '/lovable-uploads/a88120a6-4c72-4539-b575-22350a7045c1.png'} alt={authorName} />
            <AvatarFallback>{authorName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <CardTitle className="text-sm font-medium">{authorName}</CardTitle>
            <CardDescription className="text-xs">{date}</CardDescription>
          </div>
        </div>
        <CardTitle className="text-lg leading-tight line-clamp-2">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <CardDescription className="line-clamp-3">{description}</CardDescription>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between">
        <Button variant="outline" size="sm">Read More</Button>
      </CardFooter>
    </Card>
  );
}
