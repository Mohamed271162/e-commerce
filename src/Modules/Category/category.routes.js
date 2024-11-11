import { Router } from "express";
import { multerCloudFunction } from "../../Services/multercloud.js";
import { allowedExtensions } from "../../utils/allowedExtentions.js";
import * as cc from './category.controller.js'
import { asyncHandler } from "../../utils/errorhandling.js";
const router = Router()


router.post('/',multerCloudFunction(allowedExtensions.Image).single('image'),asyncHandler(cc.createCategory))
router.put('/:categoryId',multerCloudFunction(allowedExtensions.Image).single('image'),asyncHandler(cc.updateCategory))

export default router