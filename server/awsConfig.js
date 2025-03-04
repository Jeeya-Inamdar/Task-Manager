import pkg from "aws-sdk";
import dotenv from "dotenv";

dotenv.config();

const { S3 } = pkg;
const s3 = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_DEFAULT_REGION,
});

export default s3;
