const multer=require("multer");
const {CloudinaryStorage} = require("multer-storage-cloudinary");

const clodinary=require("./cloudinaryConfig");



// configure cloudinary storage

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "images", // Optional: specify a folder in Cloudinary
    allowed_formats: ["jpg", "png"], // Allowed file formats
    public_id: (req, file) => file.originalname, // Optionally use the original filename
  },
});

// multer upload middleware using cloudinary storage
const upload=multer({storage});


module.exports=upload;