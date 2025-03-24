const express = require('express');
const router = express.Router();
const diseaseController = require('../controllers/diseaseController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');
const { validateId, validatePagination } = require('../middleware/validateMiddleware');

// Routes công khai
router.get('/', validatePagination, diseaseController.getAllDiseases);
router.get('/search', validatePagination, diseaseController.searchDiseases);
router.get('/:id', validateId, diseaseController.getDiseaseById);
router.post('/symptoms', diseaseController.findBySymptoms);

// Routes yêu cầu quyền admin
router.post('/', verifyToken, verifyAdmin, diseaseController.createDisease);
router.put('/:id', verifyToken, verifyAdmin, validateId, diseaseController.updateDisease);
router.delete('/:id', verifyToken, verifyAdmin, validateId, diseaseController.deleteDisease);

module.exports = router; 