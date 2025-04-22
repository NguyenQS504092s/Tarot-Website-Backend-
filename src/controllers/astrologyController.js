const Zodiac = require('../models/zodiacModel');
const Horoscope = require('../models/horoscopeModel');
const Card = require('../models/cardModel');
const ApiError = require('../utils/apiError');

/**
 * @desc    Lấy danh sách tất cả các cung hoàng đạo
 * @route   GET /api/horoscope/signs
 * @access  Public
 */
exports.getAllZodiacSigns = async (req, res, next) => {
  try {
    // Kiểm tra xem đã có dữ liệu trong database chưa
    const zodiacSigns = await Zodiac.find().select('name nameEn symbol element period');
    
    if (zodiacSigns.length > 0) {
      return res.status(200).json({
        success: true,
        count: zodiacSigns.length,
        data: zodiacSigns
      });
    }

    // Nếu chưa có dữ liệu, trả về dữ liệu mẫu
    const defaultZodiacSigns = [
      {
        name: "Bạch Dương",
        nameEn: "Aries",
        symbol: "♈",
        element: "Lửa",
        period: "21/3 - 19/4",
        ruling_planet: "Sao Hỏa"
      },
      // Các cung khác giữ nguyên
    ];

    res.status(200).json({
      success: true,
      count: defaultZodiacSigns.length,
      data: defaultZodiacSigns
    });
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
    const { sign } = req.params;
    
    // Chuyển đổi tên cung sang chữ thường và loại bỏ dấu
    const normalizedSign = sign.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "");
    
    // Tìm trong database
    let zodiacSign = await Zodiac.findOne({
      $or: [
        { name: { $regex: new RegExp(normalizedSign, 'i') } },
        { nameEn: { $regex: new RegExp(normalizedSign, 'i') } }
      ]
    }).populate('tarotRelations.cardId');

    // Nếu không tìm thấy trong database, trả về dữ liệu mẫu
    if (!zodiacSign) {
      const zodiacSigns = {
        "aries": {
          name: "Bạch Dương",
          nameEn: "Aries",
          symbol: "♈",
          element: "Lửa",
          period: "21/3 - 19/4",
          ruling_planet: "Sao Hỏa",
          description: "Bạch Dương là cung đầu tiên trong vòng hoàng đạo, đại diện cho sự khởi đầu mới, nhiệt huyết, và năng lượng mãnh liệt. Người thuộc cung Bạch Dương thường có tính cách mạnh mẽ, dũng cảm, tự tin và đầy nhiệt huyết.",
          strengths: ["Dũng cảm", "Quyết đoán", "Tự tin", "Nhiệt tình", "Lạc quan"],
          weaknesses: ["Thiếu kiên nhẫn", "Bốc đồng", "Ích kỷ", "Hiếu chiến"]
        },
        // Các cung khác giữ nguyên
      };

      const signInfo = zodiacSigns[normalizedSign];

      if (!signInfo) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông tin cung hoàng đạo'
        });
      }

      return res.status(200).json({
        success: true,
        data: signInfo
      });
    }

    res.status(200).json({
      success: true,
      data: zodiacSign
    });
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
    const { sign } = req.params;
    const { date } = req.query;
    
    // Chuyển đổi tên cung sang chữ thường và loại bỏ dấu
    const normalizedSign = sign.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "");
    
    // Cố gắng tìm tử vi trong database trước
    let horoscope;
    
    if (date) {
      // Nếu có param date, tìm tử vi theo ngày chỉ định
      horoscope = await Horoscope.findDailyHoroscope(normalizedSign, new Date(date));
    } else {
      // Nếu không có param date, tìm tử vi cho ngày hiện tại
      horoscope = await Horoscope.findDailyHoroscope(normalizedSign);
    }
    
    // Nếu không tìm thấy trong database, tạo dữ liệu mẫu
    if (!horoscope) {
      const today = date ? new Date(date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      
      horoscope = {
        sign: normalizedSign,
        date: today,
        general: "Hôm nay là một ngày tích cực để bắt đầu những dự án mới và mở rộng mạng lưới xã hội của bạn. Sự sáng tạo của bạn đang ở mức cao.",
        love: "Nếu bạn đang độc thân, đây là thời điểm tốt để gặp gỡ người mới. Với những người đang có đối tác, hãy dành thời gian bên nhau để thắt chặt mối quan hệ.",
        career: "Công việc của bạn sẽ gặp nhiều thuận lợi, đặc biệt trong các dự án đòi hỏi sự sáng tạo và làm việc nhóm.",
        health: "Sức khỏe của bạn khá tốt, nhưng hãy chú ý đến chế độ nghỉ ngơi và tránh căng thẳng quá mức.",
        lucky_number: Math.floor(Math.random() * 100),
        lucky_color: ["Đỏ", "Cam", "Vàng", "Xanh lá", "Xanh dương", "Tím", "Hồng", "Trắng", "Đen"][Math.floor(Math.random() * 9)]
      };
    }

    res.status(200).json({
      success: true,
      data: horoscope
    });
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

    // Chuẩn hóa tên cung để tìm kiếm
    const normalizedSign1 = sign1.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "");

    const normalizedSign2 = sign2.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "");
    
    // Tìm trong database
    const zodiac1 = await Zodiac.findOne({
      $or: [
        { name: { $regex: new RegExp(normalizedSign1, 'i') } },
        { nameEn: { $regex: new RegExp(normalizedSign1, 'i') } }
      ]
    });
    
    const zodiac2 = await Zodiac.findOne({
      $or: [
        { name: { $regex: new RegExp(normalizedSign2, 'i') } },
        { nameEn: { $regex: new RegExp(normalizedSign2, 'i') } }
      ]
    });
    
    // Nếu tìm thấy cả hai cung trong database
    if (zodiac1 && zodiac2) {
      // Tìm thông tin tương hợp trong các cung
      const compatibility1 = zodiac1.compatibility.find(
        comp => comp.sign.toLowerCase() === zodiac2.nameEn.toLowerCase()
      );
      
      const compatibility2 = zodiac2.compatibility.find(
        comp => comp.sign.toLowerCase() === zodiac1.nameEn.toLowerCase()
      );
      
      if (compatibility1 && compatibility2) {
        // Tính điểm tương hợp trung bình
        const avgScore = Math.round((compatibility1.score + compatibility2.score) / 2);
        
        // Xác định mức độ tương hợp
        let compatibilityLevel, description;
        if (avgScore >= 80) {
          compatibilityLevel = "Rất hợp";
          description = "Hai cung hoàng đạo này có sự tương hợp tuyệt vời và có thể tạo nên mối quan hệ hài hòa, bền vững.";
        } else if (avgScore >= 60) {
          compatibilityLevel = "Khá hợp";
          description = "Hai cung này có nhiều điểm tương đồng và có thể xây dựng mối quan hệ tốt đẹp với một chút nỗ lực từ cả hai phía.";
        } else if (avgScore >= 40) {
          compatibilityLevel = "Trung bình";
          description = "Mối quan hệ giữa hai cung này đòi hỏi sự hiểu biết và thỏa hiệp để vượt qua những khác biệt.";
        } else if (avgScore >= 20) {
          compatibilityLevel = "Không mấy hợp";
          description = "Hai cung này có nhiều khác biệt cơ bản, cần nhiều nỗ lực để duy trì mối quan hệ.";
        } else {
          compatibilityLevel = "Không hợp";
          description = "Đây là sự kết hợp đầy thách thức, hai bên cần hiểu biết và tôn trọng sự khác biệt của nhau.";
        }
        
        const compatibility = {
          sign1: zodiac1.name,
          sign2: zodiac2.name,
          sign1En: zodiac1.nameEn,
          sign2En: zodiac2.nameEn,
          compatibilityScore: avgScore,
          compatibilityLevel,
          description: description || compatibility1.description,
          areas: {
            love: Math.floor(Math.random() * 100),
            friendship: Math.floor(Math.random() * 100),
            communication: Math.floor(Math.random() * 100),
            trust: Math.floor(Math.random() * 100)
          },
          advice: "Hãy tập trung vào những điểm chung và tôn trọng sự khác biệt của nhau để xây dựng mối quan hệ vững chắc."
        };
        
        return res.status(200).json({
          success: true,
          data: compatibility
        });
      }
    }
    
    // Nếu không có dữ liệu trong database, trả về dữ liệu mẫu
    const compatibilityScore = Math.floor(Math.random() * 100);
    let compatibilityLevel, description;

    if (compatibilityScore >= 80) {
      compatibilityLevel = "Rất hợp";
      description = "Hai cung hoàng đạo này có sự tương hợp tuyệt vời và có thể tạo nên mối quan hệ hài hòa, bền vững.";
    } else if (compatibilityScore >= 60) {
      compatibilityLevel = "Khá hợp";
      description = "Hai cung này có nhiều điểm tương đồng và có thể xây dựng mối quan hệ tốt đẹp với một chút nỗ lực từ cả hai phía.";
    } else if (compatibilityScore >= 40) {
      compatibilityLevel = "Trung bình";
      description = "Mối quan hệ giữa hai cung này đòi hỏi sự hiểu biết và thỏa hiệp để vượt qua những khác biệt.";
    } else if (compatibilityScore >= 20) {
      compatibilityLevel = "Không mấy hợp";
      description = "Hai cung này có nhiều khác biệt cơ bản, cần nhiều nỗ lực để duy trì mối quan hệ.";
    } else {
      compatibilityLevel = "Không hợp";
      description = "Đây là sự kết hợp đầy thách thức, hai bên cần hiểu biết và tôn trọng sự khác biệt của nhau.";
    }

    const compatibility = {
      sign1,
      sign2,
      compatibilityScore,
      compatibilityLevel,
      description,
      areas: {
        love: Math.floor(Math.random() * 100),
        friendship: Math.floor(Math.random() * 100),
        communication: Math.floor(Math.random() * 100),
        trust: Math.floor(Math.random() * 100)
      },
      advice: "Hãy tập trung vào những điểm chung và tôn trọng sự khác biệt của nhau để xây dựng mối quan hệ vững chắc."
    };

    res.status(200).json({
      success: true,
      data: compatibility
    });
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
    const { sign } = req.params;
    
    // Chuẩn hóa tên cung
    const normalizedSign = sign.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "");
    
    // Tìm trong database
    const zodiac = await Zodiac.findOne({
      $or: [
        { name: { $regex: new RegExp(normalizedSign, 'i') } },
        { nameEn: { $regex: new RegExp(normalizedSign, 'i') } }
      ]
    }).populate('tarotRelations.cardId');
    
    // Nếu có dữ liệu trong database
    if (zodiac && zodiac.tarotRelations && zodiac.tarotRelations.length > 0) {
      const relation = {
        sign: zodiac.name,
        signEn: zodiac.nameEn,
        major_arcana: {
          primary: zodiac.tarotRelations[0].cardId.name,
          description: zodiac.tarotRelations[0].description
        },
        minor_arcana: zodiac.tarotRelations
          .filter(rel => rel.cardId.type === 'Minor Arcana')
          .map(rel => rel.cardId.name),
        compatible_cards: zodiac.tarotRelations
          .filter(rel => rel.cardId.type === 'Major Arcana' && rel.cardId !== zodiac.tarotRelations[0].cardId)
          .map(rel => rel.cardId.name),
        elements: `${zodiac.element} (${zodiac.element === 'Lửa' ? 'Suit of Wands' : 
                                       zodiac.element === 'Nước' ? 'Suit of Cups' : 
                                       zodiac.element === 'Khí' ? 'Suit of Swords' : 
                                       'Suit of Pentacles'})`
      };
      
      return res.status(200).json({
        success: true,
        data: relation
      });
    }
    
    // Dữ liệu mẫu về mối liên hệ giữa cung hoàng đạo và các lá bài Tarot
    const zodiacTarotRelations = {
      "aries": {
        sign: "Bạch Dương",
        major_arcana: {
          primary: "The Emperor",
          description: "Lá bài The Emperor tượng trưng cho sức mạnh, quyết đoán và khả năng lãnh đạo - đặc điểm nổi bật của Bạch Dương."
        },
        minor_arcana: ["Ace of Wands", "Two of Wands", "Three of Wands"],
        compatible_cards: ["The Sun", "The Chariot", "Strength"],
        elements: "Fire (Suit of Wands)"
      },
      // Các cung khác giữ nguyên
    };

    // Chuyển đổi tên cung sang chữ thường
    const relation = zodiacTarotRelations[normalizedSign];

    if (!relation) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin liên hệ giữa Tarot và cung hoàng đạo này'
      });
    }

    res.status(200).json({
      success: true,
      data: relation
    });
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

    // Kiểm tra xem đã có tử vi cho cung hoàng đạo này trong ngày này chưa
    const existingHoroscope = await Horoscope.findOne({
      sign: sign,
      date: new Date(date)
    });

    if (existingHoroscope) {
      return res.status(400).json({
        success: false,
        message: 'Đã tồn tại tử vi cho cung hoàng đạo này trong ngày này'
      });
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
      author: req.user._id
    });

    res.status(201).json({
      success: true,
      data: horoscope
    });
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
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tử vi'
      });
    }
    
    // Cập nhật thông tin
    const updatedHoroscope = await Horoscope.findByIdAndUpdate(
      horoscopeId,
      req.body,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: updatedHoroscope
    });
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
      return res.status(400).json({
        success: false,
        message: 'Cung hoàng đạo này đã tồn tại'
      });
    }

    // Tạo cung hoàng đạo mới
    const zodiac = await Zodiac.create(req.body);

    res.status(201).json({
      success: true,
      data: zodiac
    });
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
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy cung hoàng đạo'
      });
    }
    
    // Cập nhật thông tin
    const updatedZodiac = await Zodiac.findByIdAndUpdate(
      zodiacId,
      req.body,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: updatedZodiac
    });
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
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy cung hoàng đạo'
      });
    }
    
    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lá bài'
      });
    }
    
    // Kiểm tra xem liên kết đã tồn tại chưa
    const existingRelation = zodiac.tarotRelations.find(
      relation => relation.cardId.toString() === cardId
    );
    
    if (existingRelation) {
      return res.status(400).json({
        success: false,
        message: 'Liên kết giữa cung hoàng đạo và lá bài này đã tồn tại'
      });
    }
    
    // Thêm liên kết mới
    zodiac.tarotRelations.push({
      cardId,
      description
    });
    
    await zodiac.save();
    
    // Populate thông tin chi tiết của lá bài
    const updatedZodiac = await Zodiac.findById(id).populate('tarotRelations.cardId');
    
    res.status(200).json({
      success: true,
      data: updatedZodiac
    });
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
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy cung hoàng đạo'
      });
    }
    
    // Lọc ra các liên kết còn lại
    zodiac.tarotRelations = zodiac.tarotRelations.filter(
      relation => relation._id.toString() !== relationId
    );
    
    await zodiac.save();
    
    res.status(200).json({
      success: true,
      message: 'Đã xóa liên kết thành công'
    });
  } catch (error) {
    next(error);
  }
};