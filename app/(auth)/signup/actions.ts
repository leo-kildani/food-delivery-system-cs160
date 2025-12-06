"use server";

import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import z from "zod";

const SignUpSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(1, "First Name is Required")
      .max(64, "First name must be 64 characters or less"),
    lastName: z
      .string()
      .trim()
      .min(1, "Last Name is Required")
      .max(64, "Last Name must be 64 characters or less"),
    email: z.email("Provide Valid Email"),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .max(72, "Password must be 72 characters or less")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"|<>?,./\`~]).+$/,
        "Password must include at least one lower case, upper case, digit, and symbol characters"
      ),
    confirmPassword: z.string(),
    address: z
      .string()
      .min(1, "Delivery Address Required")
      .regex(
        /CA \d{5}, USA$/,
        "Invalid Address. Please select from the dropdown."
      ),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  });

// --- SIGN UP SERVER ACTION ---
export type SignUpState = {
  ok?: boolean;
  formError?: string;
  fieldErrors?: Record<string, string[]>;
  values?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    address?: string;
  };
};

export async function signUpAction(
  _prevState: SignUpState,
  formData: FormData
): Promise<SignUpState> {
  const input = {
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    address: formData.get("address"),
  };

  const parsed = SignUpSchema.safeParse(input);
  // fields are valid
  if (!parsed.success) {
    const { fieldErrors } = parsed.error.flatten(); 
    return {
      fieldErrors,
      values: {
        firstName: (input.firstName as string) ?? "",
        lastName: (input.lastName as string) ?? "",
        email: (input.email as string) ?? "",
        address: (input.address as string) ?? "",
      },
    };
  }

  const parsedData = parsed.data;
  const supabase = await createClient();

  // sign up user with supabase auth
  const { data, error } = await supabase.auth.signUp({
    email: parsedData.email,
    password: parsedData.password,
    options: {
      data: {
        role: "user",
      },
    },
  });

  if (error) {
    const baseState: SignUpState = {
      formError: "Creating user failed",
      values: {
        firstName: parsedData.firstName,
        lastName: parsedData.lastName,
        email: parsedData.email,
        address: parsedData.address,
      },
    };

    if (error.message?.toLowerCase().includes("already registered")) {
      return {
        ...baseState,
        formError: "An account with this email already exists",
      };
    }

    return baseState;
  }

  const authId = data.user?.id;
  if (!authId) {
    return {
      formError: "Sign up did not return auth id",
      values: {
        firstName: parsedData.firstName,
        lastName: parsedData.lastName,
        email: parsedData.email,
        address: parsedData.address,
      },
    };
  }

  // store user information in supabase
  let user: Prisma.UserCreateInput;
  user = {
    authId: authId,
    firstName: parsedData.firstName,
    lastName: parsedData.lastName,
    email: parsedData.email,
    role: "USER",
    addresses: {
      create: {
        address: parsedData.address,
      },
    },
    cart: {
      create: {},
    },
  };
  try {
    await prisma.user.create({ data: user });
  } catch (e) {
    console.log(e);
    return { formError: "Error creating user" };
  }
  redirect("/home");
}
