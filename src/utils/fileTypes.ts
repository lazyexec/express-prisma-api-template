interface AllowedTypes {
  [field: string]: string[];
}
const avatarTypes = [
  "image/jpeg",
  "image/png",
  "image/jpg",
  "image/heic",
  "image/heif",
];
const messageTypes = [
  "image/jpeg",
  "image/png",
  "image/jpg",
  "image/heic",
  "image/heif",
];
const contentTypes = [
  "image/jpeg",
  "image/png",
  "image/jpg",
  "image/heic",
  "image/heif",
  // video
  "video/mp4",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-ms-wmv",
  "video/3gpp",
  "video/3gpp2",
  "video/ogg",
  "video/webm",
];

const documentTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/jpg",
  "image/heic",
  "image/heif",
];

const allowedTypes: AllowedTypes = {
  avatar: avatarTypes,
  logo: avatarTypes,
};
export default allowedTypes;
