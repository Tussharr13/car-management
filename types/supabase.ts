export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      cars: {
        Row: {
          id: string
          title: string
          description: string
          tags: string[]
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          tags: string[]
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          tags?: string[]
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      car_images: {
        Row: {
          id: string
          car_id: string
          url: string
          created_at: string
        }
        Insert: {
          id?: string
          car_id: string
          url: string
          created_at?: string
        }
        Update: {
          id?: string
          car_id?: string
          url?: string
          created_at?: string
        }
      }
    }
  }
}

