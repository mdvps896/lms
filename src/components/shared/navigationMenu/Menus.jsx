'use client'
import React, { Fragment, useEffect, useState } from "react";
import { FiChevronRight, FiLogOut } from "react-icons/fi";
import { menuList } from "@/utils/fackData/menuList";
import getIcon from "@/utils/getIcon";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import Swal from "sweetalert2";

const Menus = () => {
    const [openDropdown, setOpenDropdown] = useState(null);
    const [openSubDropdown, setOpenSubDropdown] = useState(null);
    const [activeParent, setActiveParent] = useState("");
    const [activeChild, setActiveChild] = useState("");
    const [showQuestionModal, setShowQuestionModal] = useState(false);
    const pathName = usePathname();
    const { user, logout } = useAuth();

    const handleLogout = () => {
        Swal.fire({
            title: 'Logout',
            text: 'Are you sure you want to logout?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, logout'
        }).then((result) => {
            if (result.isConfirmed) {
                logout();
            }
        });
    };

    const handleMainMenu = (e, name, hasDropdown) => {
        e.preventDefault();
        e.stopPropagation();

        if (hasDropdown) {
            if (openDropdown === name) {
                setOpenDropdown(null);
            } else {
                setOpenDropdown(name);
            }
        }
    };

    const handleDropdownMenu = (e, name) => {
        e.stopPropagation();
        if (openSubDropdown === name) {
            setOpenSubDropdown(null);
        } else {
            setOpenSubDropdown(name);
        }
    };

    useEffect(() => {
        if (pathName !== "/") {
            const x = pathName.split("/");
            const parent = x[1];
            const child = x[2];

            setActiveParent(parent);
            setActiveChild(child);

            // Check if current path belongs to a submenu and keep parent dropdown open
            let shouldOpenDropdown = null;
            menuList.forEach(item => {
                if (item.dropdownMenu && item.dropdownMenu.length > 0) {
                    const isSubMenuActive = item.dropdownMenu.some(
                        subItem => {
                            const subPath = subItem.path.replace('/', '');
                            return pathName.includes(subPath) || parent === subPath;
                        }
                    );
                    if (isSubMenuActive) {
                        shouldOpenDropdown = item.name.split(' ')[0];
                    }
                }
            });

            if (shouldOpenDropdown) {
                setOpenDropdown(shouldOpenDropdown);
            }
        } else {
            setActiveParent("dashboard");
        }
    }, [pathName]);

    // Filter menu items based on user role
    const filteredMenuList = menuList.filter(item => {
        if (!user || !user.role) return false;

        // For students, only show Dashboard
        if (user.role === 'student') {
            return item.name === 'Dashboard';
        }

        // For other roles, show all allowed menus
        return item.roles.includes(user.role);
    });

    return (
        <>
            {filteredMenuList.map(({ dropdownMenu, id, name, path, icon, showModal }) => {
                const hasDropdown = dropdownMenu && dropdownMenu.length > 0;
                // Use path segment for matching if available, otherwise fallback to name
                const menuName = (path && path.length > 1) ? path.split('/')[1] : name.split(' ')[0];

                return (
                    <Fragment key={id}>
                        <li
                            className={`nxl-item ${hasDropdown ? 'nxl-hasmenu' : ''} ${activeParent === menuName ? "active" : ""} ${openDropdown === menuName ? "active open" : ""}`}
                        >
                            {hasDropdown ? (
                                <a
                                    href="#"
                                    onClick={(e) => handleMainMenu(e, menuName, hasDropdown)}
                                    className="nxl-link text-capitalize"
                                >
                                    <span className="nxl-micon"> {getIcon(icon)} </span>
                                    <span className="nxl-mtext" style={{ paddingLeft: "2.5px" }}>
                                        {name}
                                    </span>
                                    <span className="nxl-arrow"><FiChevronRight /></span>
                                </a>
                            ) : showModal ? (
                                <a
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setShowQuestionModal(true);
                                    }}
                                    className="nxl-link text-capitalize"
                                >
                                    <span className="nxl-micon"> {getIcon(icon)} </span>
                                    <span className="nxl-mtext" style={{ paddingLeft: "2.5px" }}>
                                        {name}
                                    </span>
                                </a>
                            ) : (
                                <Link href={path} className="nxl-link text-capitalize">
                                    <span className="nxl-micon"> {getIcon(icon)} </span>
                                    <span className="nxl-mtext" style={{ paddingLeft: "2.5px" }}>
                                        {name}
                                    </span>
                                </Link>
                            )}

                            {hasDropdown && (
                                <ul className="nxl-submenu">
                                    {dropdownMenu.map((subItem) => (
                                        <li key={subItem.id} className={`nxl-item ${activeChild === subItem.name.split(' ').join('-') ? 'active' : ''}`}>
                                            <Link href={subItem.path} className="nxl-link text-capitalize">
                                                {subItem.name}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </li>
                    </Fragment>
                );
            })}

            {/* Question Modal */}
            {showQuestionModal && (
                <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setShowQuestionModal(false)}>
                    <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Questions</h5>
                                <button type="button" className="btn-close" onClick={() => setShowQuestionModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <div className="d-grid gap-3">
                                    <Link
                                        href="/question-groups"
                                        className="btn btn-primary btn-lg"
                                        onClick={() => setShowQuestionModal(false)}
                                    >
                                        <i className="feather-folder me-2"></i>
                                        Question Groups
                                    </Link>
                                    <Link
                                        href="/question-bank"
                                        className="btn btn-success btn-lg"
                                        onClick={() => setShowQuestionModal(false)}
                                    >
                                        <i className="feather-database me-2"></i>
                                        Question Bank
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Logout Menu Item */}
            <li className="nxl-item">
                <a
                    href="#"
                    onClick={(e) => {
                        e.preventDefault();
                        handleLogout();
                    }}
                    className="nxl-link text-capitalize"
                >
                    <span className="nxl-micon text-danger"> <FiLogOut /> </span>
                    <span className="nxl-mtext text-danger" style={{ paddingLeft: "2.5px" }}>
                        Logout
                    </span>
                </a>
            </li>
        </>
    );
};

export default Menus;
