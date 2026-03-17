import AdminLayout from "@/components/admin/AdminLayout";

export const metadata = {
    title: "DropCart. - Admin",
    description: "DropCart. - Admin",
};

export default function RootAdminLayout({ children }) {

    return (
        <>
            <AdminLayout>
                {children}
            </AdminLayout>
        </>
    );
}
