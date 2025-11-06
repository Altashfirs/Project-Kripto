import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger';
}

const Button: React.FC<ButtonProps> = ({ children, className, variant = 'primary', ...props }) => {
    const baseStyle = "px-4 py-2 rounded-md font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200";
    
    const variantStyles = {
        primary: "bg-accent text-black hover:bg-accent/80 focus:ring-accent",
        secondary: "bg-secondary border border-border-color text-text-primary hover:bg-border-color focus:ring-accent",
        danger: "bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 focus:ring-red-500"
    };

    return (
        <button className={`${baseStyle} ${variantStyles[variant]} ${className}`} {...props}>
            {children}
        </button>
    );
};

export default Button;