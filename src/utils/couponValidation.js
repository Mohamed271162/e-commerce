import { couponModel } from '../../DB/Models/coupon.model.js'
import moment from 'moment-timezone'

export const isCouponValid = async ({ couponCode, userId, next } = {}) => {
  const coupon = await couponModel.findOne({ couponCode })
  if (!coupon) {
    return next(new Error('please enter a valid coupon code'))
  }
  // expiration
  if (
    coupon.couponStatus == 'Expired' ||
    moment(coupon.toDate).isBefore(moment().tz('Africa/Cairo'))
  ) {
    return next(new Error('coupon is expired', { cause: 400 }))
  }

  for (const user of coupon.couponAssginedToUsers) {
    // coupon not assgined to user
    if (userId.toString() !== user.userId.toString()) {
      return next(
        new Error('this user not assgined for this coupon', { cause: 400 }),
      )
    }
    // exceed the max usage
    if (user.maxUsage <= user.usageCount) {
      return next(
        new Error('exceed the max usage for this coupon', { cause: 400 }),
      )
    }
  }

  return true
}