/**
 * Astrology Service - Xử lý các chức năng liên quan đến tử vi và cung hoàng đạo
 */
const Zodiac = require('../models/zodiacModel');
const Horoscope = require('../models/horoscopeModel');
const ApiError = require('../utils/apiError');
const { normalizeString, getEnumValues } = require('../utils/stringUtils');

/**
 * Lấy thông tin tương hợp giữa hai cung hoàng đạo
 * @param {String} sign1 Tên cung hoàng đạo thứ nhất (đã chuẩn hóa và validate)
 * @param {String} sign2 Tên cung hoàng đạo thứ hai (đã chuẩn hóa và validate)
 * @returns {Promise<Object>} Dữ liệu tương hợp
 */
exports.getZodiacCompatibility = async (sign1, sign2) => {
  try {
    // Tìm cả hai cung hoàng đạo trong database
    // Giả định sign1 và sign2 đã được validate và chuẩn hóa ở controller
    const zodiac1 = await Zodiac.findOne({ name: sign1 });

    if (!zodiac1) {
      throw new ApiError(`Không tìm thấy thông tin cho cung hoàng đạo: ${sign1}`, 404);
    }

    // Tìm dữ liệu tương hợp với sign2 trong mảng compatibility của zodiac1
    const compatibilityData = zodiac1.compatibility.find(
      comp => comp.sign === sign2 // So sánh trực tiếp với tên đã validate
    );

    if (!compatibilityData) {
      // Không tìm thấy dữ liệu tương hợp cụ thể
      throw new ApiError(`Không tìm thấy dữ liệu tương hợp cụ thể giữa ${sign1} và ${sign2}.`, 404);
    }

    // Lấy thêm thông tin của cung thứ 2 để trả về response đầy đủ hơn
    const zodiac2 = await Zodiac.findOne({ name: sign2 });
    if (!zodiac2) {
        // Trường hợp này ít xảy ra nếu validation tốt, nhưng vẫn nên kiểm tra
        throw new ApiError(`Không tìm thấy thông tin cho cung hoàng đạo: ${sign2}`, 404);
    }

    // Format the response
    return {
      sign1: zodiac1.name,
      sign2: zodiac2.name,
      sign1En: zodiac1.nameEn,
      sign2En: zodiac2.nameEn,
      compatibilityScore: compatibilityData.score,
      description: compatibilityData.description,
    };

  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(`Lỗi khi lấy thông tin tương hợp: ${error.message}`, 500);
  }
};

/**
 * Lấy mối liên hệ giữa Tarot và cung hoàng đạo
 * @param {String} sign Tên cung hoàng đạo (đã chuẩn hóa và validate)
 * @returns {Promise<Object>} Dữ liệu liên kết Tarot
 */
exports.getTarotZodiacRelation = async (sign) => {
  try {
    // Tìm cung hoàng đạo và populate relations
    const zodiac = await Zodiac.findOne({ name: sign })
                               .populate('tarotRelations.cardId', 'name type'); // Populate only needed fields

    if (!zodiac) {
      throw new ApiError(`Không tìm thấy thông tin cho cung hoàng đạo: ${sign}`, 404);
    }

    if (!zodiac.tarotRelations || zodiac.tarotRelations.length === 0) {
      throw new ApiError(`Không tìm thấy thông tin liên kết Tarot cho cung ${sign}.`, 404);
    }

    // Format the response
    const formattedRelations = zodiac.tarotRelations.map(rel => ({
      cardName: rel.cardId ? rel.cardId.name : 'N/A', // Handle potential missing card data
      cardType: rel.cardId ? rel.cardId.type : 'N/A',
      description: rel.description
    }));

    return {
      sign: zodiac.name,
      signEn: zodiac.nameEn,
      element: zodiac.element,
      tarotRelations: formattedRelations // Sửa key thành tarotRelations
    };

  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(`Lỗi khi lấy liên kết Tarot: ${error.message}`, 500);
  }
};

/**
 * Tạo tử vi hàng ngày mới (Admin)
 * @param {Object} horoscopeData Dữ liệu tử vi từ request body
 * @param {String} authorId ID của người tạo (admin)
 * @returns {Promise<Object>} Tử vi mới được tạo
 */
exports.createDailyHoroscope = async (horoscopeData, authorId) => {
  try {
    const { sign, date } = horoscopeData;

    // Normalize date before checking
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0); // Normalize to start of day

    // Validate sign against enum (optional here if validated in controller/validator)
    // const allowedSigns = getEnumValues(Horoscope.schema, 'sign');
    // if (!allowedSigns || !allowedSigns.includes(sign)) {
    //   throw new ApiError(`Cung hoàng đạo không hợp lệ: ${sign}`, 400);
    // }

    // Kiểm tra xem đã có tử vi cho cung hoàng đạo này trong ngày này chưa
    const existingHoroscope = await Horoscope.findOne({
      sign: sign,
      date: targetDate // Use normalized date
    });

    if (existingHoroscope) {
      throw new ApiError(`Đã tồn tại tử vi cho cung ${sign} vào ngày ${targetDate.toLocaleDateString('vi-VN')}.`, 400);
    }

    // Tạo tử vi mới
    const newHoroscope = await Horoscope.create({
      ...horoscopeData,
      date: targetDate, // Ensure normalized date is used
      author: authorId
    });

    return newHoroscope;
  } catch (error) {
     if (error instanceof ApiError) {
      throw error;
    }
    // Log the specific error before re-throwing
    console.error(`Error in createDailyHoroscope: Name=${error.name}, Message=${error.message}`); 
    if (error.name === 'ValidationError') {
        throw new ApiError(`Lỗi validation khi tạo tử vi: ${error.message}`, 400);
    }
    // Throw generic 500 for other errors
    throw new ApiError(`Lỗi khi tạo tử vi hàng ngày: ${error.message}`, 500); 
  }
};

/**
 * Cập nhật tử vi hàng ngày (Admin)
 * @param {String} horoscopeId ID của tử vi cần cập nhật
 * @param {Object} updateData Dữ liệu cập nhật
 * @returns {Promise<Object>} Tử vi đã được cập nhật
 */
exports.updateDailyHoroscope = async (horoscopeId, updateData) => {
  try {
    // Normalize date if provided in updateData
    if (updateData.date) {
        const targetDate = new Date(updateData.date);
        targetDate.setHours(0, 0, 0, 0);
        updateData.date = targetDate;
    }

    // Validate sign if provided (optional here if validated in controller/validator)
    // if (updateData.sign) {
    //     const allowedSigns = getEnumValues(Horoscope.schema, 'sign');
    //     if (!allowedSigns || !allowedSigns.includes(updateData.sign)) {
    //       throw new ApiError(`Cung hoàng đạo không hợp lệ: ${updateData.sign}`, 400);
    //     }
    // }

    // Find and update
    const updatedHoroscope = await Horoscope.findByIdAndUpdate(
      horoscopeId,
      updateData,
      { new: true, runValidators: true } // Return updated doc, run validators
    );

    if (!updatedHoroscope) {
      throw new ApiError('Không tìm thấy tử vi với ID này', 404);
    }

    return updatedHoroscope;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
     if (error.name === 'ValidationError') {
        throw new ApiError(`Lỗi validation khi cập nhật tử vi: ${error.message}`, 400);
    }
    // Handle potential duplicate key error if sign/date combo is updated to an existing one
     if (error.code === 11000) {
         // More specific error message might require parsing error.keyValue
         throw new ApiError(`Tử vi cho cung hoàng đạo này vào ngày này đã tồn tại.`, 400);
     }
    throw new ApiError(`Lỗi khi cập nhật tử vi: ${error.message}`, 500);
  }
};

/**
 * Xóa tử vi hàng ngày (Admin)
 * @param {String} horoscopeId ID của tử vi cần xóa
 * @returns {Promise<void>}
 */
exports.deleteDailyHoroscope = async (horoscopeId) => {
  try {
    const horoscope = await Horoscope.findByIdAndDelete(horoscopeId);

    if (!horoscope) {
      throw new ApiError('Không tìm thấy tử vi với ID này để xóa', 404);
    }
    // No return value needed for successful deletion
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(`Lỗi khi xóa tử vi: ${error.message}`, 500);
  }
};

/**
 * Tạo mới cung hoàng đạo (Admin)
 * @param {Object} zodiacData Dữ liệu cung hoàng đạo
 * @returns {Promise<Object>} Cung hoàng đạo mới được tạo
 */
exports.createZodiacSign = async (zodiacData) => {
  try {
    // Kiểm tra xem cung hoàng đạo đã tồn tại chưa (trùng tên hoặc tên tiếng Anh)
    const existingZodiac = await Zodiac.findOne({
      $or: [
        { name: zodiacData.name },
        { nameEn: zodiacData.nameEn }
      ]
    });

    if (existingZodiac) {
      throw new ApiError('Cung hoàng đạo này đã tồn tại (trùng tên hoặc tên tiếng Anh).', 400);
    }

    // Tạo cung hoàng đạo mới
    const newZodiac = await Zodiac.create(zodiacData);
    return newZodiac;
  } catch (error) {
     if (error instanceof ApiError) {
      throw error;
    }
     // Log the specific error before re-throwing
    console.error(`Error in createZodiacSign: Name=${error.name}, Message=${error.message}`);
    if (error.name === 'ValidationError') {
        throw new ApiError(`Lỗi validation khi tạo cung hoàng đạo: ${error.message}`, 400);
    }
     // Throw generic 500 for other errors
    throw new ApiError(`Lỗi khi tạo cung hoàng đạo: ${error.message}`, 500);
  }
};

/**
 * Cập nhật thông tin cung hoàng đạo (Admin)
 * @param {String} zodiacId ID của cung hoàng đạo
 * @param {Object} updateData Dữ liệu cập nhật
 * @returns {Promise<Object>} Cung hoàng đạo đã được cập nhật
 */
exports.updateZodiacSign = async (zodiacId, updateData) => {
  try {
    // Find and update
    const updatedZodiac = await Zodiac.findByIdAndUpdate(
      zodiacId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedZodiac) {
      throw new ApiError('Không tìm thấy cung hoàng đạo với ID này', 404);
    }

    return updatedZodiac;
  } catch (error) {
     if (error instanceof ApiError) {
      throw error;
    }
    if (error.name === 'ValidationError') {
        throw new ApiError(`Lỗi validation khi cập nhật cung hoàng đạo: ${error.message}`, 400);
    }
     // Handle potential duplicate key error if name/nameEn is updated to an existing one
    if (error.code === 11000) {
         throw new ApiError(`Tên cung hoàng đạo hoặc tên tiếng Anh đã tồn tại.`, 400);
     }
    throw new ApiError(`Lỗi khi cập nhật cung hoàng đạo: ${error.message}`, 500);
  }
};

/**
 * Xóa cung hoàng đạo (Admin)
 * @param {String} zodiacId ID của cung hoàng đạo cần xóa
 * @returns {Promise<void>}
 */
exports.deleteZodiacSign = async (zodiacId) => {
  try {
    const zodiac = await Zodiac.findByIdAndDelete(zodiacId);

    if (!zodiac) {
      throw new ApiError('Không tìm thấy cung hoàng đạo với ID này để xóa', 404);
    }

    // Optional: Handle related data deletion (e.g., remove this sign from compatibility arrays in other signs)
    // This can be complex and might require careful consideration of data integrity.

  } catch (error) {
     if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(`Lỗi khi xóa cung hoàng đạo: ${error.message}`, 500);
  }
};
