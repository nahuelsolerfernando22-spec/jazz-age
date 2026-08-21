export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      cloud_saves: {
        Row: {
          client_updated_at: string;
          created_at: string;
          payload: Json;
          updated_at: string;
          user_id: string;
          version: number;
        };
        Insert: {
          client_updated_at?: string;
          created_at?: string;
          payload: Json;
          updated_at?: string;
          user_id: string;
          version?: number;
        };
        Update: {
          client_updated_at?: string;
          created_at?: string;
          payload?: Json;
          updated_at?: string;
          user_id?: string;
          version?: number;
        };
        Relationships: [];
      };
      daily_tournament_runs: {
        Row: {
          alias: string;
          attempts: number;
          created_at: string;
          day: number;
          device_id: string;
          game: string;
          id: string;
          score: number;
          updated_at: string;
        };
        Insert: {
          alias: string;
          attempts?: number;
          created_at?: string;
          day: number;
          device_id: string;
          game: string;
          id?: string;
          score?: number;
          updated_at?: string;
        };
        Update: {
          alias?: string;
          attempts?: number;
          created_at?: string;
          day?: number;
          device_id?: string;
          game?: string;
          id?: string;
          score?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      leaderboards: {
        Row: {
          created_at: string;
          display_name: string;
          game: string;
          id: string;
          meta: Json;
          mode: string;
          score: number;
          seed: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          display_name: string;
          game: string;
          id?: string;
          meta?: Json;
          mode?: string;
          score: number;
          seed?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          display_name?: string;
          game?: string;
          id?: string;
          meta?: Json;
          mode?: string;
          score?: number;
          seed?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      pinball_runs: {
        Row: {
          balls_played: number;
          best_ball: number;
          client_version: string;
          combo_max: number;
          created_at: string;
          duration_ms: number;
          id: string;
          jackpots: number;
          mode: string;
          replay: Json | null;
          score: number;
          seed: string;
          user_id: string;
        };
        Insert: {
          balls_played?: number;
          best_ball?: number;
          client_version?: string;
          combo_max?: number;
          created_at?: string;
          duration_ms?: number;
          id?: string;
          jackpots?: number;
          mode: string;
          replay?: Json | null;
          score?: number;
          seed: string;
          user_id: string;
        };
        Update: {
          balls_played?: number;
          best_ball?: number;
          client_version?: string;
          combo_max?: number;
          created_at?: string;
          duration_ms?: number;
          id?: string;
          jackpots?: number;
          mode?: string;
          replay?: Json | null;
          score?: number;
          seed?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      player_progress: {
        Row: {
          alias: string;
          attempts: number;
          best_score: number;
          completed_at: string | null;
          created_at: string;
          device_id: string;
          game: string;
          id: string;
          level: number;
          stars: number;
          updated_at: string;
        };
        Insert: {
          alias: string;
          attempts?: number;
          best_score?: number;
          completed_at?: string | null;
          created_at?: string;
          device_id: string;
          game: string;
          id?: string;
          level: number;
          stars?: number;
          updated_at?: string;
        };
        Update: {
          alias?: string;
          attempts?: number;
          best_score?: number;
          completed_at?: string | null;
          created_at?: string;
          device_id?: string;
          game?: string;
          id?: string;
          level?: number;
          stars?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      players: {
        Row: {
          alias: string;
          created_at: string;
          device_id: string;
          id: string;
          updated_at: string;
        };
        Insert: {
          alias: string;
          created_at?: string;
          device_id: string;
          id?: string;
          updated_at?: string;
        };
        Update: {
          alias?: string;
          created_at?: string;
          device_id?: string;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_seed: number;
          created_at: string;
          display_name: string;
          id: string;
          updated_at: string;
        };
        Insert: {
          avatar_seed?: number;
          created_at?: string;
          display_name: string;
          id: string;
          updated_at?: string;
        };
        Update: {
          avatar_seed?: number;
          created_at?: string;
          display_name?: string;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      v_player_stars: {
        Row: {
          alias: string | null;
          device_id: string | null;
          levels_completed: number | null;
          perfect_levels: number | null;
          total_stars: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
