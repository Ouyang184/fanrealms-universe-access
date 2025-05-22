
import { MainLayout } from "@/components/Layout/MainLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronRight, Star, Clock, Video, FileIcon, Heart, TrendingUp, Zap, Award, Search } from "lucide-react"
import { Download as DownloadIcon } from "lucide-react"

export default function HomePage() {
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto p-6">
        {/* Hero Section */}
        <section className="mb-12">
          <div className="relative rounded-xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-900/90 to-black/70 z-10" />
            <img
              src="/lovable-uploads/e88a8820-dd7f-494b-a648-8d84c9a50978.png"
              alt="Fan enjoying creator content"
              className="w-full h-64 object-cover object-center"
            />
            <div className="absolute inset-0 z-20 flex flex-col justify-center p-8">
              <h1 className="text-4xl font-bold mb-2">Welcome to FanRealms</h1>
              <p className="text-xl text-gray-200 max-w-2xl mb-6">
                Support your favorite creators and get exclusive content, direct interaction, and special perks.
              </p>
              <div className="flex gap-4">
                <Button className="bg-purple-600 hover:bg-purple-700">Discover Creators</Button>
                <Button variant="outline" className="border-white/30 hover:bg-white/10">
                  How It Works
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Content Tabs */}
        <Tabs defaultValue="for-you" className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <TabsList className="bg-gray-900 border-gray-800">
              <TabsTrigger value="for-you" className="data-[state=active]:bg-purple-900/30">
                For You
              </TabsTrigger>
              <TabsTrigger value="trending" className="data-[state=active]:bg-purple-900/30">
                Trending
              </TabsTrigger>
              <TabsTrigger value="recent" className="data-[state=active]:bg-purple-900/30">
                Recent
              </TabsTrigger>
            </TabsList>
            <Button variant="link" className="text-purple-400">
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          <TabsContent value="for-you" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="bg-gray-900 border-gray-800 overflow-hidden">
                  <div className="relative">
                    <img
                      src={`/placeholder.svg?height=200&width=300&text=Content+${i + 1}`}
                      alt={`Content ${i + 1}`}
                      className="w-full h-40 object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <Badge className={i % 3 === 0 ? "bg-purple-600" : i % 3 === 1 ? "bg-blue-600" : "bg-green-600"}>
                        {i % 3 === 0 ? "Pro" : i % 3 === 1 ? "Plus" : "Basic"}
                      </Badge>
                    </div>
                    <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded text-xs flex items-center gap-1">
                      {i % 3 === 0 ? (
                        <Video className="h-3 w-3" />
                      ) : i % 3 === 1 ? (
                        <FileIcon className="h-3 w-3" />
                      ) : (
                        <DownloadIcon className="h-3 w-3" />
                      )}
                      {i % 3 === 0 ? "Video" : i % 3 === 1 ? "Article" : "Download"}
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">{["AA", "GM", "MP", "WW", "PM"][i % 5]}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-gray-400">
                        {
                          [
                            "ArtistAlley",
                            "GameDev Masters",
                            "Music Production Hub",
                            "Writing Workshop",
                            "Photo Masters",
                          ][i % 5]
                        }
                      </span>
                    </div>
                    <h3 className="font-semibold line-clamp-2">
                      {
                        [
                          "Character Design Masterclass",
                          "Advanced AI Behavior Trees",
                          "May Sample Pack",
                          "Creative Writing Tips",
                          "Lighting Techniques",
                        ][i % 5]
                      }{" "}
                      {i + 1}
                    </h3>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-400">
                        {["2 days ago", "Yesterday", "4 hours ago", "1 week ago", "Just now"][i % 5]}
                      </span>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Heart className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="trending" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="bg-gray-900 border-gray-800 overflow-hidden">
                  <div className="relative">
                    <img
                      src={`/placeholder.svg?height=200&width=300&text=Trending+${i + 1}`}
                      alt={`Trending ${i + 1}`}
                      className="w-full h-40 object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-orange-600 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" /> Trending
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">{["TC", "VG", "DS", "MC"][i % 4]}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-gray-400">
                        {["Tech Channel", "Video Guru", "Design Studio", "Music Creator"][i % 4]}
                      </span>
                    </div>
                    <h3 className="font-semibold line-clamp-2">
                      {
                        [
                          "Latest Tech Review",
                          "Video Editing Masterclass",
                          "UI/UX Design Trends",
                          "Music Production Tips",
                        ][i % 4]
                      }
                    </h3>
                    <div className="flex items-center gap-2 mt-2">
                      <Zap className="h-4 w-4 text-orange-500" />
                      <span className="text-xs text-orange-400">Gaining popularity fast</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="recent" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="bg-gray-900 border-gray-800 overflow-hidden">
                  <div className="relative">
                    <img
                      src={`/placeholder.svg?height=200&width=300&text=Recent+${i + 1}`}
                      alt={`Recent ${i + 1}`}
                      className="w-full h-40 object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-blue-600 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> New
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">{["CK", "PT", "AR", "SC"][i % 4]}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-gray-400">
                        {["Cooking King", "Photography Tips", "Art Room", "Science Channel"][i % 4]}
                      </span>
                    </div>
                    <h3 className="font-semibold line-clamp-2">
                      {
                        ["Gourmet Recipes", "Portrait Photography", "Digital Art Tutorial", "Science Experiments"][
                          i % 4
                        ]
                      }
                    </h3>
                    <div className="flex items-center gap-2 mt-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span className="text-xs text-blue-400">
                        Posted {i + 1} hour{i !== 0 ? "s" : ""} ago
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Featured Creators */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Featured Creators</h2>
            <Button variant="link" className="text-purple-400">
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="bg-gray-900 border-gray-800 overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-purple-900 to-blue-900" />
                <CardContent className="pt-0 -mt-12 p-6">
                  <div className="flex justify-between items-start">
                    <Avatar className="h-20 w-20 border-4 border-gray-900">
                      <AvatarImage src={`/placeholder.svg?height=80&width=80&text=${i + 1}`} />
                      <AvatarFallback className="bg-gray-800 text-xl">{["AA", "GM", "MP"][i]}</AvatarFallback>
                    </Avatar>
                    <Badge className="mt-2 bg-purple-600 flex items-center gap-1">
                      <Award className="h-3 w-3" /> Featured
                    </Badge>
                  </div>
                  <h3 className="text-xl font-bold mt-4">
                    {["Digital Art Master", "Game Development Pro", "Music Production Studio"][i]}
                  </h3>
                  <p className="text-gray-400 text-sm mt-1">
                    {
                      [
                        "Digital art and illustration tutorials for all skill levels",
                        "Game development tutorials, assets, and behind-the-scenes content",
                        "Music production tutorials, sample packs, and exclusive tracks",
                      ][i]
                    }
                  </p>

                  <div className="flex items-center gap-2 mt-4">
                    <Avatar className="h-6 w-6 border-2 border-gray-900">
                      <AvatarFallback className="bg-purple-900 text-xs">U1</AvatarFallback>
                    </Avatar>
                    <Avatar className="h-6 w-6 border-2 border-gray-900 -ml-2">
                      <AvatarFallback className="bg-blue-900 text-xs">U2</AvatarFallback>
                    </Avatar>
                    <Avatar className="h-6 w-6 border-2 border-gray-900 -ml-2">
                      <AvatarFallback className="bg-green-900 text-xs">U3</AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-gray-400">+{(i + 1) * 1000} subscribers</span>
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">{4.7 + (i * 0.1).toFixed(1)}/5.0</span>
                    </div>
                    <Button className="bg-purple-600 hover:bg-purple-700">Subscribe</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Categories Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Browse Categories</h2>
            <Button variant="link" className="text-purple-400">
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { name: "Art & Illustration", icon: "🎨", color: "from-purple-600 to-pink-600" },
              { name: "Gaming", icon: "🎮", color: "from-blue-600 to-cyan-600" },
              { name: "Music", icon: "🎵", color: "from-green-600 to-teal-600" },
              { name: "Writing", icon: "✍️", color: "from-yellow-600 to-amber-600" },
              { name: "Photography", icon: "📷", color: "from-red-600 to-orange-600" },
              { name: "Education", icon: "📚", color: "from-indigo-600 to-violet-600" },
            ].map((category, i) => (
              <Card
                key={i}
                className="bg-gray-900 border-gray-800 overflow-hidden group cursor-pointer hover:border-gray-700 transition-all"
              >
                <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                  <div
                    className={`h-12 w-12 rounded-full bg-gradient-to-br ${category.color} flex items-center justify-center text-2xl mb-3`}
                  >
                    {category.icon}
                  </div>
                  <h3 className="font-medium group-hover:text-purple-400 transition-colors">{category.name}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section className="mb-12">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-2xl">How FanRealms Works</CardTitle>
              <CardDescription>Support creators you love and get exclusive content and perks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="flex flex-col items-center text-center">
                  <div className="h-16 w-16 rounded-full bg-purple-900/30 flex items-center justify-center mb-4">
                    <Search className="h-8 w-8 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Discover Creators</h3>
                  <p className="text-gray-400 text-sm">
                    Find creators that match your interests across various categories and niches
                  </p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="h-16 w-16 rounded-full bg-purple-900/30 flex items-center justify-center mb-4">
                    <Award className="h-8 w-8 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Choose Your Tier</h3>
                  <p className="text-gray-400 text-sm">
                    Select a subscription tier that fits your budget and desired level of access
                  </p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="h-16 w-16 rounded-full bg-purple-900/30 flex items-center justify-center mb-4">
                    <Zap className="h-8 w-8 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Enjoy Benefits</h3>
                  <p className="text-gray-400 text-sm">
                    Get exclusive content, direct interaction with creators, and special perks
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button className="bg-purple-600 hover:bg-purple-700">Get Started</Button>
            </CardFooter>
          </Card>
        </section>

        {/* Footer */}
        <footer className="border-t border-gray-800 pt-8 mt-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold mb-4">FanRealms</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-sm text-gray-400 hover:text-white">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-gray-400 hover:text-white">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-gray-400 hover:text-white">
                    Press
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-gray-400 hover:text-white">
                    Blog
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Support</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-sm text-gray-400 hover:text-white">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-gray-400 hover:text-white">
                    Safety Center
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-gray-400 hover:text-white">
                    Community Guidelines
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-gray-400 hover:text-white">
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-sm text-gray-400 hover:text-white">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-gray-400 hover:text-white">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-gray-400 hover:text-white">
                    Cookie Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-gray-400 hover:text-white">
                    Copyright Policy
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Creators</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-sm text-gray-400 hover:text-white">
                    Start Creating
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-gray-400 hover:text-white">
                    Resources
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-gray-400 hover:text-white">
                    Creator Guidelines
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-gray-400 hover:text-white">
                    Creator FAQ
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 pb-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-400">© {new Date().getFullYear()} FanRealms. All rights reserved.</p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
            </div>
          </div>
        </footer>
      </div>
    </MainLayout>
  )
}

function Download(props) {
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
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
    </svg>
  )
}
