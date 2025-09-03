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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      clients: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      data: {
        Row: {
          created_at: string
          id: number
        }
        Insert: {
          created_at?: string
          id?: number
        }
        Update: {
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          cgst_amount: number | null
          cgst_rate: number | null
          created_at: string
          description: string
          hsn_sac_code: string | null
          id: string
          igst_amount: number | null
          igst_rate: number | null
          invoice_id: string
          quantity: number
          sgst_amount: number | null
          sgst_rate: number | null
          taxable_amount: number | null
          total: number
          unit_price: number
        }
        Insert: {
          cgst_amount?: number | null
          cgst_rate?: number | null
          created_at?: string
          description: string
          hsn_sac_code?: string | null
          id?: string
          igst_amount?: number | null
          igst_rate?: number | null
          invoice_id: string
          quantity?: number
          sgst_amount?: number | null
          sgst_rate?: number | null
          taxable_amount?: number | null
          total?: number
          unit_price?: number
        }
        Update: {
          cgst_amount?: number | null
          cgst_rate?: number | null
          created_at?: string
          description?: string
          hsn_sac_code?: string | null
          id?: string
          igst_amount?: number | null
          igst_rate?: number | null
          invoice_id?: string
          quantity?: number
          sgst_amount?: number | null
          sgst_rate?: number | null
          taxable_amount?: number | null
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          cgst_amount: number | null
          cgst_rate: number | null
          client_address: string | null
          client_email: string | null
          client_gstin: string | null
          client_id: string | null
          client_name: string | null
          client_phone: string | null
          company_gstin: string | null
          created_at: string
          currency: string | null
          date: string
          discount_amount: number | null
          due_date: string | null
          gst_type: string | null
          id: string
          igst_amount: number | null
          igst_rate: number | null
          invoice_number: string
          notes: string | null
          payment_amount: number | null
          payment_qr: string | null
          place_of_supply: string | null
          sgst_amount: number | null
          sgst_rate: number | null
          status: string
          subtotal: number
          tax_amount: number | null
          tax_rate: number | null
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          cgst_amount?: number | null
          cgst_rate?: number | null
          client_address?: string | null
          client_email?: string | null
          client_gstin?: string | null
          client_id?: string | null
          client_name?: string | null
          client_phone?: string | null
          company_gstin?: string | null
          created_at?: string
          currency?: string | null
          date: string
          discount_amount?: number | null
          due_date?: string | null
          gst_type?: string | null
          id?: string
          igst_amount?: number | null
          igst_rate?: number | null
          invoice_number: string
          notes?: string | null
          payment_amount?: number | null
          payment_qr?: string | null
          place_of_supply?: string | null
          sgst_amount?: number | null
          sgst_rate?: number | null
          status?: string
          subtotal?: number
          tax_amount?: number | null
          tax_rate?: number | null
          total?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          cgst_amount?: number | null
          cgst_rate?: number | null
          client_address?: string | null
          client_email?: string | null
          client_gstin?: string | null
          client_id?: string | null
          client_name?: string | null
          client_phone?: string | null
          company_gstin?: string | null
          created_at?: string
          currency?: string | null
          date?: string
          discount_amount?: number | null
          due_date?: string | null
          gst_type?: string | null
          id?: string
          igst_amount?: number | null
          igst_rate?: number | null
          invoice_number?: string
          notes?: string | null
          payment_amount?: number | null
          payment_qr?: string | null
          place_of_supply?: string | null
          sgst_amount?: number | null
          sgst_rate?: number | null
          status?: string
          subtotal?: number
          tax_amount?: number | null
          tax_rate?: number | null
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company_address: string | null
          company_name: string | null
          created_at: string
          currency: string | null
          email: string | null
          full_name: string | null
          gstin: string | null
          id: string
          place_of_business: string | null
          state_code: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_address?: string | null
          company_name?: string | null
          created_at?: string
          currency?: string | null
          email?: string | null
          full_name?: string | null
          gstin?: string | null
          id?: string
          place_of_business?: string | null
          state_code?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_address?: string | null
          company_name?: string | null
          created_at?: string
          currency?: string | null
          email?: string | null
          full_name?: string | null
          gstin?: string | null
          id?: string
          place_of_business?: string | null
          state_code?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
