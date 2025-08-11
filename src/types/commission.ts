
export interface CommissionType {
  id: string;
  creator_id: string;
  name: string;
  description: string | null;
  base_price: number;
  price_per_character?: number;
  price_per_revision?: number;
  estimated_turnaround_days: number;
  max_revisions: number;
  dos: string[];
  donts: string[];
  tags?: string[];
  custom_addons?: Array<{ name: string; price: number }>;
  sample_art_url?: string; // Add sample art URL
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CommissionSlot {
  id: string;
  creator_id: string;
  commission_type_id: string;
  slot_date: string;
  slot_time?: string;
  status: 'available' | 'booked' | 'blocked';
  custom_price?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type CommissionRequestStatus = 
  | 'pending' 
  | 'payment_pending' 
  | 'payment_authorized' 
  | 'payment_failed' 
  | 'accepted' 
  | 'rejected' 
  | 'in_progress' 
  | 'completed' 
  | 'delivered' 
  | 'under_review' 
  | 'revision_requested' 
  | 'cancelled' 
  | 'refunded';

export interface CommissionRequest {
  id: string;
  commission_type_id: string;
  customer_id: string;
  creator_id: string;
  title: string;
  description: string;
  reference_images: string[];
  budget_range_min?: number;
  budget_range_max?: number;
  agreed_price?: number;
  status: CommissionRequestStatus;
  deadline?: string;
  customer_notes?: string;
  creator_notes?: string;
  selected_addons?: Array<{ name: string; price: number; quantity: number }>;
  stripe_payment_intent_id?: string;
  platform_fee_amount?: number;
  created_at: string;
  updated_at: string;
}

export interface CommissionDeliverable {
  id: string;
  commission_request_id: string;
  file_urls: string[];
  external_links?: string[];
  delivery_notes?: string;
  delivered_at: string;
  created_at: string;
  updated_at: string;
}

export interface CommissionTag {
  id: string;
  name: string;
  category: string;
  description?: string;
  color_hex: string;
  is_featured: boolean;
  created_at: string;
}

export interface CommissionPortfolio {
  id: string;
  creator_id: string;
  commission_type_id?: string;
  image_url: string;
  title?: string;
  description?: string;
  tags: string[];
  is_featured: boolean;
  display_order: number;
  created_at: string;
}

export interface CreatorEarnings {
  id: string;
  creator_id: string;
  commission_request_id?: string;
  subscription_id?: string;
  earning_type: 'commission' | 'subscription';
  amount: number;
  platform_fee: number;
  net_amount: number;
  payment_date?: string;
  stripe_transfer_id?: string;
  created_at: string;
}
