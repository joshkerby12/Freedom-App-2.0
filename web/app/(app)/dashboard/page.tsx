import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <section className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Dashboard</CardTitle>
          <CardDescription>
            You are signed in. This is the authenticated landing page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--text-body)]">
            Phase 3 scaffold complete. Feature modules will be added in upcoming web tasks.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}

