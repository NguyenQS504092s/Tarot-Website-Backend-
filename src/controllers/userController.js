const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const crypto = require('crypto');

/**
 * Tạo token JWT và trả về response
 */
const sendToken = (user, statusCode, res) => {
  // Tạo JWT token
  const token = user.getSignedJwtToken();
  const refreshToken = user.getRefreshToken();

  // Xóa password khỏi output
  user.password = undefined;

  res.status(statusCode).json(ApiResponse.success({
    user,
    token,
    refreshToken
  }, 'Xác thực thành công'));
};

/**
 * @desc    Đăng ký người dùng mới
 * @route   POST /api/users/register
 * @access  Public
 */
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Kiểm tra đã tồn tại người dùng
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new ApiError('Email đã được sử dụng', 400));
    }

    // Tạo người dùng mới
    const user = await User.create({
      name,
      email,
      password
    });

    // Tạo token và trả về response
    sendToken(user, 201, res);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Đăng nhập người dùng
 * @route   POST /api/users/login
 * @access  Public
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Kiểm tra email và password
    if (!email || !password) {
      return next(new ApiError('Vui lòng cung cấp email và mật khẩu', 400));
    }

    // Kiểm tra người dùng tồn tại
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return next(new ApiError('Email hoặc mật khẩu không chính xác', 401));
    }

    // Kiểm tra mật khẩu
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(new ApiError('Email hoặc mật khẩu không chính xác', 401));
    }

    // Tạo token và trả về response
    sendToken(user, 200, res);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Làm mới token
 * @route   POST /api/users/refresh-token
 * @access  Public
 */
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return next(new ApiError('Không có refresh token', 400));
    }

    // Xác thực refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

    // Tìm người dùng
    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new ApiError('Token không hợp lệ', 401));
    }

    // Tạo token mới
    const token = user.getSignedJwtToken();

    res.status(200).json(ApiResponse.success({ token }, 'Làm mới token thành công'));
  } catch (error) {
    return next(new ApiError('Token không hợp lệ hoặc đã hết hạn', 401));
  }
};

/**
 * @desc    Lấy thông tin người dùng hiện tại
 * @route   GET /api/users/me
 * @access  Private
 */
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json(ApiResponse.success({ user }, 'Lấy thông tin người dùng thành công'));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cập nhật thông tin cá nhân
 * @route   PUT /api/users/update-profile
 * @access  Private
 */
exports.updateProfile = async (req, res, next) => {
  try {
    // Các trường được phép cập nhật
    const fieldsToUpdate = {
      name: req.body.name,
      birthDate: req.body.birthDate,
      zodiacSign: req.body.zodiacSign
    };

    // Loại bỏ các trường không được cung cấp
    Object.keys(fieldsToUpdate).forEach(
      key => fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
    );

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    res.status(200).json(ApiResponse.success({ user }, 'Cập nhật thông tin cá nhân thành công'));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Quên mật khẩu
 * @route   POST /api/users/forgot-password
 * @access  Public
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return next(new ApiError('Không tìm thấy người dùng với email này', 404));
    }

    // Trong thực tế, sẽ gửi email với token đặt lại mật khẩu
    // Ở đây chúng ta mô phỏng bằng cách tạo token và trả về
    const resetToken = crypto.randomBytes(20).toString('hex');

    user.passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    // Token hết hạn sau 10 phút
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    await user.save({ validateBeforeSave: false });

    res.status(200).json(ApiResponse.success(
      null, // Do NOT return the reset token in the response
      'Token đặt lại mật khẩu đã được gửi đến email (nếu email tồn tại)' // Adjusted message slightly
    ));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Đặt lại mật khẩu
 * @route   PUT /api/users/reset-password/:resetToken
 * @access  Public
 */
exports.resetPassword = async (req, res, next) => {
  try {
    // Trong thực tế, sẽ lấy token từ param URL và password mới từ request body
    const { resetToken } = req.params;
    const { password } = req.body;

    if (!resetToken || !password) {
      return next(new ApiError('Vui lòng cung cấp token và mật khẩu mới', 400));
    }

    // Demo code - trong thực tế sẽ xác thực token và cập nhật mật khẩu
    // Băm token để so sánh với token đã lưu trong DB
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    // Tìm user với token hợp lệ và chưa hết hạn
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });
    
    // Nếu token không hợp lệ hoặc đã hết hạn
    if (!user) {
      return next(new ApiError('Token không hợp lệ hoặc đã hết hạn', 400));
    }
    
    // Đặt mật khẩu mới và xóa thông tin reset token
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    
    await user.save();

    // Tự động đăng nhập người dùng sau khi đặt lại mật khẩu
    sendToken(user, 200, res);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Đổi mật khẩu
 * @route   PUT /api/users/change-password
 * @access  Private
 */
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return next(new ApiError('Vui lòng cung cấp mật khẩu hiện tại và mật khẩu mới', 400));
    }

    // Lấy user hiện tại với password
    const user = await User.findById(req.user.id).select('+password');

    // Kiểm tra xem mật khẩu hiện tại có đúng không
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return next(new ApiError('Mật khẩu hiện tại không chính xác', 401));
    }

    // Cập nhật mật khẩu
    user.password = newPassword;
    await user.save();

    sendToken(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// Removed unused getReaders function

/**
 * @desc    ADMIN - Lấy danh sách tất cả người dùng
 * @route   GET /api/users/admin/users
 * @access  Admin
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, role } = req.query;
    const skip = (page - 1) * limit;

    // Tạo filter
    const filter = {};
    if (role) filter.role = role;

    const totalUsers = await User.countDocuments(filter);
    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json(
      ApiResponse.pagination(
        users,
        parseInt(page),
        parseInt(limit),
        totalUsers,
        'Lấy danh sách người dùng thành công'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    ADMIN - Lấy thông tin chi tiết một người dùng
 * @route   GET /api/users/:id
 * @access  Admin
 */
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(new ApiError('Không tìm thấy người dùng', 404));
    }

    res.status(200).json(ApiResponse.success({ user }, 'Lấy thông tin người dùng thành công'));
  } catch (error) {
    next(error);
  }
};

// Removed unused updateUser function

/**
 * @desc    ADMIN - Xóa người dùng
 * @route   DELETE /api/users/admin/:id
 * @access  Admin
 */
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return next(new ApiError('Không tìm thấy người dùng', 404));
    }

    res.status(200).json(ApiResponse.success(null, 'Xóa người dùng thành công'));
  } catch (error) {
    next(error);
  }
};
