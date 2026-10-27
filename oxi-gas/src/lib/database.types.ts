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
export type CategoryRow = { id: string; label: string; icon: string; slugs: string[]; sort_order: number; parent_id: string | null };
type Table<Row, Required extends keyof Row> = {
  Row: Row; Insert: Partial<Row> & Pick<Row, Required>; Update: Partial<Row>; Relationships: [];
};
export type Database = {
  public: {
    Tables: {
      products: Table<ProductRow, 'code' | 'name'>;
      offers: Table<OfferRow, 'name'>;
      category_groups: Table<CategoryRow, 'label'>;
      product_category_links: {
        Row: { product_id: string; category_id: string; is_primary: boolean };
        Insert: { product_id: string; category_id: string; is_primary?: boolean };
        Update: { category_id?: string; is_primary?: boolean };
        Relationships: [{ foreignKeyName: 'product_category_links_product_id_fkey'; columns: ['product_id']; isOneToOne: false; referencedRelation: 'products'; referencedColumns: ['id'] }];
      };
      admin_users: Table<{ user_id: string; role: string; created_at: string | null }, 'user_id' | 'role'>;
    };
    Views: { [_ in never]: never };
    Functions: {
      save_catalog_category: { Args: { p_id: string | null; p_label: string; p_parent_id: string | null; p_sort_order: number }; Returns: string };
      delete_catalog_category: { Args: { p_id: string }; Returns: undefined };
      bulk_classify_products: { Args: { p_ids: string[]; p_primary: string | null; p_related: string[]; p_set_primary: boolean; p_mode: string }; Returns: number };
      save_catalog_product: { Args: { p_product: Json; p_primary: string | null; p_related: string[] }; Returns: string };
      replace_category_groups: { Args: { groups: Json }; Returns: undefined };
      reorder_category_groups: { Args: { ids: string[] }; Returns: undefined };
      reorder_offers: { Args: { ids: string[] }; Returns: undefined };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
