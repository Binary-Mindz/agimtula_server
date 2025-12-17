import cloudinary from '.';

export async function deleteFromCloudinary(publicId: string): Promise<any> {
  return cloudinary.uploader.destroy(publicId);
}
