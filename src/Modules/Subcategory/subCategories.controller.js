import { categoryModel } from "../../../DB/Models/Category.model.js"
import { subCategoryModel } from "../../../DB/Models/subCategory.model.js"
import cloudinary from '../../utils/cloudinaryConfigration.js'
import slugify from 'slugify'

import { customAlphabet } from 'nanoid'
const nanoid = customAlphabet('123456_=!ascbhdtel', 5)




export const createSubCategory = async (req, res, next) => {
    const { categoryId } = req.query
    const { name } = req.body
    const category = await categoryModel.findById(categoryId)
    if (!category) {
      return next(new Error('invalid categoryId', { cause: 400 }))
    }

    if (await subCategoryModel.findOne({ name })) {
      return next(new Error('duplicate name', { cause: 400 }))
    }

    const slug = slugify(name, '_')
  
    if (!req.file) {
      return next(new Error('please upload a subcategory image', { cause: 400 }))
    }
  
    const customId = nanoid()
    
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.file.path,
      {
        folder: `${process.env.PROJECT_FOLDER}/Categories/${category.customId}/subCategories/${customId}`,
      },
    )
  
    const subCategoryObject = {
      name,
      slug,
      customId,
      Image: {
        secure_url,
        public_id,
      },
      categoryId,
    }
  
    const subCategory = await subCategoryModel.create(subCategoryObject)
    if (!subCategory) {
      await cloudinary.uploader.destroy(public_id)
      return next(new Error('try again later', { cause: 400 }))
    }
    res.status(201).json({ message: 'Added Done', subCategory })
  }

  export const updatesubCategory = async (req, res, next) => {

    const { subcategoryId } = req.query
    const { name } = req.body

    const subCategory = await subCategoryModel.findById(subcategoryId)
    if (!subCategory) {
        return next(new Error('subcategory Not Found', { cause: 400 }))
    }
    if (name) {

        if (subCategory.name == name.ToLowerCase()) {
            return next(new Error('please enter diffrent name', { cause: 400 }))

        }
        //check name Unique
        if (await subCategoryModel.findOne({ name })) {
            return next(new Error('please enter diffrent category name', { cause: 400 }))

        }
        subCategory.name = name
        subCategory.slug = slugify(name, '_')
    }

    if(req.file){
        await cloudinary.uploader.destroy(subCategory.Image.public_id)   //delete old image

        const { secure_url, public_id } = await cloudinary.uploader.upload(req.file.path, {
            folder: `${process.env.PROJECT_FOLDER}/subCategories/${subCategory.customId}`,  //new image
        })
        subCategory.Image = { secure_url, public_id }
    }
    await subCategory.save()
    res.status(200).json({message:'Update Done',subCategory})
}

export const deletesubCategory = async (req, res, next) => {
    const { subCategoryId } = req.query
  
    // check category id
    const subCategoryExists = await subCategoryModel.findByIdAndDelete(subCategoryId)
    if (!subCategoryExists) {
      return next(new Error('invalid subCategoryId', { cause: 400 }))
    }
  
    //Cloudinary
    await cloudinary.api.delete_resources_by_prefix(
        `${process.env.PROJECT_FOLDER}/Categories/${category.customId}/subCategories/${subCategoryExists.customId}/Brands/${Brand.customId}`)  
    await cloudinary.api.delete_folder(
      `${process.env.PROJECT_FOLDER}/Categories/${category.customId}/subCategories/${subCategoryExists.customId}/Brands/${Brand.customId}`)  
        
      // TODO: delete related products
  
    res.status(200).json({ messsage: 'Deleted Done' })
  }



  export const getAllSubCategories = async (req, res, next) => {
    const subCategories = await subCategoryModel.find().populate([
      {
        path: 'categoryId',
        select: 'slug',
      },
    ])
    res.status(200).json({ message: 'Done', subCategories })
  }