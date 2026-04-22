export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      admin_permissions: {
        Row: {
          can_edit_site: boolean;
          can_give_discount: boolean;
          can_manage_bookings: boolean;
          can_manage_members: boolean;
          can_publish_posts: boolean;
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          can_edit_site?: boolean;
          can_give_discount?: boolean;
          can_manage_bookings?: boolean;
          can_manage_members?: boolean;
          can_publish_posts?: boolean;
          created_at?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          can_edit_site?: boolean;
          can_give_discount?: boolean;
          can_manage_bookings?: boolean;
          can_manage_members?: boolean;
          can_publish_posts?: boolean;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      bookings: {
        Row: {
          booking_code: string;
          booking_date: string;
          created_at: string;
          duration_minutes: number;
          end_slot: string;
          guest_name: string;
          guest_phone: string;
          id: string;
          notes: string | null;
          start_slot: string;
          status: Database["public"]["Enums"]["booking_status"];
          table_id: string;
          table_type: string;
          total_price: number;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          booking_code: string;
          booking_date: string;
          created_at?: string;
          duration_minutes?: number;
          end_slot: string;
          guest_name: string;
          guest_phone: string;
          id?: string;
          notes?: string | null;
          start_slot: string;
          status?: Database["public"]["Enums"]["booking_status"];
          table_id: string;
          table_type: string;
          total_price: number;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          booking_code?: string;
          booking_date?: string;
          created_at?: string;
          duration_minutes?: number;
          end_slot?: string;
          guest_name?: string;
          guest_phone?: string;
          id?: string;
          notes?: string | null;
          start_slot?: string;
          status?: Database["public"]["Enums"]["booking_status"];
          table_id?: string;
          table_type?: string;
          total_price?: number;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      post_comments: {
        Row: {
          content: string;
          created_at: string;
          id: string;
          post_id: string;
          user_id: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          id?: string;
          post_id: string;
          user_id: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          id?: string;
          post_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
        ];
      };
      post_images: {
        Row: {
          created_at: string;
          id: string;
          position: number;
          post_id: string;
          url: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          position?: number;
          post_id: string;
          url: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          position?: number;
          post_id?: string;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "post_images_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
        ];
      };
      post_likes: {
        Row: {
          created_at: string;
          post_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          post_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          post_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
        ];
      };
      posts: {
        Row: {
          author_id: string;
          content: string;
          created_at: string;
          id: string;
          is_published: boolean;
          published_at: string;
          title: string;
          updated_at: string;
          video_url: string | null;
        };
        Insert: {
          author_id: string;
          content?: string;
          created_at?: string;
          id?: string;
          is_published?: boolean;
          published_at?: string;
          title: string;
          updated_at?: string;
          video_url?: string | null;
        };
        Update: {
          author_id?: string;
          content?: string;
          created_at?: string;
          id?: string;
          is_published?: boolean;
          published_at?: string;
          title?: string;
          updated_at?: string;
          video_url?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          account_id: string | null;
          created_at: string;
          id: string;
          level: Database["public"]["Enums"]["member_level"];
          name: string;
          phone: string | null;
          points: number;
          updated_at: string;
        };
        Insert: {
          account_id?: string | null;
          created_at?: string;
          id: string;
          level?: Database["public"]["Enums"]["member_level"];
          name?: string;
          phone?: string | null;
          points?: number;
          updated_at?: string;
        };
        Update: {
          account_id?: string | null;
          created_at?: string;
          id?: string;
          level?: Database["public"]["Enums"]["member_level"];
          name?: string;
          phone?: string | null;
          points?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      site_settings: {
        Row: {
          category: string;
          key: string;
          label: string;
          updated_at: string;
          updated_by: string | null;
          value: string;
        };
        Insert: {
          category?: string;
          key: string;
          label?: string;
          updated_at?: string;
          updated_by?: string | null;
          value?: string;
        };
        Update: {
          category?: string;
          key?: string;
          label?: string;
          updated_at?: string;
          updated_by?: string | null;
          value?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_admin_permission: {
        Args: { _perm: string; _user_id: string };
        Returns: boolean;
      };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      is_super_admin: { Args: { _user_id: string }; Returns: boolean };
    };
    Enums: {
      app_role: "admin" | "member";
      booking_status: "active" | "completed" | "cancelled";
      member_level: "bronze" | "silver" | "gold";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "member"],
      booking_status: ["active", "completed", "cancelled"],
      member_level: ["bronze", "silver", "gold"],
    },
  },
} as const;
