import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import imagekit from "@/configs/imageKit";
import prisma from "src/db"

// Creating Store
export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    const formData = await request.formData();

    const name = formData.get("name");
    const username = formData.get("username");
    const description = formData.get("description");
    const email = formData.get("email");
    const contact = formData.get("contact");
    const address = formData.get("address");
    const image = formData.get("image");

    if (!name || !username || !description || !email || !contact || !address || !image) {
      return NextResponse.json({ error: "missing store info" }, { status: 400 });
    }

    // 1. Check if store already exists
    const store = await prisma.store.findFirst({
      where: { userId: userId },
    });

    if (store) {
      return NextResponse.json({ status: store.status });
    }

    // 2. Check if username is taken
    const isUsernameTaken = await prisma.store.findFirst({
      where: { username: username.toLowerCase() },
    });

    if (isUsernameTaken) {
      return NextResponse.json({ error: "Username already taken" }, { status: 400 });
    }

    // 3. Upload image to ImageKit
    const buffer = Buffer.from(await image.arrayBuffer());
    const uploadResponse = await imagekit.upload({
      file: buffer,
      fileName: image.name,
      folder: "logos",
    });

    // 4. Wrap DB operations in a sub-try/catch for cleanup
    try {
      const newStore = await prisma.store.create({
        data: {
          userId,
          name,
          description,
          username: username.toLowerCase(),
          email,
          contact,
          address,
          logo: uploadResponse.url,
        },
      });

      await prisma.user.update({
        where: { id: userId },
        data: { store: { connect: { id: newStore.id } } },
      });

      return NextResponse.json({ message: "Applied, Awaiting approval" });

    } catch (dbError) {
      // If DB fails, delete the image we just uploaded
      await imagekit.deleteFile(uploadResponse.fileId);
      throw dbError; // Pass it to the outer catch
    }

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error.code || error.message || "Internal Server Error" },
      { status: 400 }
    );
  }
} // <--- This closes the POST function

// check is user have already registered a store if yes then send status of stor

export async function GET(request) {
    try {
        const {userId} = getAuth(request)

        // check is user have already registered a store
        const store = await prisma. store.findFirst({
            where: { userId: userId}

        })

// if store is already registered then send status of store
        if(store){
            return NextResponse. json({status: store.status})
        }

        return NextResponse.json({status: "Not Registered"})

    } catch (error) {
        console.error(error);
        return NextResponse.json(
        { error: error.code || error.message || "Internal Server Error" },
        { status: 400 }
        );
    }
}
