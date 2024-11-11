import slugify from "slugify"
import { categoryModel } from "../../../DB/Models/Category.model.js"
import { subCategoryModel } from "../../../DB/Models/subCategory.model.js"
import cloudinary from "../../utils/cloudinaryConfigration.js"
import { brandModel } from "../../../DB/Models/Brands.model.js"
import { customAlphabet } from 'nanoid'
const nanoid = customAlphabet('123456_=!ascbhdtel', 5)



export const addBrand = async(req,res,next)=>{
    const {name} = req.body
    const {subCategoryId , categoryId} = req.query

    const categoryExist = await categoryModel.findById(categoryId)
    if(!categoryExist){
        return next(new Error('invalid category Id',{cause:400}))
    }

    const subCategoryExist = await subCategoryModel.findById(subCategoryId)
    if(!subCategoryExist){
        return next(new Error('invalid subCategory Id',{cause:400}))
    }

    const slug = slugify(name ,{
        replacement:'-',
        lower:true,
    })

    if(!req.file){
        return next(new Error('please upload pic',{cause:400}))
    }
    const customId = nanoid()

    const { secure_url,public_id } = await cloudinary.uploader.upload(req.file.path,{
        folder:`${process.env.PROJECT_FOLDER}/Categories/${categoryExist.customId}/subCategories/${subCategoryExist.customId}/Brands/${customId}`  

    })

    const BrandObj = {
        name,
        slug,
        logo:{
            secure_url,
            public_id,
        },
        categoryId,
        subCategoryId,
    }

   const BrandDB = await brandModel.create(BrandObj)
   if(!BrandDB){
    await cloudinary.uploader.destroy(public_id)
   }


    res.status(200).json({message:'Done',BrandDB})
}


export const updateBrand = async (req, res, next) => {

    const { BrandId } = req.query
    const { name } = req.body

    const Brand = await brandModel.findById(BrandId)
    if (!Brand) {
        return next(new Error('Brand Not Found', { cause: 400 }))
    }
    if (name) {

        if (Brand.name == name.ToLowerCase) {
            return next(new Error('please enter diffrent name', { cause: 400 }))

        }
        //check name Unique
        if (await brandModel.findOne({ name })) {
            return next(new Error('please enter diffrent Brand name', { cause: 400 }))

        }
        Brand.name = name
        Brand.slug = slugify(name, '_')
    }


    if(req.file){
        await cloudinary.uploader.destroy(Brand.logo.public_id)   //delete old image

        const { secure_url, public_id } = await cloudinary.uploader.upload(req.file.path, {
            folder: `${process.env.PROJECT_FOLDER}/Brands/${Brand.customId}`,  //new image
        })
        Brand.Image = { secure_url, public_id }
    }
    await Brand.save()
    res.status(200).json({message:'Update Done',Brand})
}


