import { notFound } from "next/navigation";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmployeeForm } from "@/components/employees/employee-form";
import { getEmployee, getViewerContext, resolvePermission } from "@/lib/employees/employee-service";
import { getRoles } from "@/lib/employees/role-service";
import { updateEmployeeAction } from "../../actions";

type EditEmployeePageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditEmployeePage({ params }: EditEmployeePageProps) {
  const { id } = await params;
  const context = await getViewerContext();

  const [canManageEmployees, canViewCompensation, roles] = await Promise.all([
    resolvePermission(context.orgId, context.employeeId, "employees.manage"),
    resolvePermission(context.orgId, context.employeeId, "compensation.view"),
    getRoles(context.orgId),
  ]);

  if (!canManageEmployees) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Employee updates are restricted</CardTitle>
          <CardDescription>You do not have permission to edit employees.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const employee = await getEmployee(context.orgId, id, {
    includeCompensation: canViewCompensation,
  });

  if (!employee) {
    notFound();
  }

  return (
    <EmployeeForm
      title="Edit Employee"
      description="Update employee details, status, and compensation history."
      submitLabel="Save Changes"
      cancelHref={`/employees/${employee.id}`}
      action={updateEmployeeAction.bind(null, employee.id)}
      roles={roles}
      canViewCompensation={canViewCompensation}
      initialEmployee={employee}
    />
  );
}
