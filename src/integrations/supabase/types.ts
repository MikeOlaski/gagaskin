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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          id: number
          registration_cap: number
        }
        Insert: {
          id?: number
          registration_cap?: number
        }
        Update: {
          id?: number
          registration_cap?: number
        }
        Relationships: []
      }
      gallery_skins: {
        Row: {
          author_handle: string | null
          created_at: string
          download_count: number
          featured: boolean
          id: string
          ingame_path: string
          inspiration_path: string
          made_with: string
          project_id: string | null
          published: boolean
          render_duo_path: string | null
          render_iso_path: string | null
          render_quad_path: string | null
          skin_png_path: string | null
          sort_order: number
          title: string
        }
        Insert: {
          author_handle?: string | null
          created_at?: string
          download_count?: number
          featured?: boolean
          id?: string
          ingame_path: string
          inspiration_path: string
          made_with: string
          project_id?: string | null
          published?: boolean
          render_duo_path?: string | null
          render_iso_path?: string | null
          render_quad_path?: string | null
          skin_png_path?: string | null
          sort_order?: number
          title: string
        }
        Update: {
          author_handle?: string | null
          created_at?: string
          download_count?: number
          featured?: boolean
          id?: string
          ingame_path?: string
          inspiration_path?: string
          made_with?: string
          project_id?: string | null
          published?: boolean
          render_duo_path?: string | null
          render_iso_path?: string | null
          render_quad_path?: string | null
          skin_png_path?: string | null
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "gallery_skins_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "skin_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      offer_views: {
        Row: {
          offer: string
          views: number
        }
        Insert: {
          offer: string
          views?: number
        }
        Update: {
          offer?: string
          views?: number
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_total: number
          created_at: string
          currency: string
          environment: string
          id: string
          status: string
          stripe_customer_id: string | null
          stripe_session_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount_total?: number
          created_at?: string
          currency?: string
          environment?: string
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_session_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount_total?: number
          created_at?: string
          currency?: string
          environment?: string
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_session_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          handle: string | null
          id: string
          platform: string
          source_offer: string
        }
        Insert: {
          created_at?: string
          handle?: string | null
          id: string
          platform?: string
          source_offer?: string
        }
        Update: {
          created_at?: string
          handle?: string | null
          id?: string
          platform?: string
          source_offer?: string
        }
        Relationships: []
      }
      skin_downloads: {
        Row: {
          created_at: string
          id: string
          skin_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          skin_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          skin_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skin_downloads_skin_id_fkey"
            columns: ["skin_id"]
            isOneToOne: false
            referencedRelation: "gallery_skins"
            referencedColumns: ["id"]
          },
        ]
      }
      skin_orders: {
        Row: {
          brief: string
          created_at: string
          creator_id: string | null
          customer_id: string
          delivered_project_id: string | null
          id: string
          platform: string
          price_intent: string
          reference_path: string | null
          released_at: string | null
          released_by: string | null
          status: Database["public"]["Enums"]["order_status"]
          updated_at: string
        }
        Insert: {
          brief: string
          created_at?: string
          creator_id?: string | null
          customer_id: string
          delivered_project_id?: string | null
          id?: string
          platform?: string
          price_intent?: string
          reference_path?: string | null
          released_at?: string | null
          released_by?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
        }
        Update: {
          brief?: string
          created_at?: string
          creator_id?: string | null
          customer_id?: string
          delivered_project_id?: string | null
          id?: string
          platform?: string
          price_intent?: string
          reference_path?: string | null
          released_at?: string | null
          released_by?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "skin_orders_delivered_project_id_fkey"
            columns: ["delivered_project_id"]
            isOneToOne: false
            referencedRelation: "skin_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      skin_projects: {
        Row: {
          created_at: string
          id: string
          name: string
          palette: Json
          plan: Json | null
          reference_data_url: string | null
          skin_png: string
          updated_at: string
          user_id: string
          view_state: Json
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string
          palette?: Json
          plan?: Json | null
          reference_data_url?: string | null
          skin_png: string
          updated_at?: string
          user_id: string
          view_state?: Json
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          palette?: Json
          plan?: Json | null
          reference_data_url?: string | null
          skin_png?: string
          updated_at?: string
          user_id?: string
          view_state?: Json
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          price_id: string | null
          product_id: string | null
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id?: string | null
          product_id?: string | null
          status?: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id?: string | null
          product_id?: string | null
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          created_at: string
          email: string
          id: string
          source_offer: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          source_offer?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          source_offer?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_active_subscription: {
        Args: { check_env?: string; user_uuid: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      record_offer_view: { Args: { _offer: string }; Returns: undefined }
      record_skin_download: { Args: { _skin: string }; Returns: undefined }
      registration_open: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "guardian" | "creator"
      order_status: "submitted" | "released" | "in_progress" | "delivered"
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
      app_role: ["guardian", "creator"],
      order_status: ["submitted", "released", "in_progress", "delivered"],
    },
  },
} as const
