import type { SupplierDetail } from "@/lib/catalog/types";

export type SupplierFormActionState = {
  error: string | null;
};

export const initialSupplierFormActionState: SupplierFormActionState = {
  error: null,
};

export type EditableSupplierLocation = {
  name: string;
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
  lat: string;
  lng: string;
  phone: string;
  isPrimary: boolean;
  isActive: boolean;
};

export function emptySupplierLocation(): EditableSupplierLocation {
  return {
    name: "",
    streetAddress: "",
    city: "",
    state: "",
    zip: "",
    lat: "",
    lng: "",
    phone: "",
    isPrimary: false,
    isActive: true,
  };
}

export function getInitialSupplierLocations(
  supplier?: SupplierDetail,
): EditableSupplierLocation[] {
  if (!supplier || supplier.locations.length === 0) {
    return [{ ...emptySupplierLocation(), isPrimary: true }];
  }

  return supplier.locations.map((location) => ({
    name: location.name,
    streetAddress: location.street_address ?? "",
    city: location.city ?? "",
    state: location.state ?? "",
    zip: location.zip ?? "",
    lat: location.lat === null ? "" : String(location.lat),
    lng: location.lng === null ? "" : String(location.lng),
    phone: location.phone ?? "",
    isPrimary: location.is_primary,
    isActive: location.is_active,
  }));
}
