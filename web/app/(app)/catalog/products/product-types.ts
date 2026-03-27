import type {
  MaterialConfigType,
  ProductCatalogDetail,
  ProductComponentType,
  ProductInputType,
} from "@/lib/catalog/types";

export type ProductFormActionState = {
  error: string | null;
};

export const initialProductFormActionState: ProductFormActionState = {
  error: null,
};

export type EditableProductInput = {
  label: string;
  inputType: ProductInputType;
  unitLabel: string;
  isRequired: boolean;
  defaultValue: string;
  customOptions: string[];
  configTypeFilter: MaterialConfigType | "";
};

export type EditableProductComponent = {
  label: string;
  componentType: ProductComponentType;
  catalogItemId: string;
  inputRef: string;
  configurationInputRef: string;
  qtyFormula: string;
};

export function emptyEditableProductInput(): EditableProductInput {
  return {
    label: "",
    inputType: "number",
    unitLabel: "",
    isRequired: true,
    defaultValue: "",
    customOptions: [""],
    configTypeFilter: "",
  };
}

export function emptyEditableProductComponent(): EditableProductComponent {
  return {
    label: "",
    componentType: "catalog_item",
    catalogItemId: "",
    inputRef: "",
    configurationInputRef: "",
    qtyFormula: "",
  };
}

export function getInitialEditableInputs(
  product?: ProductCatalogDetail,
): EditableProductInput[] {
  if (!product || product.inputs.length === 0) {
    return [emptyEditableProductInput()];
  }

  return product.inputs.map((input) => ({
    label: input.label,
    inputType: input.input_type,
    unitLabel: input.unit_label ?? "",
    isRequired: input.is_required,
    defaultValue: input.default_value ?? "",
    customOptions:
      input.custom_options && input.custom_options.length > 0
        ? input.custom_options
        : [""],
    configTypeFilter: input.config_type_filter ?? "",
  }));
}

export function getInitialEditableComponents(
  product?: ProductCatalogDetail,
): EditableProductComponent[] {
  if (!product || product.components.length === 0) {
    return [emptyEditableProductComponent()];
  }

  return product.components.map((component) => ({
    label: component.label,
    componentType: component.component_type,
    catalogItemId: component.catalog_item_id ?? "",
    inputRef: component.input_ref ?? "",
    configurationInputRef: component.configuration_input_ref ?? "",
    qtyFormula: component.qty_formula,
  }));
}
