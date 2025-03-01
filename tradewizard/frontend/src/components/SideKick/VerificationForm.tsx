import React, { useState, useEffect } from 'react';
import { Dashboard } from '../../services/sidekick';
import './VerificationForm.css';

interface VerificationFormProps {
  dashboard: Dashboard;
  onSubmit: (verifiedInfo: any) => void;
  isLoading: boolean;
}

const VerificationForm: React.FC<VerificationFormProps> = ({
  dashboard,
  onSubmit,
  isLoading,
}) => {
  // State for verified information
  const [verifiedInfo, setVerifiedInfo] = useState<any>({
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
  const [selectedMarket, setSelectedMarket] = useState<string>(
    Object.keys(dashboard.market_intelligence)[0] || ''
  );
  
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
  
  // Handle updating product information
  const updateProduct = (index: number, field: string, value: string) => {
    const updatedProducts = [...verifiedInfo.company_info.products];
    updatedProducts[index] = {
      ...updatedProducts[index],
      [field]: value,
    };
    
    updateCompanyInfo('products', updatedProducts);
  };
  
  // Handle adding a new product
  const addProduct = () => {
    const newProduct = {
      name: '',
      category: '',
      description: '',
    };
    
    updateCompanyInfo('products', [...verifiedInfo.company_info.products, newProduct]);
  };
  
  // Handle removing a product
  const removeProduct = (index: number) => {
    const updatedProducts = [...verifiedInfo.company_info.products];
    updatedProducts.splice(index, 1);
    
    updateCompanyInfo('products', updatedProducts);
  };
  
  // Handle updating capabilities
  const updateCapability = (field: string, value: any) => {
    setVerifiedInfo({
      ...verifiedInfo,
      company_info: {
        ...verifiedInfo.company_info,
        capabilities: {
          ...verifiedInfo.company_info.capabilities,
          [field]: value,
        },
      },
    });
  };
  
  // Handle updating market intelligence
  const updateMarketIntelligence = (market: string, field: string, value: any) => {
    setVerifiedInfo({
      ...verifiedInfo,
      market_intelligence: {
        ...verifiedInfo.market_intelligence,
        [market]: {
          ...verifiedInfo.market_intelligence[market],
          [field]: value,
        },
      },
    });
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(verifiedInfo);
  };
  
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
                value={verifiedInfo.company_info.company_name}
                onChange={(e) => updateCompanyInfo('company_name', e.target.value)}
                disabled={isLoading}
              />
            ) : (
              <div className="field-value">{verifiedInfo.company_info.company_name}</div>
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
                {verifiedInfo.company_info.products.map((product: any, index: number) => (
                  <div key={index} className="product-edit-row">
                    <div className="product-edit-fields">
                      <input
                        type="text"
                        placeholder="Product Name"
                        value={product.name}
                        onChange={(e) => updateProduct(index, 'name', e.target.value)}
                        disabled={isLoading}
                      />
                      <input
                        type="text"
                        placeholder="Category"
                        value={product.category}
                        onChange={(e) => updateProduct(index, 'category', e.target.value)}
                        disabled={isLoading}
                      />
                      <input
                        type="text"
                        placeholder="Description"
                        value={product.description}
                        onChange={(e) => updateProduct(index, 'description', e.target.value)}
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
                  {verifiedInfo.company_info.products.map((product: any, index: number) => (
                    <li key={index}>
                      <strong>{product.name}</strong>
                      {product.category && <span> ({product.category})</span>}
                      {product.description && <span> - {product.description}</span>}
                    </li>
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
                <div className="capability-edit-row">
                  <label>Production Capacity</label>
                  <input
                    type="text"
                    value={verifiedInfo.company_info.capabilities.production_capacity || ''}
                    onChange={(e) => updateCapability('production_capacity', e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                
                <div className="capability-edit-row">
                  <label>Certifications</label>
                  <input
                    type="text"
                    value={(verifiedInfo.company_info.capabilities.certifications || []).join(', ')}
                    onChange={(e) =>
                      updateCapability(
                        'certifications',
                        e.target.value.split(',').map((item) => item.trim())
                      )
                    }
                    placeholder="Comma-separated list"
                    disabled={isLoading}
                  />
                </div>
                
                <div className="capability-edit-row">
                  <label>Current Markets</label>
                  <input
                    type="text"
                    value={(verifiedInfo.company_info.capabilities.current_markets || []).join(', ')}
                    onChange={(e) =>
                      updateCapability(
                        'current_markets',
                        e.target.value.split(',').map((item) => item.trim())
                      )
                    }
                    placeholder="Comma-separated list"
                    disabled={isLoading}
                  />
                </div>
                
                <div className="capability-edit-row">
                  <label>Current Retailers</label>
                  <input
                    type="text"
                    value={(verifiedInfo.company_info.capabilities.current_retailers || []).join(', ')}
                    onChange={(e) =>
                      updateCapability(
                        'current_retailers',
                        e.target.value.split(',').map((item) => item.trim())
                      )
                    }
                    placeholder="Comma-separated list"
                    disabled={isLoading}
                  />
                </div>
              </div>
            ) : (
              <div className="field-value">
                <ul className="capabilities-list">
                  {verifiedInfo.company_info.capabilities.production_capacity && (
                    <li>
                      <strong>Production Capacity:</strong>{' '}
                      {verifiedInfo.company_info.capabilities.production_capacity}
                    </li>
                  )}
                  
                  {verifiedInfo.company_info.capabilities.certifications && (
                    <li>
                      <strong>Certifications:</strong>{' '}
                      {verifiedInfo.company_info.capabilities.certifications.join(', ')}
                    </li>
                  )}
                  
                  {verifiedInfo.company_info.capabilities.current_markets && (
                    <li>
                      <strong>Current Markets:</strong>{' '}
                      {verifiedInfo.company_info.capabilities.current_markets.join(', ')}
                    </li>
                  )}
                  
                  {verifiedInfo.company_info.capabilities.current_retailers && (
                    <li>
                      <strong>Current Retailers:</strong>{' '}
                      {verifiedInfo.company_info.capabilities.current_retailers.join(', ')}
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
        
        <div className="verification-section">
          <h3>Market Intelligence</h3>
          
          <div className="market-selector">
            {Object.keys(verifiedInfo.market_intelligence).map((market) => (
              <button
                key={market}
                type="button"
                className={`market-button ${selectedMarket === market ? 'active' : ''}`}
                onClick={() => setSelectedMarket(market)}
              >
                {market}
              </button>
            ))}
          </div>
          
          {selectedMarket && verifiedInfo.market_intelligence[selectedMarket] && (
            <div className="market-verification">
              <p className="market-note">
                Note: For this POC, market intelligence and regulatory requirements are read-only.
                In a full implementation, these would be editable like the company information.
              </p>
              
              <div className="market-info-display">
                <h4>{verifiedInfo.market_intelligence[selectedMarket].country}</h4>
                <p>{verifiedInfo.market_intelligence[selectedMarket].market_overview}</p>
                
                <div className="market-detail">
                  <strong>Distribution Channels:</strong>
                  <ul>
                    {verifiedInfo.market_intelligence[selectedMarket].distribution_channels.map(
                      (channel: string, index: number) => (
                        <li key={index}>{channel}</li>
                      )
                    )}
                  </ul>
                </div>
                
                <div className="market-detail">
                  <strong>Consumer Preferences:</strong>
                  <ul>
                    {verifiedInfo.market_intelligence[selectedMarket].consumer_preferences.map(
                      (preference: string, index: number) => (
                        <li key={index}>{preference}</li>
                      )
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="verification-section">
          <h3>Regulatory Requirements</h3>
          
          <div className="market-selector">
            {Object.keys(verifiedInfo.regulatory_requirements).map((market) => (
              <button
                key={market}
                type="button"
                className={`market-button ${selectedMarket === market ? 'active' : ''}`}
                onClick={() => setSelectedMarket(market)}
              >
                {market}
              </button>
            ))}
          </div>
          
          {selectedMarket && verifiedInfo.regulatory_requirements[selectedMarket] && (
            <div className="regulatory-verification">
              <div className="regulatory-info-display">
                <h4>
                  {verifiedInfo.regulatory_requirements[selectedMarket].country} -{' '}
                  {verifiedInfo.regulatory_requirements[selectedMarket].product_category}
                </h4>
                
                <div className="regulatory-detail">
                  <strong>Documentation Requirements:</strong>
                  <ul>
                    {verifiedInfo.regulatory_requirements[selectedMarket].documentation_requirements.map(
                      (doc: any, index: number) => (
                        <li key={index}>
                          <strong>{doc.document}</strong> - {doc.description}
                        </li>
                      )
                    )}
                  </ul>
                </div>
                
                <div className="regulatory-detail">
                  <strong>Labeling Requirements:</strong>
                  <ul>
                    {verifiedInfo.regulatory_requirements[selectedMarket].labeling_requirements.map(
                      (requirement: string, index: number) => (
                        <li key={index}>{requirement}</li>
                      )
                    )}
                  </ul>
                </div>
                
                <div className="regulatory-detail">
                  <strong>Import Procedures:</strong>
                  <ol>
                    {verifiedInfo.regulatory_requirements[selectedMarket].import_procedures.map(
                      (procedure: string, index: number) => (
                        <li key={index}>{procedure}</li>
                      )
                    )}
                  </ol>
                </div>
              </div>
            </div>
          )}
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