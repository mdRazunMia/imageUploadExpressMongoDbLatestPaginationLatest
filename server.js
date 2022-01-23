const express = require('express');
require('dotenv').config();
const cors = require('cors');
const uploadRoute = require("./routes/uploadImageRoute")

const app = express();

const port = process.env.PORT || 3000;

//midleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('./uploads'));

//Route for uploading image
app.use('/uploads', uploadRoute);


app.listen(port, () => {
    console.log('Dot Online Server is running on port', port);
});