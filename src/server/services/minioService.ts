import { Client } from 'minio';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

let minioClient: Client | null = null;
let bucketInitialized = false;
let minioConnectionFailed = false;

const BUCKET_NAME = process.env.MINIO_BUCKET || 'housing-pysync';

// Lazy client setup
function getMinioClient(): Client | null {
  if (minioConnectionFailed) return null;
  if (minioClient) return minioClient;

  const endpoint = process.env.MINIO_ENDPOINT;
  const accessKey = process.env.MINIO_ACCESS_KEY;
  const secretKey = process.env.MINIO_SECRET_KEY;

  // If there are no configured credentials under production, we'll gracefully fallback
  if (!endpoint || !accessKey || !secretKey) {
    console.log("MinIO environment variables are missing. File uploads will fallback to local storage or base64.");
    return null;
  }

  try {
    const port = parseInt(process.env.MINIO_PORT || '9000', 10);
    const useSSL = process.env.MINIO_USE_SSL === 'true';

    minioClient = new Client({
      endPoint: endpoint,
      port: isNaN(port) ? undefined : port,
      useSSL,
      accessKey,
      secretKey
    });

    console.log(`MinIO Client configured successfully for endpoint: ${endpoint}:${port}`);
    return minioClient;
  } catch (err) {
    console.log("Note: Error initializing MinIO Client, bypassing to use local fallback storage:", err);
    minioConnectionFailed = true;
    return null;
  }
}

// Ensures standard bucket is created and set to read-only public access
async function ensureBucket(client: Client): Promise<boolean> {
  if (bucketInitialized) return true;

  try {
    const exists = await client.bucketExists(BUCKET_NAME);
    if (!exists) {
      console.log(`MinIO bucket "${BUCKET_NAME}" does not exist. Creating...`);
      // Most S3 configurations or regions default
      await client.makeBucket(BUCKET_NAME, 'us-east-1');
      console.log(`MinIO bucket "${BUCKET_NAME}" created successfully.`);

      // Apply a public read policy so browser clients can render uploads over standard GET requests
      const policy = {
        Version: "2012-10-17",
        Statement: [
          {
            Sid: "PublicReadGetObject",
            Effect: "Allow",
            Principal: { AWS: ["*"] },
            Action: ["s3:GetObject"],
            Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`]
          }
        ]
      };

      await client.setBucketPolicy(BUCKET_NAME, JSON.stringify(policy));
      console.log(`MinIO bucket policy for "${BUCKET_NAME}" configured with Public Read Access.`);
    }

    bucketInitialized = true;
    return true;
  } catch (err: any) {
    console.log(`Information: Could not configure MinIO bucket "${BUCKET_NAME}" (${err.message || err}). Bypassing CDN storage and falling back to robust local storage.`);
    minioConnectionFailed = true;
    minioClient = null;
    return false;
  }
}

/**
 * Uploads a base64 encoded document/image to MinIO.
 * Fallbacks to a local upload path on the backend server if MinIO is not available
 * so the application remains robust.
 */
export async function uploadFileToCdn(
  base64DataUrl: string, 
  originalName: string
): Promise<string> {
  // If it's already a URL (HTTP/HTTPS), return it directly
  if (base64DataUrl.startsWith('http://') || base64DataUrl.startsWith('https://')) {
    return base64DataUrl;
  }

  // Handle expected data URL format: data:image/png;base64,iVBORw0KGgoAAA...
  if (!base64DataUrl.startsWith('data:')) {
    // If it's not a data URL and not http, maybe it's raw base64 or invalid, return as is
    return base64DataUrl;
  }

  try {
    const parts = base64DataUrl.split(';base64,');
    if (parts.length !== 2) {
      throw new Error("Invalid base64 Data URL format.");
    }

    const mimeType = parts[0].substring(5); // removes 'data:'
    const rawData = parts[1];
    const buffer = Buffer.from(rawData, 'base64');

    const cleanName = originalName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const uniqueId = crypto.randomUUID();
    const objectName = `${uniqueId}_${cleanName}`;

    const client = getMinioClient();
    if (client) {
      const bucketReady = await ensureBucket(client);
      if (bucketReady) {
        console.log(`Uploading ${objectName} to MinIO bucket ${BUCKET_NAME}...`);
        await client.putObject(
          BUCKET_NAME, 
          objectName, 
          buffer, 
          buffer.length, 
          { 'Content-Type': mimeType }
        );

        // Build the CDN URL
        const useSSL = process.env.MINIO_USE_SSL === 'true';
        const protocol = useSSL ? 'https' : 'http';
        const endpoint = process.env.MINIO_ENDPOINT;
        const port = process.env.MINIO_PORT || '9000';
        
        let fileUrl = '';
        if (port === '80' || port === '443') {
          fileUrl = `${protocol}://${endpoint}/${BUCKET_NAME}/${objectName}`;
        } else {
          fileUrl = `${protocol}://${endpoint}:${port}/${BUCKET_NAME}/${objectName}`;
        }

        console.log(`Successfully uploaded file to MinIO. CDN URL: ${fileUrl}`);
        return fileUrl;
      }
    }

    // --- FALLBACK TO LOCAL DIRECTORY STORE ---
    console.log("MinIO is not available. Falling back to local filesystem store.");
    
    // Ensure public uploads directory exists
    const localUploadsDir = path.join(process.cwd(), 'dist', 'uploads');
    if (!fs.existsSync(localUploadsDir)) {
      fs.mkdirSync(localUploadsDir, { recursive: true });
    }

    const localFileName = `${uniqueId}_${cleanName}`;
    const localFilePath = path.join(localUploadsDir, localFileName);
    fs.writeFileSync(localFilePath, buffer);

    // Build local serving URL
    const appUrl = (process.env.APP_URL || '').replace(/\/$/, '') || 'http://localhost:3000';
    const localUrl = `${appUrl}/uploads/${localFileName}`;
    console.log(`Saved file to local directory. URL: ${localUrl}`);
    return localUrl;

  } catch (error) {
    console.log("Note: Error processing upload file, returning inline data URL to maintain service continuity:", error);
    // Absolute fallback: return original data URL so nothing breaks if everything fails
    return base64DataUrl;
  }
}
