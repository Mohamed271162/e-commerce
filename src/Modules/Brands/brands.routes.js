import { Router } from "express";
const router = Router()
import * as bc from '../Brands/brands.controller.js'
import { multerCloudFunction } from "../../Services/multercloud.js";
import { allowedExtensions } from "../../utils/allowedExtentions.js";
import { asyncHandler } from "../../utils/errorhandling.js";

router.post('/',multerCloudFunction(allowedExtensions.Image).single('logo'),asyncHandler(bc.addBrand))
router.put('/',multerCloudFunction(allowedExtensions.Image).single('logo'),asyncHandler(bc.updateBrand))


export default router