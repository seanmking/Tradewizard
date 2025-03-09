import { setupWITSConnector } from './connectors/wits';

async function testWITSIntegration() {
  try {
    console.log('Testing WITS API integration...');
    
    // Create WITS connector
    const witsConnector = setupWITSConnector({
      baseUrl: 'https://wits.worldbank.org/API/V1'
    });
    
    // Test connection
    const connectionTest = await witsConnector.testConnection();
    console.log('Connection test result:', connectionTest);
    
    if (!connectionTest.success) {
      console.error('WITS API connection test failed');
      return;
    }
    
    // Test with South African dried fruits (HS code 080620) exported to the UK
    console.log('\nTesting tariff data retrieval...');
    const tariffData = await witsConnector.getTariffData('GBR', 'ZAF', '080620', 2023);
    console.log('Tariff data:', JSON.stringify(tariffData, null, 2));
    
    // Test tariff analysis
    console.log('\nTesting tariff analysis...');
    const tariffAnalysis = await witsConnector.analyzeTariffs('GBR', 'ZAF', '080620', 2023);
    console.log('Tariff analysis:', JSON.stringify(tariffAnalysis, null, 2));
    
    // Test market access evaluation
    console.log('\nTesting market access evaluation...');
    const marketAccessEvaluation = await witsConnector.evaluateMarketAccess(
      '080620',
      'ZAF',
      ['GBR', 'DEU', 'FRA', 'USA', 'CHN'],
      2023
    );
    console.log('Market access evaluation:', JSON.stringify(marketAccessEvaluation, null, 2));
    
    console.log('\nWITS API integration test completed successfully');
  } catch (error) {
    console.error('WITS API integration test failed:', error);
  }
}

// Run the test
testWITSIntegration().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 