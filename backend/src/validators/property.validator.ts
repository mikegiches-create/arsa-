import { body, param, query } from 'express-validator'

export const createPropertyValidator = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 10 })
    .withMessage('Description must be at least 10 characters'),
  body('price')
    .notEmpty()
    .withMessage('Price is required')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('type')
    .notEmpty()
    .withMessage('Property type is required')
    .isIn(['APARTMENT', 'HOUSE', 'VILLA', 'TOWNHOUSE', 'COMMERCIAL', 'LAND', 'OTHER'])
    .withMessage('Invalid property type'),
  body('address')
    .trim()
    .notEmpty()
    .withMessage('Address is required')
    .isLength({ min: 5 })
    .withMessage('Address must be at least 5 characters'),
  body('city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),
  body('state')
    .trim()
    .notEmpty()
    .withMessage('State is required'),
  body('zipCode')
    .trim()
    .notEmpty()
    .withMessage('Zip code is required'),
  body('country')
    .trim()
    .notEmpty()
    .withMessage('Country is required'),
  body('bedrooms')
    .notEmpty()
    .withMessage('Bedrooms is required')
    .isInt({ min: 0 })
    .withMessage('Bedrooms must be a non-negative number'),
  body('bathrooms')
    .notEmpty()
    .withMessage('Bathrooms is required')
    .isInt({ min: 0 })
    .withMessage('Bathrooms must be a non-negative number'),
  body('squareFeet')
    .notEmpty()
    .withMessage('Square feet is required')
    .isInt({ min: 1 })
    .withMessage('Square feet must be a positive number'),
  body('categoryId')
    .notEmpty()
    .withMessage('Category is required'),
  body('locationId')
    .notEmpty()
    .withMessage('Location is required'),
]

export const updatePropertyValidator = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10 })
    .withMessage('Description must be at least 10 characters'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('type')
    .optional()
    .isIn(['APARTMENT', 'HOUSE', 'VILLA', 'TOWNHOUSE', 'COMMERCIAL', 'LAND', 'OTHER'])
    .withMessage('Invalid property type'),
  body('status')
    .optional()
    .isIn(['AVAILABLE', 'SOLD', 'RENTED', 'PENDING', 'ARCHIVED'])
    .withMessage('Invalid property status'),
  body('featured')
    .optional()
    .isBoolean()
    .withMessage('Featured must be a boolean'),
]

export const propertyIdValidator = [
  param('id')
    .notEmpty()
    .withMessage('Property ID is required'),
]

export const savePropertyValidator = [
  body('propertyId')
    .notEmpty()
    .withMessage('Property ID is required'),
]

export const propertyQueryValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Min price must be a positive number'),
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Max price must be a positive number'),
]
