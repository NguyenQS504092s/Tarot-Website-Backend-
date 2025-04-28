const { body, param, validationResult } = require('express-validator');
const ApiError = require('../utils/apiError');

// Middleware để xử lý lỗi validation tập trung
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Lấy lỗi đầu tiên để trả về (có thể tùy chỉnh để trả về tất cả lỗi)
    const firstError = errors.array({ onlyFirstError: true })[0];
    return next(new ApiError(firstError.msg, 400));
    // Hoặc trả về tất cả lỗi:
    // return res.status(400).json(ApiResponse.fail(errors.array(), 'Dữ liệu không hợp lệ', 400));
  }
  next();
};

// Validator cho việc tạo Spread mới
exports.createSpreadValidator = [
  body('name')
    .notEmpty().withMessage('Tên kiểu trải bài là bắt buộc')
    .isString().withMessage('Tên kiểu trải bài phải là chuỗi')
    .trim(),
  body('description')
    .notEmpty().withMessage('Mô tả là bắt buộc')
    .isString().withMessage('Mô tả phải là chuỗi')
    .trim(),
  body('cardCount')
    .notEmpty().withMessage('Số lượng lá bài là bắt buộc')
    .isInt({ min: 1 }).withMessage('Số lượng lá bài phải là số nguyên lớn hơn 0'),
  body('positions')
    .optional() // positions là tùy chọn
    .isArray().withMessage('Vị trí phải là một mảng')
    .custom((positions, { req }) => {
      // Nếu positions được cung cấp, nó phải khớp với cardCount
      if (positions && req.body.cardCount && positions.length !== parseInt(req.body.cardCount, 10)) {
        throw new Error('Số lượng vị trí không khớp với số lượng lá bài');
      }
      return true;
    }),
  // Validate từng item trong mảng positions nếu có
  body('positions.*.positionNumber')
    .if(body('positions').exists()) // Chỉ validate nếu positions tồn tại
    .notEmpty().withMessage('Số thứ tự vị trí là bắt buộc')
    .isInt({ min: 1 }).withMessage('Số thứ tự vị trí phải là số nguyên dương'),
  body('positions.*.name')
    .if(body('positions').exists())
    .notEmpty().withMessage('Tên vị trí là bắt buộc')
    .isString().withMessage('Tên vị trí phải là chuỗi')
    .trim(),
  body('positions.*.meaning')
    .if(body('positions').exists())
    .notEmpty().withMessage('Ý nghĩa vị trí là bắt buộc')
    .isString().withMessage('Ý nghĩa vị trí phải là chuỗi')
    .trim(),
  body('isActive')
    .optional()
    .isBoolean().withMessage('Trạng thái kích hoạt phải là true hoặc false'),
  handleValidationErrors // Áp dụng middleware xử lý lỗi
];

// Validator cho việc cập nhật Spread
exports.updateSpreadValidator = [
  param('id').isMongoId().withMessage('ID kiểu trải bài không hợp lệ'),
  body('name')
    .optional()
    .isString().withMessage('Tên kiểu trải bài phải là chuỗi')
    .trim(),
  body('description')
    .optional()
    .isString().withMessage('Mô tả phải là chuỗi')
    .trim(),
  body('cardCount')
    .optional()
    .isInt({ min: 1 }).withMessage('Số lượng lá bài phải là số nguyên lớn hơn 0'),
  body('positions')
    .optional()
    .isArray().withMessage('Vị trí phải là một mảng')
    .custom((positions, { req }) => {
        // Nếu positions được cung cấp, kiểm tra xem nó có khớp với cardCount (nếu cardCount cũng được cập nhật) hoặc cardCount hiện tại không
        // Logic kiểm tra chi tiết hơn nên đặt trong service để truy cập DB lấy cardCount hiện tại nếu cần
        // Ở đây chỉ kiểm tra cơ bản là array
        return true;
    }),
  // Validate từng item trong mảng positions nếu có
  body('positions.*.positionNumber')
    .if(body('positions').exists())
    .notEmpty().withMessage('Số thứ tự vị trí là bắt buộc')
    .isInt({ min: 1 }).withMessage('Số thứ tự vị trí phải là số nguyên dương'),
  body('positions.*.name')
    .if(body('positions').exists())
    .notEmpty().withMessage('Tên vị trí là bắt buộc')
    .isString().withMessage('Tên vị trí phải là chuỗi')
    .trim(),
  body('positions.*.meaning')
    .if(body('positions').exists())
    .notEmpty().withMessage('Ý nghĩa vị trí là bắt buộc')
    .isString().withMessage('Ý nghĩa vị trí phải là chuỗi')
    .trim(),
  body('isActive')
    .optional()
    .isBoolean().withMessage('Trạng thái kích hoạt phải là true hoặc false'),
  // Đảm bảo ít nhất một trường được cung cấp để cập nhật
  body().custom((value, { req }) => {
    if (Object.keys(req.body).length === 0) {
      throw new Error('Vui lòng cung cấp ít nhất một trường để cập nhật');
    }
    return true;
  }),
  handleValidationErrors
];

// Validator cho ID trong params
exports.spreadIdValidator = [
  param('id').isMongoId().withMessage('ID kiểu trải bài không hợp lệ'),
  handleValidationErrors
];
