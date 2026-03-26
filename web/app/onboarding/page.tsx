import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function OnboardingPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl items-center px-4 py-8">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Finish organization setup</CardTitle>
          <CardDescription>
            Your account is active, but no organization membership was found yet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--text-body)]">
            Organization onboarding screens will be implemented in a follow-up web task.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}

