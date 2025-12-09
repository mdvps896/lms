'use client'
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import dynamic from "next/dynamic";
import Header from "@/components/shared/header/Header";
import NavigationManu from "@/components/shared/navigationMenu/NavigationMenu";
import SupportDetails from "@/components/supportDetails";
import useBootstrapUtils from "@/hooks/useBootstrapUtils"
import { useAuth } from "@/contexts/AuthContext";
// const useBootstrapUtils = dynamic(() => import('@/hooks/useBootstrapUtils'), { ssr: false })

export default function DuplicateLayout({ children }) {
    const pathName = usePathname()
    const router = useRouter()
    const { isAuthenticated, loading } = useAuth()
    useBootstrapUtils(pathName)

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push('/authentication/login')
        }
    }, [isAuthenticated, loading, router])

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        )
    }

    if (!isAuthenticated) {
        return null
    }

    return (
        <>
            <Header />
            <NavigationManu />
            <main className="nxl-container">
                <div className="nxl-content">
                    {children}
                </div>
            </main>
            <SupportDetails />
        </>

    );
}
