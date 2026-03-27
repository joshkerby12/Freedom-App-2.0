import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmployeeForm } from "@/components/employees/employee-form";
import { getViewerContext, resolvePermission } from "@/lib/employees/employee-service";
import { getRoles } from "@/lib/employees/role-service";
import { createEmployeeAction } from "../actions";

export default async function NewEmployeePage() {
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
          <CardTitle>Employee creation is restricted</CardTitle>
          <CardDescription>You do not have permission to create employees.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (roles.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No roles available</CardTitle>
          <CardDescription>Create at least one role before adding employees.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <EmployeeForm
      title="Add Employee"
      description="Create a new employee record and optional compensation row."
      submitLabel="Save Employee"
      cancelHref="/employees"
      action={createEmployeeAction}
      roles={roles}
      canViewCompensation={canViewCompensation}
    />
  );
}
