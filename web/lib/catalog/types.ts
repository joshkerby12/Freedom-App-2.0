export type ItemQuantityType = "whole" | "decimal";

export type ItemCategoryFilter = "all" | string;

export type CatalogItemSpec = {
  id: string;
  catalog_item_id: string;
  length_in: number | null;
  width_in: number | null;
  height_depth_in: number | null;
  spread_rate_sqft_per_inch: number | null;
  face_feet: number | null;
  extra_specs: Record<string, string | number> | null;
};

export type CatalogItemSupplierLink = {
  id: string;
  supplier_id: string;
  supplier_name: string;
  supplier_location_id: string | null;
  supplier_location_name: string | null;
  supplier_sku: string | null;
  supplier_item_name: string | null;
  unit_cost: number | null;
  last_price_date: string | null;
  is_preferred: boolean;
};

export type CatalogItemListItem = {
  id: string;
  name: string;
  unit: string;
  description: string | null;
  default_cost: number | null;
  default_sell_price: number | null;
  default_markup_pct: number | null;
  waste_pct: number;
  color: string | null;
  quantity_type: ItemQuantityType;
  round_to: number | null;
  minimum_qty: number | null;
  package_unit: string | null;
  price_review_frequency_days: number | null;
  price_auto_increase_pct: number | null;
  price_auto_increase_months: number | null;
  price_next_increase_date: string | null;
  last_price_updated_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  review_due_date: string | null;
  is_overdue: boolean;
  days_overdue: number;
};

export type CatalogItemDetail = CatalogItemListItem & {
  spec: CatalogItemSpec | null;
  suppliers: CatalogItemSupplierLink[];
};

export type CatalogItemSupplierInput = {
  id?: string;
  supplierId: string;
  supplierLocationId?: string | null;
  supplierSku?: string | null;
  supplierItemName?: string | null;
  unitCost?: number | null;
  lastPriceDate?: string | null;
  isPreferred?: boolean;
};

export type CatalogItemInput = {
  name: string;
  unit: string;
  description?: string | null;
  defaultCost?: number | null;
  defaultSellPrice?: number | null;
  defaultMarkupPct?: number | null;
  wastePct?: number | null;
  color?: string | null;
  quantityType?: ItemQuantityType;
  roundTo?: number | null;
  minimumQty?: number | null;
  packageUnit?: string | null;
  priceReviewFrequencyDays?: number | null;
  priceAutoIncreasePct?: number | null;
  priceAutoIncreaseMonths?: number | null;
  isActive?: boolean;
  sortOrder?: number | null;
  spec?: {
    lengthIn?: number | null;
    widthIn?: number | null;
    heightDepthIn?: number | null;
    spreadRateSqftPerInch?: number | null;
    faceFeet?: number | null;
    extraSpecs?: Record<string, string | number> | null;
  };
  suppliers?: CatalogItemSupplierInput[];
};

export type SupplierLocationRecord = {
  id: string;
  supplier_id: string;
  name: string;
  street_address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  is_primary: boolean;
  is_active: boolean;
};

export type SupplierListItem = {
  id: string;
  name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  is_active: boolean;
  location_count: number;
};

export type SupplierDetail = SupplierListItem & {
  locations: SupplierLocationRecord[];
  itemsCarried: Array<{
    id: string;
    name: string;
    unit: string;
    unit_cost: number | null;
    is_preferred: boolean;
  }>;
};

export type SupplierLocationInput = {
  id?: string;
  name?: string | null;
  streetAddress?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  lat?: number | null;
  lng?: number | null;
  phone?: string | null;
  isPrimary?: boolean;
  isActive?: boolean;
};

export type SupplierInput = {
  name: string;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  isActive?: boolean;
  locations?: SupplierLocationInput[];
};

export type PartnerRecord = {
  id: string;
  company_name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  trade_type: string | null;
  notes: string | null;
  is_active: boolean;
};

export type PartnerInput = {
  companyName: string;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  tradeType?: string | null;
  notes?: string | null;
  isActive?: boolean;
};

export type MaterialConfigType =
  | "paver_patio"
  | "wall"
  | "flagstone"
  | "mulch_bed"
  | "sod"
  | "rock_bed"
  | "turf";

export type MaterialConfigRoleRecord = {
  id: string;
  role_key: string;
  catalog_item_id: string;
  catalog_item_name: string;
  catalog_item_color: string | null;
  area_pct: number | null;
  orientation: "soldier" | "sailor" | null;
  sort_order: number;
};

export type MaterialConfigRecord = {
  id: string;
  name: string;
  config_type: MaterialConfigType;
  color: string | null;
  is_active: boolean;
  sort_order: number;
  roles: MaterialConfigRoleRecord[];
};

export type MaterialConfigRoleInput = {
  roleKey: string;
  catalogItemId: string;
  areaPct?: number | null;
  orientation?: "soldier" | "sailor" | null;
  sortOrder?: number;
};

export type MaterialConfigInput = {
  name: string;
  configType: MaterialConfigType;
  isActive?: boolean;
  sortOrder?: number;
  roles: MaterialConfigRoleInput[];
};

export type ProductCategory =
  | "hardscape"
  | "softscape"
  | "drainage"
  | "irrigation"
  | "maintenance"
  | "snow"
  | "other";

export type ProductPricingMode = "cost_plus" | "flat_rate" | "per_sf" | "t_and_m";

export type ProductInputType =
  | "number"
  | "item_dropdown"
  | "color_dropdown"
  | "config_dropdown"
  | "custom_dropdown"
  | "text";

export type ProductComponentType =
  | "catalog_item"
  | "material_configuration"
  | "labor"
  | "equipment"
  | "partner";

export type ProductCatalogInputRecord = {
  id: string;
  label: string;
  input_type: ProductInputType;
  unit_label: string | null;
  is_required: boolean;
  default_value: string | null;
  custom_options: string[] | null;
  config_type_filter: MaterialConfigType | null;
  sort_order: number;
};

export type ProductCatalogComponentRecord = {
  id: string;
  label: string;
  component_type: ProductComponentType;
  catalog_item_id: string | null;
  catalog_item_name: string | null;
  input_ref: string | null;
  configuration_input_ref: string | null;
  qty_formula: string;
  sort_order: number;
};

export type ProductCatalogRecord = {
  id: string;
  name: string;
  category: ProductCategory;
  pricing_mode: ProductPricingMode;
  install_rate: number | null;
  minimum_hours: number | null;
  flat_rate_price: number | null;
  labor_rate_override: number | null;
  equipment_rate_override: number | null;
  default_description: string | null;
  quickbooks_item_code: string | null;
  is_system_template: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type ProductCatalogDetail = ProductCatalogRecord & {
  inputs: ProductCatalogInputRecord[];
  components: ProductCatalogComponentRecord[];
};

export type ProductCatalogInputInput = {
  id?: string;
  label: string;
  inputType: ProductInputType;
  unitLabel?: string | null;
  isRequired?: boolean;
  defaultValue?: string | null;
  customOptions?: string[] | null;
  configTypeFilter?: MaterialConfigType | null;
  sortOrder?: number;
};

export type ProductCatalogComponentInput = {
  id?: string;
  label: string;
  componentType: ProductComponentType;
  catalogItemId?: string | null;
  inputRef?: string | null;
  configurationInputRef?: string | null;
  qtyFormula: string;
  sortOrder?: number;
};

export type ProductCatalogInput = {
  name: string;
  category: ProductCategory;
  pricingMode: ProductPricingMode;
  installRate?: number | null;
  minimumHours?: number | null;
  flatRatePrice?: number | null;
  laborRateOverride?: number | null;
  equipmentRateOverride?: number | null;
  defaultDescription?: string | null;
  quickbooksItemCode?: string | null;
  isActive?: boolean;
  sortOrder?: number;
  inputs: ProductCatalogInputInput[];
  components: ProductCatalogComponentInput[];
};

export type CatalogLookupOption = {
  id: string;
  label: string;
  subtitle?: string | null;
  color?: string | null;
};
