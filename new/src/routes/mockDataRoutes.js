const express = require('express');
const router = express.Router();
const mockDataService = require('../services/mockDataService');
const llmService = require('../services/llmService');

// Raw data endpoints
router.get('/website-data', async (req, res) => {
  try {
    const data = await mockDataService.getWebsiteData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Processed data endpoints
router.get('/company-profile', async (req, res) => {
  try {
    const data = await mockDataService.getCompanyProfile();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/product-catalog', async (req, res) => {
  try {
    const data = await mockDataService.getProductCatalog();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/export-capabilities', async (req, res) => {
  try {
    const data = await mockDataService.getExportCapabilities();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Note: LLM analysis endpoints will be updated once we have the regulatory data
router.get('/analysis/company-profile', async (req, res) => {
  try {
    const analysis = await llmService.analyzeCompanyProfile();
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/analysis/product-suitability', async (req, res) => {
  try {
    const analysis = await llmService.analyzeProductSuitability();
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 