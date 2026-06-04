export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      about_settings: {
        Row: {
          biography: string | null;
          hero_text: string | null;
          id: string;
          profile_image_url: string | null;
          updated_at: string | null;
        };
        Insert: {
          biography?: string | null;
          hero_text?: string | null;
          id?: string;
          profile_image_url?: string | null;
          updated_at?: string | null;
        };
        Update: {
          biography?: string | null;
          hero_text?: string | null;
          id?: string;
          profile_image_url?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      blog_posts: {
        Row: {
          content: string | null;
          cover_image_url: string | null;
          created_at: string | null;
          excerpt: string | null;
          featured: boolean | null;
          id: string;
          meta_description: string | null;
          meta_title: string | null;
          og_image_url: string | null;
          published_at: string | null;
          reading_time: number | null;
          slug: string;
          status: Database["public"]["Enums"]["entry_status"] | null;
          tags: string[] | null;
          thumbnail_url: string | null;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          content?: string | null;
          cover_image_url?: string | null;
          created_at?: string | null;
          excerpt?: string | null;
          featured?: boolean | null;
          id?: string;
          meta_description?: string | null;
          meta_title?: string | null;
          og_image_url?: string | null;
          published_at?: string | null;
          reading_time?: number | null;
          slug: string;
          status?: Database["public"]["Enums"]["entry_status"] | null;
          tags?: string[] | null;
          thumbnail_url?: string | null;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          content?: string | null;
          cover_image_url?: string | null;
          created_at?: string | null;
          excerpt?: string | null;
          featured?: boolean | null;
          id?: string;
          meta_description?: string | null;
          meta_title?: string | null;
          og_image_url?: string | null;
          published_at?: string | null;
          reading_time?: number | null;
          slug?: string;
          status?: Database["public"]["Enums"]["entry_status"] | null;
          tags?: string[] | null;
          thumbnail_url?: string | null;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      career_timeline: {
        Row: {
          created_at: string | null;
          description: string | null;
          display_order: number | null;
          end_date: string | null;
          id: string;
          is_current: boolean | null;
          organization: string | null;
          start_date: string | null;
          title: string;
          type: string | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          display_order?: number | null;
          end_date?: string | null;
          id?: string;
          is_current?: boolean | null;
          organization?: string | null;
          start_date?: string | null;
          title: string;
          type?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          display_order?: number | null;
          end_date?: string | null;
          id?: string;
          is_current?: boolean | null;
          organization?: string | null;
          start_date?: string | null;
          title?: string;
          type?: string | null;
        };
        Relationships: [];
      };
      certifications: {
        Row: {
          badge_url: string | null;
          created_at: string | null;
          date_earned: string | null;
          display_order: number | null;
          id: string;
          issuer: string | null;
          name: string;
          url: string | null;
        };
        Insert: {
          badge_url?: string | null;
          created_at?: string | null;
          date_earned?: string | null;
          display_order?: number | null;
          id?: string;
          issuer?: string | null;
          name: string;
          url?: string | null;
        };
        Update: {
          badge_url?: string | null;
          created_at?: string | null;
          date_earned?: string | null;
          display_order?: number | null;
          id?: string;
          issuer?: string | null;
          name?: string;
          url?: string | null;
        };
        Relationships: [];
      };
      education_entries: {
        Row: {
          created_at: string | null;
          degree: string | null;
          description: string | null;
          display_order: number | null;
          end_date: string | null;
          field_of_study: string | null;
          id: string;
          is_current: boolean | null;
          location: string | null;
          logo_url: string | null;
          school_name: string;
          school_url: string | null;
          start_date: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          degree?: string | null;
          description?: string | null;
          display_order?: number | null;
          end_date?: string | null;
          field_of_study?: string | null;
          id?: string;
          is_current?: boolean | null;
          location?: string | null;
          logo_url?: string | null;
          school_name: string;
          school_url?: string | null;
          start_date?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          degree?: string | null;
          description?: string | null;
          display_order?: number | null;
          end_date?: string | null;
          field_of_study?: string | null;
          id?: string;
          is_current?: boolean | null;
          location?: string | null;
          logo_url?: string | null;
          school_name?: string;
          school_url?: string | null;
          start_date?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      footer_settings: {
        Row: {
          contact_email: string | null;
          copyright_text: string | null;
          id: string;
          show_social_links: boolean | null;
          tech_stack_text: string | null;
          updated_at: string | null;
        };
        Insert: {
          contact_email?: string | null;
          copyright_text?: string | null;
          id?: string;
          show_social_links?: boolean | null;
          tech_stack_text?: string | null;
          updated_at?: string | null;
        };
        Update: {
          contact_email?: string | null;
          copyright_text?: string | null;
          id?: string;
          show_social_links?: boolean | null;
          tech_stack_text?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      hero_settings: {
        Row: {
          cta_primary_text: string | null;
          cta_primary_url: string | null;
          cta_secondary_text: string | null;
          cta_secondary_url: string | null;
          description: string | null;
          heading_line1: string | null;
          heading_line2: string | null;
          heading_line3: string | null;
          id: string;
          show_availability: boolean | null;
          subheading: string | null;
          updated_at: string | null;
        };
        Insert: {
          cta_primary_text?: string | null;
          cta_primary_url?: string | null;
          cta_secondary_text?: string | null;
          cta_secondary_url?: string | null;
          description?: string | null;
          heading_line1?: string | null;
          heading_line2?: string | null;
          heading_line3?: string | null;
          id?: string;
          show_availability?: boolean | null;
          subheading?: string | null;
          updated_at?: string | null;
        };
        Update: {
          cta_primary_text?: string | null;
          cta_primary_url?: string | null;
          cta_secondary_text?: string | null;
          cta_secondary_url?: string | null;
          description?: string | null;
          heading_line1?: string | null;
          heading_line2?: string | null;
          heading_line3?: string | null;
          id?: string;
          show_availability?: boolean | null;
          subheading?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      media_library: {
        Row: {
          alt_text: string | null;
          bucket: string | null;
          caption: string | null;
          created_at: string | null;
          file_name: string | null;
          file_size: number | null;
          height: number | null;
          id: string;
          is_url_mode: boolean | null;
          media_type: Database["public"]["Enums"]["media_type"] | null;
          url: string;
          width: number | null;
        };
        Insert: {
          alt_text?: string | null;
          bucket?: string | null;
          caption?: string | null;
          created_at?: string | null;
          file_name?: string | null;
          file_size?: number | null;
          height?: number | null;
          id?: string;
          is_url_mode?: boolean | null;
          media_type?: Database["public"]["Enums"]["media_type"] | null;
          url: string;
          width?: number | null;
        };
        Update: {
          alt_text?: string | null;
          bucket?: string | null;
          caption?: string | null;
          created_at?: string | null;
          file_name?: string | null;
          file_size?: number | null;
          height?: number | null;
          id?: string;
          is_url_mode?: boolean | null;
          media_type?: Database["public"]["Enums"]["media_type"] | null;
          url?: string;
          width?: number | null;
        };
        Relationships: [];
      };
      navigation: {
        Row: {
          created_at: string | null;
          display_order: number | null;
          id: string;
          is_external: boolean | null;
          label: string;
          url: string;
          visible: boolean | null;
        };
        Insert: {
          created_at?: string | null;
          display_order?: number | null;
          id?: string;
          is_external?: boolean | null;
          label: string;
          url: string;
          visible?: boolean | null;
        };
        Update: {
          created_at?: string | null;
          display_order?: number | null;
          id?: string;
          is_external?: boolean | null;
          label?: string;
          url?: string;
          visible?: boolean | null;
        };
        Relationships: [];
      };
      profile: {
        Row: {
          availability_status: boolean | null;
          availability_text: string | null;
          bio: string | null;
          created_at: string | null;
          email: string | null;
          github_url: string | null;
          id: string;
          job_title: string | null;
          linkedin_url: string | null;
          location: string | null;
          name: string;
          profile_picture_url: string | null;
          resume_url: string | null;
          skills: string[] | null;
          twitter_url: string | null;
          updated_at: string | null;
          username: string;
          website_url: string | null;
        };
        Insert: {
          availability_status?: boolean | null;
          availability_text?: string | null;
          bio?: string | null;
          created_at?: string | null;
          email?: string | null;
          github_url?: string | null;
          id?: string;
          job_title?: string | null;
          linkedin_url?: string | null;
          location?: string | null;
          name?: string;
          profile_picture_url?: string | null;
          resume_url?: string | null;
          skills?: string[] | null;
          twitter_url?: string | null;
          updated_at?: string | null;
          username?: string;
          website_url?: string | null;
        };
        Update: {
          availability_status?: boolean | null;
          availability_text?: string | null;
          bio?: string | null;
          created_at?: string | null;
          email?: string | null;
          github_url?: string | null;
          id?: string;
          job_title?: string | null;
          linkedin_url?: string | null;
          location?: string | null;
          name?: string;
          profile_picture_url?: string | null;
          resume_url?: string | null;
          skills?: string[] | null;
          twitter_url?: string | null;
          updated_at?: string | null;
          username?: string;
          website_url?: string | null;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          created_at: string | null;
          demo_url: string | null;
          description: string | null;
          featured: boolean | null;
          github_url: string | null;
          id: string;
          slug: string;
          sort_order: number | null;
          status: Database["public"]["Enums"]["entry_status"] | null;
          tags: string[] | null;
          thumbnail_url: string | null;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          demo_url?: string | null;
          description?: string | null;
          featured?: boolean | null;
          github_url?: string | null;
          id?: string;
          slug: string;
          sort_order?: number | null;
          status?: Database["public"]["Enums"]["entry_status"] | null;
          tags?: string[] | null;
          thumbnail_url?: string | null;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          demo_url?: string | null;
          description?: string | null;
          featured?: boolean | null;
          github_url?: string | null;
          id?: string;
          slug?: string;
          sort_order?: number | null;
          status?: Database["public"]["Enums"]["entry_status"] | null;
          tags?: string[] | null;
          thumbnail_url?: string | null;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      seo_settings: {
        Row: {
          canonical_url: string | null;
          id: string;
          keywords: string[] | null;
          meta_description: string | null;
          meta_title: string | null;
          og_image_url: string | null;
          page_key: string;
          robots: string | null;
          updated_at: string | null;
        };
        Insert: {
          canonical_url?: string | null;
          id?: string;
          keywords?: string[] | null;
          meta_description?: string | null;
          meta_title?: string | null;
          og_image_url?: string | null;
          page_key: string;
          robots?: string | null;
          updated_at?: string | null;
        };
        Update: {
          canonical_url?: string | null;
          id?: string;
          keywords?: string[] | null;
          meta_description?: string | null;
          meta_title?: string | null;
          og_image_url?: string | null;
          page_key?: string;
          robots?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      statistics: {
        Row: {
          created_at: string | null;
          display_order: number | null;
          id: string;
          label: string;
          number: string;
          updated_at: string | null;
          visible: boolean | null;
        };
        Insert: {
          created_at?: string | null;
          display_order?: number | null;
          id?: string;
          label: string;
          number: string;
          updated_at?: string | null;
          visible?: boolean | null;
        };
        Update: {
          created_at?: string | null;
          display_order?: number | null;
          id?: string;
          label?: string;
          number?: string;
          updated_at?: string | null;
          visible?: boolean | null;
        };
        Relationships: [];
      };
      study_categories: {
        Row: {
          cover_image_url: string | null;
          created_at: string | null;
          description: string | null;
          difficulty: Database["public"]["Enums"]["difficulty_level"] | null;
          entry_count: number | null;
          featured: boolean | null;
          id: string;
          progress_percent: number | null;
          slug: string;
          sort_order: number | null;
          status: Database["public"]["Enums"]["entry_status"] | null;
          tags: string[] | null;
          thumbnail_url: string | null;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          cover_image_url?: string | null;
          created_at?: string | null;
          description?: string | null;
          difficulty?: Database["public"]["Enums"]["difficulty_level"] | null;
          entry_count?: number | null;
          featured?: boolean | null;
          id?: string;
          progress_percent?: number | null;
          slug: string;
          sort_order?: number | null;
          status?: Database["public"]["Enums"]["entry_status"] | null;
          tags?: string[] | null;
          thumbnail_url?: string | null;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          cover_image_url?: string | null;
          created_at?: string | null;
          description?: string | null;
          difficulty?: Database["public"]["Enums"]["difficulty_level"] | null;
          entry_count?: number | null;
          featured?: boolean | null;
          id?: string;
          progress_percent?: number | null;
          slug?: string;
          sort_order?: number | null;
          status?: Database["public"]["Enums"]["entry_status"] | null;
          tags?: string[] | null;
          thumbnail_url?: string | null;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      study_entries: {
        Row: {
          category_id: string | null;
          content: string | null;
          cover_image_url: string | null;
          created_at: string | null;
          entry_number: number | null;
          id: string;
          meta_description: string | null;
          meta_title: string | null;
          pinned: boolean | null;
          published_at: string | null;
          reading_time: number | null;
          slug: string;
          status: Database["public"]["Enums"]["entry_status"] | null;
          summary: string | null;
          tags: string[] | null;
          thumbnail_url: string | null;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          category_id?: string | null;
          content?: string | null;
          cover_image_url?: string | null;
          created_at?: string | null;
          entry_number?: number | null;
          id?: string;
          meta_description?: string | null;
          meta_title?: string | null;
          pinned?: boolean | null;
          published_at?: string | null;
          reading_time?: number | null;
          slug: string;
          status?: Database["public"]["Enums"]["entry_status"] | null;
          summary?: string | null;
          tags?: string[] | null;
          thumbnail_url?: string | null;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          category_id?: string | null;
          content?: string | null;
          cover_image_url?: string | null;
          created_at?: string | null;
          entry_number?: number | null;
          id?: string;
          meta_description?: string | null;
          meta_title?: string | null;
          pinned?: boolean | null;
          published_at?: string | null;
          reading_time?: number | null;
          slug?: string;
          status?: Database["public"]["Enums"]["entry_status"] | null;
          summary?: string | null;
          tags?: string[] | null;
          thumbnail_url?: string | null;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "study_entries_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "study_categories";
            referencedColumns: ["id"];
          },
        ];
      };
      study_media: {
        Row: {
          alt_text: string | null;
          caption: string | null;
          created_at: string | null;
          display_order: number | null;
          entry_id: string | null;
          id: string;
          is_url_mode: boolean | null;
          media_type: Database["public"]["Enums"]["media_type"] | null;
          url: string;
        };
        Insert: {
          alt_text?: string | null;
          caption?: string | null;
          created_at?: string | null;
          display_order?: number | null;
          entry_id?: string | null;
          id?: string;
          is_url_mode?: boolean | null;
          media_type?: Database["public"]["Enums"]["media_type"] | null;
          url: string;
        };
        Update: {
          alt_text?: string | null;
          caption?: string | null;
          created_at?: string | null;
          display_order?: number | null;
          entry_id?: string | null;
          id?: string;
          is_url_mode?: boolean | null;
          media_type?: Database["public"]["Enums"]["media_type"] | null;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "study_media_entry_id_fkey";
            columns: ["entry_id"];
            isOneToOne: false;
            referencedRelation: "study_entries";
            referencedColumns: ["id"];
          },
        ];
      };
      tags: {
        Row: {
          color: string | null;
          created_at: string | null;
          id: string;
          name: string;
          slug: string;
        };
        Insert: {
          color?: string | null;
          created_at?: string | null;
          id?: string;
          name: string;
          slug: string;
        };
        Update: {
          color?: string | null;
          created_at?: string | null;
          id?: string;
          name?: string;
          slug?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      difficulty_level: "beginner" | "intermediate" | "advanced";
      entry_status: "draft" | "published" | "archived";
      media_type: "image" | "video" | "pdf" | "attachment";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type Inserts<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type Updates<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
