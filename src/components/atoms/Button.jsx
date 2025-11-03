import React from 'react';

const Button = ({ children, className = '', type = 'button', disabled = false, ...props }) => {
    const base = 'btn btn-primary';
    return (
        <button
            type={type}
            disabled={disabled}
            className={`${base} ${className}`.trim()}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;