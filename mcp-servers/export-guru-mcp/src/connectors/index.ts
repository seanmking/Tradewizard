import { ConnectorsConfig } from '../types';
import { setupTradeMapConnector } from './trade-map';
import { setupComtradeConnector } from './comtrade';
import { setupRegulatoryDbConnector } from './regulatory-db';
import { setupInternalDbConnector } from './internal-db';
import { setupWITSConnector } from './wits';

export interface Connectors {
  tradeMap: ReturnType<typeof setupTradeMapConnector>;
  comtrade: ReturnType<typeof setupComtradeConnector>;
  regulatoryDb: ReturnType<typeof setupRegulatoryDbConnector>;
  internalDb: ReturnType<typeof setupInternalDbConnector>;
  wits: ReturnType<typeof setupWITSConnector>;
}

export function setupConnectors(config: ConnectorsConfig): Connectors {
  // Set up all connectors
  const tradeMap = setupTradeMapConnector(config.tradeMap);
  const comtrade = setupComtradeConnector(config.comtrade);
  const regulatoryDb = setupRegulatoryDbConnector(config.regulatoryDb);
  const internalDb = setupInternalDbConnector(config.internalDb);
  const wits = setupWITSConnector(config.wits);
  
  return {
    tradeMap,
    comtrade,
    regulatoryDb,
    internalDb,
    wits
  };
}