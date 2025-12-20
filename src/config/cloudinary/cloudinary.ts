import cloudinary from '.';

export default function uploadToCloudinary(
  file: Express.Multer.File,
): Promise<any> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: 'auto' },
      (error, result) => {
        if (error) {
          return reject(new Error(error.message || 'Cloudinary upload failed'));
        }
        resolve(result);
      },
    );

    uploadStream.end(file.buffer);
  });
}
