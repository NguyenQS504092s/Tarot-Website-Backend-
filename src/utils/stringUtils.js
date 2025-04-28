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
 * Lấy danh sách các giá trị enum từ một trường cụ thể trong schema Mongoose.
 * Hỗ trợ lấy enum từ trường trực tiếp hoặc trường lồng trong một mảng (ví dụ: 'arrayField.enumField').
 * @param {mongoose.Schema} schema - Schema Mongoose cần kiểm tra.
 * @param {string} path - Đường dẫn đến trường chứa enum (ví dụ: 'status', 'items.type').
 * @returns {Array<string>|null} - Mảng các giá trị enum hợp lệ, hoặc null nếu trường không tồn tại hoặc không phải là enum.
 */
const getEnumValues = (schema, path) => {
  // Thử lấy trực tiếp từ đường dẫn
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
