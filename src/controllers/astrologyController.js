/**
 * Controller xử lý các chức năng liên quan đến cung hoàng đạo và tử vi
 */

/**
 * @desc    Lấy danh sách tất cả các cung hoàng đạo
 * @route   GET /api/horoscope/signs
 * @access  Public
 */
exports.getAllZodiacSigns = async (req, res, next) => {
  try {
    const zodiacSigns = [
      {
        name: "Bạch Dương",
        nameEn: "Aries",
        symbol: "♈",
        element: "Lửa",
        period: "21/3 - 19/4",
        ruling_planet: "Sao Hỏa"
      },
      {
        name: "Kim Ngưu",
        nameEn: "Taurus",
        symbol: "♉",
        element: "Đất",
        period: "20/4 - 20/5",
        ruling_planet: "Sao Kim"
      },
      {
        name: "Song Tử",
        nameEn: "Gemini",
        symbol: "♊",
        element: "Khí",
        period: "21/5 - 20/6",
        ruling_planet: "Sao Thủy"
      },
      {
        name: "Cự Giải",
        nameEn: "Cancer",
        symbol: "♋",
        element: "Nước",
        period: "21/6 - 22/7",
        ruling_planet: "Mặt Trăng"
      },
      {
        name: "Sư Tử",
        nameEn: "Leo",
        symbol: "♌",
        element: "Lửa",
        period: "23/7 - 22/8",
        ruling_planet: "Mặt Trời"
      },
      {
        name: "Xử Nữ",
        nameEn: "Virgo",
        symbol: "♍",
        element: "Đất",
        period: "23/8 - 22/9",
        ruling_planet: "Sao Thủy"
      },
      {
        name: "Thiên Bình",
        nameEn: "Libra",
        symbol: "♎",
        element: "Khí",
        period: "23/9 - 22/10",
        ruling_planet: "Sao Kim"
      },
      {
        name: "Bọ Cạp",
        nameEn: "Scorpio",
        symbol: "♏",
        element: "Nước",
        period: "23/10 - 21/11",
        ruling_planet: "Sao Diêm Vương"
      },
      {
        name: "Nhân Mã",
        nameEn: "Sagittarius",
        symbol: "♐",
        element: "Lửa",
        period: "22/11 - 21/12",
        ruling_planet: "Sao Mộc"
      },
      {
        name: "Ma Kết",
        nameEn: "Capricorn",
        symbol: "♑",
        element: "Đất",
        period: "22/12 - 19/1",
        ruling_planet: "Sao Thổ"
      },
      {
        name: "Bảo Bình",
        nameEn: "Aquarius",
        symbol: "♒",
        element: "Khí",
        period: "20/1 - 18/2",
        ruling_planet: "Sao Thiên Vương"
      },
      {
        name: "Song Ngư",
        nameEn: "Pisces",
        symbol: "♓",
        element: "Nước",
        period: "19/2 - 20/3",
        ruling_planet: "Sao Hải Vương"
      }
    ];

    res.status(200).json({
      success: true,
      count: zodiacSigns.length,
      data: zodiacSigns
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
      "taurus": {
        name: "Kim Ngưu",
        nameEn: "Taurus",
        symbol: "♉",
        element: "Đất",
        period: "20/4 - 20/5",
        ruling_planet: "Sao Kim",
        description: "Kim Ngưu là cung thứ hai trong vòng hoàng đạo, đại diện cho sự kiên định, thực tế và yêu thích sự sang trọng. Người thuộc cung Kim Ngưu thường đáng tin cậy, thực tế, kiên nhẫn và có khả năng làm việc chăm chỉ.",
        strengths: ["Đáng tin cậy", "Kiên nhẫn", "Thực tế", "Cần cù", "Trung thành"],
        weaknesses: ["Cứng đầu", "Thiếu linh hoạt", "Quá cầu toàn", "Chậm thích nghi"]
      }
    };

    // Chuyển đổi tên cung sang chữ thường và loại bỏ dấu
    const normalizedSign = sign.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "");

    const signInfo = zodiacSigns[normalizedSign];

    if (!signInfo) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin cung hoàng đạo'
      });
    }

    res.status(200).json({
      success: true,
      data: signInfo
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
    
    // Trong thực tế, dữ liệu này sẽ được lấy từ database
    // Ở đây chúng ta mô phỏng dữ liệu cho mục đích demo
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    const horoscope = {
      sign: sign,
      date: today,
      general: "Hôm nay là một ngày tích cực để bắt đầu những dự án mới và mở rộng mạng lưới xã hội của bạn. Sự sáng tạo của bạn đang ở mức cao.",
      love: "Nếu bạn đang độc thân, đây là thời điểm tốt để gặp gỡ người mới. Với những người đang có đối tác, hãy dành thời gian bên nhau để thắt chặt mối quan hệ.",
      career: "Công việc của bạn sẽ gặp nhiều thuận lợi, đặc biệt trong các dự án đòi hỏi sự sáng tạo và làm việc nhóm.",
      health: "Sức khỏe của bạn khá tốt, nhưng hãy chú ý đến chế độ nghỉ ngơi và tránh căng thẳng quá mức.",
      lucky_number: Math.floor(Math.random() * 100),
      lucky_color: ["Đỏ", "Cam", "Vàng", "Xanh lá", "Xanh dương", "Tím", "Hồng", "Trắng", "Đen"][Math.floor(Math.random() * 9)]
    };

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

    // Mô phỏng kết quả tương hợp (thực tế sẽ dựa trên logic phức tạp hơn)
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
    
    // Dữ liệu mô phỏng về mối liên hệ giữa cung hoàng đạo và các lá bài Tarot
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
      "taurus": {
        sign: "Kim Ngưu",
        major_arcana: {
          primary: "The Hierophant",
          description: "Lá bài The Hierophant tượng trưng cho sự truyền thống, ổn định và giá trị tinh thần - đặc điểm của Kim Ngưu."
        },
        minor_arcana: ["Ace of Pentacles", "Two of Pentacles", "Three of Pentacles"],
        compatible_cards: ["The Empress", "The World", "Justice"],
        elements: "Earth (Suit of Pentacles)"
      }
    };

    // Chuyển đổi tên cung sang chữ thường
    const normalizedSign = sign.toLowerCase();
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
    // Trong thực tế, sẽ lưu dữ liệu vào database
    // Đây chỉ là phương thức mẫu
    res.status(501).json({
      success: false,
      message: 'Chức năng này chưa được triển khai'
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
    // Trong thực tế, sẽ cập nhật dữ liệu trong database
    // Đây chỉ là phương thức mẫu
    res.status(501).json({
      success: false,
      message: 'Chức năng này chưa được triển khai'
    });
  } catch (error) {
    next(error);
  }
};