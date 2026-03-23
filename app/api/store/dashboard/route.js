import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "src/db"
import authSeller from "@/middlewares/authSeller";


// getting dahboard data for seller (total sales, total orders, total products, total customers)

export async function GET(request) {
  try {
    const {userId} = getAuth(request)
    const storeId = await authSeller(userId)

    // get total orders for the store
    const orders = await prisma.order.findMany({where: {storeId}})

    // get all products with ratings and reviews for seller
    const products = await prisma.product.findMany({where: {storeId}})

    const ratings = await prisma.rating.findMany({where: {productId: {in: products.map(product => product.id)}},
    include: {product: true, user: true}})

    const dashboardData = {
        ratings,
        totalOrders: orders.length,
        totalEarnings: Math.round(orders.reduce((acc, order) => acc + order.totalAmount, 0)),
        totalProducts: products.length,
        

    }
    return NextResponse.json(dashboardData);
  } catch (error) {
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 400 },
    );
  }
}