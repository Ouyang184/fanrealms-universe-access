import { useParams, Link } from 'react-router-dom';
import { MainLayout } from '@/components/Layout/MainLayout';
import {
  useSellerProfile,
  useSellerProducts,
  useSellerProjects,
  useSellerDevlogs,
} from '@/hooks/useSellerProfile';
import { ProductCard } from '@/components/marketplace/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, CalendarDays, Users, Globe, FileText, Gamepad2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { FollowButton } from '@/components/profile/FollowButton';
import { SocialLinks } from '@/components/SocialLinks';
import { safeHref } from '@/lib/safeHref';
import { useState, useEffect } from 'react';

export default function SellerProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { data: seller, isLoading: sellerLoading, isError } = useSellerProfile(username ?? '');
  const { data: products, isLoading: productsLoading } = useSellerProducts(seller?.id ?? '');
  const { data: projects, isLoading: projectsLoading } = useSellerProjects(seller?.id ?? '');
  const { data: devlogs } = useSellerDevlogs(seller?.user_id ?? '');
  const [followerCount, setFollowerCount] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  useEffect(() => {
    if (typeof seller?.follower_count === 'number') setFollowerCount(seller.follower_count);
  }, [seller?.follower_count]);

  const categories = Array.from(
    new Set((products ?? []).map((p: any) => p.category).filter(Boolean))
  ) as string[];
  const filteredProducts = selectedCategory === 'all'
    ? (products ?? [])
    : (products ?? []).filter((p: any) => p.category === selectedCategory);

  if (isError || (!sellerLoading && seller === null)) {
    return (
      <MainLayout>
        <div className="max-w-5xl mx-auto py-20 text-center">
          <p className="text-[15px] font-semibold text-[#111]">Creator not found</p>
          <p className="text-[13px] text-[#888] mt-1">No user with that username exists.</p>
          <Link to="/marketplace" className="inline-block mt-6 px-4 py-2 text-[13px] font-semibold text-white bg-primary rounded-lg hover:bg-[#3a7aab] transition-colors">
            Browse marketplace
          </Link>
        </div>
      </MainLayout>
    );
  }

  const initials = (seller?.display_name || seller?.username || '?').slice(0, 2).toUpperCase();

  return (
    <MainLayout fullWidth>
      <div className="w-full">
        {/* Banner */}
        {sellerLoading ? (
          <Skeleton className="w-full h-40 sm:h-56" />
        ) : seller?.banner_url ? (
          <div className="w-full h-40 sm:h-56 overflow-hidden bg-[#f5f5f5]">
            <img src={seller.banner_url} alt="" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-full h-32 sm:h-44 bg-gradient-to-br from-[#e8eef4] to-[#f5f7fa]" />
        )}

        <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-10 sm:-mt-12 relative">
          {/* Header card */}
          <div className="bg-white border border-[#eee] rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row gap-5 items-start">
            {sellerLoading ? (
              <>
                <Skeleton className="w-20 h-20 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-64 mt-2" />
                </div>
              </>
            ) : (
              <>
                <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0 bg-[#111] flex items-center justify-center text-white text-[22px] font-bold border-4 border-white shadow-sm">
                  {seller?.profile_image_url ? (
                    <img src={seller.profile_image_url} alt={seller.display_name ?? seller.username} className="w-full h-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h1 className="text-[24px] font-bold tracking-[-0.5px]">
                        {seller?.display_name || seller?.username}
                      </h1>
                      <p className="text-[13px] text-[#888]">@{seller?.username}</p>
                    </div>
                    {seller?.id && (
                      <FollowButton
                        creatorId={seller.id}
                        creatorUserId={seller.user_id}
                        initialFollowerCount={followerCount}
                        onCountChange={setFollowerCount}
                      />
                    )}
                  </div>
                  {seller?.bio && (
                    <p className="text-[13px] text-[#444] mt-3 max-w-2xl leading-relaxed whitespace-pre-wrap">{seller.bio}</p>
                  )}
                  {seller?.id && (
                    <div className="mt-3">
                      <SocialLinks
                        creatorId={seller.id}
                        variant="outline"
                        size="sm"
                        showText={true}
                        className="gap-2"
                      />
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3">
                    <span className="flex items-center gap-1.5 text-[12px] text-[#888]">
                      <Gamepad2 className="w-3.5 h-3.5" />
                      {projects?.length ?? 0} projects
                    </span>
                    <span className="flex items-center gap-1.5 text-[12px] text-[#888]">
                      <Package className="w-3.5 h-3.5" />
                      {products?.length ?? 0} assets
                    </span>
                    <span className="flex items-center gap-1.5 text-[12px] text-[#888]">
                      <Users className="w-3.5 h-3.5" />
                      {followerCount} followers
                    </span>
                    {(seller as any)?.website && (
                      <a
                        href={safeHref((seller as any).website)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-[12px] text-primary hover:underline"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        Website
                      </a>
                    )}
                    {seller?.created_at && (
                      <span className="flex items-center gap-1.5 text-[12px] text-[#aaa]">
                        <CalendarDays className="w-3.5 h-3.5" />
                        Joined {formatDistanceToNow(new Date(seller.created_at), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Projects */}
          <section className="mt-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[16px] font-bold tracking-[-0.3px]">Projects</h2>
            </div>
            {projectsLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-[4/3] w-full rounded-xl" />
                ))}
              </div>
            ) : projects && projects.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {projects.map((p: any) => (
                  <Link key={p.id} to={`/projects/${p.slug}`} className="group block">
                    <div className="aspect-[4/3] rounded-xl bg-[#f5f5f5] overflow-hidden mb-2">
                      {p.cover_image_url ? (
                        <img src={p.cover_image_url} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Gamepad2 className="w-8 h-8 text-[#ccc]" />
                        </div>
                      )}
                    </div>
                    <div className="text-[13px] font-semibold truncate group-hover:text-primary transition-colors">{p.title}</div>
                    {p.short_description && (
                      <div className="text-[11px] text-[#888] line-clamp-2">{p.short_description}</div>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center border border-dashed border-[#e5e5e5] rounded-2xl">
                <Gamepad2 className="w-7 h-7 text-[#ccc] mx-auto mb-2" />
                <p className="text-[13px] font-semibold text-[#111]">No projects yet</p>
              </div>
            )}
          </section>

          {/* Assets */}
          <section className="mt-10">
            <h2 className="text-[16px] font-bold tracking-[-0.3px] mb-4">Assets</h2>
            {!productsLoading && categories.length > 1 && (
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1.5 text-[12px] font-semibold rounded-full border transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-[#444] border-[#eee] hover:border-[#ccc]'
                  }`}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 text-[12px] font-semibold rounded-full border transition-colors ${
                      selectedCategory === cat
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white text-[#444] border-[#eee] hover:border-[#ccc]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
            {productsLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="aspect-[4/3] w-full rounded-xl" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map((product: any) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="py-12 text-center border border-dashed border-[#e5e5e5] rounded-2xl">
                <Package className="w-7 h-7 text-[#ccc] mx-auto mb-2" />
                <p className="text-[13px] font-semibold text-[#111]">
                  {products && products.length > 0 ? 'No assets in this category' : 'No assets listed yet'}
                </p>
              </div>
            )}
          </section>


          {/* Latest posts */}
          <section className="mt-10 mb-12">
            <h2 className="text-[16px] font-bold tracking-[-0.3px] mb-4">Latest posts</h2>
            {devlogs && devlogs.length > 0 ? (
              <div className="bg-white border border-[#eee] rounded-xl overflow-hidden">
                {devlogs.map((d: any, i: number) => (
                  <Link
                    key={d.id}
                    to={`/devlogs/${d.id}`}
                    className={`flex items-start gap-3 px-4 py-3 hover:bg-[#fafafa] transition-colors ${i < devlogs.length - 1 ? 'border-b border-[#f5f5f5]' : ''}`}
                  >
                    <FileText className="w-4 h-4 text-[#aaa] flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold truncate hover:text-primary transition-colors">{d.title}</div>
                      {d.content && (
                        <div className="text-[12px] text-[#666] line-clamp-2 mt-0.5">{d.content}</div>
                      )}
                      <div className="text-[11px] text-[#aaa] mt-0.5">
                        {d.projects?.title ?? 'Project'} · {formatDistanceToNow(new Date(d.created_at), { addSuffix: true })}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center border border-dashed border-[#e5e5e5] rounded-2xl">
                <FileText className="w-7 h-7 text-[#ccc] mx-auto mb-2" />
                <p className="text-[13px] font-semibold text-[#111]">No posts yet</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </MainLayout>
  );
}
