import React from 'react';
import { useVerification } from '../contexts/VerificationContext';

const VerificationSummary: React.FC = () => {
  const { state } = useVerification();
  const business = state.businessVerification?.details;
  const tax = state.taxVerification?.details;
  const contact = state.contactVerification?.details;

  return (
    <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
      <h2 className="text-2xl font-bold mb-6">Business Profile Summary</h2>
      
      <div className="space-y-8">
        {/* Company Overview */}
        <div className="border-b pb-6">
          <h3 className="text-xl font-semibold mb-4">Company Overview</h3>
          <div className="grid grid-cols-1 gap-4 text-sm">
            <div>
              <p className="text-gray-600 font-medium">Business Name</p>
              <p>{business?.companyName}</p>
            </div>
            <div>
              <p className="text-gray-600 font-medium">Overview</p>
              <p>{business?.businessProfile?.overview}</p>
            </div>
            <div>
              <p className="text-gray-600 font-medium">Founding Story</p>
              <p>{business?.businessProfile?.foundingStory}</p>
            </div>
          </div>
        </div>

        {/* Business Operations */}
        <div className="border-b pb-6">
          <h3 className="text-xl font-semibold mb-4">Business Operations</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600 font-medium">Facility Size</p>
              <p>{business?.businessProfile?.facilitySize}</p>
            </div>
            <div>
              <p className="text-gray-600 font-medium">Production Capacity</p>
              <p>{business?.businessProfile?.productionCapacity}</p>
            </div>
            <div>
              <p className="text-gray-600 font-medium">Full-time Staff</p>
              <p>{business?.businessProfile?.employeeCount?.fullTime} employees</p>
            </div>
            <div>
              <p className="text-gray-600 font-medium">Seasonal Staff</p>
              <p>{business?.businessProfile?.employeeCount?.seasonal}</p>
            </div>
            <div>
              <p className="text-gray-600 font-medium">Annual Revenue</p>
              <p>{business?.businessProfile?.revenue}</p>
            </div>
          </div>
        </div>

        {/* Products */}
        <div className="border-b pb-6">
          <h3 className="text-xl font-semibold mb-4">Product Portfolio</h3>
          <div className="grid grid-cols-1 gap-4">
            {business?.businessProfile?.products.map((product, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded">
                <p className="font-medium">{product.name}</p>
                <p className="text-sm text-gray-600">{product.type}</p>
                <p className="text-sm mt-1">{product.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Market Presence */}
        <div className="border-b pb-6">
          <h3 className="text-xl font-semibold mb-4">Market Presence</h3>
          <div className="grid grid-cols-1 gap-4 text-sm">
            <div>
              <p className="text-gray-600 font-medium">Regions</p>
              <p>{business?.businessProfile?.marketPresence?.regions.join(', ')}</p>
            </div>
            <div>
              <p className="text-gray-600 font-medium">Distribution</p>
              <p>{business?.businessProfile?.marketPresence?.distribution}</p>
            </div>
          </div>
        </div>

        {/* Compliance & Certifications */}
        <div className="border-b pb-6">
          <h3 className="text-xl font-semibold mb-4">Compliance & Certifications</h3>
          <div className="grid grid-cols-1 gap-4 text-sm">
            <div>
              <p className="text-gray-600 font-medium">Tax Compliance Status</p>
              <div className="flex items-center mt-1">
                {tax?.compliant ? (
                  <span className="text-green-600 flex items-center">
                    <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Compliant
                  </span>
                ) : (
                  <span className="text-red-600">Non-Compliant</span>
                )}
              </div>
            </div>
            <div>
              <p className="text-gray-600 font-medium">VAT Status</p>
              <p>Registration: {tax?.vatNumber}</p>
            </div>
            <div>
              <p className="text-gray-600 font-medium">Business Certifications</p>
              <ul className="list-disc list-inside">
                {business?.businessProfile?.certifications.map((cert, index) => (
                  <li key={index}>{cert}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Digital Presence */}
        {contact?.digitalPresence && (
          <div>
            <h3 className="text-xl font-semibold mb-4">Digital Presence</h3>
            <div className="grid grid-cols-1 gap-4 text-sm">
              <div>
                <p className="text-gray-600 font-medium">Website</p>
                <p>{contact.digitalPresence.websiteDetails.url}</p>
              </div>
              <div>
                <p className="text-gray-600 font-medium">Business Listings</p>
                <div className="space-y-2 mt-1">
                  {contact.digitalPresence.businessListings.map((listing, index) => (
                    <div key={index} className="flex items-center">
                      <span className="font-medium">{listing.platform}</span>
                      {listing.rating && (
                        <span className="ml-2 text-yellow-500">★ {listing.rating}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-gray-600 font-medium">Industry Recognition</p>
                <div className="space-y-2 mt-1">
                  {contact.digitalPresence.awards.map((award, index) => (
                    <div key={index}>
                      <p className="font-medium">{award.name}</p>
                      <p className="text-sm text-gray-600">{award.year} - {award.category}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded">
        <h3 className="font-bold text-green-800 mb-2">Verification Complete</h3>
        <p className="text-sm text-green-700">
          All required verifications have been successfully completed. Based on the verified information,
          your business shows strong potential for export opportunities, particularly in the SADC region.
        </p>
      </div>
    </div>
  );
};

export default VerificationSummary; 