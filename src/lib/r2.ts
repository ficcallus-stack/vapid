import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;

let _s3Client: S3Client | null = null;

function getS3Client() {
  if (_s3Client) return _s3Client;

  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    throw new Error(
      "Missing R2 cloudflare credentials. Please establish R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY in env variables."
    );
  }

  _s3Client = new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID || "",
      secretAccessKey: R2_SECRET_ACCESS_KEY || "",
    },
  });

  return _s3Client;
}

export async function uploadToR2(
  file: Buffer,
  fileName: string,
  contentType: string
) {
  if (!R2_BUCKET_NAME) throw new Error("R2_BUCKET_NAME is not defined");

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: fileName,
    Body: file,
    ContentType: contentType,
  });

  await getS3Client().send(command);
  
  try {
    return getPublicR2Url(fileName);
  } catch (e) {
    // Fallback if NEXT_PUBLIC_R2_PUBLIC_URL is missing
    console.warn("NEXT_PUBLIC_R2_PUBLIC_URL not set, returning fileName only");
    return fileName;
  }
}

export async function getPresignedUrl(fileName: string) {
  if (!process.env.R2_BUCKET_NAME) throw new Error("R2_BUCKET_NAME is not defined");

  const command = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: fileName,
  });

  return await getSignedUrl(getS3Client(), command, { expiresIn: 3600 });
}

export function getPublicR2Url(fileName: string) {
  const publicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
  if (!publicUrl) {
    throw new Error("NEXT_PUBLIC_R2_PUBLIC_URL is not defined");
  }

  // Ensure no double slashes if publicUrl ends with /
  const base = publicUrl.endsWith('/') ? publicUrl.slice(0, -1) : publicUrl;
  return `${base}/${fileName}`;
}

export async function createPresignedUploadUrl(fileName: string, contentType: string) {
  if (!process.env.R2_BUCKET_NAME) throw new Error("R2_BUCKET_NAME is not defined");

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: fileName,
    ContentType: contentType, // strictly enforce browser headers
  });

  return await getSignedUrl(getS3Client(), command, { expiresIn: 3600 });
}
