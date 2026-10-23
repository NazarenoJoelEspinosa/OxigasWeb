// Contrato esperado; regenerar con Supabase CLI al conectar la base real.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];
export type ProductRow = {
  id: string; code: string; name: string; description: string | null;
  brand: string | null; category: string | null; price: number | null;
  visible: boolean | null; images: Json | null; custom_fields: Json | null; created_at: string | null;
  metadata: Json | null; created_by: string | null; updated_at: string | null;
};
export type OfferRow = {
  id: string; product_code: string | null; name: string; description: string | null;
  brand: string | null; price: number | null; original_price: number | null;
  image: string | null; visible: boolean; sort_order: number; created_at: string | null;
};
export type CategoryRow = { id: string; label: string; icon: string; slugs: string[]; sort_order: number };
type Table<Row, Required extends keyof Row> = {
  Row: Row; Insert: Partial<Row> & Pick<Row, Required>; Update: Partial<Row>; Relationships: [];
};
export type Database = {
  public: {
    Tables: {
      products: Table<ProductRow, 'code' | 'name'>;
      offers: Table<OfferRow, 'name'>;
      category_groups: Table<CategoryRow, 'label'>;
      admin_users: Table<{ user_id: string; role: string; created_at: string | null }, 'user_id' | 'role'>;
    };
    Views: { [_ in never]: never };
    Functions: {
      replace_category_groups: { Args: { groups: Json }; Returns: undefined };
      reorder_category_groups: { Args: { ids: string[] }; Returns: undefined };
      reorder_offers: { Args: { ids: string[] }; Returns: undefined };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
