
import slugify from "slugify"
import cloudinary from "../../utils/cloudinaryConfigration.js"
import { categoryModel } from "../../../DB/Models/Category.model.js"
import { customAlphabet } from "nanoid"
import { subCategoryModel } from "../../../DB/Models/subCategory.model.js"
const nanoid = customAlphabet('12345_abcdjfh', 5)


export const createCategory = async (req, res, next) => {
    const { name } = req.body
    const slug = slugify(name, '_')
    if (!req.file) {
        next(new Error('please upload category picture', { cause: 400 }))
    }
    const customId = nanoid()

    const { secure_url, public_id } = await cloudinary.uploader.upload(req.file.path, {
        folder: `${process.env.PROJECT_FOLDER}/Categories/${customId}`,
    })

    const categoryObject = {
        name,
        slug,
        Image: {
            secure_url,
            public_id,
        }
    }
    const category = await categoryModel.create(categoryObject)
    if (!category) {
        await cloudinary.uploader.destroy(public_id)
        return next(new Error('fail to add your category', { cause: 400 }))
    }
    res.status(200).json({ message: 'Added Done', category })

}


export const updateCategory = async (req, res, next) => {

    const { categoryId } = req.params
    const { name } = req.body

    const category = await categoryModel.findById(categoryId)
    if (!category) {
        return next(new Error('category Not Found', { cause: 400 }))
    }
    if (name) {

        if (category.name == name.ToLowerCase()) {
            return next(new Error('please enter diffrent name', { cause: 400 }))

        }
        //check name Unique
        if (await categoryModel.findOne({ name })) {
            return next(new Error('please enter diffrent category name', { cause: 400 }))

        }
        category.name = name
        category.slug = slugify(name, '_')
    }

    if (req.file) {
        await cloudinary.uploader.destroy(category.Image.public_id)   //delete old image

        const { secure_url, public_id } = await cloudinary.uploader.upload(req.file.path, {
            folder: `${process.env.PROJECT_FOLDER}/Categories/${category.customId}`,  //new image
        })
        category.Image = { secure_url, public_id }
    }
    await category.save()
    res.status(200).json({ message: 'Update Done', category })
}

export const deleteCategory = async (req, res, next) => {
    const { categoryId } = req.query

    // check category id
    const categoryExists = await categoryModel.findByIdAndDelete(categoryId)
    if (!categoryExists) {
        return next(new Error('invalid categoryId', { cause: 400 }))
    }

    //Cloudinary
    await cloudinary.api.delete_resources_by_prefix(
        `${process.env.PROJECT_FOLDER}/Categories/${categoryExists.customId}`,
    )

    await cloudinary.api.delete_folder(
        `${process.env.PROJECT_FOLDER}/Categories/${categoryExists.customId}`,
    )

        //DB
        
    const deleteRelatedSubCategories = await subCategoryModel.deleteMany({
        categoryId,
      })
      const deleteRelatedBrands = await brandModel.deleteMany({
        categoryId,
      })
      const deleteRelatedProducts = await productModel.deleteMany({
        categoryId,
      })
    
      if (!deleteRelatedSubCategories.deletedCount) {
        return next(new Error('delete fail subCategory', { cause: 400 }))
      }
      if (!deleteRelatedBrands.deletedCount) {
        return next(new Error('delete fail brands', { cause: 400 }))
      }
      if (!deleteRelatedProducts.deletedCount) {
        return next(new Error('delete fail products', { cause: 400 }))
      }

    res.status(200).json({ messsage: 'Deleted Done' })
}


export const getAllCategories = async (req, res, next) => {
    const Categories = await categoryModel.find().populate([
        {
            path: 'subCategories',
        },
    ])
    res.status(200).json({ message: 'Done', Categories })
}