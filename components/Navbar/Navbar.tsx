"use client";
import { motion } from "framer-motion";
import React, { useState, useEffect, useRef } from "react";
import { Home, User, Mail, Settings, Menu, BookOpen } from "lucide-react";
import Link from "next/link";


const Navbar = ({ children }: { children: React.ReactNode }) => {
    const [isOpen, setIsOpen] = useState(false);
    const navRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (navRef.current && !navRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    const variants = {
        open: { width: 240 },
        closed: { width: 72 },
    };

    const itemVariants = {
        open: { opacity: 1, x: 0, transition: { delay: 0.2 } },
        closed: { opacity: 0, x: -20 },
    };

    return (
        <div className="flex min-h-screen">
            {/* Sidebar */}
            <motion.div
                ref={navRef}
                initial={{ width: 72 }}
                animate={isOpen ? "open" : "closed"}
                variants={variants}
                className={`h-screen bg-gray-900 shadow-xl p-4 flex-col z-50 border-r border-gray-700 
                    fixed lg:sticky top-0 
                    ${isOpen ? 'left-0' : '-left-0'}
                    w-[72px] lg:w-[240px]`}
                style={{ overflow: "hidden" }}
            >
                {/* Toggle Button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsOpen(!isOpen);
                    }}
                    className="z-20 p-2 bg-gray-900 rounded-lg flex items-center justify-between w-full"
                >
                    <div className="flex items-center gap-4">
                        <Menu className="w-6 h-6 text-gray-300" />
                        <motion.div
                            variants={itemVariants}
                            initial="closed"
                            animate={isOpen ? "open" : "closed"}
                            className="flex items-center"
                        >
                            <h1 className="text-gray-300 font-bold text-xl whitespace-nowrap">
                                Kira<span className="text-cyan-500">TopUp</span>
                            </h1>
                        </motion.div>
                    </div>
                </button>

                <div className="space-y-4 mt-14">
                    {[
                        { icon: <Home className="w-5 h-5 text-gray-300" />, text: "Home", link: "/" },
                        { icon: <BookOpen className="w-5 h-5 text-gray-300" />, text: "Blog", link: "/blog" },
                        { icon: <User className="w-5 h-5 text-gray-300" />, text: "Profile", link: "/" },
                        { icon: <Mail className="w-5 h-5 text-gray-300" />, text: "Messages", link: "/" },
                        { icon: <Settings className="w-5 h-5 text-gray-300" />, text: "Settings", link: "/" },
                    ].map((item, index) => (
                        <Link href={item.link} key={index}>
                            <motion.div
                                whileHover={{
                                    scale: 1.05,
                                    backgroundColor: "rgba(31, 41, 55, 0.5)",
                                }}
                                whileTap={{ scale: 0.95 }}
                                className="flex items-center gap-4 p-2 rounded-lg cursor-pointer"
                            >
                                <span>{item.icon}</span>
                                <motion.span
                                    variants={itemVariants}
                                    className="text-gray-300 whitespace-nowrap font-medium"
                                >
                                    {item.text}
                                </motion.span>
                            </motion.div>
                        </Link>
                    ))}
                </div>
            </motion.div>

            {/* Overlay untuk Mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Konten Utama */}
            <div className="flex-1 pl-[72px] lg:pl-0">
                {children}
            </div>
        </div>
    );
};

export default Navbar;