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
    streetAddress: z.string().trim().min(1, "Street Address required"),
    aptNumber: z.string().optional(),
    city: z.string().trim().min(1, "City is required"),
    stateCode: z.enum(["CA"], { error: "Only delivery in california allowed" }),
    postalCode: z
      .string()
      .trim()
      .regex(/^\d{5}$/, "Invalid US Postal Code"),
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
    streetAddress: formData.get("streetAddress"),
    aptNumber: formData.get("aptNumber"),
    city: formData.get("city"),
    stateCode: formData.get("stateCode"),
    postalCode: formData.get("postalCode"),
  };

  const parsed = SignUpSchema.safeParse(input);
  // fields are valid
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
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
    return { formError: "Creating user failed" };
  }

  const authId = data.user?.id;
  if (!authId) {
    return { formError: "Sign up did not return auth id" };
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
        street: parsedData.streetAddress,
        aptNumber: parsedData.aptNumber,
        city: parsedData.city,
        stateCode: parsedData.stateCode,
        postalCode: parsedData.postalCode,
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
