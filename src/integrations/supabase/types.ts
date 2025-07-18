export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_deliverables: {
        Row: {
          commission_request_id: string
          created_at: string
          delivered_at: string
          delivery_notes: string | null
          file_urls: string[]
          id: string
          updated_at: string
        }
        Insert: {
          commission_request_id: string
          created_at?: string
          delivered_at?: string
          delivery_notes?: string | null
          file_urls?: string[]
          id?: string
          updated_at?: string
        }
        Update: {
          commission_request_id?: string
          created_at?: string
          delivered_at?: string
          delivery_notes?: string | null
          file_urls?: string[]
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_deliverables_commission_request_id_fkey"
            columns: ["commission_request_id"]
            isOneToOne: false
            referencedRelation: "commission"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_deliverables_commission_request_id_fkey"
            columns: ["commission_request_id"]
            isOneToOne: false
            referencedRelation: "commission_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_requests: {
        Row: {
          agreed_price: number | null
          budget_range_max: number | null
          budget_range_min: number | null
          commission_type_id: string
          created_at: string
          creator_id: string
          creator_notes: string | null
          customer_id: string
          customer_notes: string | null
          deadline: string | null
          description: string
          id: string
          platform_fee_amount: number | null
          reference_images: string[] | null
          selected_addons: Json | null
          status: string
          stripe_payment_intent_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          agreed_price?: number | null
          budget_range_max?: number | null
          budget_range_min?: number | null
          commission_type_id: string
          created_at?: string
          creator_id: string
          creator_notes?: string | null
          customer_id: string
          customer_notes?: string | null
          deadline?: string | null
          description: string
          id?: string
          platform_fee_amount?: number | null
          reference_images?: string[] | null
          selected_addons?: Json | null
          status?: string
          stripe_payment_intent_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          agreed_price?: number | null
          budget_range_max?: number | null
          budget_range_min?: number | null
          commission_type_id?: string
          created_at?: string
          creator_id?: string
          creator_notes?: string | null
          customer_id?: string
          customer_notes?: string | null
          deadline?: string | null
          description?: string
          id?: string
          platform_fee_amount?: number | null
          reference_images?: string[] | null
          selected_addons?: Json | null
          status?: string
          stripe_payment_intent_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_requests_commission_type_id_fkey"
            columns: ["commission_type_id"]
            isOneToOne: false
            referencedRelation: "commission_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_requests_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_requests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_types: {
        Row: {
          base_price: number
          created_at: string
          creator_id: string
          custom_addons: Json | null
          description: string | null
          donts: string[] | null
          dos: string[] | null
          estimated_turnaround_days: number
          id: string
          is_active: boolean
          max_revisions: number
          name: string
          price_per_revision: number | null
          sample_art_url: string | null
          updated_at: string
        }
        Insert: {
          base_price: number
          created_at?: string
          creator_id: string
          custom_addons?: Json | null
          description?: string | null
          donts?: string[] | null
          dos?: string[] | null
          estimated_turnaround_days: number
          id?: string
          is_active?: boolean
          max_revisions?: number
          name: string
          price_per_revision?: number | null
          sample_art_url?: string | null
          updated_at?: string
        }
        Update: {
          base_price?: number
          created_at?: string
          creator_id?: string
          custom_addons?: Json | null
          description?: string | null
          donts?: string[] | null
          dos?: string[] | null
          estimated_turnaround_days?: number
          id?: string
          is_active?: boolean
          max_revisions?: number
          name?: string
          price_per_revision?: number | null
          sample_art_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_types_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string | null
          created_at: string
          id: string
          last_message_at: string | null
          other_user_id: string
          user_id: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          id?: string
          last_message_at?: string | null
          other_user_id: string
          user_id: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          id?: string
          last_message_at?: string | null
          other_user_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_other_user_id_fkey"
            columns: ["other_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      creator_earnings: {
        Row: {
          amount: number
          commission_request_id: string | null
          created_at: string | null
          creator_id: string
          earning_type: string | null
          id: string
          net_amount: number
          payment_date: string | null
          platform_fee: number
          stripe_transfer_id: string | null
          subscription_id: string | null
        }
        Insert: {
          amount: number
          commission_request_id?: string | null
          created_at?: string | null
          creator_id: string
          earning_type?: string | null
          id?: string
          net_amount: number
          payment_date?: string | null
          platform_fee: number
          stripe_transfer_id?: string | null
          subscription_id?: string | null
        }
        Update: {
          amount?: number
          commission_request_id?: string | null
          created_at?: string | null
          creator_id?: string
          earning_type?: string | null
          id?: string
          net_amount?: number
          payment_date?: string | null
          platform_fee?: number
          stripe_transfer_id?: string | null
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creator_earnings_commission_request_id_fkey"
            columns: ["commission_request_id"]
            isOneToOne: false
            referencedRelation: "commission"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_earnings_commission_request_id_fkey"
            columns: ["commission_request_id"]
            isOneToOne: false
            referencedRelation: "commission_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_earnings_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_links: {
        Row: {
          created_at: string | null
          creator_id: string | null
          id: string
          label: string | null
          position: number | null
          url: string
        }
        Insert: {
          created_at?: string | null
          creator_id?: string | null
          id?: string
          label?: string | null
          position?: number | null
          url: string
        }
        Update: {
          created_at?: string | null
          creator_id?: string | null
          id?: string
          label?: string | null
          position?: number | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_links_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_ratings: {
        Row: {
          created_at: string
          creator_id: string
          id: string
          rating: number
          rating_type: string
          review_text: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          id?: string
          rating: number
          rating_type?: string
          review_text?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          id?: string
          rating?: number
          rating_type?: string
          review_text?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_ratings_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      creators: {
        Row: {
          accepts_commissions: boolean | null
          banner_url: string | null
          bio: string | null
          commission_base_rate: number | null
          commission_slots_available: number | null
          commission_tos: string | null
          commission_turnaround_days: number | null
          created_at: string
          display_name: string | null
          follower_count: number
          id: string
          is_nsfw: boolean
          profile_image_url: string | null
          stripe_account_id: string | null
          stripe_charges_enabled: boolean | null
          stripe_onboarding_complete: boolean | null
          stripe_payouts_enabled: boolean | null
          tags: string[] | null
          updated_at: string | null
          user_id: string
          website: string | null
        }
        Insert: {
          accepts_commissions?: boolean | null
          banner_url?: string | null
          bio?: string | null
          commission_base_rate?: number | null
          commission_slots_available?: number | null
          commission_tos?: string | null
          commission_turnaround_days?: number | null
          created_at?: string
          display_name?: string | null
          follower_count?: number
          id?: string
          is_nsfw?: boolean
          profile_image_url?: string | null
          stripe_account_id?: string | null
          stripe_charges_enabled?: boolean | null
          stripe_onboarding_complete?: boolean | null
          stripe_payouts_enabled?: boolean | null
          tags?: string[] | null
          updated_at?: string | null
          user_id: string
          website?: string | null
        }
        Update: {
          accepts_commissions?: boolean | null
          banner_url?: string | null
          bio?: string | null
          commission_base_rate?: number | null
          commission_slots_available?: number | null
          commission_tos?: string | null
          commission_turnaround_days?: number | null
          created_at?: string
          display_name?: string | null
          follower_count?: number
          id?: string
          is_nsfw?: boolean
          profile_image_url?: string | null
          stripe_account_id?: string | null
          stripe_charges_enabled?: boolean | null
          stripe_onboarding_complete?: boolean | null
          stripe_payouts_enabled?: boolean | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creators_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      feeds: {
        Row: {
          created_at: string
          feed_type: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          feed_type: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          feed_type?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feeds_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feeds_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          creator_id: string
          id: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          id?: never
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          id?: never
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_tiers: {
        Row: {
          active: boolean
          created_at: string
          creator_id: string
          description: string
          id: string
          price: number
          stripe_price_id: string | null
          stripe_product_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          creator_id: string
          description: string
          id?: string
          price: number
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          creator_id?: string
          description?: string
          id?: string
          price?: number
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "membership_tiers_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          blocked_at: string | null
          created_at: string
          deleted_at: string | null
          id: string
          is_read: boolean
          message_text: string
          receiver_id: string
          sender_id: string
        }
        Insert: {
          blocked_at?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_read?: boolean
          message_text: string
          receiver_id: string
          sender_id: string
        }
        Update: {
          blocked_at?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_read?: boolean
          message_text?: string
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean | null
          metadata: Json | null
          related_id: string | null
          related_user_id: string | null
          title: string | null
          type: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          metadata?: Json | null
          related_id?: string | null
          related_user_id?: string | null
          title?: string | null
          type: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          metadata?: Json | null
          related_id?: string | null
          related_user_id?: string | null
          title?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reads: {
        Row: {
          created_at: string
          id: string
          post_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reads_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_shares: {
        Row: {
          created_at: string
          id: string
          platform: string
          post_id: string
          shared_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          platform: string
          post_id: string
          shared_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          platform?: string
          post_id?: string
          shared_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_shares_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_tiers: {
        Row: {
          created_at: string
          id: string
          post_id: string
          tier_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          tier_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          tier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_tiers_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_tiers_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "membership_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      post_views: {
        Row: {
          id: string
          post_id: string
          user_id: string
          view_type: string
          viewed_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          view_type?: string
          viewed_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          view_type?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_views_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          attachments: Json | null
          author_id: string
          content: string
          created_at: string
          creator_id: string | null
          id: string
          is_nsfw: boolean
          scheduled_for: string | null
          status: string | null
          tier_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          attachments?: Json | null
          author_id: string
          content: string
          created_at?: string
          creator_id?: string | null
          id?: string
          is_nsfw?: boolean
          scheduled_for?: string | null
          status?: string | null
          tier_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          attachments?: Json | null
          author_id?: string
          content?: string
          created_at?: string
          creator_id?: string | null
          id?: string
          is_nsfw?: boolean
          scheduled_for?: string | null
          status?: string | null
          tier_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "membership_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_customers: {
        Row: {
          created_at: string | null
          id: string
          stripe_customer_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          stripe_customer_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          stripe_customer_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          category_id: number
          category_name: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category_id: number
          category_name: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category_id?: number
          category_name?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          amount: number
          cancel_at_period_end: boolean | null
          created_at: string
          creator_id: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          cancel_at_period_end?: boolean | null
          created_at?: string
          creator_id: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          cancel_at_period_end?: boolean | null
          created_at?: string
          creator_id?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_subscriptions_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "membership_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          age_verified: boolean | null
          created_at: string
          date_of_birth: string | null
          email: string
          id: string
          is_nsfw_enabled: boolean
          profile_picture: string | null
          updated_at: string | null
          username: string
          website: string | null
        }
        Insert: {
          age_verified?: boolean | null
          created_at?: string
          date_of_birth?: string | null
          email: string
          id?: string
          is_nsfw_enabled?: boolean
          profile_picture?: string | null
          updated_at?: string | null
          username: string
          website?: string | null
        }
        Update: {
          age_verified?: boolean | null
          created_at?: string
          date_of_birth?: string | null
          email?: string
          id?: string
          is_nsfw_enabled?: boolean
          profile_picture?: string | null
          updated_at?: string | null
          username?: string
          website?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      commission: {
        Row: {
          agreed_price: number | null
          budget_range_max: number | null
          budget_range_min: number | null
          commission_type_id: string | null
          created_at: string | null
          creator_id: string | null
          creator_notes: string | null
          customer_id: string | null
          customer_notes: string | null
          deadline: string | null
          description: string | null
          id: string | null
          reference_images: string[] | null
          status: string | null
          stripe_payment_intent_id: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          agreed_price?: number | null
          budget_range_max?: number | null
          budget_range_min?: number | null
          commission_type_id?: string | null
          created_at?: string | null
          creator_id?: string | null
          creator_notes?: string | null
          customer_id?: string | null
          customer_notes?: string | null
          deadline?: string | null
          description?: string | null
          id?: string | null
          reference_images?: string[] | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          agreed_price?: number | null
          budget_range_max?: number | null
          budget_range_min?: number | null
          commission_type_id?: string | null
          created_at?: string | null
          creator_id?: string | null
          creator_notes?: string | null
          customer_id?: string | null
          customer_notes?: string | null
          deadline?: string | null
          description?: string | null
          id?: string | null
          reference_images?: string[] | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commission_requests_commission_type_id_fkey"
            columns: ["commission_type_id"]
            isOneToOne: false
            referencedRelation: "commission_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_requests_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_requests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_post_view_count: {
        Args: { post_id_param: string }
        Returns: number
      }
      user_has_tier_access: {
        Args: { tier_id_param: string }
        Returns: boolean
      }
      user_owns_post: {
        Args: { post_id_param: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
