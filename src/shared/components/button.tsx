// src/components/Button.tsx
import React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "danger";
    size?: "sm" | "md" | "lg";
};

const variantClasses = {
    primary:
        "bg-[#007AFF] hover:bg-[#0A84FF] text-white shadow-[0_10px_24px_rgba(0,122,255,0.28)] dark:shadow-[0_10px_24px_rgba(10,132,255,0.28)]",
    secondary:
        "bg-white/80 hover:bg-white text-slate-800 shadow-[0_8px_20px_rgba(0,0,0,0.08)] dark:bg-zinc-800 dark:text-slate-100",
    danger:
        "bg-[#FF3B30] hover:bg-[#FF453A] text-white shadow-[0_10px_24px_rgba(255,59,48,0.28)] dark:shadow-[0_10px_24px_rgba(255,69,58,0.28)]",
};

const sizeClasses = {
    sm: "h-9 px-4 text-sm",
    md: "h-10 px-5 text-base",
    lg: "h-12 px-6 text-base",
};

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = "primary",
    size = "md",
    className = "",
    ...props
}) => {
    const baseClasses =
        "rounded-2xl font-semibold tracking-tight transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:ring-offset-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

    return (
        <button
            {...props}
            className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        >
            {children}
        </button>
    );
};
