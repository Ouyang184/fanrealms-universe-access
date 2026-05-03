import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useCreatorProducts, useDeleteProduct } from '@/hooks/useMarketplace';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Package } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function DashboardAssetsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectParam = searchParams.get('project');

  const { data: assets, isLoading } = useCreatorProducts();
  const deleteProduct = useDeleteProduct();

  const handleNew = () => {
    const url = projectParam
      ? `/dashboard/assets/new?project=${encodeURIComponent(projectParam)}`
      : '/dashboard/assets/new';
    navigate(url);
  };

  return (
    <DashboardLayout>
      <div className="w-full space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[20px] font-bold tracking-[-0.5px]">Your Assets</h1>
            <p className="text-[13px] text-[#888] mt-0.5">Manage your Godot asset listings</p>
          </div>
          <Button
            onClick={handleNew}
            className="bg-primary hover:bg-[#3a7aab] text-white text-[13px] font-semibold"
          >
            <Plus className="w-4 h-4 mr-2" />
            New asset
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : assets && assets.length > 0 ? (
          <div className="bg-white border border-[#eee] rounded-xl overflow-hidden">
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 py-3 border-b border-[#f5f5f5] text-[11px] font-bold text-[#aaa] uppercase tracking-[0.5px]">
              <span>Asset</span>
              <span className="text-right">Price</span>
              <span>Status</span>
              <span></span>
            </div>

            {assets.map((asset, i) => (
              <div
                key={asset.id}
                className={`grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-4 py-3.5 ${
                  i < assets.length - 1 ? 'border-b border-[#f5f5f5]' : ''
                }`}
              >
                <Link
                  to={`/dashboard/assets/${asset.id}`}
                  className="flex items-center gap-3 min-w-0 group"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#f5f5f5] overflow-hidden flex-shrink-0">
                    {asset.cover_image_url && (
                      <img src={asset.cover_image_url} className="w-full h-full object-cover" alt="" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold truncate group-hover:text-primary transition-colors">
                      {asset.title}
                    </div>
                    {asset.category && (
                      <div className="text-[11px] text-[#aaa]">{asset.category}</div>
                    )}
                  </div>
                </Link>

                <div className="text-[13px] font-bold text-right">
                  {asset.price === 0 ? 'Free' : `$${(asset.price / 100).toFixed(2)}`}
                </div>

                <div>
                  {asset.status === 'published' ? (
                    <Badge className="bg-green-50 text-green-700 border-green-200 text-[10px]">Published</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[#aaa] border-[#e5e5e5] text-[10px]">Draft</Badge>
                  )}
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-[#777] hover:text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete asset?</AlertDialogTitle>
                      <AlertDialogDescription>
                        "{asset.title}" will be permanently removed from the marketplace. This cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-red-500 hover:bg-red-600"
                        onClick={() => deleteProduct.mutate(asset.id)}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-[#e5e5e5] rounded-2xl p-16 text-center">
            <Package className="w-10 h-10 text-[#ccc] mx-auto mb-4" />
            <p className="text-[16px] font-bold text-[#111] mb-1">No assets yet</p>
            <p className="text-[13px] text-[#888] mb-6 max-w-xs mx-auto">
              Upload your first Godot plugin, shader, or sprite pack and start selling.
            </p>
            <Button onClick={handleNew} className="bg-primary hover:bg-[#3a7aab] text-white">
              <Plus className="w-4 h-4 mr-2" />
              Upload your first asset
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
