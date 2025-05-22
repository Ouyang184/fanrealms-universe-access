
import { useState } from "react";
import { HeroSection } from "./HeroSection";
import { ContentTabs } from "./ContentTabs";
import { FeaturedCreators } from "./FeaturedCreators";
import { CategoriesSection } from "./CategoriesSection";
import { HowItWorks } from "./HowItWorks";
import { HomeFooter } from "./HomeFooter";
import { ContentPreviewModal } from "@/components/content/ContentPreviewModal";

// Sample content data
const forYouContent = [
  {
    id: 1,
    title: "Character Design Masterclass",
    description: "Learn advanced character design techniques with professional illustrations and step-by-step guides.",
    thumbnail: "/lovable-uploads/7a965acd-47c5-4598-9132-11abf1abf1e9.jpeg",
    creator: {
      id: 1,
      name: "ArtistAlley",
      avatar: "/placeholder.svg?height=50&width=50&text=AA",
    },
    type: "video",
    date: "2 days ago",
    preview: true,
  },
  {
    id: 2,
    title: "Advanced AI Behavior Trees",
    description: "Create complex enemy AI behaviors using behavior trees in Unity. This tutorial covers decision making and state management.",
    thumbnail: "/lovable-uploads/3e41e291-b088-401c-9522-bf54cd7b6eda.jpeg",
    creator: {
      id: 2,
      name: "GameDev Masters",
      avatar: "/placeholder.svg?height=50&width=50&text=GM",
    },
    type: "article",
    date: "Yesterday",
    preview: false,
  },
  {
    id: 3,
    title: "June Sample Pack: Ambient Textures",
    description: "This month's sample pack includes 50+ ambient textures, drones, and atmospheric sounds for immersive soundscapes.",
    thumbnail: "/lovable-uploads/0f996e09-53ab-4b42-aafc-5855dbdbdd79.jpeg",
    creator: {
      id: 3,
      name: "Music Production Hub",
      avatar: "/placeholder.svg?height=50&width=50&text=MP",
    },
    type: "download",
    date: "3 days ago",
    preview: true,
  },
  {
    id: 4,
    title: "Weekly Art Challenge: Cyberpunk Environments",
    description: "Create your own futuristic cityscape with neon lights and dystopian elements. Submit by Friday for feedback!",
    thumbnail: "/lovable-uploads/leaves-image.jpeg",
    creator: {
      id: 1,
      name: "ArtistAlley",
      avatar: "/placeholder.svg?height=50&width=50&text=AA",
    },
    type: "article",
    date: "4 days ago",
    preview: true,
  },
  {
    id: 5,
    title: "Portrait Photography Essentials",
    description: "Learn professional portrait photography techniques, from lighting setup to post-processing workflows.",
    thumbnail: "/lovable-uploads/0f996e09-53ab-4b42-aafc-5855dbdbdd79.jpeg",
    creator: {
      id: 5,
      name: "Photo Masters",
      avatar: "/placeholder.svg?height=50&width=50&text=PM",
    },
    type: "video",
    date: "5 days ago",
    preview: false,
  },
  {
    id: 6,
    title: "CSS Grid Advanced Layout Techniques",
    description: "Master CSS Grid to create complex, responsive layouts with minimal code and maximum flexibility.",
    thumbnail: "/lovable-uploads/7a965acd-47c5-4598-9132-11abf1abf1e9.jpeg",
    creator: {
      id: 6,
      name: "Web Wizard",
      avatar: "/placeholder.svg?height=50&width=50&text=WW",
    },
    type: "video",
    date: "1 week ago",
    preview: true,
  },
  {
    id: 7,
    title: "Digital Painting Brushes Collection",
    description: "A curated set of 50+ custom brushes for digital painting in Procreate and Photoshop.",
    thumbnail: "/lovable-uploads/3e41e291-b088-401c-9522-bf54cd7b6eda.jpeg",
    creator: {
      id: 1,
      name: "ArtistAlley",
      avatar: "/placeholder.svg?height=50&width=50&text=AA",
    },
    type: "download",
    date: "2 weeks ago",
    preview: false,
  },
  {
    id: 8,
    title: "Creative Writing Workshop: Building Characters",
    description: "Learn techniques to develop memorable, complex characters for your stories, novels, and screenplays.",
    thumbnail: "/lovable-uploads/0f996e09-53ab-4b42-aafc-5855dbdbdd79.jpeg",
    creator: {
      id: 8,
      name: "Writing Workshop",
      avatar: "/placeholder.svg?height=50&width=50&text=WW",
    },
    type: "article",
    date: "3 weeks ago",
    preview: true,
  },
];

// Content for the "Trending" tab
const trendingContent = [
  {
    id: 10,
    title: "Latest Tech Review: AI Hardware Accelerators",
    description: "An in-depth review of the newest AI hardware accelerators and their impact on machine learning performance.",
    thumbnail: "/lovable-uploads/3e41e291-b088-401c-9522-bf54cd7b6eda.jpeg",
    creator: {
      id: 10,
      name: "Tech Channel",
      avatar: "/placeholder.svg?height=50&width=50&text=TC",
    },
    type: "video",
    date: "12 hours ago",
    preview: true,
  },
  {
    id: 11,
    title: "Video Editing Masterclass",
    description: "Professional video editing techniques using industry-standard tools and workflows.",
    thumbnail: "/lovable-uploads/7a965acd-47c5-4598-9132-11abf1abf1e9.jpeg",
    creator: {
      id: 11,
      name: "Video Guru",
      avatar: "/placeholder.svg?height=50&width=50&text=VG",
    },
    type: "video",
    date: "2 days ago",
    preview: false,
  },
  {
    id: 12,
    title: "UI/UX Design Trends 2025",
    description: "Explore the upcoming UI/UX design trends that will shape digital experiences in the coming year.",
    thumbnail: "/lovable-uploads/0f996e09-53ab-4b42-aafc-5855dbdbdd79.jpeg",
    creator: {
      id: 12,
      name: "Design Studio",
      avatar: "/placeholder.svg?height=50&width=50&text=DS",
    },
    type: "article",
    date: "3 days ago",
    preview: true,
  },
  {
    id: 13,
    title: "Music Production Tips: Spatial Audio",
    description: "Create immersive spatial audio mixes for modern streaming platforms and VR applications.",
    thumbnail: "/lovable-uploads/leaves-image.jpeg",
    creator: {
      id: 3,
      name: "Music Production Hub",
      avatar: "/placeholder.svg?height=50&width=50&text=MP",
    },
    type: "download",
    date: "5 days ago",
    preview: true,
  },
];

// Content for the "Recent" tab
const recentContent = [
  {
    id: 20,
    title: "Gourmet Recipes: Summer Edition",
    description: "Fresh, seasonal recipes perfect for summer gatherings and outdoor dining experiences.",
    thumbnail: "/lovable-uploads/3e41e291-b088-401c-9522-bf54cd7b6eda.jpeg",
    creator: {
      id: 20,
      name: "Cooking King",
      avatar: "/placeholder.svg?height=50&width=50&text=CK",
    },
    type: "article",
    date: "2 hours ago",
    preview: true,
  },
  {
    id: 21,
    title: "Portrait Photography: Natural Light Techniques",
    description: "Master the art of portrait photography using only natural light and simple reflectors.",
    thumbnail: "/lovable-uploads/0f996e09-53ab-4b42-aafc-5855dbdbdd79.jpeg",
    creator: {
      id: 21,
      name: "Photography Tips",
      avatar: "/placeholder.svg?height=50&width=50&text=PT",
    },
    type: "video",
    date: "5 hours ago",
    preview: false,
  },
  {
    id: 22,
    title: "Digital Art Tutorial: Environment Design",
    description: "Create stunning environmental concept art for games, films, and personal projects.",
    thumbnail: "/lovable-uploads/7a965acd-47c5-4598-9132-11abf1abf1e9.jpeg",
    creator: {
      id: 22,
      name: "Art Room",
      avatar: "/placeholder.svg?height=50&width=50&text=AR",
    },
    type: "video",
    date: "1 day ago",
    preview: true,
  },
  {
    id: 23,
    title: "Science Experiments for Home Learning",
    description: "Educational science experiments that can be conducted safely at home with common materials.",
    thumbnail: "/lovable-uploads/leaves-image.jpeg",
    creator: {
      id: 23,
      name: "Science Channel",
      avatar: "/placeholder.svg?height=50&width=50&text=SC",
    },
    type: "download",
    date: "2 days ago",
    preview: true,
  },
];

export function HomeContent() {
  const [selectedContent, setSelectedContent] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleCardClick = (content: any) => {
    setSelectedContent(content);
    setModalOpen(true);
  };

  return (
    <div>
      <HeroSection />
      
      <ContentTabs 
        forYouContent={forYouContent}
        trendingContent={trendingContent}
        recentContent={recentContent}
        onCardClick={handleCardClick}
      />
      
      <FeaturedCreators />
      <CategoriesSection />
      <HowItWorks />
      <HomeFooter />
      
      {selectedContent && (
        <ContentPreviewModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          content={selectedContent}
        />
      )}
    </div>
  );
}
