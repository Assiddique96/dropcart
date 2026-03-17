import StoreLayout from "@/components/store/StoreLayout";

export const metadata = {
    title: "DropCart. - Store Dashboard",
    description: "DropCart. - Store Dashboard",
};

export default function RootAdminLayout({ children }) {

    return (
        <>
            <StoreLayout>
                {children}
            </StoreLayout>
        </>
    );
}
