import { Router } from "express";
import { multerCloudFunction } from "../../Services/multercloud.js";
import { allowedExtensions } from "../../utils/allowedExtentions.js";
import { asyncHandler } from "../../utils/errorhandling.js";
import * as sc from '../Subcategory/subCategories.controller.js'
const router = Router()

router.post('/',multerCloudFunction(allowedExtensions.Image).single('image'),asyncHandler(sc.createSubCategory))
router.put('/',multerCloudFunction(allowedExtensions.Image).single('image'),asyncHandler(sc.updatesubCategory))
router.delete('/', asyncHandler(sc.deletesubCategory))
router.get('/', asyncHandler(sc.getAllSubCategories))


export default router