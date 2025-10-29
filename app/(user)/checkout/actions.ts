'use server';

import prisma from '@/lib/prisma';
import {createClient} from '@/lib/supabase/server';
import {DeliveryAddress, Prisma, Product, Order} from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// Define query type for Cart with Cartitem and products
const cartWithItemsAndProduct = Prisma.validator<Prisma.CartDefaultArgs>()({
  include: {
    cartItems: {
      include: {
        product: true,
      },
    },
  },
});

// Define query return type for type checking (TS)
export type CartWithItemsAndProduct =
    Prisma.CartGetPayload<typeof cartWithItemsAndProduct>;

async function getUserId() {
  const supabase = await createClient();
  const {
    data: {user},
  } = await supabase.auth.getUser();
  let personal_user = await prisma.user.findUnique({
    where: {authId: user?.id},
  });
  if (!personal_user?.id) {
    throw new Error('User not found or user ID is undefined');
  }
  return personal_user.id;
}
export async function getCartItems() {
  // first get userId
  // get cart id from userId from the cart table
  // return all cartItems with a certain cartID
  let userId = await getUserId();
  let cartId = await prisma.cart.findUnique({where: {userId: userId}});
  if (cartId == null) {
    return [];
  }
  let cart = await prisma.cart.findUnique({
    where: {
      userId: userId,
    },
    ...cartWithItemsAndProduct,
  });
  if (!cart) {
    return [];
  }
  let toReturn = cart?.cartItems.map(
      (item) => {return ({
        ...item,
        product: {
          ...item.product,
          pricePerUnit: item.product.pricePerUnit.toNumber(),
          weightPerUnit: item.product.weightPerUnit.toNumber()
        }
      })})

  return toReturn;
}

export type CheckoutState = {
  ok?: boolean;
  formError?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function getAddresses(): Promise<DeliveryAddress[]> {
  let userId = await getUserId();
  let addresses = await prisma.deliveryAddress.findMany({
    where: {
      userId: userId,
    }
  }
  )
  return addresses;
}

export async function checkoutAction(
    prevState: CheckoutState, formData: FormData): Promise<CheckoutState> {
  try {
    const selectedItemsJson = formData.get('selectedItems') as string;
    const selectedItems = JSON.parse(selectedItemsJson);
    const selectedAddressId = formData.get('selectedAddressId') as string;

    let userId = await getUserId();
    let cart = await prisma.cart.findUnique({ where: { userId: userId } });
    let addresses = await getAddresses();
    if (addresses.length <= 0) {
      return { formError: "You do not have an address set" };
    }
    
    const selectedAddress = addresses.find(addr => addr.id === parseInt(selectedAddressId));
    if (!selectedAddress) {
      return { formError: "Please select a valid delivery address" };
    }
    
    const order = await prisma.order.create({
      data: {
        userId: userId,
        status: 'PENDING',
        toAddress: selectedAddress.address, 
        createdAt: new Date()
      },
    });
    const productIds = selectedItems.map((item: any) => item.productId);

    const orderItems = await prisma.orderItem.createMany({
      data: selectedItems.map((item: any) => ({
                                orderId: order.id,
                                productId: item.productId,
                                quantity: item.quantity,
                                pricePerUnit: item.pricePerUnit, 
                                weightPerUnit: item.weightPerUnit
                              })),
    });
    // create order items with the correct order ID
    // remove selectedItems from realCart and update cart
    const remove_items = await prisma.cartItem.deleteMany({
      where: {cartId: cart?.id, productId: {in : productIds}},
    });

  } catch (error) {
    console.log('some error:', error);
    return {formError: 'Checkout failed, some problem occured'};
  }
  revalidatePath('/home');
  redirect('/home')
}
