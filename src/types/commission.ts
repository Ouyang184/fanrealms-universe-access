
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
  custom_addons?: CommissionAddon[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CommissionAddon {
  id: string;
  name: string;
  price: number;
  description?: string;
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
  | 'checkout_created'
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
  stripe_payment_intent_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CommissionDeliverable {
  id: string;
  commission_request_id: string;
  file_urls: string[];
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
