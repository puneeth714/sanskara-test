
import React from 'react';
import { Vendor } from '../types';
import { MapPinIcon } from './icons';

interface VendorCardProps {
  vendor: Vendor;
}

const VendorCard: React.FC<VendorCardProps> = ({ vendor }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden max-w-sm border border-orange-100">
      <img src={vendor.image || 'https://picsum.photos/400/250'} alt={vendor.name} className="w-full h-48 object-cover" />
      <div className="p-4">
        <h3 className="text-xl font-bold text-orange-800">{vendor.name}</h3>
        <p className="text-sm text-gray-500 mb-2">{vendor.type}</p>
        <div className="flex items-center justify-between text-sm mb-3">
          <span className="bg-yellow-400 text-yellow-900 font-semibold px-2 py-0.5 rounded-full">{vendor.rating} ★</span>
          <a
            href={vendor.map_link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors"
          >
            <MapPinIcon />
            View on Map
          </a>
        </div>
        <p className="text-gray-700 text-sm mb-3">{vendor.notes}</p>
        <p className="text-gray-600 text-xs">Contact: {vendor.contact}</p>
      </div>
    </div>
  );
};

export default VendorCard;
