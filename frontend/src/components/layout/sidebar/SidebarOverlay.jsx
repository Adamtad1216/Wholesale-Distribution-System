import React from 'react';

export default function SidebarOverlay({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-40 bg-card950 backdrop-blur-sm lg:hidden transition-opacity duration-300"
    />
  );
}
