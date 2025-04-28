/**
 * Spread Service - Xử lý logic liên quan đến các kiểu trải bài Tarot
 */
const Spread = require('../models/spreadModel');
const ApiError = require('../utils/apiError');

/**
 * Lấy tất cả các kiểu trải bài đang hoạt động.
 * @returns {Promise<Array>} Danh sách các kiểu trải bài
 */
exports.getAllActiveSpreads = async () => {
  try {
    // Chỉ lấy các trường cần thiết cho danh sách public
    const spreads = await Spread.find({ isActive: true })
                                .select('name description cardCount'); // Chỉ chọn các trường cần thiết
    return spreads;
  } catch (error) {
    throw new ApiError(`Lỗi khi lấy danh sách kiểu trải bài: ${error.message}`, 500);
  }
};

/**
 * Lấy thông tin chi tiết một kiểu trải bài theo ID.
 * @param {String} spreadId ID của kiểu trải bài
 * @returns {Promise<Object>} Chi tiết kiểu trải bài
 */
exports.getSpreadById = async (spreadId) => {
  try {
    const spread = await Spread.findById(spreadId);
    if (!spread) {
      throw new ApiError('Không tìm thấy kiểu trải bài', 404);
    }
    return spread;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error.name === 'CastError') {
        throw new ApiError(`ID kiểu trải bài không hợp lệ: ${spreadId}`, 400);
    }
    throw new ApiError(`Lỗi khi lấy chi tiết kiểu trải bài: ${error.message}`, 500);
  }
};

/**
 * Tạo kiểu trải bài mới (Admin).
 * @param {Object} spreadData Dữ liệu kiểu trải bài
 * @returns {Promise<Object>} Kiểu trải bài mới được tạo
 */
exports.createSpread = async (spreadData) => {
  try {
    // Kiểm tra xem tên đã tồn tại chưa
    const existingSpread = await Spread.findOne({ name: spreadData.name });
    if (existingSpread) {
      throw new ApiError(`Kiểu trải bài với tên "${spreadData.name}" đã tồn tại`, 400);
    }

    // Validate positions array if provided
    if (spreadData.positions && spreadData.positions.length !== spreadData.cardCount) {
        throw new ApiError(`Số lượng vị trí (${spreadData.positions.length}) không khớp với số lượng lá bài (${spreadData.cardCount})`, 400);
    }

    const newSpread = await Spread.create(spreadData);
    return newSpread;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error.name === 'ValidationError') {
      throw new ApiError(`Lỗi validation khi tạo kiểu trải bài: ${error.message}`, 400);
    }
    throw new ApiError(`Lỗi khi tạo kiểu trải bài: ${error.message}`, 500);
  }
};

/**
 * Cập nhật kiểu trải bài (Admin).
 * @param {String} spreadId ID của kiểu trải bài
 * @param {Object} updateData Dữ liệu cập nhật
 * @returns {Promise<Object>} Kiểu trải bài đã được cập nhật
 */
exports.updateSpread = async (spreadId, updateData) => {
  try {
    // Validate positions array if provided and cardCount is changing
    if (updateData.positions && updateData.cardCount && updateData.positions.length !== updateData.cardCount) {
         throw new ApiError(`Số lượng vị trí (${updateData.positions.length}) không khớp với số lượng lá bài (${updateData.cardCount})`, 400);
    }
    // If only positions are updated, check against existing cardCount
    else if (updateData.positions && !updateData.cardCount) {
        const existingSpread = await Spread.findById(spreadId).select('cardCount');
        if (existingSpread && updateData.positions.length !== existingSpread.cardCount) {
            throw new ApiError(`Số lượng vị trí (${updateData.positions.length}) không khớp với số lượng lá bài hiện tại (${existingSpread.cardCount})`, 400);
        }
    }


    const updatedSpread = await Spread.findByIdAndUpdate(spreadId, updateData, {
      new: true, // Trả về document sau khi cập nhật
      runValidators: true // Chạy validators của Mongoose khi cập nhật
    });

    if (!updatedSpread) {
      throw new ApiError('Không tìm thấy kiểu trải bài để cập nhật', 404);
    }
    return updatedSpread;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error.name === 'ValidationError') {
      throw new ApiError(`Lỗi validation khi cập nhật kiểu trải bài: ${error.message}`, 400);
    }
    if (error.code === 11000 && error.keyPattern && error.keyPattern.name) {
        throw new ApiError(`Tên kiểu trải bài "${updateData.name}" đã tồn tại`, 400);
    }
    throw new ApiError(`Lỗi khi cập nhật kiểu trải bài: ${error.message}`, 500);
  }
};

/**
 * Xóa (hủy kích hoạt) kiểu trải bài (Admin).
 * @param {String} spreadId ID của kiểu trải bài
 * @returns {Promise<void>}
 */
exports.deleteSpread = async (spreadId) => {
  try {
    // Thay vì xóa hẳn, chúng ta chỉ cập nhật trạng thái isActive = false
    const spread = await Spread.findByIdAndUpdate(spreadId, { isActive: false }, { new: true });

    if (!spread) {
      throw new ApiError('Không tìm thấy kiểu trải bài để xóa', 404);
    }
    // Không cần trả về gì khi hủy kích hoạt thành công
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(`Lỗi khi xóa kiểu trải bài: ${error.message}`, 500);
  }
};
