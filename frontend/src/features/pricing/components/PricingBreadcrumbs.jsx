import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export default function PricingBreadcrumbs({ items = [] }) {
  return (
    <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
      <Link
        to="/pricing/tiers"
        className="flex items-center gap-1 hover:text-foreground transition-colors font-medium"
      >
        <Home className="w-3.5 h-3.5" />
        <span>Pricing</span>
      </Link>
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <React.Fragment key={idx}>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
            {item.href && !isLast ? (
              <Link
                to={item.href}
                className="hover:text-foreground transition-colors font-medium"
              >
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? 'text-foreground font-semibold' : ''}>
                {item.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
