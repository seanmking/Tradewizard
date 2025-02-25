const fs = require('fs').promises;
const path = require('path');

class MockDataService {
  constructor() {
    this.websiteDataPath = path.join(__dirname, '../mock-data/synthetic/global-fresh-website.json');
  }

  async getWebsiteData() {
    try {
      const data = await fs.readFile(this.websiteDataPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading website data:', error);
      throw new Error('Failed to fetch website data');
    }
  }

  async getCompanyProfile() {
    try {
      const websiteData = await this.getWebsiteData();
      return {
        basicInfo: websiteData.companyInfo,
        team: websiteData.team
      };
    } catch (error) {
      console.error('Error creating company profile:', error);
      throw new Error('Failed to create company profile');
    }
  }

  async getProductCatalog() {
    try {
      const websiteData = await this.getWebsiteData();
      return websiteData.products;
    } catch (error) {
      console.error('Error fetching product catalog:', error);
      throw new Error('Failed to fetch product catalog');
    }
  }

  async getExportCapabilities() {
    try {
      const websiteData = await this.getWebsiteData();
      return {
        facilities: websiteData.facilities,
        distribution: websiteData.distribution
      };
    } catch (error) {
      console.error('Error fetching export capabilities:', error);
      throw new Error('Failed to fetch export capabilities');
    }
  }
}

module.exports = new MockDataService(); 