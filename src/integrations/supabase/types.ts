export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
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
          external_links: string[]
          file_urls: string[]
          id: string
          updated_at: string
        }
        Insert: {
          commission_request_id: string
          created_at?: string
          delivered_at?: string
          delivery_notes?: string | null
          external_links?: string[]
          file_urls?: string[]
          id?: string
          updated_at?: string
        }
        Update: {
          commission_request_id?: string
          created_at?: string
          delivered_at?: string
          delivery_notes?: string | null
          external_links?: string[]
          file_urls?: string[]
          id?: string
          updated_at?: string
        }
        Relationships: [
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
          revision_count: number
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
          revision_count?: number
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
          revision_count?: number
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
      commission_revisions: {
        Row: {
          commission_request_id: string
          created_at: string
          extra_revision_fee: number | null
          id: string
          is_extra_revision: boolean
          request_notes: string
          requester_id: string
          revision_number: number
          status: string
          stripe_payment_intent_id: string | null
          updated_at: string
        }
        Insert: {
          commission_request_id: string
          created_at?: string
          extra_revision_fee?: number | null
          id?: string
          is_extra_revision?: boolean
          request_notes: string
          requester_id: string
          revision_number: number
          status?: string
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Update: {
          commission_request_id?: string
          created_at?: string
          extra_revision_fee?: number | null
          id?: string
          is_extra_revision?: boolean
          request_notes?: string
          requester_id?: string
          revision_number?: number
          status?: string
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Relationships: []
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
          price_per_character: number | null
          price_per_revision: number | null
          sample_art_url: string | null
          tags: string[] | null
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
          price_per_character?: number | null
          price_per_revision?: number | null
          sample_art_url?: string | null
          tags?: string[] | null
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
          price_per_character?: number | null
          price_per_revision?: number | null
          sample_art_url?: string | null
          tags?: string[] | null
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
      email_2fa_codes: {
        Row: {
          code: string
          created_at: string
          email: string
          expires_at: string
        }
        Insert: {
          code: string
          created_at?: string
          email: string
          expires_at: string
        }
        Update: {
          code?: string
          created_at?: string
          email?: string
          expires_at?: string
        }
        Relationships: []
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
      payment_audit_log: {
        Row: {
          accessed_data: Json | null
          created_at: string
          id: string
          ip_address: unknown | null
          operation: string
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          accessed_data?: Json | null
          created_at?: string
          id?: string
          ip_address?: unknown | null
          operation: string
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          accessed_data?: Json | null
          created_at?: string
          id?: string
          ip_address?: unknown | null
          operation?: string
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      payment_metadata_encrypted: {
        Row: {
          created_at: string
          encrypted_data: string | null
          id: string
          payment_method_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          encrypted_data?: string | null
          id?: string
          payment_method_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          encrypted_data?: string | null
          id?: string
          payment_method_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_metadata_encrypted_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          card_brand: string | null
          card_exp_month: number | null
          card_exp_year: number | null
          card_last4: string | null
          created_at: string
          id: string
          is_default: boolean
          stripe_payment_method_id: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          card_brand?: string | null
          card_exp_month?: number | null
          card_exp_year?: number | null
          card_last4?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          stripe_payment_method_id: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          card_brand?: string | null
          card_exp_month?: number | null
          card_exp_year?: number | null
          card_last4?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          stripe_payment_method_id?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_rate_limits: {
        Row: {
          created_at: string
          id: string
          ip_address: unknown | null
          operation: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: unknown | null
          operation: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: unknown | null
          operation?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_secrets_vault: {
        Row: {
          created_at: string
          encrypted_stripe_id: string | null
          encryption_key_hash: string | null
          id: string
          last_accessed: string | null
          payment_method_id: string
        }
        Insert: {
          created_at?: string
          encrypted_stripe_id?: string | null
          encryption_key_hash?: string | null
          id?: string
          last_accessed?: string | null
          payment_method_id: string
        }
        Update: {
          created_at?: string
          encrypted_stripe_id?: string | null
          encryption_key_hash?: string | null
          id?: string
          last_accessed?: string | null
          payment_method_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_secrets_vault_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_security_alerts: {
        Row: {
          alert_type: string
          attempted_data: Json | null
          created_at: string
          id: string
          ip_address: unknown | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          alert_type: string
          attempted_data?: Json | null
          created_at?: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          alert_type?: string
          attempted_data?: Json | null
          created_at?: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      payment_vault_encrypted: {
        Row: {
          access_count: number | null
          created_at: string
          encrypted_metadata: string | null
          encrypted_stripe_id: string
          encryption_version: number
          id: string
          key_fingerprint: string
          last_accessed: string | null
          payment_method_id: string
        }
        Insert: {
          access_count?: number | null
          created_at?: string
          encrypted_metadata?: string | null
          encrypted_stripe_id: string
          encryption_version?: number
          id?: string
          key_fingerprint: string
          last_accessed?: string | null
          payment_method_id: string
        }
        Update: {
          access_count?: number | null
          created_at?: string
          encrypted_metadata?: string | null
          encrypted_stripe_id?: string
          encryption_version?: number
          id?: string
          key_fingerprint?: string
          last_accessed?: string | null
          payment_method_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_vault_encrypted_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
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
          tags: string[] | null
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
          tags?: string[] | null
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
          tags?: string[] | null
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
      rate_limit_events: {
        Row: {
          action: string
          created_at: string
          email: string | null
          id: string
          ip: string
        }
        Insert: {
          action: string
          created_at?: string
          email?: string | null
          id?: string
          ip: string
        }
        Update: {
          action?: string
          created_at?: string
          email?: string | null
          id?: string
          ip?: string
        }
        Relationships: []
      }
      saved_posts: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: []
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
      tags: {
        Row: {
          category: string | null
          created_at: string | null
          flagged_reason: string | null
          id: string
          is_flagged: boolean | null
          is_moderated: boolean | null
          name: string
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          flagged_reason?: string | null
          id?: string
          is_flagged?: boolean | null
          is_moderated?: boolean | null
          name: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          flagged_reason?: string | null
          id?: string
          is_flagged?: boolean | null
          is_moderated?: boolean | null
          name?: string
          updated_at?: string | null
          usage_count?: number | null
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
            foreignKeyName: "fk_user_subscriptions_creator_id"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_user_subscriptions_tier_id"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "membership_tiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_user_subscriptions_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
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
          email_2fa_enabled: boolean
          id: string
          is_nsfw_enabled: boolean
          notification_preferences: Json | null
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
          email_2fa_enabled?: boolean
          id?: string
          is_nsfw_enabled?: boolean
          notification_preferences?: Json | null
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
          email_2fa_enabled?: boolean
          id?: string
          is_nsfw_enabled?: boolean
          notification_preferences?: Json | null
          profile_picture?: string | null
          updated_at?: string | null
          username?: string
          website?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      audit_payment_operation: {
        Args: {
          p_metadata?: Json
          p_operation_type: string
          p_payment_method_id: string
          p_result: string
        }
        Returns: undefined
      }
      check_payment_rate_limit: {
        Args: {
          p_limit?: number
          p_operation: string
          p_user_id: string
          p_window_minutes?: number
        }
        Returns: boolean
      }
      cleanup_expired_2fa_codes: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_old_payment_audit_logs: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      detect_payment_intrusion: {
        Args: { p_suspicious_behavior: string; p_table_accessed: string }
        Returns: undefined
      }
      get_commission_request_secure: {
        Args: { p_commission_id: string }
        Returns: {
          agreed_price: number
          budget_range_max: number
          budget_range_min: number
          commission_type_base_price: number
          commission_type_id: string
          commission_type_name: string
          created_at: string
          creator_id: string
          creator_notes: string
          customer_id: string
          customer_notes: string
          customer_profile_picture: string
          customer_username: string
          deadline: string
          description: string
          id: string
          platform_fee_amount: number
          reference_images: string[]
          revision_count: number
          selected_addons: Json
          status: string
          stripe_payment_intent_id: string
          title: string
          updated_at: string
        }[]
      }
      get_creator_commission_info: {
        Args: { p_creator_id: string }
        Returns: {
          accepts_commissions: boolean
          commission_base_rate: number
          commission_slots_available: number
          commission_tos: string
          commission_turnaround_days: number
          id: string
        }[]
      }
      get_creator_commission_status: {
        Args: { p_creator_id: string }
        Returns: boolean
      }
      get_creator_followers: {
        Args: { p_creator_id: string; p_limit?: number; p_offset?: number }
        Returns: {
          profile_picture: string
          user_id: string
          username: string
        }[]
      }
      get_creator_ratings: {
        Args: {
          p_creator_id: string
          p_limit?: number
          p_offset?: number
          p_rating_type?: string
        }
        Returns: {
          created_at: string
          creator_id: string
          id: string
          profile_picture: string
          rating: number
          rating_type: string
          review_text: string
          user_id: string
          username: string
        }[]
      }
      get_masked_payment_methods: {
        Args: { p_user_id: string }
        Returns: {
          card_brand: string
          card_last4: string
          exp_display: string
          id: string
          is_default: boolean
          type: string
        }[]
      }
      get_my_creator_earnings: {
        Args: {
          p_end_date?: string
          p_limit?: number
          p_offset?: number
          p_start_date?: string
        }
        Returns: {
          amount: number
          commission_request_id: string
          creator_id: string
          earning_type: string
          id: string
          net_amount: number
          payment_date: string
          platform_fee: number
          subscription_id: string
        }[]
      }
      get_my_creator_earnings_summary: {
        Args: { p_end_date?: string; p_start_date?: string }
        Returns: {
          count_records: number
          total_amount: number
          total_net: number
          total_platform_fees: number
        }[]
      }
      get_payment_method_for_processing: {
        Args: { p_operation: string; p_payment_method_id: string }
        Returns: {
          id: string
          stripe_payment_method_id: string
          type: string
          user_id: string
        }[]
      }
      get_payment_method_for_processing_secure: {
        Args: {
          p_operation: string
          p_payment_method_id: string
          p_request_context?: Json
        }
        Returns: {
          method_type: string
          stripe_payment_method_id: string
          user_id: string
        }[]
      }
      get_payment_method_for_service: {
        Args: { p_operation: string; p_payment_method_id: string }
        Returns: {
          id: string
          stripe_payment_method_id: string
          type: string
          user_id: string
        }[]
      }
      get_payment_security_summary: {
        Args: Record<PropertyKey, never>
        Returns: {
          newest_record: string
          oldest_record: string
          table_name: string
          total_records: number
          unique_users: number
        }[]
      }
      get_post_like_count: {
        Args: { post_id_param: string }
        Returns: number
      }
      get_post_view_count: {
        Args: { post_id_param: string }
        Returns: number
      }
      get_public_commission_types: {
        Args: {
          p_creator_id: string
          p_limit?: number
          p_offset?: number
          p_only_active?: boolean
        }
        Returns: {
          base_price: number
          creator_id: string
          description: string
          estimated_turnaround_days: number
          id: string
          is_active: boolean
          name: string
          sample_art_url: string
          tags: string[]
        }[]
      }
      get_public_creator_profile: {
        Args:
          | { p_creator_id?: string; p_user_id?: string; p_username?: string }
          | { p_creator_id?: string; p_username?: string }
        Returns: {
          banner_url: string
          bio: string
          display_name: string
          follower_count: number
          id: string
          is_nsfw: boolean
          profile_image_url: string
          tags: string[]
          username: string
          website: string
        }[]
      }
      get_public_creators_by_user_ids: {
        Args: { p_user_ids: string[] }
        Returns: {
          bio: string
          display_name: string
          id: string
          profile_image_url: string
          user_id: string
        }[]
      }
      get_public_creators_list: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_search?: string
          p_sort?: string
        }
        Returns: {
          banner_url: string
          bio: string
          created_at: string
          display_name: string
          follower_count: number
          id: string
          is_nsfw: boolean
          profile_image_url: string
          tags: string[]
          user_id: string
          username: string
          website: string
        }[]
      }
      get_public_membership_tiers: {
        Args: { p_creator_id: string; p_limit?: number; p_offset?: number }
        Returns: {
          active: boolean
          creator_id: string
          description: string
          id: string
          price: number
          title: string
        }[]
      }
      get_safe_payment_methods: {
        Args: { p_user_id: string }
        Returns: {
          card_brand: string
          card_exp_month: number
          card_exp_year: number
          card_last4: string
          created_at: string
          id: string
          is_default: boolean
          type: string
          updated_at: string
          user_id: string
        }[]
      }
      get_secure_payment_display: {
        Args: { p_user_id: string }
        Returns: {
          card_type: string
          created_at: string
          display_text: string
          id: string
          is_default: boolean
        }[]
      }
      get_user_commission_requests_with_details: {
        Args: { p_customer_id: string }
        Returns: {
          agreed_price: number
          budget_range_max: number
          budget_range_min: number
          commission_type_base_price: number
          commission_type_id: string
          commission_type_max_revisions: number
          commission_type_name: string
          commission_type_price_per_revision: number
          created_at: string
          creator_display_name: string
          creator_id: string
          creator_notes: string
          creator_profile_image_url: string
          customer_id: string
          customer_notes: string
          deadline: string
          description: string
          id: string
          platform_fee_amount: number
          reference_images: string[]
          revision_count: number
          selected_addons: Json
          status: string
          stripe_payment_intent_id: string
          title: string
          updated_at: string
        }[]
      }
      get_user_following: {
        Args: { p_limit?: number; p_offset?: number; p_user_id: string }
        Returns: {
          banner_url: string
          bio: string
          creator_id: string
          creator_user_id: string
          display_name: string
          followed_at: string
          follower_count: number
          is_nsfw: boolean
          profile_image_url: string
          tags: string[]
          username: string
        }[]
      }
      get_user_payment_cards_display: {
        Args: { p_user_id: string }
        Returns: {
          card_display: string
          created_at: string
          id: string
          is_default: boolean
        }[]
      }
      get_user_payment_methods_secure: {
        Args: { p_user_id: string }
        Returns: {
          card_brand: string
          card_exp_month: number
          card_exp_year: number
          card_last4: string
          created_at: string
          id: string
          is_default: boolean
          type: string
        }[]
      }
      get_user_public_data: {
        Args: { ids?: string[]; usernames?: string[] }
        Returns: {
          created_at: string
          id: string
          profile_picture: string
          username: string
          website: string
        }[]
      }
      get_user_public_profiles: {
        Args: { ids?: string[]; usernames?: string[] }
        Returns: {
          created_at: string
          id: string
          profile_picture: string
          username: string
          website: string
        }[]
      }
      get_zero_knowledge_payment_display: {
        Args: { p_user_id: string }
        Returns: {
          added_date: string
          id: string
          is_default: boolean
          method_type: string
          status: string
        }[]
      }
      list_my_commission_requests: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_role?: string
          p_status?: string
        }
        Returns: {
          agreed_price: number
          commission_type_base_price: number
          commission_type_id: string
          commission_type_name: string
          created_at: string
          creator_id: string
          customer_id: string
          id: string
          status: string
          title: string
          updated_at: string
        }[]
      }
      log_payment_access: {
        Args: {
          p_accessed_data?: Json
          p_operation: string
          p_table_name: string
        }
        Returns: undefined
      }
      log_secure_payment_access: {
        Args: { p_metadata?: Json; p_operation: string; p_user_id: string }
        Returns: undefined
      }
      log_security_event: {
        Args: { p_details?: Json; p_event_type: string; p_table_name: string }
        Returns: undefined
      }
      user_has_tier_access: {
        Args: { tier_id_param: string }
        Returns: boolean
      }
      user_owns_creator_profile: {
        Args: { creator_id_param: string }
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
