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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ad_hooks: {
        Row: {
          ad_name: string | null
          adset_name: string | null
          brand_id: string | null
          campaign_name: string | null
          conversion_source: string | null
          created_at: string
          hook_type: string | null
          id: string
          name: string
          platform: string
        }
        Insert: {
          ad_name?: string | null
          adset_name?: string | null
          brand_id?: string | null
          campaign_name?: string | null
          conversion_source?: string | null
          created_at?: string
          hook_type?: string | null
          id?: string
          name: string
          platform: string
        }
        Update: {
          ad_name?: string | null
          adset_name?: string | null
          brand_id?: string | null
          campaign_name?: string | null
          conversion_source?: string | null
          created_at?: string
          hook_type?: string | null
          id?: string
          name?: string
          platform?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_hooks_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment_statuses: {
        Row: {
          created_at: string | null
          id: string
          is_negative: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_negative?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_negative?: boolean | null
          name?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          ad_hook: string | null
          adset_name: string | null
          booked_at: string | null
          brand_id: string | null
          campaign_name: string | null
          channel_id: string | null
          contact_email: string | null
          created_at: string | null
          feedback_received_at: string | null
          id: string
          lead_id: string | null
          partner_id: string | null
          postal_code: string | null
          province_id: string | null
          rescheduled: boolean | null
          rescheduled_at: string | null
          salesperson_id: string | null
          scheduled_at: string | null
          sector_id: string | null
          source_id: string | null
          status_id: string | null
          status_reason: string | null
          upload_id: string | null
        }
        Insert: {
          ad_hook?: string | null
          adset_name?: string | null
          booked_at?: string | null
          brand_id?: string | null
          campaign_name?: string | null
          channel_id?: string | null
          contact_email?: string | null
          created_at?: string | null
          feedback_received_at?: string | null
          id?: string
          lead_id?: string | null
          partner_id?: string | null
          postal_code?: string | null
          province_id?: string | null
          rescheduled?: boolean | null
          rescheduled_at?: string | null
          salesperson_id?: string | null
          scheduled_at?: string | null
          sector_id?: string | null
          source_id?: string | null
          status_id?: string | null
          status_reason?: string | null
          upload_id?: string | null
        }
        Update: {
          ad_hook?: string | null
          adset_name?: string | null
          booked_at?: string | null
          brand_id?: string | null
          campaign_name?: string | null
          channel_id?: string | null
          contact_email?: string | null
          created_at?: string | null
          feedback_received_at?: string | null
          id?: string
          lead_id?: string | null
          partner_id?: string | null
          postal_code?: string | null
          province_id?: string | null
          rescheduled?: boolean | null
          rescheduled_at?: string | null
          salesperson_id?: string | null
          scheduled_at?: string | null
          sector_id?: string | null
          source_id?: string | null
          status_id?: string | null
          status_reason?: string | null
          upload_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_province_id_fkey"
            columns: ["province_id"]
            isOneToOne: false
            referencedRelation: "provinces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_salesperson_id_fkey"
            columns: ["salesperson_id"]
            isOneToOne: false
            referencedRelation: "salespeople"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "appointment_statuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "upload_history"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          color: string | null
          created_at: string
          icon: string | null
          id: string
          name: string
          price_per_appointment: number | null
          slug: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          price_per_appointment?: number | null
          slug: string
        }
        Update: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          price_per_appointment?: number | null
          slug?: string
        }
        Relationships: []
      }
      channels: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          brand_id: string | null
          channel_id: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          conversation_date: string | null
          created_at: string
          external_ref: string | null
          id: string
          lead_id: string | null
          notes: string | null
          province_id: string | null
          sector_id: string | null
          source_id: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          brand_id?: string | null
          channel_id?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          conversation_date?: string | null
          created_at?: string
          external_ref?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          province_id?: string | null
          sector_id?: string | null
          source_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          brand_id?: string | null
          channel_id?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          conversation_date?: string | null
          created_at?: string
          external_ref?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          province_id?: string | null
          sector_id?: string | null
          source_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_province_id_fkey"
            columns: ["province_id"]
            isOneToOne: false
            referencedRelation: "provinces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_items: {
        Row: {
          amount_eur: number
          brand_id: string | null
          campaign_name: string | null
          channel_id: string | null
          created_at: string | null
          date: string
          id: string
          notes: string | null
          sector_id: string | null
          source_id: string | null
          upload_id: string | null
        }
        Insert: {
          amount_eur?: number
          brand_id?: string | null
          campaign_name?: string | null
          channel_id?: string | null
          created_at?: string | null
          date: string
          id?: string
          notes?: string | null
          sector_id?: string | null
          source_id?: string | null
          upload_id?: string | null
        }
        Update: {
          amount_eur?: number
          brand_id?: string | null
          campaign_name?: string | null
          channel_id?: string | null
          created_at?: string | null
          date?: string
          id?: string
          notes?: string | null
          sector_id?: string | null
          source_id?: string | null
          upload_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cost_items_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cost_items_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cost_items_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cost_items_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cost_items_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "upload_history"
            referencedColumns: ["id"]
          },
        ]
      }
      excluded_postcodes: {
        Row: {
          created_at: string
          id: string
          postcode: string
          reason: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          postcode: string
          reason?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          postcode?: string
          reason?: string | null
        }
        Relationships: []
      }
      feature_requests: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          id: string
          status: string | null
          target_dashboard: string | null
          title: string
          votes: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          status?: string | null
          target_dashboard?: string | null
          title: string
          votes?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          status?: string | null
          target_dashboard?: string | null
          title?: string
          votes?: number | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          ad_hook_id: string | null
          ad_name: string | null
          adset_name: string | null
          brand_id: string | null
          campaign_name: string | null
          channel_id: string | null
          city: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          conversion_source: string | null
          created_at: string | null
          external_ref: string | null
          first_name: string | null
          id: string
          last_name: string | null
          notes: string | null
          postal_code: string | null
          province_id: string | null
          sector_id: string | null
          source_id: string | null
          street_address: string | null
          termijn: string | null
          upload_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          ad_hook_id?: string | null
          ad_name?: string | null
          adset_name?: string | null
          brand_id?: string | null
          campaign_name?: string | null
          channel_id?: string | null
          city?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          conversion_source?: string | null
          created_at?: string | null
          external_ref?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          notes?: string | null
          postal_code?: string | null
          province_id?: string | null
          sector_id?: string | null
          source_id?: string | null
          street_address?: string | null
          termijn?: string | null
          upload_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          ad_hook_id?: string | null
          ad_name?: string | null
          adset_name?: string | null
          brand_id?: string | null
          campaign_name?: string | null
          channel_id?: string | null
          city?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          conversion_source?: string | null
          created_at?: string | null
          external_ref?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          notes?: string | null
          postal_code?: string | null
          province_id?: string | null
          sector_id?: string | null
          source_id?: string | null
          street_address?: string | null
          termijn?: string | null
          upload_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_ad_hook_id_fkey"
            columns: ["ad_hook_id"]
            isOneToOne: false
            referencedRelation: "ad_hooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_province_id_fkey"
            columns: ["province_id"]
            isOneToOne: false
            referencedRelation: "provinces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "upload_history"
            referencedColumns: ["id"]
          },
        ]
      }
      lost_leads: {
        Row: {
          brand_id: string | null
          channel_id: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          id: string
          lead_id: string | null
          lost_at: string
          lost_reason: string
          notes: string | null
          province_id: string | null
          sector_id: string | null
          source_id: string | null
          user_email: string | null
        }
        Insert: {
          brand_id?: string | null
          channel_id?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          lost_at?: string
          lost_reason: string
          notes?: string | null
          province_id?: string | null
          sector_id?: string | null
          source_id?: string | null
          user_email?: string | null
        }
        Update: {
          brand_id?: string | null
          channel_id?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          lost_at?: string
          lost_reason?: string
          notes?: string | null
          province_id?: string | null
          sector_id?: string | null
          source_id?: string | null
          user_email?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lost_leads_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lost_leads_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lost_leads_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lost_leads_province_id_fkey"
            columns: ["province_id"]
            isOneToOne: false
            referencedRelation: "provinces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lost_leads_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lost_leads_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      multi_product_bookings: {
        Row: {
          booking_reference: string | null
          contact_email: string
          created_at: string
          id: string
          matched_at: string | null
          matched_lead_id: string | null
          products: string[]
          raw_payload: Json | null
          received_at: string
        }
        Insert: {
          booking_reference?: string | null
          contact_email: string
          created_at?: string
          id?: string
          matched_at?: string | null
          matched_lead_id?: string | null
          products?: string[]
          raw_payload?: Json | null
          received_at?: string
        }
        Update: {
          booking_reference?: string | null
          contact_email?: string
          created_at?: string
          id?: string
          matched_at?: string | null
          matched_lead_id?: string | null
          products?: string[]
          raw_payload?: Json | null
          received_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "multi_product_bookings_matched_lead_id_fkey"
            columns: ["matched_lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_coverage: {
        Row: {
          brand_id: string | null
          capacity_per_week: number | null
          created_at: string | null
          id: string
          partner_id: string
          province_id: string
          sector_id: string
        }
        Insert: {
          brand_id?: string | null
          capacity_per_week?: number | null
          created_at?: string | null
          id?: string
          partner_id: string
          province_id: string
          sector_id: string
        }
        Update: {
          brand_id?: string | null
          capacity_per_week?: number | null
          created_at?: string | null
          id?: string
          partner_id?: string
          province_id?: string
          sector_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_coverage_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_coverage_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_coverage_province_id_fkey"
            columns: ["province_id"]
            isOneToOne: false
            referencedRelation: "provinces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_coverage_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_sectors: {
        Row: {
          created_at: string | null
          id: string
          partner_id: string
          sector_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          partner_id: string
          sector_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          partner_id?: string
          sector_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_sectors_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_sectors_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          active: boolean | null
          brand_id: string | null
          created_at: string | null
          email: string | null
          id: string
          last_synced_at: string | null
          name: string
          notes: string | null
          phone: string | null
          postcode_sheets_url: string | null
          price_per_appointment: number | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          brand_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          last_synced_at?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          postcode_sheets_url?: string | null
          price_per_appointment?: number | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          brand_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          last_synced_at?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          postcode_sheets_url?: string | null
          price_per_appointment?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partners_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      postcode_coverage: {
        Row: {
          brand_id: string | null
          capacity_per_week: number | null
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          municipality: string | null
          partner_id: string | null
          postcode: string
          province_id: string | null
          salesperson_id: string | null
          sector_id: string | null
        }
        Insert: {
          brand_id?: string | null
          capacity_per_week?: number | null
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          municipality?: string | null
          partner_id?: string | null
          postcode: string
          province_id?: string | null
          salesperson_id?: string | null
          sector_id?: string | null
        }
        Update: {
          brand_id?: string | null
          capacity_per_week?: number | null
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          municipality?: string | null
          partner_id?: string | null
          postcode?: string
          province_id?: string | null
          salesperson_id?: string | null
          sector_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "postcode_coverage_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "postcode_coverage_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "postcode_coverage_province_id_fkey"
            columns: ["province_id"]
            isOneToOne: false
            referencedRelation: "provinces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "postcode_coverage_salesperson_id_fkey"
            columns: ["salesperson_id"]
            isOneToOne: false
            referencedRelation: "salespeople"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "postcode_coverage_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      postcode_sync_history: {
        Row: {
          error_message: string | null
          id: string
          partner_id: string | null
          postcodes_count: number
          success: boolean
          synced_at: string
        }
        Insert: {
          error_message?: string | null
          id?: string
          partner_id?: string | null
          postcodes_count?: number
          success?: boolean
          synced_at?: string
        }
        Update: {
          error_message?: string | null
          id?: string
          partner_id?: string | null
          postcodes_count?: number
          success?: boolean
          synced_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "postcode_sync_history_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      provinces: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      revenue_items: {
        Row: {
          amount_eur: number
          appointment_id: string | null
          brand_id: string | null
          created_at: string | null
          date: string
          id: string
          lead_id: string | null
          notes: string | null
          partner_id: string | null
          pricing_model: string | null
          sector_id: string | null
          upload_id: string | null
        }
        Insert: {
          amount_eur?: number
          appointment_id?: string | null
          brand_id?: string | null
          created_at?: string | null
          date: string
          id?: string
          lead_id?: string | null
          notes?: string | null
          partner_id?: string | null
          pricing_model?: string | null
          sector_id?: string | null
          upload_id?: string | null
        }
        Update: {
          amount_eur?: number
          appointment_id?: string | null
          brand_id?: string | null
          created_at?: string | null
          date?: string
          id?: string
          lead_id?: string | null
          notes?: string | null
          partner_id?: string | null
          pricing_model?: string | null
          sector_id?: string | null
          upload_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "revenue_items_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_items_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_items_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_items_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_items_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_items_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "upload_history"
            referencedColumns: ["id"]
          },
        ]
      }
      salespeople: {
        Row: {
          created_at: string
          id: string
          name: string
          partner_id: string
          phone: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          partner_id: string
          phone?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          partner_id?: string
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "salespeople_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      salesperson_regions: {
        Row: {
          created_at: string
          id: string
          province_id: string
          salesperson_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          province_id: string
          salesperson_id: string
        }
        Update: {
          created_at?: string
          id?: string
          province_id?: string
          salesperson_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "salesperson_regions_province_id_fkey"
            columns: ["province_id"]
            isOneToOne: false
            referencedRelation: "provinces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salesperson_regions_salesperson_id_fkey"
            columns: ["salesperson_id"]
            isOneToOne: false
            referencedRelation: "salespeople"
            referencedColumns: ["id"]
          },
        ]
      }
      salesperson_sectors: {
        Row: {
          created_at: string
          id: string
          salesperson_id: string
          sector_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          salesperson_id: string
          sector_id: string
        }
        Update: {
          created_at?: string
          id?: string
          salesperson_id?: string
          sector_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "salesperson_sectors_salesperson_id_fkey"
            columns: ["salesperson_id"]
            isOneToOne: false
            referencedRelation: "salespeople"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salesperson_sectors_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      sector_lead_prices: {
        Row: {
          active: boolean | null
          brand_id: string | null
          created_at: string
          id: string
          notes: string | null
          price_per_lead: number
          sector_id: string
          source_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          brand_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          price_per_lead?: number
          sector_id: string
          source_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          brand_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          price_per_lead?: number
          sector_id?: string
          source_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sector_lead_prices_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sector_lead_prices_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sector_lead_prices_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      sectors: {
        Row: {
          brand_id: string | null
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          brand_id?: string | null
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          brand_id?: string | null
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "sectors_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      sources: {
        Row: {
          active: boolean | null
          brand_id: string | null
          created_at: string | null
          id: string
          name: string
          notes: string | null
          price_per_lead: number | null
          pricing_model: string | null
        }
        Insert: {
          active?: boolean | null
          brand_id?: string | null
          created_at?: string | null
          id?: string
          name: string
          notes?: string | null
          price_per_lead?: number | null
          pricing_model?: string | null
        }
        Update: {
          active?: boolean | null
          brand_id?: string | null
          created_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          price_per_lead?: number | null
          pricing_model?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sources_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      telecalendar_reps: {
        Row: {
          active: boolean
          buffer_minutes: number
          company_name: string | null
          created_at: string
          event_type_id: number
          id: string
          max_appointments_per_day: number | null
          rep_name: string
          slot_duration: number
          updated_at: string
          work_end_hour: number
          work_start_hour: number
          working_days: number[]
        }
        Insert: {
          active?: boolean
          buffer_minutes?: number
          company_name?: string | null
          created_at?: string
          event_type_id: number
          id?: string
          max_appointments_per_day?: number | null
          rep_name: string
          slot_duration?: number
          updated_at?: string
          work_end_hour?: number
          work_start_hour?: number
          working_days?: number[]
        }
        Update: {
          active?: boolean
          buffer_minutes?: number
          company_name?: string | null
          created_at?: string
          event_type_id?: number
          id?: string
          max_appointments_per_day?: number | null
          rep_name?: string
          slot_duration?: number
          updated_at?: string
          work_end_hour?: number
          work_start_hour?: number
          working_days?: number[]
        }
        Relationships: []
      }
      upload_history: {
        Row: {
          created_at: string
          error_message: string | null
          file_name: string
          id: string
          records_count: number
          success: boolean
          upload_type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          file_name: string
          id?: string
          records_count?: number
          success?: boolean
          upload_type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          file_name?: string
          id?: string
          records_count?: number
          success?: boolean
          upload_type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      weekly_ad_costs: {
        Row: {
          brand_id: string | null
          channel_id: string | null
          cost_per_lead: number | null
          created_at: string
          id: string
          lead_count: number | null
          notes: string | null
          sector_id: string | null
          total_cost_eur: number
          updated_at: string
          week_end: string
          week_start: string
        }
        Insert: {
          brand_id?: string | null
          channel_id?: string | null
          cost_per_lead?: number | null
          created_at?: string
          id?: string
          lead_count?: number | null
          notes?: string | null
          sector_id?: string | null
          total_cost_eur?: number
          updated_at?: string
          week_end: string
          week_start: string
        }
        Update: {
          brand_id?: string | null
          channel_id?: string | null
          cost_per_lead?: number | null
          created_at?: string
          id?: string
          lead_count?: number | null
          notes?: string | null
          sector_id?: string | null
          total_cost_eur?: number
          updated_at?: string
          week_end?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_ad_costs_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_ad_costs_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_ad_costs_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      postcode_coverage_aggregated: {
        Row: {
          brand_id: string | null
          partner_ids: string[] | null
          postcode: string | null
          province_id: string | null
          sector_ids: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "postcode_coverage_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "postcode_coverage_province_id_fkey"
            columns: ["province_id"]
            isOneToOne: false
            referencedRelation: "provinces"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "viewer"
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
    Enums: {
      app_role: ["admin", "viewer"],
    },
  },
} as const
