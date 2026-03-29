import { NextResponse } from "next/server";
import prisma from "@/src/db";
import { getAuth } from "@clerk/nextjs/server";
import authSeller from "@/middlewares/authSeller";

export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    
    // Get data from the frontend request body
    const { orderId, status } = await request.json();

    // 1. Authenticate the Seller
    const storeId = await authSeller(userId);
    if (!storeId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Security Check: Ensure this order actually belongs to this store
    const order = await prisma.order.findFirst({
      where: { 
        id: orderId, 
        storeId: storeId 
      }
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found for your store" }, { status: 404 });
    }

    // 3. Update the Status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: status }
    });

    return NextResponse.json({ 
      message: "Order status updated successfully!", 
      updatedOrder 
    });

  } catch (error) {
    console.error("Status Update Error:", error);
    return NextResponse.json(
      { error: error.message }, 
      { status: 500 }
    );
  }
}