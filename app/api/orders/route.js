// funtions to create order and get orders
import { NextResponse } from "next/server";
import prisma from "@/src/db";
import { getAuth } from "@clerk/nextjs/server";
import { PaymentMethod } from "@/src/generated/prisma";



// create order
export async function POST(request) {
  try {
    const { userId, has } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const { addressId, items, couponCode, paymentMethod } =
      await request.json();
    // check if all required fields are present
    if (!addressId || !items || !paymentMethod || items.length === 0) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 },
      );
    }
    // check coupon
    let coupon = null;
    if (couponCode) {
      coupon = await prisma.coupon.findUnique({
        where: {
          code: couponCode
        },
      });
    if (!coupon) {
      return NextResponse.json(
        { error: "Invalid coupon code" },
        { status: 400 },
      );
    }  
    }


    // NEW USER ELIGIBILITY CHECK
    if (couponCode && coupon.forNewUser) {
      const userOrders = await prisma.order.findMany({
        where: {
          userId: userId,
        },
      });
      if (userOrders.length > 0) {
        return NextResponse.json(
          { error: "Coupon code valid for NEW users only" },
          { status: 400 },
        );
      }
    }
    // NEW MEMBER ELIGIBILITY CHECK
    const isPlusMemeber = has({ plan: `plus` });
    if (couponCode && coupon.forMember) {
      
      if (!isPlusMemeber) {
        return NextResponse.json(
          { error: "Coupon code valid for MEMBERS ONLY" },
          { status: 404 },
        );
      }
    }

    // Group orders by store using a map
    const ordersByStore = new Map();
    for (const item of items) {
        const product = await prisma.product.findUnique({
            where: { id: item.id }
        });
        const storeId = product.storeId;
        if (!ordersByStore.has(storeId)) {
            ordersByStore.set(storeId, []);
        }
        ordersByStore.get(storeId).push({...item, price: product.price});
    }

    let orderIds = [];
    let fullAmount = 0;

    let isShippingFeeAdded = false;
    // Create separate orders for each store
    for (const [storeId, sellerItems] of ordersByStore.entries()) {
        let total = sellerItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        fullAmount += total;

        // add coupon
        if (couponCode){
            total -= (total * coupon.discount) / 100;
        }
        if (!isPlusMemeber && !isShippingFeeAdded) {
            total += 7000; // Add shipping fee for non-members
            isShippingFeeAdded = true; // Ensure shipping fee is added only once
        }

        fullAmount += parseFloat((total).toFixed(2));

        const order = await prisma.order.create({
            data: {
                userId,
                storeId,
                addressId,
                total: parseFloat((total).toFixed(2)),
                paymentMethod,
                isCouponUsed: couponCode ? true : false,
                coupon: coupon ? coupon : {},
                orderItems: {
                    create: sellerItems.map(item => ({
                        productId: item.id,
                        quantity: item.quantity,
                        price: item.price
                    }))
                }

            }
        });
        orderIds.push(order.id);

    }

    // clear user's cart
    await prisma.user.update({
        where: { id: userId },
        data: { cart: {}}

        });
    return NextResponse.json({ message: "Order created successfully", orderIds, fullAmount });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.code || error.message }, { status: 400 });
  }
}


// Get orders for a user
export async function GET(request) {
    try {
        const { userId } = getAuth(request);
        const orders = await prisma.order.findMany({
            where: { 
                userId, 
                OR: [
                    { paymentMethod: PaymentMethod.COD },
                    { AND: [
                        { paymentMethod: PaymentMethod.STRIPE },
                        { isPaid: true }
                    ]}
                ] 
            },
            include: {
                // ✅ Address belongs to the ORDER, move it here
                address: true, 
                orderItems: {
                    include: {
                        product: true,
                    }
                }
            }, 
            // ✅ This is now correctly placed to sort orders by date
            orderBy: { createdAt: 'desc' }
        });
        
        return NextResponse.json({ orders });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
