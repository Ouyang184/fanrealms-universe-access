import { useEffect } from "react";
import { MainLayout } from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Filter,
  Heart,
  MessageSquare,
  Share2,
  Bookmark,
  MoreHorizontal,
  Clock,
  Video,
  FileText,
  ImageIcon,
  Music,
  FileAudio,
  Download,
  Eye,
  ThumbsUp,
  Calendar,
  Bell,
  Users,
} from "lucide-react";

// Add TypeScript interfaces for our feed data
interface Creator {
  id: number;
  name: string;
  username: string;
  avatar: string;
  tier: {
    name: string;
    color: string;
  };
}

// Define base content and specific content types
interface BaseContent {
  title: string;
  description: string;
  thumbnail?: string;
  type: string;
  preview: boolean;
}

interface VideoContent extends BaseContent {
  type: "video";
  duration: string;
}

interface TutorialContent extends BaseContent {
  type: "tutorial";
  duration: string;
}

interface DownloadContent extends BaseContent {
  type: "download";
  fileSize: string;
}

interface PostContent extends BaseContent {
  type: "post";
  images?: string[];
}

interface CourseContent extends BaseContent {
  type: "course";
  lessons: number;
  duration: string;
}

interface EventContent extends BaseContent {
  type: "event";
  date: string;
}

interface WorkshopContent extends BaseContent {
  type: "workshop";
  duration: string;
}

type ContentType = VideoContent | TutorialContent | DownloadContent | PostContent | CourseContent | EventContent | WorkshopContent;

interface FeedPost {
  id: number;
  creator: Creator;
  content: ContentType;
  metadata: {
    posted: string;
    views?: number;
    downloads?: number;
    likes: number;
    comments: number;
    isNew?: boolean;
    interested?: number;
  };
}

// Sample data for feed posts
const feedPosts: FeedPost[] = [
  {
    id: 1,
    creator: {
      id: 1,
      name: "Digital Art Master",
      username: "artmaster",
      avatar: "/placeholder.svg?height=50&width=50",
      tier: {
        name: "Pro Artist",
        color: "purple",
      },
    },
    content: {
      title: "Character Design Masterclass Part 4",
      description:
        "In this tutorial, I'll show you advanced techniques for designing expressive character faces and how to convey emotion through subtle details.",
      thumbnail: "/placeholder.svg?height=400&width=800&text=Character+Design",
      type: "video",
      duration: "1h 15m",
      preview: true,
    },
    metadata: {
      posted: "2 hours ago",
      views: 1245,
      likes: 87,
      comments: 32,
      isNew: true,
    },
  },
  {
    id: 2,
    creator: {
      id: 2,
      name: "Game Development Pro",
      username: "gamedevpro",
      avatar: "/placeholder.svg?height=50&width=50",
      tier: {
        name: "Indie Developer",
        color: "green",
      },
    },
    content: {
      title: "Implementing Advanced AI Behavior Trees",
      description:
        "Learn how to create complex enemy AI behaviors using behavior trees in Unity. This tutorial covers decision making, state management, and performance optimization.",
      thumbnail: "/placeholder.svg?height=400&width=800&text=Game+AI",
      type: "tutorial",
      duration: "2h 10m",
      preview: false,
    },
    metadata: {
      posted: "Yesterday",
      views: 876,
      likes: 54,
      comments: 18,
      isNew: true,
    },
  },
  {
    id: 3,
    creator: {
      id: 3,
      name: "Music Production Studio",
      username: "musicstudio",
      avatar: "/placeholder.svg?height=50&width=50",
      tier: {
        name: "Producer Plus",
        color: "blue",
      },
    },
    content: {
      title: "June Sample Pack: Ambient Textures",
      description:
        "This month's sample pack includes 50+ ambient textures, drones, and atmospheric sounds perfect for creating immersive soundscapes and background elements.",
      thumbnail: "/placeholder.svg?height=400&width=800&text=Sample+Pack",
      type: "download",
      fileSize: "450 MB",
      preview: true,
    },
    metadata: {
      posted: "3 days ago",
      downloads: 342,
      likes: 145,
      comments: 27,
      isNew: true,
    },
  },
  {
    id: 4,
    creator: {
      id: 1,
      name: "Digital Art Master",
      username: "artmaster",
      avatar: "/placeholder.svg?height=50&width=50",
      tier: {
        name: "Pro Artist",
        color: "purple",
      },
    },
    content: {
      title: "Weekly Art Challenge: Cyberpunk Environments",
      description:
        "This week's art challenge is all about cyberpunk environments! Create your own futuristic cityscape with neon lights and dystopian elements. Submit your work by Friday for feedback!",
      images: [
        "/placeholder.svg?height=200&width=300&text=Example+1",
        "/placeholder.svg?height=200&width=300&text=Example+2",
      ],
      type: "post",
      preview: true,
    },
    metadata: {
      posted: "4 days ago",
      views: 932,
      likes: 76,
      comments: 41,
      isNew: false,
    },
  },
  {
    id: 5,
    creator: {
      id: 5,
      name: "Photo Masters",
      username: "photomasters",
      avatar: "/placeholder.svg?height=50&width=50",
      tier: {
        name: "Pro Photographer",
        color: "cyan",
      },
    },
    content: {
      title: "Landscape Photography Essentials",
      description:
        "A comprehensive guide to capturing stunning landscape photos. Learn about composition, lighting, equipment, and post-processing techniques.",
      thumbnail: "/placeholder.svg?height=400&width=800&text=Landscape+Photography",
      type: "course",
      lessons: 12,
      duration: "3h 15m",
      preview: false,
    },
    metadata: {
      posted: "5 days ago",
      views: 1567,
      likes: 124,
      comments: 35,
      isNew: false,
    },
  },
];

// Type guard to check if content has a date property
function isEventContent(content: ContentType): content is EventContent {
  return content.type === "event";
}

// Get tier badge color
const getTierColor = (color: string) => {
  switch (color) {
    case "purple":
      return "bg-purple-600";
    case "green":
      return "bg-green-600";
    case "blue":
      return "bg-blue-600";
    case "amber":
      return "bg-amber-600";
    case "cyan":
      return "bg-cyan-600";
    case "orange":
      return "bg-orange-600";
    case "red":
      return "bg-red-600";
    default:
      return "bg-purple-600";
  }
};

// Get content type icon
const getContentTypeIcon = (type: string) => {
  switch (type) {
    case "video":
      return <Video className="h-4 w-4" />;
    case "tutorial":
      return <FileText className="h-4 w-4" />;
    case "download":
      return <Download className="h-4 w-4" />;
    case "post":
      return <FileText className="h-4 w-4" />;
    case "course":
      return <BookIcon className="h-4 w-4" />;
    case "event":
      return <Calendar className="h-4 w-4" />;
    case "workshop":
      return <Users className="h-4 w-4" />;
    case "audio":
      return <FileAudio className="h-4 w-4" />;
    case "image":
      return <ImageIcon className="h-4 w-4" />;
    case "music":
      return <Music className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

export default function Feed() {
  // Set document title when component mounts
  useEffect(() => {
    document.title = "Feed | Creator Platform";
  }, []);

  return (
    <MainLayout showTabs={true}>
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Your Feed</h1>
            <p className="text-muted-foreground">Recent posts from creators you follow</p>
          </div>
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>All Content</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Videos</DropdownMenuItem>
                <DropdownMenuItem>Tutorials</DropdownMenuItem>
                <DropdownMenuItem>Downloads</DropdownMenuItem>
                <DropdownMenuItem>Posts</DropdownMenuItem>
                <DropdownMenuItem>Events</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Free Content Only</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Feed Tabs */}
        <Tabs defaultValue="all" className="mb-8">
          <TabsList>
            <TabsTrigger value="all">
              All Posts
            </TabsTrigger>
            <TabsTrigger value="unread">
              Unread
              <Badge className="ml-2 bg-red-500 h-5 min-w-[20px] px-1">3</Badge>
            </TabsTrigger>
            <TabsTrigger value="saved">
              Saved
            </TabsTrigger>
          </TabsList>

          {/* All Posts Tab */}
          <TabsContent value="all" className="mt-6 space-y-6">
            {feedPosts.map((post) => (
              <Card key={post.id}>
                <CardContent className="p-0">
                  {/* Post Header */}
                  <div className="p-4 flex items-center justify-between border-b">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={post.creator.avatar || "/placeholder.svg"} alt={post.creator.name} />
                        <AvatarFallback>{post.creator.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{post.creator.name}</h3>
                          <Badge variant="outline" className={`${getTierColor(post.creator.tier.color)} border-0 text-white`}>{post.creator.tier.name}</Badge>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{post.metadata.posted}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      {post.metadata.isNew && <Badge className="mr-2 bg-blue-600">New</Badge>}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Save Post</DropdownMenuItem>
                          <DropdownMenuItem>Hide Post</DropdownMenuItem>
                          <DropdownMenuItem>Turn Off Notifications</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>Report Content</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Post Content */}
                  <div>
                    <div className="p-4">
                      <h2 className="text-xl font-bold mb-2">{post.content.title}</h2>
                      <p className="text-muted-foreground">{post.content.description}</p>
                    </div>

                    {/* Post Media */}
                    <div className="relative">
                      {post.content.thumbnail && (
                        <img
                          src={post.content.thumbnail || "/placeholder.svg"}
                          alt={post.content.title}
                          className="w-full object-cover max-h-[400px]"
                        />
                      )}
                      {'images' in post.content && post.content.images && (
                        <div className="grid grid-cols-2 gap-2 p-4">
                          {post.content.images.map((image, index) => (
                            <img
                              key={index}
                              src={image || "/placeholder.svg"}
                              alt={`${post.content.title} - Image ${index + 1}`}
                              className="w-full h-40 object-cover rounded-md"
                            />
                          ))}
                        </div>
                      )}
                      {/* Content Type Badge */}
                      <div className="absolute top-2 left-2 bg-background/70 px-2 py-1 rounded text-xs flex items-center gap-1">
                        {getContentTypeIcon(post.content.type)}
                        {post.content.type.charAt(0).toUpperCase() + post.content.type.slice(1)}
                        {'duration' in post.content && post.content.duration && ` • ${post.content.duration}`}
                        {'fileSize' in post.content && post.content.fileSize && ` • ${post.content.fileSize}`}
                        {'lessons' in post.content && post.content.lessons && ` • ${post.content.lessons} lessons`}
                        {isEventContent(post.content) && post.content.date && ` • ${post.content.date}`}
                      </div>
                      {/* Preview Badge */}
                      {!post.content.preview && (
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-primary">Subscribers Only</Badge>
                        </div>
                      )}
                    </div>

                    {/* Post Stats and Actions */}
                    <div className="p-4 flex flex-wrap items-center justify-between border-t">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 text-sm">
                          {post.metadata.views && (
                            <>
                              <Eye className="h-4 w-4 text-muted-foreground" />
                              <span>{post.metadata.views.toLocaleString()}</span>
                            </>
                          )}
                          {post.metadata.downloads && (
                            <>
                              <Download className="h-4 w-4 text-muted-foreground" />
                              <span>{post.metadata.downloads.toLocaleString()}</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <ThumbsUp className="h-4 w-4 text-muted-foreground" />
                          <span>{post.metadata.likes.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          <span>{post.metadata.comments.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2 sm:mt-0">
                        <Button variant="ghost" size="sm" className="gap-2">
                          <Heart className="h-4 w-4" />
                          Like
                        </Button>
                        <Button variant="ghost" size="sm" className="gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Comment
                        </Button>
                        <Button variant="ghost" size="sm" className="gap-2">
                          <Share2 className="h-4 w-4" />
                          Share
                        </Button>
                        <Button variant="ghost" size="sm" className="gap-2">
                          <Bookmark className="h-4 w-4" />
                          Save
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/50 p-4 flex justify-between">
                  <Button variant="ghost" size="sm" className="text-primary">
                    View All Comments
                  </Button>
                  <Button variant="default" size="sm">
                    {post.content.preview ? "View Full Post" : "Subscribe to View"}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </TabsContent>

          {/* Unread Tab */}
          <TabsContent value="unread" className="mt-6 space-y-6">
            {feedPosts
              .filter((post) => post.metadata.isNew)
              .map((post) => (
                <Card key={post.id}>
                  <CardContent className="p-0">
                    {/* Post Header */}
                    <div className="p-4 flex items-center justify-between border-b">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={post.creator.avatar || "/placeholder.svg"} alt={post.creator.name} />
                          <AvatarFallback>{post.creator.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{post.creator.name}</h3>
                            <Badge variant="outline" className={`${getTierColor(post.creator.tier.color)} border-0 text-white`}>
                              {post.creator.tier.name}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{post.metadata.posted}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Badge className="mr-2 bg-blue-600">New</Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Mark as Read</DropdownMenuItem>
                            <DropdownMenuItem>Save Post</DropdownMenuItem>
                            <DropdownMenuItem>Hide Post</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Report Content</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Post Content */}
                    <div>
                      <div className="p-4">
                        <h2 className="text-xl font-bold mb-2">{post.content.title}</h2>
                        <p className="text-muted-foreground">{post.content.description}</p>
                      </div>

                      {/* Post Media */}
                      <div className="relative">
                        {post.content.thumbnail && (
                          <img
                            src={post.content.thumbnail || "/placeholder.svg"}
                            alt={post.content.title}
                            className="w-full object-cover max-h-[400px]"
                          />
                        )}
                        {'images' in post.content && post.content.images && (
                          <div className="grid grid-cols-2 gap-2 p-4">
                            {post.content.images.map((image, index) => (
                              <img
                                key={index}
                                src={image || "/placeholder.svg"}
                                alt={`${post.content.title} - Image ${index + 1}`}
                                className="w-full h-40 object-cover rounded-md"
                              />
                            ))}
                          </div>
                        )}
                        {/* Content Type Badge */}
                        <div className="absolute top-2 left-2 bg-background/70 px-2 py-1 rounded text-xs flex items-center gap-1">
                          {getContentTypeIcon(post.content.type)}
                          {post.content.type.charAt(0).toUpperCase() + post.content.type.slice(1)}
                          {'duration' in post.content && post.content.duration && ` • ${post.content.duration}`}
                          {'fileSize' in post.content && post.content.fileSize && ` • ${post.content.fileSize}`}
                          {'lessons' in post.content && post.content.lessons && ` • ${post.content.lessons} lessons`}
                          {isEventContent(post.content) && post.content.date && ` • ${post.content.date}`}
                        </div>
                        {/* Preview Badge */}
                        {!post.content.preview && (
                          <div className="absolute top-2 right-2">
                            <Badge className="bg-primary">Subscribers Only</Badge>
                          </div>
                        )}
                      </div>

                      {/* Post Stats and Actions */}
                      <div className="p-4 flex flex-wrap items-center justify-between border-t">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1 text-sm">
                            {post.metadata.views && (
                              <>
                                <Eye className="h-4 w-4 text-muted-foreground" />
                                <span>{post.metadata.views.toLocaleString()}</span>
                              </>
                            )}
                            {post.metadata.downloads && (
                              <>
                                <Download className="h-4 w-4 text-muted-foreground" />
                                <span>{post.metadata.downloads.toLocaleString()}</span>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <ThumbsUp className="h-4 w-4 text-muted-foreground" />
                            <span>{post.metadata.likes.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                            <span>{post.metadata.comments.toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2 sm:mt-0">
                          <Button variant="ghost" size="sm" className="gap-2">
                            <Heart className="h-4 w-4" />
                            Like
                          </Button>
                          <Button variant="ghost" size="sm" className="gap-2">
                            <MessageSquare className="h-4 w-4" />
                            Comment
                          </Button>
                          <Button variant="ghost" size="sm" className="gap-2">
                            <Share2 className="h-4 w-4" />
                            Share
                          </Button>
                          <Button variant="ghost" size="sm" className="gap-2">
                            <Bookmark className="h-4 w-4" />
                            Save
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-muted/50 p-4 flex justify-between">
                    <Button variant="ghost" size="sm" className="text-primary">
                      View All Comments
                    </Button>
                    <Button variant="default" size="sm">
                      {post.content.preview ? "View Full Post" : "Subscribe to View"}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
          </TabsContent>

          {/* Saved Tab */}
          <TabsContent value="saved" className="mt-6">
            <div className="text-center py-12">
              <Bookmark className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-medium mb-2">No saved posts yet</h3>
              <p className="text-muted-foreground mb-6">
                When you save posts from your feed, they'll appear here for easy access later.
              </p>
              <Button>Browse Your Feed</Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

// BookIcon component
function BookIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    </svg>
  );
}
