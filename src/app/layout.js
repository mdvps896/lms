'use client'

import "../assets/scss/theme.scss";
import 'react-circular-progressbar/dist/styles.css';
import "react-perfect-scrollbar/dist/css/styles.css";
import "react-datepicker/dist/react-datepicker.css";
import "react-datetime/css/react-datetime.css";
import 'react-toastify/dist/ReactToastify.css';
import '@/utils/passiveEvents'; // Fix passive event listeners
import { ToastContainer } from 'react-toastify';
import NavigationProvider from "@/contentApi/navigationProvider";
import SettingSideBarProvider from "@/contentApi/settingSideBarProvider";
import ThemeCustomizer from "@/components/shared/ThemeCustomizer";
import { AuthProvider } from "@/contexts/AuthContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import DynamicGoogleProvider from "@/components/shared/DynamicGoogleProvider";
import DynamicHead from "@/components/shared/DynamicHead";
import TopProgressBar from "@/components/shared/TopProgressBar";
import CategoryGuard from "@/components/CategoryGuard";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta httpEquiv="Cross-Origin-Opener-Policy" content="unsafe-none" />
        <meta httpEquiv="Cross-Origin-Embedder-Policy" content="unsafe-none" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <DynamicHead />
      <body>
        <TopProgressBar />
        <DynamicGoogleProvider>
          <AuthProvider>
            <SettingsProvider>
              <SettingSideBarProvider>
                <NavigationProvider>
                  <CategoryGuard>
                    {children}
                  </CategoryGuard>
                </NavigationProvider>
              </SettingSideBarProvider>
              <ThemeCustomizer />
              <ToastContainer />
            </SettingsProvider>
          </AuthProvider>
        </DynamicGoogleProvider>
      </body>
    </html>
  );
}
