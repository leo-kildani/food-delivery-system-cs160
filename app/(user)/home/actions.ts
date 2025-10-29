"use server";

import prisma from "@/lib/prisma";
import { Product, ProductStatus } from "@prisma/client";
import { createClient } from "@/lib/supabase/server";
import { getCartItems } from "../checkout/actions";
import { revalidatePath } from "next/cache";
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function getUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let personal_user = await prisma.user.findUnique({
    where: { authId: user?.id },
  });
  if (!personal_user?.id) {
    throw new Error("User not found or user ID is undefined");
  }
  return personal_user.id;
}

export async function getActiveProducts(): Promise<Product[]> {
  return await prisma.product.findMany({
    where: { status: ProductStatus.ACTIVE },
  });
}
export async function getCartId(): Promise<number> {
  let userId = await getUserId();
  let cart = await prisma.cart.findUnique({ where: { userId: userId } });
  if (cart == null) {
    return -1; // should never happen due to database constraint
  } else {
    return cart.id;
  }
}
export type AddToCartState = {
  success?: boolean;
  error?: string;
  data?: any;
};
export async function addToCartAction(
  _prevState: AddToCartState,
  formData: FormData
): Promise<AddToCartState> {
  try {
    const cartId = parseInt(formData.get("cartId") as string);
    const productId = parseInt(formData.get("productId") as string);
    const quantity = parseInt(formData.get("quantity") as string);
    let userId = await getUserId();
    console.log(cartId, userId);
    const addedItem = await prisma.cartItem.upsert({
      where: {
        cartId_productId: {
          cartId: cartId,
          productId: productId,
        },
      },
      update: {
        quantity: quantity,
      },
      create: {
        cartId: cartId,
        productId: productId,
        quantity: quantity,
      },
    });
    revalidatePath("/home");
    return { success: true, data: addedItem };
  } catch (error) {
    console.error("Error adding to cart:", error);
    return { success: false, error: "Failed to add to cart" };
  }
}
// --- SERVER ACTION ---
export type SerializedProduct = Omit<
  Product,
  "pricePerUnit" | "weightPerUnit"
> & {
  pricePerUnit: number;
  weightPerUnit: number;
};

export interface CartItem {
  cartId: number;
  id: number;
  productId: number;
  quantity: number;
  product: SerializedProduct;
}

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export async function sendChatMessage(messages: ChatMessage[]) {
  try {
    if (!messages || !Array.isArray(messages)) {
      throw new Error('Invalid messages format');
    }

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    // Use the existing getActiveProducts function
    const products = await getActiveProducts();

    // Format products for the AI context with ID, name, and ingredients
    const productsContext = products
      ?.map((p) => `ID: ${p.id}, Name: ${p.name}, Ingredients: ${p.description}`)
      .join('\n') || 'No products available';

    const SYSTEM_PROMPT = `You are an AI assistant for a food delivery service that helps users find ingredients.

Available Products:
${productsContext}

When a user asks about ingredients for a recipe or meal, analyze their request and respond ONLY with a JSON array of products they need. Each product should include:
- productID: the product ID number
- productName: the product name
- quantity: estimated quantity needed (as a number)

Example response format:
[
  {"productID": 1, "productName": "Tomatoes", "quantity": 3},
  {"productID": 5, "productName": "Onions", "quantity": 2}
]

IMPORTANT:
- Respond ONLY with the JSON array, no additional text
- Base your response on the available products listed above
- If the user asks a non-ingredient question, respond with an empty array: []
- Estimate reasonable quantities based on the recipe or request`;

    const openaiMessages = messages.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...openaiMessages,
      ],
      max_tokens: 300,
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const assistantMessage = response.choices[0].message.content;

    return {
      content: assistantMessage,
    };
  } catch (error) {
    console.error('Chat API error:', error);
    throw error;
  }
}
