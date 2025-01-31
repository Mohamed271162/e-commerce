import { cartModel } from '../../../DB/Models/Cart.model.js'
import { orderModel } from '../../../DB/Models/Order.model.js'
import { productModel } from '../../../DB/Models/Product.model.js'
import { couponModel } from '../../../DB/Models/coupon.model.js'
import { isCouponValid } from '../../utils/couponValidation.js'

// ========================== create order =================
export const createOrder = async (req, res, next) => {
  const userId = req.authUser._id
  const {
    productId,
    quantity,
    address,
    phoneNumbers,
    paymentMethod,
    couponCode,
  } = req.body

  // ======================== coupon check ================
  if (couponCode) {
    const coupon = await couponModel
      .findOne({ couponCode })
      .select('isPercentage isFixedAmount couponAmount couponAssginedToUsers')
    const isCouponValidResult = await isCouponValid({
      couponCode,
      userId,
      next,
    })
    if (isCouponValidResult !== true) {
      return isCouponValidResult
    }
    req.coupon = coupon
  }

  // ====================== products check ================
  const products = []
  const isProductValid = await productModel.findOne({
    _id: productId,
    stock: { $gte: quantity },
  })
  if (!isProductValid) {
    return next(
      new Error('invalid product please check your quantity', { cause: 400 }),
    )
  }
  const productObject = {
    productId,
    quantity,
    title: isProductValid.title,
    price: isProductValid.priceAfterDiscount,
    finalPrice: isProductValid.priceAfterDiscount * quantity,
  }
  products.push(productObject)

  //===================== subTotal ======================
  const subTotal = productObject.finalPrice
  //====================== paid Amount =================
  let paidAmount = 0
  if (req.coupon?.isPercentage) {
    paidAmount = subTotal * (1 - (req.coupon.couponAmount || 0) / 100)
  } else if (req.coupon?.isFixedAmount) {
    paidAmount = subTotal - req.coupon.couponAmount
  } else {
    paidAmount = subTotal
  }

  //======================= paymentMethod  + orderStatus ==================
  let orderStatus
  paymentMethod == 'cash' ? (orderStatus = 'placed') : (orderStatus = 'pending')

  const orderObject = {
    userId,
    products,
    address,
    phoneNumbers,
    orderStatus,
    paymentMethod,
    subTotal,
    paidAmount,
    couponId: req.coupon?._id,
  }
  const orderDB = await orderModel.create(orderObject)
  if (orderDB) {
    // increase usageCount for coupon usage
    if (req.coupon) {
      for (const user of req.coupon.couponAssginedToUsers) {
        if (user.userId.toString() == userId.toString()) {
          user.usageCount += 1
        }
      }
      await req.coupon.save()
    }

    // decrease product's stock by order's product quantity
    await productModel.findOneAndUpdate(
      { _id: productId },
      {
        $inc: { stock: -parseInt(quantity) },
      },
    )

    //TODO: remove product from userCart if exist

    return res.status(201).json({ message: 'Done', orderDB })
  }
  return next(new Error('fail to create your order', { cause: 400 }))
}

// ============== break 9:30 ================

// =========================== create order from cart products ====================
export const fromCartoOrder = async (req, res, next) => {
  const userId = req.authUser._id
  const { cartId } = req.query
  const { address, phoneNumbers, paymentMethod, couponCode } = req.body

  const cart = await cartModel.findById(cartId)
  if (!cart || !cart.products.length) {
    return next(new Error('please fill your cart first', { cause: 400 }))
  }

  // ======================== coupon check ================
  if (couponCode) {
    const coupon = await couponModel
      .findOne({ couponCode })
      .select('isPercentage isFixedAmount couponAmount couponAssginedToUsers')
    const isCouponValidResult = await isCouponValid({
      couponCode,
      userId,
      next,
    })
    if (isCouponValidResult !== true) {
      return isCouponValidResult
    }
    req.coupon = coupon
  }

  let subTotal = cart.subTotal
  //====================== paid Amount =================
  let paidAmount = 0
  if (req.coupon?.isPercentage) {
    paidAmount = subTotal * (1 - (req.coupon.couponAmount || 0) / 100)
  } else if (req.coupon?.isFixedAmount) {
    paidAmount = subTotal - req.coupon.couponAmount
  } else {
    paidAmount = subTotal
  }

  //======================= paymentMethod  + orderStatus ==================
  let orderStatus
  paymentMethod == 'cash' ? (orderStatus = 'placed') : (orderStatus = 'pending')
  let orderProduct = []
  for (const product of cart.products) {
    const productExist = await productModel.findById(product.productId)
    orderProduct.push({
      productId: product.productId,
      quantity: product.quantity,
      title: productExist.title,
      price: productExist.priceAfterDiscount,
      finalPrice: productExist.priceAfterDiscount * product.quantity,
    })
  }

  const orderObject = {
    userId,
    products: orderProduct,
    address,
    phoneNumbers,
    orderStatus,
    paymentMethod,
    subTotal,
    paidAmount,
    couponId: req.coupon?._id,
  }
  const orderDB = await orderModel.create(orderObject)
  if (orderDB) {
    // increase usageCount for coupon usage
    if (req.coupon) {
      for (const user of req.coupon.couponAssginedToUsers) {
        if (user.userId.toString() == userId.toString()) {
          user.usageCount += 1
        }
      }
      await req.coupon.save()
    }

    // decrease product's stock by order's product quantity
    for (const product of cart.products) {
      await productModel.findOneAndUpdate(
        { _id: product.productId },
        {
          $inc: { stock: -parseInt(product.quantity) },
        },
      )
    }

    //TODO: remove product from userCart if exist
    cart.products = []
    await cart.save()

    return res.status(201).json({ message: 'Done', orderDB, cart })
  }
  return next(new Error('fail to create your order', { cause: 400 }))
}