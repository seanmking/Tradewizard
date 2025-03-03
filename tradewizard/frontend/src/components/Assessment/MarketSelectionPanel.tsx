import React, { useState, useEffect, useRef } from 'react';
import { MarketOption } from '../../services/assessment-api';
import './MarketSelectionPanel.css';

interface MarketSelectionPanelProps {
  markets: MarketOption[];
  onSubmit: (selectedMarkets: string[]) => void;
  isLoading: boolean;
}

const MarketSelectionPanel: React.FC<MarketSelectionPanelProps> = ({ 
  markets, 
  onSubmit,
  isLoading
}) => {
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([]);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const marketsGridRef = useRef<HTMLDivElement>(null);
  
  // Check if scrolling is needed
  useEffect(() => {
    const checkScrollable = () => {
      if (marketsGridRef.current) {
        const { scrollHeight, clientHeight } = marketsGridRef.current;
        setShowScrollIndicator(scrollHeight > clientHeight);
      }
    };
    
    checkScrollable();
    window.addEventListener('resize', checkScrollable);
    
    return () => {
      window.removeEventListener('resize', checkScrollable);
    };
  }, [markets]);
  
  // Debug log to check if markets are being received
  console.log('MarketSelectionPanel received markets:', markets);
  
  const handleToggleMarket = (marketName: string) => {
    if (selectedMarkets.includes(marketName)) {
      setSelectedMarkets(selectedMarkets.filter(m => m !== marketName));
    } else {
      setSelectedMarkets([...selectedMarkets, marketName]);
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMarkets.length > 0) {
      onSubmit(selectedMarkets);
    }
  };
  
  return (
    <div className="market-selection-panel">
      <h3>Select Target Markets</h3>
      <p className="selection-instruction">
        Based on your business profile, we've identified these markets as potential opportunities.
        Select all that interest you:
      </p>
      
      <form onSubmit={handleSubmit}>
        <div className={`markets-grid ${showScrollIndicator ? 'scrollable' : ''}`} ref={marketsGridRef}>
          {markets.map(market => (
            <div 
              key={market.id} 
              className={`market-card ${selectedMarkets.includes(market.name) ? 'selected' : ''}`}
              onClick={() => handleToggleMarket(market.name)}
            >
              <div className="market-header">
                <h4>{market.name}</h4>
                <div className="confidence-indicator">
                  <div 
                    className="confidence-bar" 
                    style={{ width: `${Math.round(market.confidence * 100)}%` }}
                  ></div>
                  <span>{Math.round(market.confidence * 100)}% match</span>
                </div>
              </div>
              <p className="market-description">{market.description}</p>
              <div className="selection-indicator">
                {selectedMarkets.includes(market.name) ? '✓' : '+'}
              </div>
            </div>
          ))}
        </div>
        
        {showScrollIndicator && (
          <div className="scroll-indicator">
            <span>Scroll to see more markets</span>
            <div className="scroll-arrow">↓</div>
          </div>
        )}
        
        <div className="selection-actions">
          <div className="selected-count">
            {selectedMarkets.length} market{selectedMarkets.length !== 1 ? 's' : ''} selected
          </div>
          <button 
            type="submit" 
            disabled={selectedMarkets.length === 0 || isLoading}
            className="submit-selection"
          >
            {isLoading ? 'Processing...' : 'Explore Selected Markets'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MarketSelectionPanel; 