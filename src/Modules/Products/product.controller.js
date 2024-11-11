import slugify from "slugify"
import { brandModel } from "../../../DB/Models/Brands.model.js"
import { categoryModel } from "../../../DB/Models/Category.model.js"
import { subCategoryModel } from "../../../DB/Models/subCategory.model.js"
import cloudinary from "../../utils/cloudinaryConfigration.js"
import { customAlphabet } from 'nanoid'
import { productModel } from "../../../DB/Product.model.js"
import { paginationFunction } from "../../utils/pagination.js"
import { ApiFeatures } from "../../utils/apiFeatures.js"
const nanoid = customAlphabet('123456_=!ascbhdtel', 5)



export const addProduct = async (req, res, next) => {
    const { title, desc, sizes, colors, price, appliedDiscount, stock } = req.body
    const { categoryId, subCategoryId, brandId } = req.query

    const category = await categoryModel.findById(categoryId)
    if (!category) {
        return next(new Error('invalid category Id', { cause: 400 }))
    }

    const subCategory = await subCategoryModel.findById(subCategoryId)
    if (!subCategory) {
        return next(new Error('invalid subCategory Id', { cause: 400 }))
    }

    const Brand = await brandModel.findById(brandId)
    if (!Brand) {
        return next(new Error('invalid Brand Id', { cause: 400 }))

    }

    const slug = slugify(title, '-')

    const priceAfterDiscount = price - (price * ((appliedDiscount || 0) / 100))

    if (!req.files) {
        return next(new Error('please upload Pic', { cause: 400 }))
    }

    const customId = nanoid()
    const Image = []
    const puplicIds = []
    for (const file of req.files) {
        const { secure_url, public_id } = await cloudinary.uploader.upload(file.path, {
            folder: `${process.env.PROJECT_FOLDER}/Categories/${category.customId}/subCategories/${subCategory.customId}/Brands/${Brand.customId}/Products/${customId}`

        })
        Image.push({ secure_url, public_id })
        puplicIds.push(public_id)
    }

    req.imagePath =
        `${process.env.PROJECT_FOLDER}/Categories/${category.customId}/subCategories/${subCategory.customId}/Brands/${Brand.customId}/Products/${customId}`


    const productObj = {
        title,
        desc,
        sizes,
        colors,
        price,
        appliedDiscount,
        stock,
        categoryId,
        subCategoryId,
        brandId,
        customId,
        Image,
        slug,
        priceAfterDiscount,
    }
    const Product = await productModel.create(productObj)
    if (!Product) {
        await cloudinary.api.delete_resources(puplicIds)
        return next(new Error('Fail Add', { cause: 400 }))
    }
    res.status(200).json({ message: 'Done', Product })
}


export const updateproduct = async (req, res, next) => {
    const { title, desc, price, appliedDiscount, colors, sizes, stock } = req.body

    const { productId, categoryId, subCategoryId, brandId } = req.query

    const product = await productModel.findById(productId)
    if (!product) {
        return next(new Error('invalid product id', { cause: 400 }))
    }

    const subCategoryExists = await subCategoryModel.findById(
        subCategoryId || product.subCategoryId,
    )
    if (subCategoryId) {

        product.subCategoryId = subCategoryId
    }
    const categoryExists = await categoryModel.findById(
        categoryId || product.categoryId,
    )
    if (categoryId) {
        if (!categoryExists) {
            return next(new Error('invalid categories', { cause: 400 }))
        }
        product.categoryId = categoryId
    }

    const brandExists = await brandModel.findById(brandId || product.brandId)
    if (brandId) {
        if (!brandExists) {
            return next(new Error('invalid brand', { cause: 400 }))
        }
        product.brandId = brandId
    }

    if (appliedDiscount && price) {
        const priceAfterDiscount = price * (1 - (appliedDiscount || 0) / 100)
        product.priceAfterDiscount = priceAfterDiscount
        product.price = price
        product.appliedDiscount = appliedDiscount
    } else if (price) {
        const priceAfterDiscount =
            price * (1 - (product.appliedDiscount || 0) / 100)
        product.priceAfterDiscount = priceAfterDiscount
        product.price = price
    } else if (appliedDiscount) {
        const priceAfterDiscount =
            product.price * (1 - (appliedDiscount || 0) / 100)
        product.priceAfterDiscount = priceAfterDiscount
        product.appliedDiscount = appliedDiscount
    }

    if (req.files?.length) {
        let ImageArr = []
        for (const file of req.files) {
            const { secure_url, public_id } = await cloudinary.uploader.upload(
                file.path,
                {
                    folder: `${process.env.PROJECT_FOLDER}/Categories/${categoryExists.customId}/subCategories/${subCategoryExists.customId}/Brands/${brandExists.customId}/Products/${product.customId}`,
                },
            )
            ImageArr.push({ secure_url, public_id })
        }
        let public_ids = []
        for (const image of product.Images) {
            public_ids.push(image.public_id)
        }
        await cloudinary.api.delete_resources(public_ids)
        product.Images = ImageArr
    }

    if (title) {
        product.title = title
        product.slug = slugify(title, '-')
    }
    if (desc) product.desc = desc
    if (colors) product.colors = colors
    if (sizes) product.sizes = sizes
    if (stock) product.stock = stock

    await product.save()
    res.status(200).json({ message: 'Done', product })
}


export const deleteProduct = async (req, res, next) => {
    const { productId } = req.query
    // check productId
    const product = await productModel.findByIdAndDelete(productId)
    if (!product) {
        return next(new Error('invalid product id', { cause: 400 }))
    }
    res.status(200).json({ message: 'Done', product })
}


//   export const getAllProd = async (req, res, next) => {
//     const { page, size } = req.query
//     const { limit, skip } = paginationFunction({ page, size })

//     const productsc = await productModel.find().limit(limit).skip(skip)
//     res.status(200).json({ message: 'Done', productsc })
//   }

//   export const getProductsByName = async (req, res, next) => {
//     const { searchKey, page, size } = req.query

//     const { limit, skip } = paginationFunction({ page, size })

//     const productsc = await productModel
//       .find({
//         $or: [
//           { title: { $regex: searchKey, $options: 'i' } },
//           { desc: { $regex: searchKey, $options: 'i' } },
//         ],
//       })
//       .limit(limit)
//       .skip(skip)
//     res.status(200).json({ message: 'Done', productsc })
//   }

export const getAllProd = async (req, res, next) => {
    const InstanceApiFeatures = new ApiFeatures(productModel.find(),req.query).pagination()
    const product = await InstanceApiFeatures.mongooseQuery


    res.status(200).json({ message: 'Done', product })
}

