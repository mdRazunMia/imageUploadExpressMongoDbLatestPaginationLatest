const express = require("express");
const { route } = require("express/lib/application");
const router = express.Router();
const uploadImageController = require("../controllers/uploadImageController.js")


router.post('/',uploadImageController.uploadImageInfo,uploadImageController.uploadImage)
router.get('/',uploadImageController.getUploadImage)
router.get('/pagination',uploadImageController.getPaginatedImage)
router.delete('/:id', uploadImageController.deleteImage)



module.exports = router;