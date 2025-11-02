
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary';
}

const Button: React.FC<ButtonProps> = ({ children, className, variant = 'primary', ...props }) => {
    const baseStyle = "px-4 py-2 rounded-md font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200";
    
    const variantStyles = {
        primary: "bg-accent text-white hover:bg-blue-500 focus:ring-accent",
        secondary: "bg-secondary border border-border-color text-text-primary hover:bg-border-color focus:ring-accent"
    };

    return (
        <button className={`${baseStyle} ${variantStyles[variant]} ${className}`} {...props}>
            {children}
        </button>
    );
};

export default Button;
