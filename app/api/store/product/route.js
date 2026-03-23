import imagekit from "@/configs/imageKit";
import authSeller from "@/middlewares/authSeller";
import prisma from "src/db";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// API to Add a new product

export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    const storeId = await authSeller(userId);

    if (!storeId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }

    // get data from the form

    const formData = await request.formData();
    const name = formData.get("name");
    const description = formData.get("description");
    const mrp = Number(formData.get("mrp"));
    const price = Number(formData.get("price"));
    const category = formData.get("category");
    
    // Get all images and filter out any that aren't valid files
    const images = formData.getAll("images").filter(item => item instanceof File);

    if (!name || !description || isNaN(mrp) || isNaN(price) || !category || images.length < 1) {
      return NextResponse.json({ error: "Missing or invalid product details" }, { status: 400 });
    }

    // Uploading images to ImageKit
    const imagesUrl = await Promise.all(
      images.map(async (image) => {
        try {
          const arrayBuffer = await image.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          
          const response = await imagekit.upload({
            file: buffer,
            fileName: image.name || `product-${Date.now()}`,
            folder: "products",
          });

          return imagekit.url({
            path: response.filePath,
            transformation: [
              { quality: 'auto' },
              { format: 'webp' },
              { width: '1024' }
            ]
          });
        } catch (uploadError) {
          console.error("ImageKit upload error:", uploadError);
          return null; // Don't crash the whole request if one image fails
        }
      })
    );

    // Filter out any failed uploads
    const validUrls = imagesUrl.filter(url => url !== null);

    await prisma.product.create({
      data: {
        name: String(name),
        description: String(description),
        mrp,
        price,
        category: String(category),
        images: validUrls, // Ensure your Prisma schema is String[]
        storeId
      }
    });

    return NextResponse.json({ message: "Product added successfully!" });
  } catch (error) {
    console.error("Add product error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to add product" },
      { status: 500 }
      
    );
  } 
}

// API to get all product from a particular seller

export async function GET(request) {
    try {

    const { userId } = getAuth(request);
    const storeId = await authSeller(userId);

    if (!storeId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }
    const products = await prisma.product.findMany({where: {storeId}})
    return NextResponse.json({products})

        
    } catch (error) {
         return NextResponse.json(
        { error: error.code || error.message},
        { status: 400 }
        );
    }
}