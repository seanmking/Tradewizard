import React, { useState, useEffect } from 'react';
import { SimplifiedDashboard, SimplifiedMarket } from '../../services/simplifiedSidekick';
import './VerificationForm.css';

interface VerificationFormProps {
  dashboard: SimplifiedDashboard;
  onSubmit: (verifiedInfo: SimplifiedDashboard) => void;
  isLoading: boolean;
}

const VerificationForm: React.FC<VerificationFormProps> = ({
  dashboard,
  onSubmit,
  isLoading,
}) => {
  // State for verified information
  const [verifiedInfo, setVerifiedInfo] = useState<SimplifiedDashboard>({
    company_info: { ...dashboard.company_info },
    market_intelligence: { ...dashboard.market_intelligence },
    regulatory_requirements: { ...dashboard.regulatory_requirements },
  });
  
  // State for tracking which sections are being edited
  const [editingSections, setEditingSections] = useState<Record<string, boolean>>({
    company_name: false,
    business_type: false,
    products: false,
    capabilities: false,
  });
  
  // State for tracking which market is being viewed/edited
  const [selectedMarketIndex, setSelectedMarketIndex] = useState<number>(0);
  
  // Handle toggling edit mode for a section
  const toggleEditSection = (section: string) => {
    setEditingSections({
      ...editingSections,
      [section]: !editingSections[section],
    });
  };
  
  // Handle updating company information
  const updateCompanyInfo = (field: string, value: any) => {
    setVerifiedInfo({
      ...verifiedInfo,
      company_info: {
        ...verifiedInfo.company_info,
        [field]: value,
      },
    });
  };
  
  // Handle updating product
  const updateProduct = (index: number, value: string) => {
    const updatedProducts = [...verifiedInfo.company_info.products];
    updatedProducts[index] = value;
    
    updateCompanyInfo('products', updatedProducts);
  };
  
  // Handle adding a new product
  const addProduct = () => {
    updateCompanyInfo('products', [...verifiedInfo.company_info.products, '']);
  };
  
  // Handle removing a product
  const removeProduct = (index: number) => {
    const updatedProducts = [...verifiedInfo.company_info.products];
    updatedProducts.splice(index, 1);
    
    updateCompanyInfo('products', updatedProducts);
  };
  
  // Handle updating capability
  const updateCapability = (index: number, value: string) => {
    const updatedCapabilities = [...verifiedInfo.company_info.capabilities];
    updatedCapabilities[index] = value;
    
    updateCompanyInfo('capabilities', updatedCapabilities);
  };
  
  // Handle adding a new capability
  const addCapability = () => {
    updateCompanyInfo('capabilities', [...verifiedInfo.company_info.capabilities, '']);
  };
  
  // Handle removing a capability
  const removeCapability = (index: number) => {
    const updatedCapabilities = [...verifiedInfo.company_info.capabilities];
    updatedCapabilities.splice(index, 1);
    
    updateCompanyInfo('capabilities', updatedCapabilities);
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(verifiedInfo);
  };
  
  // Get the selected market
  const selectedMarket = verifiedInfo.market_intelligence.potential_markets[selectedMarketIndex];
  
  return (
    <div className="verification-form">
      <h2>Verify Your Information</h2>
      <p className="form-description">
        Please review and correct the information we've gathered about your business and export opportunities.
      </p>
      
      <form onSubmit={handleSubmit}>
        <div className="verification-section">
          <h3>Business Information</h3>
          
          {/* Company Name */}
          <div className="verification-field">
            <div className="field-header">
              <label>Company Name</label>
              <button
                type="button"
                className="edit-button"
                onClick={() => toggleEditSection('company_name')}
              >
                {editingSections.company_name ? 'Done' : 'Edit'}
              </button>
            </div>
            
            {editingSections.company_name ? (
              <input
                type="text"
                value={verifiedInfo.company_info.name}
                onChange={(e) => updateCompanyInfo('name', e.target.value)}
                disabled={isLoading}
              />
            ) : (
              <div className="field-value">{verifiedInfo.company_info.name}</div>
            )}
          </div>
          
          {/* Business Type */}
          <div className="verification-field">
            <div className="field-header">
              <label>Business Type</label>
              <button
                type="button"
                className="edit-button"
                onClick={() => toggleEditSection('business_type')}
              >
                {editingSections.business_type ? 'Done' : 'Edit'}
              </button>
            </div>
            
            {editingSections.business_type ? (
              <input
                type="text"
                value={verifiedInfo.company_info.business_type}
                onChange={(e) => updateCompanyInfo('business_type', e.target.value)}
                disabled={isLoading}
              />
            ) : (
              <div className="field-value">{verifiedInfo.company_info.business_type}</div>
            )}
          </div>
          
          {/* Products */}
          <div className="verification-field">
            <div className="field-header">
              <label>Products</label>
              <button
                type="button"
                className="edit-button"
                onClick={() => toggleEditSection('products')}
              >
                {editingSections.products ? 'Done' : 'Edit'}
              </button>
            </div>
            
            {editingSections.products ? (
              <div className="products-editor">
                {verifiedInfo.company_info.products.map((product, index) => (
                  <div key={index} className="product-edit-row">
                    <div className="product-edit-fields">
                      <input
                        type="text"
                        placeholder="Product"
                        value={product}
                        onChange={(e) => updateProduct(index, e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                    <button
                      type="button"
                      className="remove-button"
                      onClick={() => removeProduct(index)}
                      disabled={isLoading}
                    >
                      ×
                    </button>
                  </div>
                ))}
                
                <button
                  type="button"
                  className="add-button"
                  onClick={addProduct}
                  disabled={isLoading}
                >
                  + Add Product
                </button>
              </div>
            ) : (
              <div className="field-value">
                <ul className="product-list">
                  {verifiedInfo.company_info.products.map((product, index) => (
                    <li key={index}>{product}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          {/* Capabilities */}
          <div className="verification-field">
            <div className="field-header">
              <label>Capabilities</label>
              <button
                type="button"
                className="edit-button"
                onClick={() => toggleEditSection('capabilities')}
              >
                {editingSections.capabilities ? 'Done' : 'Edit'}
              </button>
            </div>
            
            {editingSections.capabilities ? (
              <div className="capabilities-editor">
                {verifiedInfo.company_info.capabilities.map((capability, index) => (
                  <div key={index} className="capability-edit-row">
                    <input
                      type="text"
                      value={capability}
                      onChange={(e) => updateCapability(index, e.target.value)}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      className="remove-button"
                      onClick={() => removeCapability(index)}
                      disabled={isLoading}
                    >
                      ×
                    </button>
                  </div>
                ))}
                
                <button
                  type="button"
                  className="add-button"
                  onClick={addCapability}
                  disabled={isLoading}
                >
                  + Add Capability
                </button>
              </div>
            ) : (
              <div className="field-value">
                <ul className="capabilities-list">
                  {verifiedInfo.company_info.capabilities.map((capability, index) => (
                    <li key={index}>{capability}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        
        <div className="verification-section">
          <h3>Market Intelligence</h3>
          
          <div className="market-selector">
            {verifiedInfo.market_intelligence.potential_markets.map((market, index) => (
              <button
                key={market.name}
                type="button"
                className={`market-button ${selectedMarketIndex === index ? 'active' : ''}`}
                onClick={() => setSelectedMarketIndex(index)}
              >
                {market.name}
              </button>
            ))}
          </div>
          
          {selectedMarket && (
            <div className="market-verification">
              <p className="market-note">
                Note: For this POC, market intelligence and regulatory requirements are read-only.
                In a full implementation, these would be editable like the company information.
              </p>
              
              <div className="market-info-display">
                <h4>{selectedMarket.name}</h4>
                
                <div className="market-detail">
                  <strong>Market Size:</strong> {selectedMarket.market_size}
                </div>
                
                <div className="market-detail">
                  <strong>Growth Rate:</strong> {selectedMarket.growth_rate}
                </div>
                
                <div className="market-detail">
                  <strong>Competitors:</strong>
                  <ul>
                    {selectedMarket.competitors.map((competitor, index) => (
                      <li key={index}>
                        <strong>{competitor.name}</strong> - Market Share: {competitor.market_share}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="verification-section">
          <h3>Regulatory Requirements</h3>
          
          <div className="regulatory-verification">
            <div className="regulatory-info-display">
              <div className="regulatory-detail">
                <strong>Certifications:</strong>
                <ul>
                  {verifiedInfo.regulatory_requirements.certifications.map((cert, index) => (
                    <li key={index}>{cert}</li>
                  ))}
                </ul>
              </div>
              
              <div className="regulatory-detail">
                <strong>Import Duties:</strong>
                <p>{verifiedInfo.regulatory_requirements.import_duties}</p>
              </div>
              
              <div className="regulatory-detail">
                <strong>Documentation:</strong>
                <ul>
                  {verifiedInfo.regulatory_requirements.documentation.map((doc, index) => (
                    <li key={index}>{doc}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        <div className="form-actions">
          <button
            type="submit"
            className="primary-button"
            disabled={isLoading}
          >
            {isLoading ? 'Submitting...' : 'Submit Verified Information'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VerificationForm; 