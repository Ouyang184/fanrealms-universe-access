
import {
  Search,
  Filter,
  Calendar,
  FileText,
  ImageIcon,
  Video,
  Music,
  MoreHorizontal,
  Plus,
  EyeOff,
  Clock,
  Edit,
  Copy,
  Trash,
  ChevronDown,
  Star,
  CalendarDays,
  CheckCircle2,
  MessageSquare,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { MainLayout } from "@/components/main-layout"

export default function CreatorPostsPage() {
  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Posts</h1>
            <p className="text-gray-400 mt-1">Create and manage your content</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button className="bg-purple-600 hover:bg-purple-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Create New Post
            </Button>
            <Button variant="outline" className="border-gray-700">
              <Calendar className="h-4 w-4 mr-2" />
              Content Calendar
            </Button>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative w-full sm:w-auto sm:flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search posts..."
              className="pl-10 bg-gray-900 border-gray-700 focus-visible:ring-purple-500 w-full"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button variant="outline" className="border-gray-700">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-gray-700">
                  <span>Sort by</span>
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-gray-900 border-gray-800 text-white">
                <DropdownMenuItem>Newest first</DropdownMenuItem>
                <DropdownMenuItem>Oldest first</DropdownMenuItem>
                <DropdownMenuItem>Most viewed</DropdownMenuItem>
                <DropdownMenuItem>Most engagement</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <div className="flex justify-between items-center">
            <TabsList className="bg-gray-900">
              <TabsTrigger value="all" className="data-[state=active]:bg-purple-900/40">
                All Posts
              </TabsTrigger>
              <TabsTrigger value="articles" className="data-[state=active]:bg-purple-900/40">
                <FileText className="h-4 w-4 mr-2" />
                Articles
              </TabsTrigger>
              <TabsTrigger value="images" className="data-[state=active]:bg-purple-900/40">
                <ImageIcon className="h-4 w-4 mr-2" />
                Images
              </TabsTrigger>
              <TabsTrigger value="videos" className="data-[state=active]:bg-purple-900/40">
                <Video className="h-4 w-4 mr-2" />
                Videos
              </TabsTrigger>
              <TabsTrigger value="audio" className="data-[state=active]:bg-purple-900/40">
                <Music className="h-4 w-4 mr-2" />
                Audio
              </TabsTrigger>
            </TabsList>
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-400">
              <span>Show draft posts</span>
              <Switch id="show-drafts" />
            </div>
          </div>

          {/* All Posts Tab Content */}
          <TabsContent value="all" className="space-y-4">
            {/* Post Item */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-white">Behind the Scenes of My Latest Project</CardTitle>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400">
                      <Badge variant="outline" className="bg-green-900/30 text-green-400 border-green-800">
                        Published
                      </Badge>
                      <span>May 10, 2023</span>
                      <span>•</span>
                      <span>Article</span>
                      <span>•</span>
                      <span className="flex items-center">
                        <EyeOff className="h-3 w-3 mr-1" />
                        Premium
                      </span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                        <MoreHorizontal className="h-5 w-5" />
                        <span className="sr-only">More options</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 bg-gray-900 border-gray-800 text-white" align="end">
                      <DropdownMenuItem className="flex items-center gap-2">
                        <Edit className="h-4 w-4" /> Edit post
                      </DropdownMenuItem>
                      <DropdownMenuItem className="flex items-center gap-2">
                        <EyeOff className="h-4 w-4" /> Change visibility
                      </DropdownMenuItem>
                      <DropdownMenuItem className="flex items-center gap-2">
                        <Copy className="h-4 w-4" /> Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem className="flex items-center gap-2 text-red-400">
                        <Trash className="h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="pb-3">
                <p className="text-gray-300 line-clamp-2">
                  In this exclusive post, I share the creative process behind my latest project. From initial sketches
                  to the final product, you'll get to see everything that went into making it a reality.
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant="secondary" className="bg-gray-800 hover:bg-gray-700 text-gray-300">
                    creative
                  </Badge>
                  <Badge variant="secondary" className="bg-gray-800 hover:bg-gray-700 text-gray-300">
                    behind-the-scenes
                  </Badge>
                  <Badge variant="secondary" className="bg-gray-800 hover:bg-gray-700 text-gray-300">
                    project
                  </Badge>
                </div>
              </CardContent>
              <CardFooter className="flex items-center justify-between pt-0">
                <div className="flex items-center text-sm text-gray-400">
                  <div className="flex items-center mr-4">
                    <EyeOff className="h-4 w-4 mr-1" />
                    <span>1,245</span>
                  </div>
                  <div className="flex items-center mr-4">
                    <Star className="h-4 w-4 mr-1" />
                    <span>98</span>
                  </div>
                  <div className="flex items-center">
                    <MessageSquare className="h-4 w-4 mr-1" />
                    <span>24</span>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="text-xs text-gray-400 mr-2">Available to:</div>
                  <Badge className="bg-purple-900/40 text-purple-300">Premium</Badge>
                  <Badge className="bg-indigo-900/40 text-indigo-300 ml-1">VIP</Badge>
                </div>
              </CardFooter>
            </Card>

            {/* Post Item - Scheduled */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-white">5 Tips for Better Digital Art Composition</CardTitle>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400">
                      <Badge variant="outline" className="bg-blue-900/30 text-blue-400 border-blue-800">
                        Scheduled
                      </Badge>
                      <span>May 15, 2023 - 9:00 AM</span>
                      <span>•</span>
                      <span>Article</span>
                      <span>•</span>
                      <span className="flex items-center">
                        <EyeOff className="h-3 w-3 mr-1" />
                        Free
                      </span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                        <MoreHorizontal className="h-5 w-5" />
                        <span className="sr-only">More options</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 bg-gray-900 border-gray-800 text-white" align="end">
                      <DropdownMenuItem className="flex items-center gap-2">
                        <Edit className="h-4 w-4" /> Edit post
                      </DropdownMenuItem>
                      <DropdownMenuItem className="flex items-center gap-2">
                        <Clock className="h-4 w-4" /> Reschedule
                      </DropdownMenuItem>
                      <DropdownMenuItem className="flex items-center gap-2">
                        <Copy className="h-4 w-4" /> Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem className="flex items-center gap-2 text-red-400">
                        <Trash className="h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="pb-3">
                <p className="text-gray-300 line-clamp-2">
                  Learn how to improve your digital art with these 5 essential composition tips. Whether you're a
                  beginner or experienced artist, these guidelines will help take your work to the next level.
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant="secondary" className="bg-gray-800 hover:bg-gray-700 text-gray-300">
                    tutorial
                  </Badge>
                  <Badge variant="secondary" className="bg-gray-800 hover:bg-gray-700 text-gray-300">
                    digital-art
                  </Badge>
                  <Badge variant="secondary" className="bg-gray-800 hover:bg-gray-700 text-gray-300">
                    tips
                  </Badge>
                </div>
              </CardContent>
              <CardFooter className="flex items-center justify-between pt-0">
                <div className="flex items-center text-sm text-gray-400">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>Publishes in 5 days</span>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="text-xs text-gray-400 mr-2">Available to:</div>
                  <Badge className="bg-green-900/40 text-green-300">All</Badge>
                </div>
              </CardFooter>
            </Card>

            {/* Post Item - Draft */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-white">New Studio Setup Tour (Work in Progress)</CardTitle>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400">
                      <Badge variant="outline" className="bg-gray-800 text-gray-400 border-gray-700">
                        Draft
                      </Badge>
                      <span>Last edited: May 8, 2023</span>
                      <span>•</span>
                      <span>Video</span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                        <MoreHorizontal className="h-5 w-5" />
                        <span className="sr-only">More options</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 bg-gray-900 border-gray-800 text-white" align="end">
                      <DropdownMenuItem className="flex items-center gap-2">
                        <Edit className="h-4 w-4" /> Continue editing
                      </DropdownMenuItem>
                      <DropdownMenuItem className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" /> Publish now
                      </DropdownMenuItem>
                      <DropdownMenuItem className="flex items-center gap-2">
                        <Clock className="h-4 w-4" /> Schedule
                      </DropdownMenuItem>
                      <DropdownMenuItem className="flex items-center gap-2 text-red-400">
                        <Trash className="h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="pb-3">
                <p className="text-gray-300 line-clamp-2">
                  Take a tour of my newly renovated studio space. This video will showcase all the new equipment,
                  lighting setup, and organization systems I've implemented.
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant="secondary" className="bg-gray-800 hover:bg-gray-700 text-gray-300">
                    studio-tour
                  </Badge>
                  <Badge variant="secondary" className="bg-gray-800 hover:bg-gray-700 text-gray-300">
                    equipment
                  </Badge>
                  <Badge variant="secondary" className="bg-gray-800 hover:bg-gray-700 text-gray-300">
                    behind-the-scenes
                  </Badge>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button variant="outline" className="border-gray-700 text-gray-300 mr-2">
                  <Edit className="h-4 w-4 mr-2" />
                  Continue Editing
                </Button>
                <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Publish
                </Button>
              </CardFooter>
            </Card>

            {/* Show more button */}
            <div className="flex justify-center mt-6">
              <Button variant="outline" className="border-gray-700 text-gray-300">
                Load More Posts
              </Button>
            </div>
          </TabsContent>

          {/* Placeholders for other tabs */}
          <TabsContent value="articles">
            <Card className="bg-gray-900 border-gray-800 p-8">
              <div className="text-center text-gray-400">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-500" />
                <h3 className="text-xl font-medium text-white mb-2">Articles</h3>
                <p>View and manage all your written content here.</p>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="images">
            <Card className="bg-gray-900 border-gray-800 p-8">
              <div className="text-center text-gray-400">
                <ImageIcon className="h-12 w-12 mx-auto mb-4 text-gray-500" />
                <h3 className="text-xl font-medium text-white mb-2">Images</h3>
                <p>View and manage all your image content here.</p>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="videos">
            <Card className="bg-gray-900 border-gray-800 p-8">
              <div className="text-center text-gray-400">
                <Video className="h-12 w-12 mx-auto mb-4 text-gray-500" />
                <h3 className="text-xl font-medium text-white mb-2">Videos</h3>
                <p>View and manage all your video content here.</p>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="audio">
            <Card className="bg-gray-900 border-gray-800 p-8">
              <div className="text-center text-gray-400">
                <Music className="h-12 w-12 mx-auto mb-4 text-gray-500" />
                <h3 className="text-xl font-medium text-white mb-2">Audio</h3>
                <p>View and manage all your audio content here.</p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Content Calendar Only */}
        <div className="mt-8">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white text-lg">Content Calendar</CardTitle>
              <CardDescription>Upcoming scheduled posts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <CalendarDays className="h-8 w-8 text-blue-400" />
                <div>
                  <p className="text-sm font-medium text-white">May 15, 2023 - 9:00 AM</p>
                  <p className="text-sm text-gray-400 truncate">5 Tips for Better Digital Art Composition</p>
                </div>
              </div>
              <Separator className="bg-gray-800" />
              <div className="flex items-center space-x-4">
                <CalendarDays className="h-8 w-8 text-blue-400" />
                <div>
                  <p className="text-sm font-medium text-white">May 22, 2023 - 10:00 AM</p>
                  <p className="text-sm text-gray-400 truncate">Monthly Q&A Session</p>
                </div>
              </div>
              <Separator className="bg-gray-800" />
              <div className="flex items-center space-x-4">
                <CalendarDays className="h-8 w-8 text-blue-400" />
                <div>
                  <p className="text-sm font-medium text-white">May 30, 2023 - 2:00 PM</p>
                  <p className="text-sm text-gray-400 truncate">New Product Review</p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full border-gray-700">
                View Full Calendar
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}
