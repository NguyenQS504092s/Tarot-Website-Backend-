/**
 * Class hỗ trợ tạo phản hồi API chuẩn hóa
 */
class ApiResponse {
  /**
   * Tạo phản hồi thành công
   * @param {Object} data - Dữ liệu trả về
   * @param {String} message - Thông báo phản hồi
   * @param {Number} statusCode - Mã trạng thái HTTP
   * @returns {Object} - Đối tượng phản hồi API
   */
  static success(data, message = 'Thao tác thành công', statusCode = 200) {
    return {
      success: true,
      message,
      code: statusCode,
      data
    };
  }

  /**
   * Tạo phản hồi lỗi
   * @param {String} message - Thông báo lỗi
   * @param {Number} statusCode - Mã trạng thái HTTP
   * @param {Object} errors - Chi tiết lỗi (tùy chọn)
   * @returns {Object} - Đối tượng phản hồi API
   */
  static error(message, statusCode = 500, errors = null) {
    const response = {
      success: false,
      message,
      code: statusCode
    };

    if (errors) {
      response.errors = errors;
    }

    return response;
  }

  /**
   * Tạo phản hồi cho dữ liệu phân trang
   * @param {Array} data - Dữ liệu trả về
   * @param {Number} page - Trang hiện tại
   * @param {Number} limit - Số lượng mục trên mỗi trang
   * @param {Number} total - Tổng số mục
   * @param {String} message - Thông báo phản hồi
   * @returns {Object} - Đối tượng phản hồi API với metadata phân trang
   */
  static pagination(data, page, limit, total, message = 'Lấy dữ liệu thành công') {
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      success: true,
      message,
      code: 200,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    };
  }
}

module.exports = ApiResponse;