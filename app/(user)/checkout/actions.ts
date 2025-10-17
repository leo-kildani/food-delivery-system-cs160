'use server';

import {convertSegmentPathToStaticExportFilename} from 'next/dist/shared/lib/segment-cache/segment-value-encoding';
import prisma from '../../../lib/prisma';
import {createClient} from '../../../lib/supabase/server';
import {Product} from '@prisma/client';


export async function getCartItems() {
  // first get userId
  // get cart id from userId from the cart table
  // return all cartItems with a certain cartID
  const supabase = await createClient();

  const {
    data: {user},
  } = await supabase.auth.getUser();
  let personal_user = await prisma.user.findUnique({where: {authId: user?.id}})
  // console.log(personal_user)
  let cartId =
      await prisma.cart.findUnique({where: {userId: personal_user?.id}})
  let cart_items = await prisma.cartItem.findMany({where: {cartId: cartId?.id}})
  // console.log(cart_items);
  let productPromises = cart_items.map(async (cart_item) => {
    return {
      product:
          await prisma.product.findUnique({where: {id: cart_item.productId}}),
      quantity: cart_item.quantity
    };
  })
  let products = await Promise.all(productPromises);
  return products;
}