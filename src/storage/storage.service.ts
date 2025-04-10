import { Injectable, Logger } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StorageService {
  private s3: S3Client;
  private bucketName: string;
  private readonly logger = new Logger(StorageService.name);

  constructor() {
    const region = process.env.AWS_REGION;
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const bucketName = process.env.AWS_S3_BUCKET;

    if (!region || !accessKeyId || !secretAccessKey || !bucketName) {
      throw new Error('Missing required AWS environment variables');
    }

    this.s3 = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    this.bucketName = bucketName;
  }

  /**
   * Generates a unique media ID.
   */
  async generateMediaId(): Promise<string> {
  return uuidv4();
  }

  /**
   * Saves a file to AWS S3.
   * @param path - The path where the file will be stored in the bucket.
   * @param contentType - The MIME type of the file.
   * @param media - The file content as a Buffer.
   * @param metadata - Additional metadata to associate with the file.
   * @returns An object containing the media ID.
   */
  async save(
    path: string,
    contentType: string,
    media: Buffer,
    metadata: { [key: string]: string }[],
  ): Promise<{ mediaId: string }> {
    try {
      const objectMetadata = metadata.reduce((obj, item) => Object.assign(obj, item), {});
      const mediaId = objectMetadata['mediaId'] || (await this.generateMediaId());
      const key = `${path}/${mediaId}`;

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: media,
        ContentType: contentType,
        Metadata: objectMetadata,
      });

      await this.s3.send(command);

      this.logger.log(`File uploaded successfully: ${key}`);
      return { mediaId };
    } catch (error) {
      this.logger.error('Error uploading to S3', error.stack);
      throw new Error('Failed to upload file to S3');
    }
  }

  async upload(path: string, fileBuffer: Buffer): Promise<void> {
    // Implement the logic to upload the file to your storage (e.g., AWS S3, local storage, etc.)
    console.log(`Uploading file to ${path}`);
    // Example for local storage:
    const fs = require('fs');
    const fullPath = `./uploads/${path}`;
    fs.writeFileSync(fullPath, fileBuffer);
  }


  /**
   * Deletes a file from AWS S3.
   * @param path - The path of the file to delete.
   */
  async delete(path: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: path,
      });

      await this.s3.send(command);
      this.logger.log(`File deleted successfully: ${path}`);
    } catch (error) {
      if (error.name === 'NoSuchKey') {
        this.logger.warn(`File not found: ${path}`);
        throw new Error('File not found');
      }
      this.logger.error('Error deleting file from S3', error.stack);
      throw new Error('Failed to delete file from S3');
    }
  }
}