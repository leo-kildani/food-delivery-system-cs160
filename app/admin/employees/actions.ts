"use server";

import { createClient } from "@/lib/supabase/server";
import createAdminClient from "@/lib/supabase/admin";
import prisma from "@/lib/prisma";
import { User, UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { z } from "zod";

// Validation schemas
const CreateEmployeeSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const UpdateEmployeeSchema = z.object({
  id: z.string(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
});

const DeleteEmployeeSchema = z.object({
  id: z.string(),
});

// Get all employees (ADMIN only)
export async function getEmployees(): Promise<User[]> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (data.user?.user_metadata?.role !== "admin") {
    redirect("/login");
  }

  return await prisma.user.findMany({
    where: {
      role: UserRole.EMPL,
    },
    orderBy: {
      email: "asc",
    },
  });
}

// Create new employee
export type CreateEmployeeState = {
  ok?: boolean;
  formError?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function createEmployeeAction(
  _prevState: CreateEmployeeState,
  formData: FormData
): Promise<CreateEmployeeState> {
  const input = {
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = CreateEmployeeSchema.safeParse(input);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const parsedData = parsed.data;
  const supabase = await createClient();

  // Check if user is admin
  const { data } = await supabase.auth.getUser();
  if (data.user?.user_metadata?.role !== "admin") {
    return { formError: "Unauthorized" };
  }

  // Create user in Supabase Auth using admin client
  const adminClient = createAdminClient();
  const { data: authData, error: authError } =
    await adminClient.auth.admin.createUser({
      email: parsedData.email,
      password: parsedData.password,
      user_metadata: {
        role: "empl",
      },
      email_confirm: true, // Auto-confirm the email for employees
    });

  if (authError) {
    console.error("Auth error:", authError);
    return {
      formError: authError.message || "Failed to create employee account",
    };
  }

  const authId = authData?.user?.id;
  if (!authId) {
    return { formError: "Failed to get auth ID" };
  }

  // Create user in database
  try {
    await prisma.user.create({
      data: {
        authId: authId,
        firstName: parsedData.firstName,
        lastName: parsedData.lastName,
        email: parsedData.email,
        role: UserRole.EMPL,
        cart: {
          create: {},
        },
      },
    });
  } catch (e) {
    console.log(e);
    return { formError: "Error creating employee" };
  }

  return { ok: true };
}

// Update employee
export type UpdateEmployeeState = {
  ok?: boolean;
  formError?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function updateEmployeeAction(
  _prevState: UpdateEmployeeState,
  formData: FormData
): Promise<UpdateEmployeeState> {
  const input = {
    id: formData.get("id"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
  };

  const parsed = UpdateEmployeeSchema.safeParse(input);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const parsedData = parsed.data;
  const supabase = await createClient();

  // Check if user is admin
  const { data } = await supabase.auth.getUser();
  if (data.user?.user_metadata?.role !== "admin") {
    return { formError: "Unauthorized" };
  }

  try {
    await prisma.user.update({
      where: { id: parsedData.id },
      data: {
        firstName: parsedData.firstName,
        lastName: parsedData.lastName,
        email: parsedData.email,
      },
    });
  } catch (e) {
    console.log(e);
    return { formError: "Error updating employee" };
  }

  return { ok: true };
}

// Delete employee
export type DeleteEmployeeState = {
  ok?: boolean;
  formError?: string;
};

export async function deleteEmployeeAction(
  _prevState: DeleteEmployeeState,
  formData: FormData
): Promise<DeleteEmployeeState> {
  const input = {
    id: formData.get("id"),
  };

  const parsed = DeleteEmployeeSchema.safeParse(input);
  if (!parsed.success) {
    return { formError: "Invalid employee ID" };
  }

  const parsedData = parsed.data;
  const supabase = await createClient();

  // Check if user is admin
  const { data } = await supabase.auth.getUser();
  if (data.user?.user_metadata?.role !== "admin") {
    return { formError: "Unauthorized" };
  }

  try {
    // Get user to find authId
    const user = await prisma.user.findUnique({
      where: { id: parsedData.id },
    });

    if (!user) {
      return { formError: "Employee not found" };
    }

    // Delete from database first
    await prisma.user.delete({
      where: { id: parsedData.id },
    });

    // Note: In a real application, you might want to delete the Supabase auth user as well
    // This would require using the Supabase Admin API
  } catch (e) {
    console.log(e);
    return { formError: "Error deleting employee" };
  }

  return { ok: true };
}
