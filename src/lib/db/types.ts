export interface Database {
  public: {
    Tables: {
      jobs: {
        Row: {
          id: string
          source: string
          external_id: string
          title: string
          company: string
          location: string | null
          description: string | null
          posting_url: string | null
          apply_url: string | null
          salary_min: number | null
          salary_max: number | null
          salary_currency: string | null
          employment_type: string | null
          posted_at: string | null
          fetched_at: string
          dedupe_hash: string
          created_at: string
        }
        Insert: {
          id?: string
          source: string
          external_id: string
          title: string
          company: string
          location?: string | null
          description?: string | null
          posting_url?: string | null
          apply_url?: string | null
          salary_min?: number | null
          salary_max?: number | null
          salary_currency?: string | null
          employment_type?: string | null
          posted_at?: string | null
          fetched_at?: string
          dedupe_hash: string
          created_at?: string
        }
        Update: {
          id?: string
          source?: string
          external_id?: string
          title?: string
          company?: string
          location?: string | null
          description?: string | null
          posting_url?: string | null
          apply_url?: string | null
          salary_min?: number | null
          salary_max?: number | null
          salary_currency?: string | null
          employment_type?: string | null
          posted_at?: string | null
          fetched_at?: string
          dedupe_hash?: string
          created_at?: string
        }
        Relationships: []
      }
      applications: {
        Row: {
          id: string
          job_id: string
          status: ApplicationStatus
          notes: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          job_id: string
          status?: ApplicationStatus
          notes?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          status?: ApplicationStatus
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      resumes: {
        Row: {
          id: string
          storage_path: string
          filename: string
          mime_type: string
          extracted_text: string | null
          is_selected: boolean
          uploaded_at: string
        }
        Insert: {
          id?: string
          storage_path: string
          filename: string
          mime_type: string
          extracted_text?: string | null
          is_selected?: boolean
          uploaded_at?: string
        }
        Update: {
          id?: string
          storage_path?: string
          filename?: string
          mime_type?: string
          extracted_text?: string | null
          is_selected?: boolean
          uploaded_at?: string
        }
        Relationships: []
      }
      generations: {
        Row: {
          id: string
          job_id: string
          resume_id: string | null
          kind: GenerationKind
          model: string
          prompt_tokens: number
          completion_tokens: number
          duration_ms: number
          created_at: string
        }
        Insert: {
          id?: string
          job_id: string
          resume_id?: string | null
          kind: GenerationKind
          model: string
          prompt_tokens: number
          completion_tokens: number
          duration_ms: number
          created_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          resume_id?: string | null
          kind?: GenerationKind
          model?: string
          prompt_tokens?: number
          completion_tokens?: number
          duration_ms?: number
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      set_selected_resume: {
        Args: { p_id: string }
        Returns: undefined
      }
    }
    Enums: {
      application_status: ApplicationStatus
    }
    CompositeTypes: Record<string, never>
  }
}

export type ApplicationStatus = 'saved' | 'applying' | 'applied' | 'interview' | 'offer' | 'rejected' | 'archived'
export type GenerationKind = 'analysis' | 'resume' | 'cover_letter'

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]
