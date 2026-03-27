import Link from "next/link";
import { notFound } from "next/navigation";
import { deletePartnerAction } from "@/app/(app)/catalog/partners/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPartner } from "@/lib/catalog/partner-service";

type PartnerDetailPageProps = {
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

export default async function PartnerDetailPage({
  params,
  searchParams,
}: PartnerDetailPageProps) {
  const { id } = await params;
  const query = await searchParams;
  const partner = await getPartner(id);

  if (!partner) {
    notFound();
  }

  const saved = readQueryValue(query, "saved");
  const error = readQueryValue(query, "error");

  return (
    <section className="space-y-4">
      {saved ? <p className="auth-feedback-success">Partner updated successfully.</p> : null}
      {error ? <p className="auth-feedback-error">{decodeURIComponent(error)}</p> : null}

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle>{partner.company_name}</CardTitle>
            <CardDescription>
              {partner.trade_type ?? "General trade"}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/catalog/partners/${partner.id}/edit`}>
              <Button variant="secondary">Edit Partner</Button>
            </Link>
            <form action={deletePartnerAction.bind(null, partner.id)}>
              <Button variant="destructive" type="submit">
                Delete
              </Button>
            </form>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-[var(--text-body)]">
          <p><strong>Contact:</strong> {partner.contact_name ?? "—"}</p>
          <p><strong>Phone:</strong> {partner.phone ?? "—"}</p>
          <p><strong>Email:</strong> {partner.email ?? "—"}</p>
          <p><strong>Trade Type:</strong> {partner.trade_type ?? "—"}</p>
          <p><strong>Status:</strong> {partner.is_active ? "Active" : "Inactive"}</p>
          <p><strong>Notes:</strong> {partner.notes ?? "—"}</p>
        </CardContent>
      </Card>
    </section>
  );
}
