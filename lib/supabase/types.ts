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
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["organizations"]["Insert"]>;
      };
      profiles: {
        Row: {
          id: string;
          org_id: string | null;
          role: "admin" | "manager" | "rep";
          full_name: string | null;
          email: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
          requires_password_reset: boolean;
        };
        Insert: {
          id: string;
          org_id?: string | null;
          role?: "admin" | "manager" | "rep";
          full_name?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
          requires_password_reset?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      teams: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          name: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["teams"]["Insert"]>;
      };
      team_members: {
        Row: {
          team_id: string;
          profile_id: string;
          role: "admin" | "manager" | "rep";
          created_at: string;
        };
        Insert: {
          team_id: string;
          profile_id: string;
          role?: "admin" | "manager" | "rep";
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["team_members"]["Insert"]>;
      };
      accounts: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          industry: string | null;
          region: string | null;
          address_line: string | null;
          health: string | null;
          website: string | null;
          annual_revenue: number | null;
          owner_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          name: string;
          industry?: string | null;
          region?: string | null;
          address_line?: string | null;
          health?: string | null;
          website?: string | null;
          annual_revenue?: number | null;
          owner_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["accounts"]["Insert"]>;
      };
      contacts: {
        Row: {
          id: string;
          org_id: string;
          account_id: string | null;
          owner_id: string | null;
          name: string;
          email: string | null;
          phone: string | null;
          title: string | null;
          last_interaction_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          account_id?: string | null;
          owner_id?: string | null;
          name: string;
          email?: string | null;
          phone?: string | null;
          title?: string | null;
          last_interaction_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["contacts"]["Insert"]>;
      };
      leads: {
        Row: {
          id: string;
          org_id: string;
          account_id: string | null;
          contact_id: string | null;
          owner_id: string | null;
          team_id: string | null;
          name: string;
          company: string | null;
          title: string | null;
          email: string | null;
          phone: string | null;
          notes: string | null;
          status: "nuevo" | "en_progreso" | "cerrado";
          stage: "Nuevo" | "Contactado" | "Calificado" | "En Negociación" | "Cerrado";
          source: "Web" | "Evento" | "Referencia" | "Campaña" | "Inbound";
          score: number | null;
          value: number | null;
          last_activity_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          account_id?: string | null;
          contact_id?: string | null;
          owner_id?: string | null;
          team_id?: string | null;
          name: string;
          company?: string | null;
          title?: string | null;
          email?: string | null;
          phone?: string | null;
          notes?: string | null;
          status?: "nuevo" | "en_progreso" | "cerrado";
          stage?: "Nuevo" | "Contactado" | "Calificado" | "En Negociación" | "Cerrado";
          source?: "Web" | "Evento" | "Referencia" | "Campaña" | "Inbound";
          score?: number | null;
          value?: number | null;
          last_activity_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["leads"]["Insert"]>;
      };

      opportunities: {
        Row: {
          id: string;
          org_id: string;
          lead_id: string | null;
          account_id: string | null;
          owner_id: string | null;
          team_id: string | null;
          name: string;
          stage:
            | 'Prospección'
            | 'Descubrimiento'
            | 'Propuesta'
            | 'Negociación'
            | 'Cerrado Ganado'
            | 'Cerrado Perdido';
          amount: number | null;
          probability: number | null;
          close_date: string | null;
          has_contract: boolean | null;
          contract_term_months: number | null;
          coverage_zone: string | null;
          service_type: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          lead_id?: string | null;
          account_id?: string | null;
          owner_id?: string | null;
          team_id?: string | null;
          name: string;
          stage?:
            | 'Prospección'
            | 'Descubrimiento'
            | 'Propuesta'
            | 'Negociación'
            | 'Cerrado Ganado'
            | 'Cerrado Perdido';
          amount?: number | null;
          probability?: number | null;
          close_date?: string | null;
          has_contract?: boolean | null;
          contract_term_months?: number | null;
          coverage_zone?: string | null;
          service_type?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["opportunities"]["Insert"]>;
      };
      products: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          category: string;
          pricing_mode: Database["public"]["Enums"]["pricing_mode"];
          base_unit_price: number | null;
          allow_sale: boolean;
          allow_rental: boolean;
          allow_concession: boolean;
          min_concession_units: number | null;
          rental_monthly_fee: number | null;
          notes: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          name: string;
          category: string;
          pricing_mode?: Database["public"]["Enums"]["pricing_mode"];
          base_unit_price?: number | null;
          allow_sale?: boolean;
          allow_rental?: boolean;
          allow_concession?: boolean;
          min_concession_units?: number | null;
          rental_monthly_fee?: number | null;
          notes?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
      };
      product_pricing_rules: {
        Row: {
          id: string;
          org_id: string;
          product_id: string;
          min_quantity: number;
          max_quantity: number | null;
          price: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          product_id: string;
          min_quantity: number;
          max_quantity?: number | null;
          price: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["product_pricing_rules"]["Insert"]>;
      };
      product_rules: {
        Row: {
          id: string;
          org_id: string;
          product_id: string | null;
          product_category: string | null;
          service_type: string | null;
          coverage_zone: string | null;
          name: string;
          description: string | null;
          priority: number;
          conditions: Json;
          effects: Json;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          product_id?: string | null;
          product_category?: string | null;
          service_type?: string | null;
          coverage_zone?: string | null;
          name: string;
          description?: string | null;
          priority?: number;
          conditions: Json;
          effects: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["product_rules"]["Insert"]>;
      };
      opportunity_products: {
        Row: {
          id: string;
          opportunity_id: string;
          product_id: string | null;
          name: string;
          category: string | null;
          quantity: number;
          pricing_mode: Database["public"]["Enums"]["pricing_mode"];
          monthly_revenue: number;
          notes: string | null;
          unit_price: number | null;
          total_price: number | null;
          benefits: string[] | null;
          extra_charges: number | null;
          applied_rule_ids: string[] | null;
          rule_snapshot: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          opportunity_id: string;
          product_id?: string | null;
          name: string;
          category?: string | null;
          quantity?: number;
          pricing_mode: Database["public"]["Enums"]["pricing_mode"];
          monthly_revenue: number;
          notes?: string | null;
          unit_price?: number | null;
          total_price?: number | null;
          benefits?: string[] | null;
          extra_charges?: number | null;
          applied_rule_ids?: string[] | null;
          rule_snapshot?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["opportunity_products"]["Insert"]>;
      };
      activities: {

        Row: {
          id: string;
          org_id: string;
          lead_id: string | null;
          opportunity_id: string | null;
          owner_id: string | null;
          team_id: string | null;
          subject: string;
          notes: string | null;
          type: 'llamada' | 'reunión' | 'correo' | 'tarea';
          status: 'pendiente' | 'completada';
          priority: 'alta' | 'media' | 'baja';
          due_date: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          lead_id?: string | null;
          opportunity_id?: string | null;
          owner_id?: string | null;
          team_id?: string | null;
          subject: string;
          notes?: string | null;
          type?: 'llamada' | 'reunión' | 'correo' | 'tarea';
          status?: 'pendiente' | 'completada';
          priority?: 'alta' | 'media' | 'baja';
          due_date?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["activities"]["Insert"]>;
      };
      attachments: {
        Row: {
          id: string;
          org_id: string;
          activity_id: string | null;
          lead_id: string | null;
          opportunity_id: string | null;
          storage_path: string;
          file_name: string;
          content_type: string | null;
          file_size: number | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          activity_id?: string | null;
          lead_id?: string | null;
          opportunity_id?: string | null;
          storage_path: string;
          file_name: string;
          content_type?: string | null;
          file_size?: number | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["attachments"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      current_org: {
        Args: Record<string, never>;
        Returns: string | null;
      };
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      has_team_access: {
        Args: { entity_org: string; entity_team: string | null; entity_owner: string | null };
        Returns: boolean;
      };
    };
    Enums: {
      user_role: 'admin' | 'manager' | 'rep';
      activity_type: 'llamada' | 'reunión' | 'correo' | 'tarea';
      activity_status: 'pendiente' | 'completada';
      activity_priority: 'alta' | 'media' | 'baja';
      lead_stage: 'Nuevo' | 'Contactado' | 'Calificado' | 'En Negociación' | 'Cerrado';
      lead_status: 'nuevo' | 'en_progreso' | 'cerrado';
      lead_source: 'Web' | 'Evento' | 'Referencia' | 'Campaña' | 'Inbound';
      opportunity_stage:
        | 'Prospección'
        | 'Descubrimiento'
        | 'Propuesta'
        | 'Negociación'
        | 'Cerrado Ganado'
        | 'Cerrado Perdido';
      pricing_mode: 'concesión' | 'alquiler' | 'venta';
    };
  };
};

export type Tables<K extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][K]["Row"];
export type TablesInsert<K extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][K]["Insert"];
export type TablesUpdate<K extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][K]["Update"];
