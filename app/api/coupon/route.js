import prisma from "@/src/db";
import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";

// Verify coupon
export async function POST(request) {
    try {
        const { userId, has } = getAuth(request);
        const {code} = await request.json();

        const coupon = await prisma.coupon.findUnique({
            where: {
                code: code
            }
        });

        if (!coupon) {
            return NextResponse.json({ error: 'Invalid coupon code' }, { status: 400 });
        }
        // NEW USER CHECK
        if (coupon.forNewUser){
            const userOrders = await prisma.order.findMany({
                where: {
                    userId: userId
                }
            });
            if (userOrders.length > 0) {
                return NextResponse.json({ error: 'Coupon code valid for new users only' }, { status: 400 });
            }
        }
        // NEW MEMBER CHECK
        if (coupon.forMember) {
            const hasPlusPlan = has({plan: `plus`})
            if (!hasPlusPlan) {
                return NextResponse.json({ error: 'Coupon code valid for members only' }, { status: 404 });
            }
        }


        return NextResponse.json({ coupon });
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error : error.code || error.message}, { status: 400 });
    }
}