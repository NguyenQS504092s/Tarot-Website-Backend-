/**
 * Spread Controller - Xử lý các request liên quan đến kiểu trải bài
 */
const spreadService = require('../services/spreadService');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError'); // Import ApiError

/**
 * @desc    Lấy danh sách tất cả các kiểu trải bài đang hoạt động
 * @route   GET /api/spreads
 * @access  Public
 */
exports.getAllActiveSpreads = async (req, res, next) => {
  try {
    const spreads = await spreadService.getAllActiveSpreads();
    res.status(200).json(ApiResponse.success(spreads, 'Lấy danh sách kiểu trải bài thành công'));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lấy thông tin chi tiết một kiểu trải bài (Public/Admin)
 * @route   GET /api/spreads/:id
 * @access  Public (for public spreads), Admin (for all spreads)
 */
exports.getSpreadById = async (req, res, next) => {
  try {
    // Validator handles ID format check
    const spread = await spreadService.getSpreadById(req.params.id); // Service throws 404 if ID doesn't exist

    // If req.user exists, it means the request came through an authenticated route (likely admin)
    if (req.user) {
      // Authenticated user (Admin in this case, due to route protection) can access any spread
      const message = !spread.isActive 
        ? 'Lấy chi tiết kiểu trải bài không hoạt động thành công (Admin)' 
        : 'Lấy chi tiết kiểu trải bài thành công';
      return res.status(200).json(ApiResponse.success({ spread }, message));
    } else {
      // Public access: Only return active spreads
      if (spread.isActive) {
        return res.status(200).json(ApiResponse.success({ spread }, 'Lấy chi tiết kiểu trải bài thành công'));
      } else {
        // Treat inactive spreads as not found for public users
        return next(new ApiError('Không tìm thấy kiểu trải bài', 404));
      }
    }
  } catch (error) {
    // Catch errors from service (like actual not found) or other issues
    next(error);
  }
};

/**
 * @desc    Tạo kiểu trải bài mới (Admin)
 * @route   POST /api/spreads/admin/
 * @access  Admin
 */
exports.createSpread = async (req, res, next) => {
  try {
    // Validator handles request body check
    const newSpread = await spreadService.createSpread(req.body);
    // Service handles duplicate errors
    res.status(201).json(ApiResponse.success({ spread: newSpread }, 'Tạo kiểu trải bài thành công', 201));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cập nhật kiểu trải bài (Admin)
 * @route   PUT /api/spreads/admin/:id
 * @access  Admin
 */
exports.updateSpread = async (req, res, next) => {
  try {
    // Validator handles ID and request body check
    const updatedSpread = await spreadService.updateSpread(req.params.id, req.body);
    // Service handles not found and duplicate errors
    res.status(200).json(ApiResponse.success({ spread: updatedSpread }, 'Cập nhật kiểu trải bài thành công'));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Xóa kiểu trải bài (Admin)
 * @route   DELETE /api/spreads/admin/:id
 * @access  Admin
 */
exports.deleteSpread = async (req, res, next) => {
  try {
    // Validator handles ID format check
    await spreadService.deleteSpread(req.params.id);
    // Service handles not found error
    // Send 204 No Content for successful deletion
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
