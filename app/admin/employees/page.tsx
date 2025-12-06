import { requireAdmin } from "../actions";
import { getEmployees } from "./actions";
import AddEmployeeButton from "./add-employee-button";
import { columns } from "./columns";
import { DataTable } from "./data-table";

export default async function AdminEmployees() {
  await requireAdmin();
  const employees = await getEmployees();

  return (
    <div className="">
      <div className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Employee Management</h1>
          <AddEmployeeButton />
        </div>
        <div className="py-3">
          <DataTable
            columns={columns}
            data={employees.map((employee) => {
              return {
                id: employee.id,
                firstName: employee.firstName || "",
                lastName: employee.lastName || "",
                email: employee.email,
                role: employee.role,
              };
            })}
          />
        </div>
      </div>
    </div>
  );
}
