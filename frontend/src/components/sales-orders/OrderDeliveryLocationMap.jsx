import React, { useState } from 'react';
import { format, isValid } from 'date-fns';
import { MapPin, ExternalLink, Calendar, Navigation, Building2, CheckCircle2, RefreshCw } from 'lucide-react';
import ErrorBoundary from '../common/ErrorBoundary';

function OrderDeliveryLocationMapInner({ order, className = '', height = '320px' }) {
  const [mapType, setMapType] = useState('m'); // 'm' for roadmap, 'k' for satellite

  if (!order) return null;

  const latNum = order.deliveryLatitude != null ? Number(order.deliveryLatitude) : null;
  const lngNum = order.deliveryLongitude != null ? Number(order.deliveryLongitude) : null;

  const hasCoordinates =
    latNum !== null &&
    lngNum !== null &&
    !isNaN(latNum) &&
    !isNaN(lngNum) &&
    (latNum !== 0 || lngNum !== 0);

  // Default to Addis Ababa central coordinates if none provided
  const lat = hasCoordinates ? latNum : 9.010793;
  const lng = hasCoordinates ? lngNum : 38.761252;

  const addressText =
    order.deliveryAddressText ||
    order.deliveryAddress?.address ||
    order.customer?.addresses?.[0]?.address ||
    (hasCoordinates ? `Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}` : 'Addis Ababa, Ethiopia');

  const customerName =
    order.customer?.organization?.name ||
    order.customer?.companyName ||
    order.customer?.businessName ||
    (order.customer?.person
      ? `${order.customer.person.firstName} ${order.customer.person.lastName || ''}`.trim()
      : 'Wholesale Customer');

  // Google Maps URLs
  const googleMapsUrl = hasCoordinates
    ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressText)}`;

  // Embedded Google Map URL using clean iframe (no API key required, 100% crash-free)
  const embedUrl = `https://maps.google.com/maps?q=${lat},${lng}&t=${mapType}&z=15&ie=UTF8&iwloc=&output=embed`;

  // Safely format required date
  let formattedRequiredDate = null;
  if (order.requiredDate) {
    try {
      const d = new Date(order.requiredDate);
      if (isValid(d)) {
        formattedRequiredDate = format(d, 'MMM d, yyyy');
      }
    } catch {
      formattedRequiredDate = null;
    }
  }

  return (
    <div className={`rounded-2xl border border-border bg-card shadow-sm overflow-hidden flex flex-col ${className}`}>
      {/* Header Bar */}
      <div className="p-4 border-b border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-secondary/30">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
            <MapPin className="w-4 h-4 text-rose-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                Customer Delivery Destination
              </h3>
              {hasCoordinates && (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3" />
                  GPS Pinpoint
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-md" title={addressText}>
              {addressText}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Map Layer Switcher (Roadmap vs Satellite) */}
          <div className="flex items-center bg-secondary rounded-lg p-0.5 border border-border text-[10px] font-semibold">
            <button
              type="button"
              onClick={() => setMapType('m')}
              className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                mapType === 'm' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Map
            </button>
            <button
              type="button"
              onClick={() => setMapType('k')}
              className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                mapType === 'k' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Satellite
            </button>
          </div>

          {formattedRequiredDate && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/25">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              Target: {formattedRequiredDate}
            </span>
          )}

          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-primary/15 hover:bg-primary/25 text-primary border border-primary/30 transition-all shadow-sm cursor-pointer"
            title="Open delivery location directly in Google Maps"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Open in Google Maps</span>
            <ExternalLink className="w-3 h-3 opacity-70" />
          </a>
        </div>
      </div>

      {/* Embedded Google Map Area */}
      <div className="relative w-full overflow-hidden bg-slate-950" style={{ height }}>
        <iframe
          title={`Google Map - ${customerName}`}
          src={embedUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="w-full h-full opacity-90 hover:opacity-100 transition-opacity"
        />

        {/* Floating coordinates badge */}
        {hasCoordinates && (
          <div className="absolute bottom-2 left-2 z-10 bg-background/90 backdrop-blur-md px-2.5 py-1 rounded-md border border-border shadow-sm text-[10px] font-mono text-foreground pointer-events-none">
            GPS: {lat.toFixed(6)}, {lng.toFixed(6)}
          </div>
        )}
      </div>

      {/* Footer Info Bar */}
      <div className="px-4 py-2.5 bg-secondary/20 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-muted-foreground gap-2">
        <div className="flex items-center gap-2 truncate">
          <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="font-semibold text-foreground truncate">{customerName}</span>
          <span>•</span>
          <span className="truncate">{addressText}</span>
        </div>

        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline font-semibold flex items-center gap-1 shrink-0"
        >
          View Route & Directions in Google Maps ↗
        </a>
      </div>
    </div>
  );
}

/**
 * Wrapped in an ErrorBoundary so that even in the most catastrophic scenario,
 * the map component will never crash the surrounding page or produce a white screen.
 */
export default function OrderDeliveryLocationMap(props) {
  return (
    <ErrorBoundary compact={true}>
      <OrderDeliveryLocationMapInner {...props} />
    </ErrorBoundary>
  );
}
