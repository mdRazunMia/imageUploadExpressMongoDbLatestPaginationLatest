const express = require("express")
const { MongoClient } = require('mongodb')
const cors = require('cors')
const fs = require("fs")
const ObjectId = require('mongodb').ObjectId
const multer = require("multer")
const md5 = require("md5")
const path = require("path")
const constant = require('../constants/constants')


//upload image in a local folder 
const upload = multer();
const storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, './uploads');
    },
    filename: function(req, file, cb){
        cb(null, md5(file.originalname)+path.extname(file.originalname))
    }
})
//image is the name of the input field. 
const uploadImageInfo = multer({storage: storage}).single('image')



//database uri
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rv6z4.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

//console.log(uri);

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect();
console.log('connected to the database');
const database = client.db("dotOnline");
const uploadImageCollection = database.collection("upload_image");

const uploadImage = async (req, res, next)=>{
    const imageInfo = {
        "name": md5(req.file.originalname)+path.extname(req.file.originalname),
        "path": req.file.path
        
    }
    const uploadImageResponse= await uploadImageCollection.insertOne(imageInfo)
    res.json(uploadImageResponse)
    
}





const getPaginatedImage = (req, res)=>{
    // const defaultPage = constant.PAGE
    // const defaultItems = constant.ITEMS
    let requestedItems = 0
    let requestedPageNumber = 0
    const checkPage = req.query.page
    const checkItems = req.query.items
    if(typeof checkPage === 'undefined'){
        requestedPageNumber = constant.PAGE
    }else{
        requestedPageNumber  = parseInt(req.query.page)
    }
    
    if(typeof checkItems === 'undefined'){
        requestedItems = constant.ITEMS
    }else{
        const items = parseInt(req.query.items)
        if(items <= constant.MAX_ITEMS){
            requestedItems = items
        }else{
            requestedItems = constant.MAX_ITEMS
        }        
    }
    
    // console.log(requestedPageNumber)
    // console.log(requestedItems)
    
    // console.log(requestedItems)
    // console.log(requestedPageNumber)
    console.log("we are in pagination function")
    uploadImageCollection.find({}).toArray(function(err, result) {
        if (err) throw err;
        let totalImageLength = result.length
        let totalPage = Math.ceil(totalImageLength/requestedItems)
        let initialValue = -1
        // if(requestedPageNumber === totalPage){
        //     let modifiedRequestedPageNumber = requestedPageNumber - 1
        //     initialValue = modifiedRequestedPageNumber * requestedItems
        // }else{
        //     initialValue = requestedPageNumber*requestedItems
        // }

        initialValue = (requestedPageNumber-1)*requestedItems

        let endValue = initialValue + requestedItems - 1 
        // console.log(`requestedPageNumber: ${requestedPageNumber} requestedItemsNumber: ${requestedItems} length: ${totalImageLength} totalPage: ${totalPage} initialValue: ${initialValue} endValue: ${endValue} totalImageLength: ${totalImageLength}`)
        
        // console.log(requestedPageNumber<=totalPage)
        // console.log(endValue<=totalImageLength)
        if((requestedPageNumber <= totalPage) && requestedPageNumber != 0){
            let requestedArrayOfImages = []
            let counter = 0
            for(var i = initialValue; i <= endValue; i++){
                if(result[i] != null){
                    requestedArrayOfImages[counter] = result[i];
                    counter = counter + 1
                }
                // requestedArrayOfImages[counter] = result[i];
                // console.log(`i = ${i} counter = ${counter}`)            
            }
            let nextButton = false
            if(requestedPageNumber < totalPage){
                nextButton = true
            }
            const data  = {}
            data.items= requestedArrayOfImages
            data.meta={
                "totalPage": totalPage,
                "nextPage": nextButton,
                "currentPage": requestedPageNumber
            }
            res.send(data)
        }else{
            res.send({message:`Page number ${requestedPageNumber} is invalid`})
        }

    });
}







const getUploadImage = (req, res)=>{
    const allImages = uploadImageCollection.find({}).toArray(function(err, result) {
        if (err) throw err;
        res.send(result);
    });
}



const deleteImage = (req, res)=>{
    const imageId = req.params.id
    //delete image from local storage
    const deletedImageInfo =  uploadImageCollection.find({_id : ObjectId(imageId)}).toArray((error, result)=>{
        if(error) throw error
        const imagePath = result[0].path
        fs.unlink(imagePath, (error)=>{
            if(error) return
            console.log("Image has been deleted from the local storage successfully.")
        })

    })
    //delete image info from database
    const deletedParameter = {_id: ObjectId(imageId)}
    const deleteImageResponse = uploadImageCollection.deleteOne(deletedParameter, (error, object)=>{
        if(error) throw error
        res.json({message: `Item ${imageId} is deleted successfully from database.`})
    })
    

    
}

module.exports = {
    uploadImage,
    uploadImageInfo,
    getUploadImage,
    getPaginatedImage,
    deleteImage
}