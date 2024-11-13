import { Router } from 'express'
const router = Router()
import * as cartC from './cart.controller.js'
import { asyncHandler } from '../../utils/errorhandling.js'
import { isAuth } from '../../middlewares/auth.js'

router.post('/', isAuth(), asyncHandler(cartC.addToCart))
router.delete('/', isAuth(), asyncHandler(cartC.deleteFromCart))
export default router