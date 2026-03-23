

// Update seller orders status (pending, processing, shipped, delivered, cancelled)

import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "src/db"
import authSeller from "@/middlewares/authSeller";

export async function POST(request) {
    try {
        const {userId} = getAuth(request)
        const storeId = await authSeller(userId)
        
        if(!storeId) {
            return NextResponse.json({error: "Unauthorized"}, {status: 401})
        }
        const {orderId, status} = await request.json()

        await prisma.order.update({
            where: {id: orderId, storeId},
            data: {status}
        })
        return NextResponse.json({message: "Order status updated successfully"})

    } catch (error) {
        console.log(error)
        return NextResponse.json({error: "Failed to update order status"}, {status: 500})
    }
}

// get all orders for the seller
export async function GET(request) {
    try {
        const {userId} = getAuth(request)
        const storeId = await authSeller(userId)
        
        if(!storeId) {
            return NextResponse.json({error: "Unauthorized"}, {status: 401})
        }
        const orders = await prisma.order.findMany({
            where: {storeId},
            include: { user: true, address: true, orderItems: { include: { product: true } } },
            orderBy: { createdAt: "desc" }
        })
        return NextResponse.json({orders})
    } catch (error) {
        console.log(error)
        return NextResponse.json({error: "Failed to fetch orders"}, {status: 500})
    }
}