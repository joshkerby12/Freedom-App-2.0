import { CrewForm } from "@/components/crews/crew-form";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createCrewAction } from "@/app/(app)/crews/actions";
import { listCrewLeadOptions, type CrewLeadOption } from "@/lib/crews/crew-service";
import { createClient } from "@/lib/supabase/server";

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export default async function NewCrewPage() {
  const supabase = await createClient();
  let crewLeadOptions: CrewLeadOption[] = [];
  let errorMessage: string | null = null;

  try {
    crewLeadOptions = await listCrewLeadOptions(supabase);
  } catch (error) {
    errorMessage = getErrorMessage(error, "Please try again shortly.");
  }

  if (errorMessage) {
    return (
      <section className="mx-auto w-full max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Unable to open crew form</CardTitle>
            <CardDescription>{errorMessage}</CardDescription>
          </CardHeader>
        </Card>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-2xl space-y-4">
      <CrewForm
        title="Create Crew"
        description="Set up a new crew and optionally assign a crew lead."
        submitLabel="Create Crew"
        cancelHref="/crews"
        action={createCrewAction}
        crewLeadOptions={crewLeadOptions}
      />
    </section>
  );
}
