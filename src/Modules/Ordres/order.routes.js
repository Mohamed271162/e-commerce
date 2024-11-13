import { Router } from 'express'
const router = Router()
import * as oc from './order.controller.js'
import { asyncHandler } from '../../utils/errorhandling.js'
import { isAuth } from '../../middlewares/auth.js'

router.post('/', isAuth(), asyncHandler(oc.createOrder))
router.post('/orderCart', isAuth(), asyncHandler(oc.fromCartoOrder))

export default router