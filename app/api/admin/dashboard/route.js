import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "src/db"
import authAdmin from "@/middlewares/authAdmin";
import { all } from "axios";



// get dashboard data for admin (total sales, total orders, total products, total customers)

export async function GET(request) {

    try {
        const {userId} = getAuth(request)
    const isAdmin = await authAdmin(userId)

    if (!isAdmin) {
        return NextResponse.json({error: "Unauthorized"}, {status: 401})
    }

    // get total orders
    const orders = await prisma.order.count()

    // get total products
    const products = await prisma.product.count()

    // get total stores
    const stores = await prisma.store.count()

    // get total orders including createdAt, and total revenue.
    const allOrders = await prisma.order.findMany({select: {
        createdAt: true,
        total: true
    }})

    let totalRevenue = 0
    allOrders.forEach(order => {
        totalRevenue += order.total
    })

    const revenue = totalRevenue.toFixed(2)
    // total products on app
    const product = await prisma.product.count()

    // dashboard data for admin
    const dashboardData = {
        orders,
        stores,
        products,
        revenue,
        allOrders
    }
    return NextResponse.json(dashboardData)
    
    } catch (error) {
        console.log(error)
        return NextResponse.json({error: error.code || error.message}, {status: 400})
        
    }

}