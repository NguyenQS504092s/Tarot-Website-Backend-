const User = require('../models/userModel');
const jwt = require('jsonwebtoken');

/**
 * Tạo token JWT và trả về response
 */
const sendToken = (user, statusCode, res) => {
  // Tạo JWT token
  const token = user.getSignedJwtToken();
  const refreshToken = user.getRefreshToken();

  // Xóa password khỏi output
  user.password = undefined;

  res.status(statusCode).json({
    success: true,
    token,
    refreshToken,
    data: {
      user
    }
  });
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
      return res.status(400).json({
        success: false,
        message: 'Email đã được sử dụng'
      });
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
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp email và mật khẩu'
      });
    }

    // Kiểm tra người dùng tồn tại
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không chính xác'
      });
    }

    // Kiểm tra mật khẩu
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không chính xác'
      });
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
      return res.status(400).json({
        success: false,
        message: 'Không có refresh token'
      });
    }

    // Xác thực refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

    // Tìm người dùng
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ'
      });
    }

    // Tạo token mới
    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      token
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ hoặc đã hết hạn'
    });
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

    res.status(200).json({
      success: true,
      data: {
        user
      }
    });
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

    res.status(200).json({
      success: true,
      data: {
        user
      }
    });
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
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng với email này'
      });
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

    res.status(200).json({
      success: true,
      message: 'Token đặt lại mật khẩu đã được gửi đến email',
      resetToken // Trong thực tế không nên trả về token này
    });
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
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp token và mật khẩu mới'
      });
    }

    // Demo code - trong thực tế sẽ xác thực token và cập nhật mật khẩu
    res.status(200).json({
      success: true,
      message: 'Mật khẩu đã được đặt lại thành công'
    });
  } catch (error) {
    next(error);
  }
};