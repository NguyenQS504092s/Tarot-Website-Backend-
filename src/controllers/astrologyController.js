const Zodiac = require('../models/zodiacModel');
const Horoscope = require('../models/horoscopeModel');
const Card = require('../models/cardModel');
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

    // Find both zodiac signs in the database
    const [zodiac1, zodiac2] = await Promise.all([
      Zodiac.findOne({ name: matchedSign1 }),
      Zodiac.findOne({ name: matchedSign2 })
    ]);

    if (!zodiac1 || !zodiac2) {
      return next(new ApiError('Không tìm thấy thông tin cho một hoặc cả hai cung hoàng đạo.', 404));
    }

    // Find compatibility data (assuming it's stored symmetrically or needs calculation)
    // This simplified version just checks if data exists in zodiac1 for zodiac2
    const compatibilityData = zodiac1.compatibility.find(
      comp => comp.sign === matchedSign2 // Use exact enum match
    );

    if (!compatibilityData) {
      // No specific compatibility data found in DB for this pair
      // Return a generic message or calculate dynamically if needed
      // For now, return 404 as specific data is missing
      return next(new ApiError(`Không tìm thấy dữ liệu tương hợp cụ thể giữa ${matchedSign1} và ${matchedSign2}.`, 404));
    }

    // Remove fallback/random data logic
    // Format the response based on found data
    const responseData = {
      sign1: zodiac1.name,
      sign2: zodiac2.name,
      sign1En: zodiac1.nameEn,
      sign2En: zodiac2.nameEn,
      compatibilityScore: compatibilityData.score,
      description: compatibilityData.description,
      // Add other relevant fields if needed
    };

    res.status(200).json(ApiResponse.success(responseData, 'Lấy thông tin tương hợp thành công'));
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

    // Find the zodiac sign and populate relations
    const zodiac = await Zodiac.findOne({ name: matchedSign })
                               .populate('tarotRelations.cardId', 'name type'); // Populate only needed fields

    if (!zodiac) {
      return next(new ApiError(`Không tìm thấy thông tin cho cung hoàng đạo: ${matchedSign}`, 404));
    }

    if (!zodiac.tarotRelations || zodiac.tarotRelations.length === 0) {
      return next(new ApiError(`Không tìm thấy thông tin liên kết Tarot cho cung ${matchedSign}.`, 404));
    }

    // Format the response based on actual data, avoid assumptions about array order
    const formattedRelations = zodiac.tarotRelations.map(rel => ({
      cardName: rel.cardId ? rel.cardId.name : 'N/A', // Handle potential missing card data
      cardType: rel.cardId ? rel.cardId.type : 'N/A',
      description: rel.description
    }));

    const responseData = {
      sign: zodiac.name,
      signEn: zodiac.nameEn,
      element: zodiac.element,
      relations: formattedRelations
    };

    // Remove fallback data logic
    res.status(200).json(ApiResponse.success(responseData, 'Lấy liên kết Tarot thành công'));
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
    const {
      sign,
      date,
      general,
      love,
      career,
      health,
      lucky_number,
      lucky_color,
      lucky_time,
      mood,
      compatibility
    } = req.body;

    // Normalize date before checking and creating
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0); // Normalize to start of day

    // Validate sign against enum
    const allowedSigns = getEnumValues(Horoscope.schema, 'sign');
    if (!allowedSigns || !allowedSigns.includes(sign)) {
      return next(new ApiError(`Cung hoàng đạo không hợp lệ: ${sign}`, 400));
    }

    // Kiểm tra xem đã có tử vi cho cung hoàng đạo này trong ngày này chưa
    const existingHoroscope = await Horoscope.findOne({
      sign: sign,
      date: targetDate // Use normalized date
    });

    if (existingHoroscope) {
      return next(new ApiError(`Đã tồn tại tử vi cho cung ${sign} vào ngày ${targetDate.toLocaleDateString('vi-VN')}.`, 400));
    }

    // Tạo tử vi mới
    const horoscope = await Horoscope.create({
      sign,
      date: date || new Date(),
      general,
      love,
      career,
      health,
      lucky_number,
      lucky_color,
      lucky_time,
      mood,
      compatibility,
      author: req.user._id // Assuming req.user is populated by auth middleware
    });

    res.status(201).json(ApiResponse.success(horoscope, 'Tạo tử vi hàng ngày thành công', 201));
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
    const horoscopeId = req.params.id;
    
    // Kiểm tra xem tử vi có tồn tại không
    const horoscope = await Horoscope.findById(horoscopeId);
    
    if (!horoscope) {
      return next(new ApiError('Không tìm thấy tử vi với ID này', 404));
    }
    
    // Cập nhật thông tin
    const updatedHoroscope = await Horoscope.findByIdAndUpdate(
      horoscopeId,
      req.body,
      { new: true, runValidators: true } // Return updated doc, run validators
    );
    
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
    // Kiểm tra xem cung hoàng đạo đã tồn tại chưa
    const existingZodiac = await Zodiac.findOne({
      $or: [
        { name: req.body.name },
        { nameEn: req.body.nameEn }
      ]
    });

    if (existingZodiac) {
      return next(new ApiError('Cung hoàng đạo này đã tồn tại (trùng tên hoặc tên tiếng Anh).', 400));
    }

    // Tạo cung hoàng đạo mới
    const zodiac = await Zodiac.create(req.body);

    res.status(201).json(ApiResponse.success(zodiac, 'Tạo cung hoàng đạo thành công', 201));
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
    const zodiacId = req.params.id;
    
    // Kiểm tra xem cung hoàng đạo có tồn tại không
    const zodiac = await Zodiac.findById(zodiacId);
    
    if (!zodiac) {
      return next(new ApiError('Không tìm thấy cung hoàng đạo với ID này', 404));
    }
    
    // Cập nhật thông tin
    const updatedZodiac = await Zodiac.findByIdAndUpdate(
      zodiacId,
      req.body,
      { new: true, runValidators: true }
    );
    
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
