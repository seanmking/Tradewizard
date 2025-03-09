import express, { Request, Response, NextFunction } from 'express';
import { setupRegulatoryDbConnector } from '../connectors/regulatory-db';
import { ApiError } from '../utils/error-handling';

const router = express.Router();

// Initialize the regulatory database connector
const regulatoryDb = setupRegulatoryDbConnector({
  connectionString: process.env.REGULATORY_DB_URL || 'postgresql://postgres:postgres@localhost:5432/regulatory_db'
});

/**
 * @route GET /api/regulatory/requirements
 * @desc Get regulatory requirements for a country and product category
 * @access Public
 */
router.get('/requirements', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { country, productCategory, hsCode } = req.query;
    
    if (!country || !productCategory) {
      throw new ApiError('Country and product category are required', 400);
    }
    
    const requirements = await regulatoryDb.getRequirements(
      country as string,
      productCategory as string,
      hsCode as string | undefined
    );
    
    res.json({
      success: true,
      data: requirements
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/regulatory/requirements
 * @desc Add a new regulatory requirement
 * @access Private
 */
router.post('/requirements', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requirement = req.body;
    
    if (!requirement.country || !requirement.productCategory || !requirement.requirementType || !requirement.description) {
      throw new ApiError('Missing required fields', 400);
    }
    
    const success = await regulatoryDb.addRequirement(requirement);
    
    res.status(201).json({
      success,
      message: 'Regulatory requirement added successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route PUT /api/regulatory/requirements/:id
 * @desc Update a regulatory requirement
 * @access Private
 */
router.put('/requirements/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id);
    const requirement = req.body;
    
    if (isNaN(id)) {
      throw new ApiError('Invalid requirement ID', 400);
    }
    
    const success = await regulatoryDb.updateRequirement(id, requirement);
    
    res.json({
      success,
      message: 'Regulatory requirement updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route DELETE /api/regulatory/requirements/:id
 * @desc Delete a regulatory requirement
 * @access Private
 */
router.delete('/requirements/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      throw new ApiError('Invalid requirement ID', 400);
    }
    
    const success = await regulatoryDb.deleteRequirement(id);
    
    res.json({
      success,
      message: 'Regulatory requirement deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/regulatory/search
 * @desc Search for regulatory requirements
 * @access Public
 */
router.get('/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { term } = req.query;
    
    if (!term) {
      throw new ApiError('Search term is required', 400);
    }
    
    const requirements = await regulatoryDb.searchRequirements(term as string);
    
    res.json({
      success: true,
      data: requirements
    });
  } catch (error) {
    next(error);
  }
});

export default router; 