/**
 * Chuẩn hóa chuỗi: chuyển sang chữ thường, loại bỏ dấu tiếng Việt.
 * @param {string} str Chuỗi cần chuẩn hóa
 * @returns {string} Chuỗi đã được chuẩn hóa
 */
const normalizeString = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize("NFD") // Tách dấu và chữ cái
    .replace(/[\u0300-\u036f]/g, "") // Loại bỏ dấu
    .replace(/đ/g, "d"); // Chuyển đổi 'đ' thành 'd'
};

/**
 * Lấy danh sách các giá trị enum từ schema Mongoose.
 * @param {mongoose.Schema} schema Schema Mongoose
 * @param {string} path Đường dẫn đến trường có enum
 * @returns {Array<string>|null} Mảng các giá trị enum hoặc null nếu không tìm thấy
 */
const getEnumValues = (schema, path) => {
  const schemaPath = schema.path(path);
  if (schemaPath && schemaPath.enumValues) {
    return schemaPath.enumValues;
  }
  // Check if it's within an array's subdocument
  const parts = path.split('.');
  if (parts.length > 1) {
      const arrayPath = parts[0];
      const subPath = parts.slice(1).join('.');
      const arraySchemaPath = schema.path(arrayPath);
      if (arraySchemaPath && arraySchemaPath.schema) {
          const subSchemaPath = arraySchemaPath.schema.path(subPath);
          if (subSchemaPath && subSchemaPath.enumValues) {
              return subSchemaPath.enumValues;
          }
      }
  }
  return null;
};


module.exports = {
  normalizeString,
  getEnumValues
};
