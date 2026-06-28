export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type Database = {
  public: {
    Tables: {
      questions: {
        Row: {
          id: string
          number: number | null
          title: string
          body: string
          title_en_cache: string | null
          body_en_cache: string | null
          category: string
          status: 'active' | 'proposed' | 'archived' | 'selected'
          vote_count: number
          resident_vote_count: number
          proposed_by_session: string | null
          created_at: string
        }
        Insert: {
          id?: string
          number?: number | null
          title: string
          body: string
          title_en_cache?: string | null
          body_en_cache?: string | null
          category: string
          status?: 'active' | 'proposed' | 'archived' | 'selected'
          vote_count?: number
          resident_vote_count?: number
          proposed_by_session?: string | null
          created_at?: string
        }
        Update: {
          title?: string
          body?: string
          title_en_cache?: string | null
          body_en_cache?: string | null
          category?: string
          status?: 'active' | 'proposed' | 'archived' | 'selected'
          vote_count?: number
          resident_vote_count?: number
        }
      }
      votes: {
        Row: {
          id: string
          question_id: string
          session_id: string
          is_resident: boolean
          created_at: string
        }
        Insert: {
          id?: string
          question_id: string
          session_id: string
          is_resident?: boolean
          created_at?: string
        }
        Update: never
      }
      comments: {
        Row: {
          id: string
          question_id: string
          session_id: string
          display_name: string | null
          is_resident: boolean
          body: string
          body_en_cache: string | null
          created_at: string
        }
        Insert: {
          id?: string
          question_id: string
          session_id: string
          display_name?: string | null
          is_resident?: boolean
          body: string
          body_en_cache?: string | null
          created_at?: string
        }
        Update: {
          body_en_cache?: string | null
        }
      }
    }
  }
}

export type Question = Database['public']['Tables']['questions']['Row']
export type Vote = Database['public']['Tables']['votes']['Row']
export type Comment = Database['public']['Tables']['comments']['Row']
