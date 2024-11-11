import { paginationFunction } from "./pagination.js"

export class ApiFeatures {
    constructor (mongooseQuery , QueryData){
        this.mongooseQuery = mongooseQuery
        this.QueryData = QueryData
    }

    pagination(){
        const {page , size}= this.QueryData
        const {limit , skip} = paginationFunction({page,size})
        this.mongooseQuery.limit(limit).skip(skip)
        return this
    }

    sort(){
        this.mongooseQuery.sort(this.QueryData.sort?.replaceAll(',' , ' '))
        return this
    }

    select(){
        this.mongooseQuery.select(this.QueryData.select?.replaceAll(',' , ' '))
        return this
    }
}