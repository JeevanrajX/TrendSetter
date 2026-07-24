import axios from 'axios'

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

console.log("Cloudinary Cloud Name:", CLOUD_NAME)
console.log("Cloudinary Upload Preset:", UPLOAD_PRESET)

export async function uploadImage(file) {
  if (!CLOUD_NAME) {
    throw new Error(
      "VITE_CLOUDINARY_CLOUD_NAME is missing. Check your .env file."
    )
  }

  if (!UPLOAD_PRESET) {
    throw new Error(
      "VITE_CLOUDINARY_UPLOAD_PRESET is missing. Check your .env file."
    )
  }

  const formData = new FormData()
  formData.append("file", file)
  formData.append("upload_preset", UPLOAD_PRESET)

  try {
    const { data } = await axios.post(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      formData
    )

    return data.secure_url
  } catch (error) {
    console.error("Cloudinary Upload Error:", error.response?.data || error)
    throw error
  }
}