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

export async function setupConnectors(config: ConnectorsConfig): Promise<Connectors> {
  // Set up all connectors
  const tradeMap = await setupTradeMapConnector(config.tradeMap);
  const comtrade = await setupComtradeConnector(config.comtrade);
  const regulatoryDb = await setupRegulatoryDbConnector(config.regulatoryDb);
  const internalDb = await setupInternalDbConnector(config.internalDb);
  const wits = await setupWITSConnector(config.wits);
  
  return {
    tradeMap,
    comtrade,
    regulatoryDb,
    internalDb,
    wits
  };
}