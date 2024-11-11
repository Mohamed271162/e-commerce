import { Schema, model } from 'mongoose'

const categorySchema = new Schema(
  {
    name: {
      type: String,
      unique: true,
      lowercase: true,
      required: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      required: true,
    },
    Image: {
      secure_url: {
        type: String,
        required: true,
      },
      public_id: {
        type: String,
        required: true,
      },
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false, // TODO: convert into true after creating usermodel
    },
    customId: String,
  },
  {
    timestamps: true,
    toJSON:{virtuals:true},
    toObject:{virtuals:true},

  },
)
categorySchema.virtual('subCategories',{
  ref:'subCategory',
  foreignField:'categoryId',
  localField:'_id'
})



export const categoryModel = model('Category', categorySchema)