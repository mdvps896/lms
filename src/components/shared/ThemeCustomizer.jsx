'use client'
import React, { useEffect, useState } from 'react'
import PerfectScrollbar from 'react-perfect-scrollbar'
import { FiSettings, FiX } from 'react-icons/fi'

const fontFalmily = [
    { isChecked: false, value: "app-font-family-lato", label: "Lato" },
    { isChecked: false, value: "app-font-family-rubik", label: "Rubik" },
    { isChecked: true, value: "app-font-family-inter", label: "Inter" },
    { isChecked: false, value: "app-font-family-cinzel", label: "Cinzel" },
    { isChecked: false, value: "app-font-family-nunito", label: "Nunito" },
    { isChecked: false, value: "app-font-family-roboto", label: "Roboto" },
    { isChecked: false, value: "app-font-family-ubuntu", label: "Ubuntu" },
    { isChecked: false, value: "app-font-family-poppins", label: "Poppins" },
    { isChecked: false, value: "app-font-family-raleway", label: "Raleway" },
    { isChecked: false, value: "app-font-family-system-ui", label: "System UI" },
    { isChecked: false, value: "app-font-family-noto-sans", label: "Noto Sans" },
    { isChecked: false, value: "app-font-family-fira-sans", label: "Fira Sans" },
    { isChecked: false, value: "app-font-family-work-sans", label: "Work Sans" },
    { isChecked: false, value: "app-font-family-open-sans", label: "Open Sans" },
    { isChecked: false, value: "app-font-family-maven-pro", label: "Maven Pro" },
    { isChecked: false, value: "app-font-family-quicksand", label: "Quicksand" },
    { isChecked: false, value: "app-font-family-montserrat", label: "Montserrat" },
    { isChecked: false, value: "app-font-family-josefin-sans", label: "Josefin Sans" },
    { isChecked: false, value: "app-font-family-ibm-plex-sans", label: "Ibm Plex Sans" },
    { isChecked: false, value: "app-font-family-source-sans-pro", label: "Source Sans Pro" },
    { isChecked: false, value: "app-font-family-montserrat-alt", label: "Montserrat Alt" },
    { isChecked: false, value: "app-font-family-roboto-slab", label: "Roboto Slab" },
]
const ThemeCustomizer = () => {
    const [open, setOpen] = useState(false)
    const handleNavigationTheme = (type) => {
        if (type === "dark") {
            document.documentElement.classList.add("app-navigation-dark");
            localStorage.setItem("navigationTheme", "dark");
        } else {
            document.documentElement.classList.remove("app-navigation-dark");
            localStorage.setItem("navigationTheme", "light");
        }
    };

    const handleHeaderTheme = (type) => {
        if (type === "dark") {
            document.documentElement.classList.add("app-header-dark");
            localStorage.setItem("headerTheme", "dark");
        } else {
            document.documentElement.classList.remove("app-header-dark");
            localStorage.setItem("headerTheme", "light");
        }
    };

    const handleSkinTheme = (type) => {
        if (type === "dark") {
            document.documentElement.classList.add("app-skin-dark");
            localStorage.setItem("skinTheme", "dark");
        } else {
            document.documentElement.classList.remove("app-skin-dark");
            localStorage.setItem("skinTheme", "light");
        }
    };

    const handleFontFamily = (font, id) => {
        const existingFontClass = document.documentElement.classList.value.match(/app-font-family-\w+/);
        if (existingFontClass) {
            document.documentElement.classList.remove(existingFontClass[0]);
        }
        document.documentElement.classList.add(font);
        localStorage.setItem("fontFamily", font);
    };

    const handleResetAll = () => {
        const x = document.documentElement.classList;
        document.documentElement.classList.remove(...x);
        localStorage.clear(); // Clear all localStorage items
        setOpen(false);
    };

    // Load saved themes from localStorage on page load
    const loadSavedThemes = () => {
        const savedNavigationTheme = localStorage.getItem("navigationTheme");
        const savedHeaderTheme = localStorage.getItem("headerTheme");
        const savedSkinTheme = localStorage.getItem("skinTheme");
        const savedFontFamily = localStorage.getItem("fontFamily");

        if (savedNavigationTheme) {
            handleNavigationTheme(savedNavigationTheme);
        }
        if (savedHeaderTheme) {
            handleHeaderTheme(savedHeaderTheme);
        }
        if (savedSkinTheme) {
            handleSkinTheme(savedSkinTheme);
        }
        if (savedFontFamily) {
            handleFontFamily(savedFontFamily);
        }
    };

    useEffect(() => {
        loadSavedThemes()
    }, [])

    return null;
}

export default ThemeCustomizer