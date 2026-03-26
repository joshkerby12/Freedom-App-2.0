import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DvirSection } from "@/components/fleet/dvir-section";
import { ExpiryBadge } from "@/components/fleet/expiry-badge";
import { MaintenanceLogSection } from "@/components/fleet/maintenance-log-section";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createDvirEntry, listDvirDrivers } from "@/lib/fleet/dvir-service";
import { createMaintenanceEntry } from "@/lib/fleet/maintenance-service";
import { formatDateRange, getEquipmentDetail, todayYmd } from "@/lib/fleet/equipment-service";

type EquipmentDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readQueryValue(
  params: Record<string, string | string[] | undefined>,
  key: string,
): string {
  const value = params[key];
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return typeof value === "string" ? value : "";
}

function parseOptionalNumber(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseOptionalString(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseOptionalFile(value: FormDataEntryValue | null): File | null {
  if (!(value instanceof File)) {
    return null;
  }

  return value.size > 0 ? value : null;
}

export default async function EquipmentDetailPage({
  params,
  searchParams,
}: EquipmentDetailPageProps) {
  const { id } = await params;
  const query = await searchParams;
  const detail = await getEquipmentDetail(id);

  if (!detail) {
    notFound();
  }

  const drivers = await listDvirDrivers();
  const savedMessage = readQueryValue(query, "saved");
  const errorMessage = readQueryValue(query, "error");

  async function maintenanceAction(formData: FormData) {
    "use server";

    let destination = `/fleet/equipment/${id}`;

    try {
      const type = parseOptionalString(formData.get("type"));
      const performedDate = parseOptionalString(formData.get("performed_date"));

      if (!type || !performedDate) {
        throw new Error("Maintenance type and performed date are required.");
      }

      await createMaintenanceEntry({
        equipmentId: id,
        type,
        performedDate,
        mileage: parseOptionalNumber(formData.get("mileage")),
        nextServiceDate: parseOptionalString(formData.get("next_service_date")),
        nextServiceMileage: parseOptionalNumber(formData.get("next_service_mileage")),
        performedBy: parseOptionalString(formData.get("performed_by")),
        cost: parseOptionalNumber(formData.get("cost")),
        notes: parseOptionalString(formData.get("notes")),
        receiptFile: parseOptionalFile(formData.get("receipt_file")),
      });

      destination = `/fleet/equipment/${id}?saved=maintenance`;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save maintenance entry.";
      destination = `/fleet/equipment/${id}?error=${encodeURIComponent(message)}`;
    }

    redirect(destination);
  }

  async function dvirAction(formData: FormData) {
    "use server";

    let destination = `/fleet/equipment/${id}`;

    try {
      const inspectionType = parseOptionalString(formData.get("inspection_type"));
      const inspectionDate = parseOptionalString(formData.get("inspection_date"));
      const driverId = parseOptionalString(formData.get("driver_id"));

      if (!inspectionType || (inspectionType !== "pre_trip" && inspectionType !== "post_trip")) {
        throw new Error("Inspection type is required.");
      }

      if (!inspectionDate || !driverId) {
        throw new Error("Inspection date and driver are required.");
      }

      const passed = formData.get("passed") === "on";
      const selectedDefects = formData
        .getAll("defects")
        .filter((value): value is string => typeof value === "string")
        .map((item) => item.trim())
        .filter((item) => item.length > 0);

      await createDvirEntry({
        equipmentId: id,
        driverId,
        inspectionType,
        inspectionDate,
        passed,
        odometer: parseOptionalNumber(formData.get("odometer")),
        defects: selectedDefects,
        notes: parseOptionalString(formData.get("notes")),
        signatureFile: parseOptionalFile(formData.get("signature_file")),
      });

      destination = `/fleet/equipment/${id}?saved=dvir`;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save DVIR entry.";
      destination = `/fleet/equipment/${id}?error=${encodeURIComponent(message)}`;
    }

    redirect(destination);
  }

  return (
    <section className="space-y-4">
      {savedMessage ? (
        <p className="auth-feedback-success">
          {savedMessage === "created" && "Equipment created successfully."}
          {savedMessage === "updated" && "Equipment updated successfully."}
          {savedMessage === "maintenance" && "Maintenance entry saved."}
          {savedMessage === "dvir" && "DVIR entry saved."}
        </p>
      ) : null}
      {errorMessage ? (
        <p className="auth-feedback-error">{decodeURIComponent(errorMessage)}</p>
      ) : null}

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle>{detail.equipment.name}</CardTitle>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              {detail.equipment.type} • {detail.equipment.is_active ? "Active" : "Inactive"}
            </p>
          </div>
          <Link href={`/fleet/equipment/${id}/edit`}>
            <Button variant="secondary">Edit Equipment</Button>
          </Link>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 text-sm text-[var(--text-body)]">
            <p><strong>Make/Model:</strong> {[detail.equipment.make, detail.equipment.model].filter(Boolean).join(" ") || "—"}</p>
            <p><strong>Year:</strong> {detail.equipment.year ?? "—"}</p>
            <p><strong>VIN/Serial:</strong> {detail.equipment.vin_serial ?? "—"}</p>
            <p><strong>License Plate:</strong> {detail.equipment.license_plate ?? "—"}</p>
            <p><strong>DOT Number:</strong> {detail.equipment.dot_number ?? "—"}</p>
            <p><strong>Shareable:</strong> {detail.equipment.is_shareable ? "Yes" : "No"}</p>
          </div>

          <div className="space-y-3 rounded-lg border border-[var(--divider)] bg-[var(--surface-elevated)] p-3">
            <p className="text-sm font-semibold text-[var(--text-primary)]">Compliance</p>
            <div className="flex items-center justify-between gap-2 text-sm text-[var(--text-body)]">
              <span>Registration: {detail.equipment.registration_expiry ?? "—"}</span>
              <ExpiryBadge status={detail.equipment.expiry.registration} />
            </div>
            <div className="flex items-center justify-between gap-2 text-sm text-[var(--text-body)]">
              <span>Insurance: {detail.equipment.insurance_expiry ?? "—"}</span>
              <ExpiryBadge status={detail.equipment.expiry.insurance} />
            </div>
            <div className="flex items-center justify-between gap-2 text-sm text-[var(--text-body)]">
              <span>Annual Inspection: {detail.equipment.annual_inspection_due ?? "—"}</span>
              <ExpiryBadge status={detail.equipment.expiry.inspection} />
            </div>
          </div>

          <div className="space-y-2 rounded-lg border border-[var(--divider)] bg-[var(--surface-elevated)] p-3 text-sm text-[var(--text-body)] md:col-span-2">
            <p className="font-semibold text-[var(--text-primary)]">Current Assignment</p>
            {detail.currentAssignment ? (
              <p>
                {detail.currentAssignment.crew_name ?? "Unknown Crew"} • Assigned {detail.currentAssignment.assigned_date}
              </p>
            ) : (
              <p className="text-[var(--text-secondary)]">No assignment on record.</p>
            )}

            <p className="mt-3 font-semibold text-[var(--text-primary)]">Schedule</p>
            {detail.schedule.length === 0 ? (
              <p className="text-[var(--text-secondary)]">No scheduled date ranges.</p>
            ) : (
              <ul className="space-y-1">
                {detail.schedule.map((entry) => (
                  <li key={entry.id}>
                    {entry.crew_name ?? "Unassigned crew"}: {formatDateRange(entry.start_date, entry.end_date)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>

      <MaintenanceLogSection entries={detail.maintenance} action={maintenanceAction} />
      <DvirSection entries={detail.inspections} drivers={drivers} action={dvirAction} />

      <Card>
        <CardHeader>
          <CardTitle>Availability Snapshot</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--text-secondary)]">
            This record uses non-shareable conflict checks against `equipment_schedule` for date overlaps and active status.
          </p>
          <p className="mt-2 text-xs text-[var(--text-secondary)]">
            Current date: {todayYmd()}
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
