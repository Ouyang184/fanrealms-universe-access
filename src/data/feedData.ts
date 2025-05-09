
import { FeedPost } from "@/types/FeedPostTypes";

// Sample data for feed posts
export const feedPosts: FeedPost[] = [
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
