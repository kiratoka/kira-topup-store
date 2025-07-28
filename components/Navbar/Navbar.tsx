"use client";
import { motion } from "framer-motion";
import React, { useState, useEffect, useRef } from "react";
import { Home, User, Mail, Settings, Menu, BookOpen, X } from "lucide-react";
import Link from "next/link";

const Navbar = ({ children }: { children: React.ReactNode }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const navRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 640); // sm breakpoint
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

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

    const mobileMenuVariants = {
        open: { 
            opacity: 1, 
            y: 0,
            transition: { 
                type: "spring", 
                stiffness: 300, 
                damping: 24 
            }
        },
        closed: { 
            opacity: 0, 
            y: -20,
            transition: { 
                duration: 0.2 
            }
        }
    };

    const menuItems = [
        { icon: <Home className="w-5 h-5" />, text: "Home", link: "/" },
        { icon: <BookOpen className="w-5 h-5" />, text: "Blog", link: "/blog" },
        { icon: <User className="w-5 h-5" />, text: "Profile", link: "/" },
        { icon: <Mail className="w-5 h-5" />, text: "Messages", link: "/" },
        { icon: <Settings className="w-5 h-5" />, text: "Settings", link: "/" },
    ];

    // Mobile Layout
    if (isMobile) {
        return (
            <div className="min-h-screen">
                {/* Mobile Top Header */}
                <header className="sticky top-0 left-0 right-0 z-50 bg-gray-900 border-b border-gray-700 px-4 py-3">
                    <div className="flex items-center justify-between">
                        <Link href="/">
                        <h1 className="text-gray-300 font-bold text-xl">
                            Kira<span className="text-cyan-500">TopUp</span>
                        </h1>
                        </Link>
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
                        >
                            {isOpen ? (
                                <X className="w-6 h-6 text-gray-300" />
                            ) : (
                                <Menu className="w-6 h-6 text-gray-300" />
                            )}
                        </button>
                    </div>

                    {/* Mobile Dropdown Menu */}
                    <motion.div
                        initial="closed"
                        animate={isOpen ? "open" : "closed"}
                        variants={mobileMenuVariants}
                        className={`${isOpen ? 'block' : 'hidden'} mt-4`}
                    >
                        <nav className="bg-gray-800 rounded-lg shadow-lg border border-gray-700">
                            {menuItems.map((item, index) => (
                                <Link href={item.link} key={index} onClick={() => setIsOpen(false)}>
                                    <motion.div
                                        whileTap={{ scale: 0.98 }}
                                        className="flex items-center gap-4 p-4 text-gray-300 hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg border-b border-gray-700 last:border-b-0 transition-colors"
                                    >
                                        <span className="text-cyan-400">{item.icon}</span>
                                        <span className="font-medium">{item.text}</span>
                                    </motion.div>
                                </Link>
                            ))}
                        </nav>
                    </motion.div>
                </header>

                {/* Mobile Bottom Navigation Alternative */}
                <nav className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-700 px-2 py-2">
                    <div className="flex justify-around items-center">
                        {menuItems.slice(0, 4).map((item, index) => (
                            <Link href={item.link} key={index}>
                                <motion.div
                                    whileTap={{ scale: 0.9 }}
                                    className="flex flex-col items-center gap-1 p-2 rounded-lg text-gray-400 hover:text-cyan-400 transition-colors"
                                >
                                    {item.icon}
                                    <span className="text-xs font-medium">{item.text}</span>
                                </motion.div>
                            </Link>
                        ))}
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="flex flex-col items-center gap-1 p-2 rounded-lg text-gray-400 hover:text-cyan-400 transition-colors"
                        >
                            <Menu className="w-5 h-5" />
                            <span className="text-xs font-medium">More</span>
                        </button>
                    </div>
                </nav>

                {/* Mobile Content */}
                <main>
                    {children}
                </main>
            </div>
        );
    }

    // Desktop Layout (Original)
    return (
        <div className="flex min-h-screen">
            {/* Desktop Sidebar */}
            <motion.div
                ref={navRef}
                initial={{ width: 72 }}
                animate={isOpen ? "open" : "closed"}
                variants={variants}
                className="h-screen bg-gray-900 shadow-xl p-4 flex-col z-50 border-r border-gray-700 sticky top-0"
                style={{ overflow: "hidden" }}
            >
                {/* Toggle Button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsOpen(!isOpen);
                    }}
                    className="z-20 p-2 bg-gray-900 rounded-lg flex items-center justify-between w-full hover:bg-gray-800 transition-colors"
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
                    {menuItems.map((item, index) => (
                        <Link href={item.link} key={index}>
                            <motion.div
                                whileHover={{
                                    scale: 1.05,
                                    backgroundColor: "rgba(31, 41, 55, 0.5)",
                                }}
                                whileTap={{ scale: 0.95 }}
                                className="flex items-center gap-4 p-2 rounded-lg cursor-pointer transition-colors"
                            >
                                <span className="text-gray-300">{item.icon}</span>
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

            {/* Desktop Content */}
            <div className="flex-1">
                {children}
            </div>
        </div>
    );
};

export default Navbar;