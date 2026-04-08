import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateProduct } from '@/hooks/useMarketplace';
import { Plus } from 'lucide-react';

const PRODUCT_CATEGORIES = ['Game Assets', 'Templates', 'Tools', 'Tutorials', 'Music', 'Art', 'Other'];

export function CreateProductDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Other');
  const [assetUrl, setAssetUrl] = useState('');
  const createProduct = useCreateProduct();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createProduct.mutate(
      {
        title,
        description,
        price: parseFloat(price),
        category,
        asset_url: assetUrl || undefined,
        status: 'published',
      },
      {
        onSuccess: () => {
          setOpen(false);
          setTitle('');
          setDescription('');
          setPrice('');
          setCategory('Other');
          setAssetUrl('');
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4 mr-2" />Add Product</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Product</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price ($)</Label>
              <Input id="price" type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRODUCT_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="assetUrl">Asset URL (download link)</Label>
            <Input id="assetUrl" value={assetUrl} onChange={(e) => setAssetUrl(e.target.value)} placeholder="https://..." />
          </div>
          <Button type="submit" className="w-full" disabled={createProduct.isPending}>
            {createProduct.isPending ? 'Creating...' : 'Create Product'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
