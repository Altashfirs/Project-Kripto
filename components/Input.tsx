
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    id: string;
}

const Input: React.FC<InputProps> = ({ label, id, className, ...props }) => {
    const baseStyle = "w-full px-3 py-2 bg-primary border border-border-color rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent text-text-primary placeholder-text-secondary";
    return (
        <div>
            {label && <label htmlFor={id} className="block text-sm font-medium text-text-secondary mb-1">{label}</label>}
            <input id={id} className={`${baseStyle} ${className}`} {...props} />
        </div>
    );
};

export default Input;
