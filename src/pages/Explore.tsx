import { useState } from 'react';
import { MainLayout } from '@/components/Layout/MainLayout';
import { useCreators } from '@/hooks/useCreators';
import { ExploreHero } from '@/components/explore/ExploreHero';
import { ExploreCategories } from '@/components/explore/ExploreCategories';
import { FeaturedCreators } from '@/components/explore/FeaturedCreators';
import { DiscoverSection } from '@/components/explore/DiscoverSection';
import { PopularTagsSection } from '@/components/explore/PopularTagsSection';
import { CommunitySection } from '@/components/explore/CommunitySection';

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter] = useState<string | null>(null);

  const { data: creators = [], isLoading } = useCreators(
    searchQuery.length >= 2 ? searchQuery : undefined
  );

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        <ExploreHero
          categoryFilter={categoryFilter}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        <ExploreCategories />

        <FeaturedCreators
          creators={creators as any}
          isLoading={isLoading}
          categoryFilter={categoryFilter}
        />

        <DiscoverSection />

        <PopularTagsSection />

        <CommunitySection />
      </div>
    </MainLayout>
  );
}
