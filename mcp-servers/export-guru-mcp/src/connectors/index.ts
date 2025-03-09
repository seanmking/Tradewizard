import { ConnectorsConfig } from '../types';
import { setupTradeMapConnector } from './trade-map';
import { setupComtradeConnector } from './comtrade';
import { setupRegulatoryDbConnector } from './regulatory-db';
import { setupInternalDbConnector } from './internal-db';

export interface Connectors {
  tradeMap: ReturnType<typeof setupTradeMapConnector>;
  comtrade: ReturnType<typeof setupComtradeConnector>;
  regulatoryDb: ReturnType<typeof setupRegulatoryDbConnector>;
  internalDb: ReturnType<typeof setupInternalDbConnector>;
}

export async function setupConnectors(config: ConnectorsConfig): Promise<Connectors> {
  // Set up all connectors
  const tradeMap = await setupTradeMapConnector(config.tradeMap);
  const comtrade = await setupComtradeConnector(config.comtrade);
  const regulatoryDb = await setupRegulatoryDbConnector(config.regulatoryDb);
  const internalDb = await setupInternalDbConnector(config.internalDb);
  
  return {
    tradeMap,
    comtrade,
    regulatoryDb,
    internalDb
  };
}