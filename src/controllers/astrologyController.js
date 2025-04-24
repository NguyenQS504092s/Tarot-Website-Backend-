const Zodiac = require('../models/zodiacModel');
const Zodiac = require('../models/zodiacModel');
const Horoscope = require('../models/horoscopeModel');
const Card = require('../models/cardModel');
const astrologyService = require('../services/astrologyService'); // Import the service
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const { normalizeString, getEnumValues } = require('../utils/stringUtils'); // Import utils

/**
 * @desc    Lấy danh sách tất cả các cung hoàng đạo
 * @route   GET /api/horoscope/signs
 * @access  Public
 */
exports.getAllZodiacSigns = async (req, res, next) => {
  try {
    // Lấy dữ liệu từ database
    const zodiacSigns = await Zodiac.find().select('name nameEn symbol element period');
    
    // Trả về dữ liệu (có thể là mảng rỗng nếu DB trống)
    res.status(200).json(ApiResponse.success(zodiacSigns, 'Lấy danh sách cung hoàng đạo thành công'));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Xóa tử vi hàng ngày (dành cho admin)
 * @route   DELETE /api/horoscope/:id
 * @access  Admin
 */
exports.deleteDailyHoroscope = async (req, res, next) => {
  try {
    const horoscopeId = req.params.id;

    // TODO: Add validation for horoscopeId if needed (e.g., isMongoId)

    // Call service to delete
    await astrologyService.deleteDailyHoroscope(horoscopeId); // Use the service

    // Service handles 'not found' error

    res.status(200).json(ApiResponse.success(null, 'Xóa tử vi thành công'));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lấy thông tin chi tiết cung hoàng đạo cụ thể
 * @route   GET /api/horoscope/signs/:sign
 * @access  Public
 */
exports.getZodiacSignInfo = async (req, res, next) => {
  try {
    const inputSign = req.params.sign;
    const normalizedInput = normalizeString(inputSign);

    // Validate input against enum values (normalized comparison)
    const allowedSigns = getEnumValues(Zodiac.schema, 'name');
    if (!allowedSigns) {
      return next(new ApiError('Không thể lấy danh sách cung hoàng đạo hợp lệ từ schema.', 500));
    }

    const matchedSign = allowedSigns.find(s => normalizeString(s) === normalizedInput);

    if (!matchedSign) {
      return next(new ApiError(`Cung hoàng đạo không hợp lệ: ${inputSign}`, 400));
    }

    // Tìm trong database bằng tên đã được xác thực
    const zodiacSign = await Zodiac.findOne({ name: matchedSign })
                                   .populate('tarotRelations.cardId');

    if (!zodiacSign) {
      // This case implies data inconsistency if validation passed, but handle defensively
      return next(new ApiError(`Không tìm thấy thông tin cho cung hoàng đạo: ${matchedSign}`, 404));
    }

    // Remove fallback data logic
    res.status(200).json(ApiResponse.success(zodiacSign, 'Lấy thông tin cung hoàng đạo thành công'));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lấy tử vi hàng ngày theo cung hoàng đạo
 * @route   GET /api/horoscope/:sign
 * @access  Private
 */
exports.getDailyHoroscope = async (req, res, next) => {
  try {
    const inputSign = req.params.sign;
    const { date } = req.query; // Keep date query optional

    // Validate input sign against enum values (normalized comparison)
    const normalizedInput = normalizeString(inputSign);
    const allowedSigns = getEnumValues(Horoscope.schema, 'sign'); // Use Horoscope schema
    if (!allowedSigns) {
      return next(new ApiError('Không thể lấy danh sách cung hoàng đạo hợp lệ từ schema.', 500));
    }
    const matchedSign = allowedSigns.find(s => normalizeString(s) === normalizedInput);

    if (!matchedSign) {
      return next(new ApiError(`Cung hoàng đạo không hợp lệ: ${inputSign}`, 400));
    }

    // Use the static method with the validated sign and optional date
    const queryDate = date ? new Date(date) : undefined; // Pass undefined if date query is missing
    const horoscope = await Horoscope.findDailyHoroscope(matchedSign, queryDate);

    // If no horoscope found for that sign/date in DB
    if (!horoscope) {
      return next(new ApiError(`Không tìm thấy tử vi cho cung ${matchedSign} vào ngày ${queryDate ? queryDate.toLocaleDateString('vi-VN') : 'hôm nay'}.`, 404));
    }

    // Remove fallback data logic
    res.status(200).json(ApiResponse.success(horoscope, 'Lấy tử vi hàng ngày thành công'));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lấy thông tin tương hợp giữa các cung hoàng đạo
 * @route   GET /api/horoscope/compatibility/:sign1/:sign2
 * @access  Private
 */
exports.getZodiacCompatibility = async (req, res, next) => {
  try {
    const { sign1, sign2 } = req.params;

    // Validate input signs
    const allowedSigns = getEnumValues(Zodiac.schema, 'name');
    if (!allowedSigns) {
      return next(new ApiError('Không thể lấy danh sách cung hoàng đạo hợp lệ từ schema.', 500));
    }

    const matchedSign1 = allowedSigns.find(s => normalizeString(s) === normalizeString(sign1));
    const matchedSign2 = allowedSigns.find(s => normalizeString(s) === normalizeString(sign2));

    if (!matchedSign1) {
      return next(new ApiError(`Cung hoàng đạo không hợp lệ: ${sign1}`, 400));
    }
    if (!matchedSign2) {
      return next(new ApiError(`Cung hoàng đạo không hợp lệ: ${sign2}`, 400));
    }
    if (matchedSign1 === matchedSign2) {
      return next(new ApiError('Vui lòng cung cấp hai cung hoàng đạo khác nhau.', 400));
    }

    // Call the service function with validated sign names
    const compatibilityResult = await astrologyService.getZodiacCompatibility(matchedSign1, matchedSign2);

    // Service handles 'not found' errors

    res.status(200).json(ApiResponse.success(compatibilityResult, 'Lấy thông tin tương hợp thành công'));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lấy mối liên hệ giữa Tarot và cung hoàng đạo
 * @route   GET /api/horoscope/tarot-relation/:sign
 * @access  Private
 */
exports.getTarotZodiacRelation = async (req, res, next) => {
  try {
    const inputSign = req.params.sign;

    // Validate input sign
    const normalizedInput = normalizeString(inputSign);
    const allowedSigns = getEnumValues(Zodiac.schema, 'name');
    if (!allowedSigns) {
      return next(new ApiError('Không thể lấy danh sách cung hoàng đạo hợp lệ từ schema.', 500));
    }
    const matchedSign = allowedSigns.find(s => normalizeString(s) === normalizedInput);

    if (!matchedSign) {
      return next(new ApiError(`Cung hoàng đạo không hợp lệ: ${inputSign}`, 400));
    }

    // Call the service function with the validated sign name
    const relationData = await astrologyService.getTarotZodiacRelation(matchedSign);

    // Service handles 'not found' errors

    res.status(200).json(ApiResponse.success(relationData, 'Lấy liên kết Tarot thành công'));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Tạo tử vi hàng ngày mới (dành cho admin)
 * @route   POST /api/horoscope
 * @access  Admin
 */
exports.createDailyHoroscope = async (req, res, next) => {
  try {
    // Data is already validated by createHoroscopeValidator
    const horoscopeData = req.body;
    const authorId = req.user._id; // Get author from authenticated user

    // Call the service function
    const newHoroscope = await astrologyService.createDailyHoroscope(horoscopeData, authorId);

    // Service handles validation and existing checks

    res.status(201).json(ApiResponse.success(newHoroscope, 'Tạo tử vi hàng ngày thành công', 201));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cập nhật tử vi hàng ngày (dành cho admin)
 * @route   PUT /api/horoscope/:id
 * @access  Admin
 */
exports.updateDailyHoroscope = async (req, res, next) => {
  try {
    const horoscopeId = req.params.id; // ID is validated by updateHoroscopeValidator
    const updateData = req.body; // Data is validated by updateHoroscopeValidator

    // Call the service function
    const updatedHoroscope = await astrologyService.updateDailyHoroscope(horoscopeId, updateData);

    // Service handles 'not found' and validation errors

    res.status(200).json(ApiResponse.success(updatedHoroscope, 'Cập nhật tử vi thành công'));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Tạo mới cung hoàng đạo (dành cho admin)
 * @route   POST /api/horoscope/signs
 * @access  Admin
 */
exports.createZodiacSign = async (req, res, next) => {
  try {
    // Data is validated by createZodiacSignValidator
    const zodiacData = req.body;

    // Call the service function
    const newZodiac = await astrologyService.createZodiacSign(zodiacData);

    // Service handles existing checks and validation errors

    res.status(201).json(ApiResponse.success(newZodiac, 'Tạo cung hoàng đạo thành công', 201));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cập nhật thông tin cung hoàng đạo (dành cho admin)
 * @route   PUT /api/horoscope/signs/:id
 * @access  Admin
 */
exports.updateZodiacSign = async (req, res, next) => {
  try {
    const zodiacId = req.params.id; // ID is validated by updateZodiacSignValidator
    const updateData = req.body; // Data is validated by updateZodiacSignValidator

    // Call the service function
    const updatedZodiac = await astrologyService.updateZodiacSign(zodiacId, updateData);

    // Service handles 'not found' and validation errors

    res.status(200).json(ApiResponse.success(updatedZodiac, 'Cập nhật cung hoàng đạo thành công'));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Thêm liên kết giữa cung hoàng đạo và lá bài tarot
 * @route   POST /api/horoscope/signs/:id/tarot-relations
 * @access  Admin
 */
exports.addTarotRelation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { cardId, description } = req.body;
    
    // Kiểm tra xem cung hoàng đạo và lá bài có tồn tại không
    const [zodiac, card] = await Promise.all([
      Zodiac.findById(id),
      Card.findById(cardId)
    ]);
    
    if (!zodiac) {
      return next(new ApiError('Không tìm thấy cung hoàng đạo với ID này', 404));
    }
    
    if (!card) {
      return next(new ApiError('Không tìm thấy lá bài với ID này', 404));
    }
    
    // Kiểm tra xem liên kết đã tồn tại chưa
    const existingRelation = zodiac.tarotRelations.find(
      relation => relation.cardId.toString() === cardId
    );
    
    if (existingRelation) {
      return next(new ApiError('Liên kết giữa cung hoàng đạo và lá bài này đã tồn tại', 400));
    }
    
    // Thêm liên kết mới
    zodiac.tarotRelations.push({
      cardId,
      description
    });
    
    await zodiac.save();
    
    // Populate thông tin chi tiết của lá bài
    // Populate thông tin chi tiết của lá bài sau khi lưu
    const updatedZodiac = await Zodiac.findById(id).populate('tarotRelations.cardId', 'name type');
    
    res.status(200).json(ApiResponse.success(updatedZodiac, 'Thêm liên kết Tarot thành công'));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Xóa cung hoàng đạo (dành cho admin)
 * @route   DELETE /api/horoscope/signs/:id
 * @access  Admin
 */
exports.deleteZodiacSign = async (req, res, next) => {
  try {
    const zodiacId = req.params.id;

    // TODO: Add validation for zodiacId if needed (e.g., isMongoId)

    // Call service to delete
    await astrologyService.deleteZodiacSign(zodiacId); // Use the service

    // Service handles 'not found' error

    res.status(200).json(ApiResponse.success(null, 'Xóa cung hoàng đạo thành công'));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Xóa liên kết giữa cung hoàng đạo và lá bài tarot
 * @route   DELETE /api/horoscope/signs/:id/tarot-relations/:relationId
 * @access  Admin
 */
exports.removeTarotRelation = async (req, res, next) => {
  try {
    const { id, relationId } = req.params;
    
    // Kiểm tra xem cung hoàng đạo có tồn tại không
    const zodiac = await Zodiac.findById(id);
    
    if (!zodiac) {
      return next(new ApiError('Không tìm thấy cung hoàng đạo với ID này', 404));
    }
    
    // Lọc ra các liên kết còn lại
    zodiac.tarotRelations = zodiac.tarotRelations.filter(
      relation => relation._id.toString() !== relationId
    );
    
    // Check if relation actually exists before attempting to filter
    const relationExists = zodiac.tarotRelations.some(rel => rel._id.toString() === relationId);
    if (!relationExists) {
       return next(new ApiError('Không tìm thấy liên kết Tarot với ID này', 404));
    }

    zodiac.tarotRelations = zodiac.tarotRelations.filter(
      relation => relation._id.toString() !== relationId
    );
    
    await zodiac.save();
    
    res.status(200).json(ApiResponse.success(null, 'Đã xóa liên kết thành công'));
  } catch (error) {
    next(error);
  }
};
