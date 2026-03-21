import { inngest } from "./client";
import {prisma} from "../src/db"

// Inngest Funtions to save user data to neon database

export const syncUserCreation = inngest.createFunction(
    { 
        id: 'sync-user-create',
        // In v4, use the 'triggers' array instead of a direct 'event' property
        triggers: [{ event: 'clerk/user.created' }] 
    },
    async ({ event }) => {
        const { data } = event;
        
        await prisma.user.create({
            data: {
                id: data.id, // Access the specific ID string
                email: data.email_addresses[0].email_address, // Fixed 'addresses' typo
                name: `${data.first_name} ${data.last_name}`,
                image: data.image_url,
            }
        });
    }
);



// Inngest Function to update user data in Neon database
export const syncUserUpdation = inngest.createFunction(
    { 
        id: 'sync-user-update',
        triggers: [{ event: 'clerk/user.updated' }] 
    },
    async ({ event }) => {
        const { data } = event;
        await prisma.user.update({
            where: { id: data.id },
            data: {
                // Fixed: Clerk returns an array, use the first element
                email: data.email_addresses[0].email_address,
                name: `${data.first_name} ${data.last_name}`,
                image: data.image_url,
            }
        });
    }
);


// Inngest Funtion to delete a user from Neon database

export const syncUserDeletion = inngest.createFunction(
    { 
        id: 'sync-user-delete',
        triggers: [{ event: 'clerk/user.deleted' }] 
    },
    async ({ event }) => {
        const { data } = event;
        await prisma.user.delete({
            where: { id: data.id }
        });
    }
);

// Inngest Funtion to delete coupon on expiration date
export const deleteExpiredCoupons = inngest.createFunction(
    {
        id: 'delete-coupon-on-expiry',
        triggers: [{ event: 'app/coupon.expired' }]
    },
    async ({event, step}) => {
        const { data } = event;
        const expiryDate = new Date(data.expires_at)
        await step.sleepUntil('wait-for-expiry', expiryDate)

        await step.run('delete-coupon-from-database', async () => {
            await prisma.coupon.delete({
                where: { code: data.code }
            })
        })
    }
);