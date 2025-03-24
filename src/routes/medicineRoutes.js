const express = require('express');
const router = express.Router();
const medicineController = require('../controllers/medicineController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');
const { validateId, validatePagination } = require('../middleware/validateMiddleware');

// Routes công khai
router.get('/', validatePagination, medicineController.getAllMedicines);
router.get('/search', validatePagination, medicineController.searchMedicines);
router.get('/manufacturer', validatePagination, medicineController.filterByManufacturer);
router.get('/:id', validateId, medicineController.getMedicineById);

// Routes yêu cầu quyền admin
router.post('/', verifyToken, verifyAdmin, medicineController.createMedicine);
router.put('/:id', verifyToken, verifyAdmin, validateId, medicineController.updateMedicine);
router.delete('/:id', verifyToken, verifyAdmin, validateId, medicineController.deleteMedicine);

module.exports = router; 