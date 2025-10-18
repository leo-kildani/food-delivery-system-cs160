'use server'

import{convertSegmentPathToStaticExportFilename} from 'next/dist/shared/lib/segment-cache/segment-value-encoding';
import prisma from '../../../lib/prisma';
import {createClient} from '../../../lib/supabase/server';
import {Product} from '@prisma/client';

async function getUserId() {
  const supabase = await createClient();
  const {
    data: {user},
  } = await supabase.auth.getUser();
  let personal_user = await prisma.user.findUnique({where: {authId: user?.id}})
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
  let cartId = await prisma.cart.findUnique({where: {userId: userId}})
  let cart_items = await prisma.cartItem.findMany({where: {cartId: cartId?.id}})
  // console.log(cart_items);
  let productPromises = cart_items.map(async (cart_item) => {
    const product =
        await prisma.product.findUnique({where: {id: cart_item.productId}});
    return {
      product: product ? {
        ...product,
        pricePerUnit: product.pricePerUnit.toNumber(),
        weightPerUnit: product.weightPerUnit.toNumber()
      } :
                         null,
      quantity: cart_item.quantity
    };
  })
  let products = await Promise.all(productPromises);
  return products;
}
export type CheckoutState = {
  ok?: boolean;
  formError?: string;
  fieldErrors?: Record<string, string[]>;
};
export async function checkoutAction(
    prevState: CheckoutState, formData: FormData): Promise<CheckoutState> {
  console.log('here another')
  try {
    const selectedItemsJson = formData.get('selectedItems') as string;
    const selectedItems = JSON.parse(selectedItemsJson);
    // console.log(selectedItems);
    // create new order with it being pending
    const delivery = await prisma.delivery.create({
      data: {
          // this is autoincrement id
      }  // empty
    });
    let userId = await getUserId();
    let cart = await prisma.cart.findUnique({where: {userId: userId}})
    const order = await prisma.order.create({
      data: {
        deliveryId: delivery.id,
        userId: userId,
        status: 'PENDING',
      }
    });
    const productIds = selectedItems.map((item: any) => item.productId);

    const orderItems = await prisma.orderItem.createMany({
      data: selectedItems.map((item: any) => ({
                                orderId: order.id,
                                productId: item.productId,
                                quantity: item.quantity
                              }))
    });
    // create order items with the correct order ID
    // remove selectedItems from realCart and update cart
    const remove_items = await prisma.cartItem.deleteMany(
        {where: {cartId: cart?.id, productId: {in : productIds}}})
    console.log('processing checkout')
    return {ok: true};
  } catch (error) {
    console.log('some error:', error);
    return {formError: 'Checkout failed, some problem occured'};
  }
}