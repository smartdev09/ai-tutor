export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      achievements: {
        Row: {
          id: string
          name: string
          description: string
          icon_url: string | null
          category_id: string | null
          required_actions: Json[]
          xp: number
          created_at: string
          tier: number
        }
        Insert: {
          id?: string
          name: string
          description: string
          icon_url?: string | null
          category_id?: string | null
          required_actions: Json[]
          xp: number
          created_at?: string
          tier?: number
        }
        Update: {
          id?: string
          name?: string
          description?: string
          icon_url?: string | null
          category_id?: string | null
          required_actions?: Json[]
          xp?: number
          created_at?: string
          tier?: number
        }
      }
      achievement_categories: {
        Row: {
          id: string
          name: string
          description: string | null
          icon_url: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          icon_url?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          icon_url?: string | null
        }
      }
      user_achievements: {
        Row: {
          id: string
          user_id: string
          achievement_id: string
          earned_at: string
        }
        Insert: {
          id?: string
          user_id: string
          achievement_id: string
          earned_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          achievement_id?: string
          earned_at?: string
        }
      }
      leaderboards: {
        Row: {
          id: string
          name: string
          type: string
          start_date: string | null
          end_date: string | null
        }
        Insert: {
          id?: string
          name: string
          type: string
          start_date?: string | null
          end_date?: string | null
        }
        Update: {
          id?: string
          name?: string
          type?: string
          start_date?: string | null
          end_date?: string | null
        }
      }
      leaderboard_entries: {
        Row: {
          id: string
          leaderboard_id: string
          user_id: string
          score: number
          rank: number
          updated_at: string
        }
        Insert: {
          id?: string
          leaderboard_id: string
          user_id: string
          score: number
          rank: number
          updated_at?: string
        }
        Update: {
          id?: string
          leaderboard_id?: string
          user_id?: string
          score?: number
          rank?: number
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          username: string | null
          avatar_url: string | null
          experience_points: number
          level: number
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          username?: string | null
          avatar_url?: string | null
          experience_points?: number
          level?: number
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string | null
          avatar_url?: string | null
          experience_points?: number
          level?: number
          created_at?: string
        }
      }
      rate_limits: {
        Row: {
          id: string
          user_id: string
          endpoint: string
          requests_count: number
          last_reset: string
        }
        Insert: {
          id?: string
          user_id: string
          endpoint: string
          requests_count?: number
          last_reset?: string
        }
        Update: {
          id?: string
          user_id?: string
          endpoint?: string
          requests_count?: number
          last_reset?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_user_xp: {
        Args: {
          user_id: string
          xp_amount: number
        }
        Returns: void
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
} 