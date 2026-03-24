import prisma from "@/src/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    let products = await prisma.product.findMany({
      where: {
        inStock: true,
      },

      include: {
        store: {
          select: {
            isActive: true,
            isActive: true,
            name: true,     // Added
            logo: true,     // Added
            username: true, // Added
          },
        },

        rating: {
          select: {
            createdAt: true,
            rating: true,
            review: true,

            user: {
              select: {
                name: true,
                email: true,
                image: true,
              },
            },
          },

          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    products = products.filter((product) => product.store?.isActive);

    return NextResponse.json({
      products,
    });
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      { error: "Failed to fetch products" },

      { status: 500 },
    );
  }
}
