import multer from "multer";

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export default upload;

// import s3 from "../awsConfig.js";
// import dotenv from "dotenv";
// import multer from "multer";
// import multerS3 from "multer-s3";

// dotenv.config();

// const upload = multer({
//   storage: multerS3({
//     s3: s3,
//     bucket: process.env.AWS_S3_BUCKET_NAME,
//     metadata: (req, file, cb) => {
//       cb(null, { fieldName: file.fieldname });
//     },
//     key: (req, file, cb) => {
//       cb(null, `uploads/${Date.now()}_${file.originalname}`);
//     },
//   }),
// });

//export default upload;
