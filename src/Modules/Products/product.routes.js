import { Router } from "express";
import { multerCloudFunction } from "../../Services/multercloud.js";
import { allowedExtensions } from "../../utils/allowedExtentions.js";
import { asyncHandler } from "../../utils/errorhandling.js";
import * as pc from '../Products/product.controller.js'
const router = Router()


router.post('/',multerCloudFunction(allowedExtensions.Image).array('image',2),asyncHandler(pc.addProduct))
router.post('/update',multerCloudFunction(allowedExtensions.Image).array('image',2),asyncHandler(pc.updateproduct))
router.get('/', asyncHandler(pc.getAllProd))

router.delete('/', asyncHandler(pc.deleteProduct))
router.get('/title', asyncHandler(pc.getProductsByName))

export default router