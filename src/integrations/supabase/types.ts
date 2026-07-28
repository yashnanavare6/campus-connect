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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      claims: {
        Row: {
          claimer_id: string
          created_at: string
          id: string
          item_id: string
          message: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["claim_status"]
          verification_answers: Json
        }
        Insert: {
          claimer_id: string
          created_at?: string
          id?: string
          item_id: string
          message?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["claim_status"]
          verification_answers?: Json
        }
        Update: {
          claimer_id?: string
          created_at?: string
          id?: string
          item_id?: string
          message?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["claim_status"]
          verification_answers?: Json
        }
        Relationships: [
          {
            foreignKeyName: "claims_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "found_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claims_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "found_items_public"
            referencedColumns: ["id"]
          },
        ]
      }
      found_items: {
        Row: {
          category: string
          created_at: string
          date_found: string | null
          finder_contact: string | null
          finder_id: string
          hidden_details: Json
          id: string
          image_url: string | null
          images: string[]
          location_found: string | null
          public_description: string | null
          status: Database["public"]["Enums"]["item_status"]
          title: string
        }
        Insert: {
          category: string
          created_at?: string
          date_found?: string | null
          finder_contact?: string | null
          finder_id: string
          hidden_details?: Json
          id?: string
          image_url?: string | null
          images?: string[]
          location_found?: string | null
          public_description?: string | null
          status?: Database["public"]["Enums"]["item_status"]
          title: string
        }
        Update: {
          category?: string
          created_at?: string
          date_found?: string | null
          finder_contact?: string | null
          finder_id?: string
          hidden_details?: Json
          id?: string
          image_url?: string | null
          images?: string[]
          location_found?: string | null
          public_description?: string | null
          status?: Database["public"]["Enums"]["item_status"]
          title?: string
        }
        Relationships: []
      }
      lost_items: {
        Row: {
          category: string
          created_at: string
          date_lost: string | null
          description: string | null
          id: string
          image_url: string | null
          location_lost: string | null
          owner_id: string
          status: Database["public"]["Enums"]["item_status"]
          title: string
        }
        Insert: {
          category: string
          created_at?: string
          date_lost?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          location_lost?: string | null
          owner_id: string
          status?: Database["public"]["Enums"]["item_status"]
          title: string
        }
        Update: {
          category?: string
          created_at?: string
          date_lost?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          location_lost?: string | null
          owner_id?: string
          status?: Database["public"]["Enums"]["item_status"]
          title?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          department: string | null
          email: string
          id: string
          name: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          created_at?: string
          department?: string | null
          email: string
          id: string
          name?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          created_at?: string
          department?: string | null
          email?: string
          id?: string
          name?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      found_items_public: {
        Row: {
          category: string | null
          created_at: string | null
          date_found: string | null
          finder_id: string | null
          id: string | null
          image_url: string | null
          images: string[] | null
          location_found: string | null
          public_description: string | null
          status: Database["public"]["Enums"]["item_status"] | null
          title: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          date_found?: string | null
          finder_id?: string | null
          id?: string | null
          image_url?: string | null
          images?: string[] | null
          location_found?: string | null
          public_description?: string | null
          status?: Database["public"]["Enums"]["item_status"] | null
          title?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          date_found?: string | null
          finder_id?: string | null
          id?: string | null
          image_url?: string | null
          images?: string[] | null
          location_found?: string | null
          public_description?: string | null
          status?: Database["public"]["Enums"]["item_status"] | null
          title?: string | null
        }
        Relationships: []
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
      is_item_finder: {
        Args: { _item_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      claim_status: "pending" | "approved" | "rejected"
      item_status: "open" | "claimed" | "recovered" | "closed"
      user_role: "student" | "faculty" | "driver"
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
      app_role: ["admin", "moderator", "user"],
      claim_status: ["pending", "approved", "rejected"],
      item_status: ["open", "claimed", "recovered", "closed"],
      user_role: ["student", "faculty", "driver"],
    },
  },
} as const
