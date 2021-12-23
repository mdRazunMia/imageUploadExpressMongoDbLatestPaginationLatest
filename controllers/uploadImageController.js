const express = require("express")
const { MongoClient } = require('mongodb')
const cors = require('cors')
const fs = require("fs")
const ObjectId = require('mongodb').ObjectId
const multer = require("multer")
const md5 = require("md5")
const path = require("path")


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
    let requestedPageNumber  = parseInt(req.query.page)
    let requestedItems = parseInt(req.query.items)
    console.log("we are in pagination function")
    uploadImageCollection.find({}).toArray(function(err, result) {
        if (err) throw err;
        let totalImageLength = result.length
        let totalPage = totalImageLength/requestedItems
        let initialValue = -1
        // if(requestedPageNumber === totalPage){
        //     let modifiedRequestedPageNumber = requestedPageNumber - 1
        //     initialValue = modifiedRequestedPageNumber * requestedItems
        // }else{
        //     initialValue = requestedPageNumber*requestedItems
        // }

        initialValue = (requestedPageNumber-1)*requestedItems

        let endValue = initialValue + requestedItems - 1 
        console.log(`requesedPageNumber: ${requestedPageNumber} requestedItemsNumber: ${requestedItems} length: ${totalImageLength} totalPage: ${totalPage} initialValue: ${initialValue} endValue: ${endValue} totalImageLength: ${totalImageLength}`)
        
        console.log(requestedPageNumber<=totalPage)
        console.log(endValue<=totalImageLength)
        if((requestedPageNumber <= totalPage) && (endValue <= totalImageLength) && requestedPageNumber != 0){
            let requetedArrayOfImages = []
            let counter = 0
            for(var i = initialValue; i <= endValue; i++){
                requetedArrayOfImages[counter] = result[i];
                console.log(`i = ${i} counter = ${counter}`)
                counter = counter + 1
            }
            res.send(requetedArrayOfImages)
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
    const deleteparameter = {_id: ObjectId(imageId)}
    const deleteImageResponse = uploadImageCollection.deleteOne(deleteparameter, (error, object)=>{
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