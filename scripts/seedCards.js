const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { connectDB } = require('../src/config/database'); // Path reverted: ../config -> ../src/config
const Card = require('../src/models/cardModel'); // Path reverted: ../models -> ../src/models
const logger = require('../src/utils/logger'); // Path reverted: ../utils -> ../src/utils

// Load environment variables (especially MONGODB_URI)
// Path reverted: ../../.env -> ../.env
dotenv.config({ path: require('path').resolve(__dirname, '../.env') });

// Data extracted from jobsgo.vn and combined with metabismuth structure
const suitMap = {
  "Cups": "Cốc",
  "Swords": "Kiếm",
  "Wands": "Gậy",
  "Pentacles": "Tiền"
};

// Base structure from metabismuth/tarot-json
const baseCardsInfo = [
  {"name":"The Fool","number":"0","arcana":"Major Arcana","suit":null},
  {"name":"The Magician","number":"1","arcana":"Major Arcana","suit":null},
  {"name":"The High Priestess","number":"2","arcana":"Major Arcana","suit":null},
  {"name":"The Empress","number":"3","arcana":"Major Arcana","suit":null},
  {"name":"The Emperor","number":"4","arcana":"Major Arcana","suit":null},
  {"name":"The Hierophant","number":"5","arcana":"Major Arcana","suit":null},
  {"name":"The Lovers","number":"6","arcana":"Major Arcana","suit":null},
  {"name":"The Chariot","number":"7","arcana":"Major Arcana","suit":null},
  {"name":"Strength","number":"8","arcana":"Major Arcana","suit":null}, // Note: JobsGO has VII. Strength, this is VIII
  {"name":"The Hermit","number":"9","arcana":"Major Arcana","suit":null},
  {"name":"Wheel of Fortune","number":"10","arcana":"Major Arcana","suit":null}, // JobsGO: X. The Wheel
  {"name":"Justice","number":"11","arcana":"Major Arcana","suit":null},
  {"name":"The Hanged Man","number":"12","arcana":"Major Arcana","suit":null},
  {"name":"Death","number":"13","arcana":"Major Arcana","suit":null},
  {"name":"Temperance","number":"14","arcana":"Major Arcana","suit":null},
  {"name":"The Devil","number":"15","arcana":"Major Arcana","suit":null},
  {"name":"The Tower","number":"16","arcana":"Major Arcana","suit":null},
  {"name":"The Star","number":"17","arcana":"Major Arcana","suit":null},
  {"name":"The Moon","number":"18","arcana":"Major Arcana","suit":null},
  {"name":"The Sun","number":"19","arcana":"Major Arcana","suit":null},
  {"name":"Judgement","number":"20","arcana":"Major Arcana","suit":null},
  {"name":"The World","number":"21","arcana":"Major Arcana","suit":null},
  {"name":"Ace of Cups","number":"1","arcana":"Minor Arcana","suit":"Cups"},
  {"name":"Two of Cups","number":"2","arcana":"Minor Arcana","suit":"Cups"},
  {"name":"Three of Cups","number":"3","arcana":"Minor Arcana","suit":"Cups"},
  {"name":"Four of Cups","number":"4","arcana":"Minor Arcana","suit":"Cups"},
  {"name":"Five of Cups","number":"5","arcana":"Minor Arcana","suit":"Cups"},
  {"name":"Six of Cups","number":"6","arcana":"Minor Arcana","suit":"Cups"},
  {"name":"Seven of Cups","number":"7","arcana":"Minor Arcana","suit":"Cups"},
  {"name":"Eight of Cups","number":"8","arcana":"Minor Arcana","suit":"Cups"},
  {"name":"Nine of Cups","number":"9","arcana":"Minor Arcana","suit":"Cups"},
  {"name":"Ten of Cups","number":"10","arcana":"Minor Arcana","suit":"Cups"},
  {"name":"Page of Cups","number":"11","arcana":"Minor Arcana","suit":"Cups"},
  {"name":"Knight of Cups","number":"12","arcana":"Minor Arcana","suit":"Cups"},
  {"name":"Queen of Cups","number":"13","arcana":"Minor Arcana","suit":"Cups"},
  {"name":"King of Cups","number":"14","arcana":"Minor Arcana","suit":"Cups"},
  {"name":"Ace of Swords","number":"1","arcana":"Minor Arcana","suit":"Swords"},
  {"name":"Two of Swords","number":"2","arcana":"Minor Arcana","suit":"Swords"},
  {"name":"Three of Swords","number":"3","arcana":"Minor Arcana","suit":"Swords"},
  {"name":"Four of Swords","number":"4","arcana":"Minor Arcana","suit":"Swords"},
  {"name":"Five of Swords","number":"5","arcana":"Minor Arcana","suit":"Swords"},
  {"name":"Six of Swords","number":"6","arcana":"Minor Arcana","suit":"Swords"},
  {"name":"Seven of Swords","number":"7","arcana":"Minor Arcana","suit":"Swords"},
  {"name":"Eight of Swords","number":"8","arcana":"Minor Arcana","suit":"Swords"},
  {"name":"Nine of Swords","number":"9","arcana":"Minor Arcana","suit":"Swords"},
  {"name":"Ten of Swords","number":"10","arcana":"Minor Arcana","suit":"Swords"},
  {"name":"Page of Swords","number":"11","arcana":"Minor Arcana","suit":"Swords"},
  {"name":"Knight of Swords","number":"12","arcana":"Minor Arcana","suit":"Swords"},
  {"name":"Queen of Swords","number":"13","arcana":"Minor Arcana","suit":"Swords"},
  {"name":"King of Swords","number":"14","arcana":"Minor Arcana","suit":"Swords"},
  {"name":"Ace of Wands","number":"1","arcana":"Minor Arcana","suit":"Wands"}, // JobsGO: Age of Pentacles for Ace
  {"name":"Two of Wands","number":"2","arcana":"Minor Arcana","suit":"Wands"},
  {"name":"Three of Wands","number":"3","arcana":"Minor Arcana","suit":"Wands"},
  {"name":"Four of Wands","number":"4","arcana":"Minor Arcana","suit":"Wands"},
  {"name":"Five of Wands","number":"5","arcana":"Minor Arcana","suit":"Wands"},
  {"name":"Six of Wands","number":"6","arcana":"Minor Arcana","suit":"Wands"},
  {"name":"Seven of Wands","number":"7","arcana":"Minor Arcana","suit":"Wands"},
  {"name":"Eight of Wands","number":"8","arcana":"Minor Arcana","suit":"Wands"},
  {"name":"Nine of Wands","number":"9","arcana":"Minor Arcana","suit":"Wands"},
  {"name":"Ten of Wands","number":"10","arcana":"Minor Arcana","suit":"Wands"},
  {"name":"Page of Wands","number":"11","arcana":"Minor Arcana","suit":"Wands"},
  {"name":"Knight of Wands","number":"12","arcana":"Minor Arcana","suit":"Wands"},
  {"name":"Queen of Wands","number":"13","arcana":"Minor Arcana","suit":"Wands"},
  {"name":"King of Wands","number":"14","arcana":"Minor Arcana","suit":"Wands"},
  {"name":"Ace of Pentacles","number":"1","arcana":"Minor Arcana","suit":"Pentacles"}, // JobsGO: Age of Pentacles
  {"name":"Two of Pentacles","number":"2","arcana":"Minor Arcana","suit":"Pentacles"},
  {"name":"Three of Pentacles","number":"3","arcana":"Minor Arcana","suit":"Pentacles"},
  {"name":"Four of Pentacles","number":"4","arcana":"Minor Arcana","suit":"Pentacles"},
  {"name":"Five of Pentacles","number":"5","arcana":"Minor Arcana","suit":"Pentacles"},
  {"name":"Six of Pentacles","number":"6","arcana":"Minor Arcana","suit":"Pentacles"},
  {"name":"Seven of Pentacles","number":"7","arcana":"Minor Arcana","suit":"Pentacles"},
  {"name":"Eight of Pentacles","number":"8","arcana":"Minor Arcana","suit":"Pentacles"},
  {"name":"Nine of Pentacles","number":"9","arcana":"Minor Arcana","suit":"Pentacles"},
  {"name":"Ten of Pentacles","number":"10","arcana":"Minor Arcana","suit":"Pentacles"},
  {"name":"Page of Pentacles","number":"11","arcana":"Minor Arcana","suit":"Pentacles"},
  {"name":"Knight of Pentacles","number":"12","arcana":"Minor Arcana","suit":"Pentacles"},
  {"name":"Queen of Pentacles","number":"13","arcana":"Minor Arcana","suit":"Pentacles"},
  {"name":"King of Pentacles","number":"14","arcana":"Minor Arcana","suit":"Pentacles"}
];

// Meanings extracted from jobsgo.vn (name mapping might need adjustment)
const meaningsJobsGo = {
  "The Fool": { upright: "Đại diện cho một khởi đầu mới trong cuộc đời bạn.", reversed: "Bạn đang thiếu thận trọng khi đưa ra những quyết định." },
  "The Magician": { upright: "Bạn gặt hái thành công bởi tài năng và kinh nghiệm vốn có của mình.", reversed: "Sự mất tự tin, thiếu quyết đoán khiến bạn tiêu cực với mọi thứ và dễ bỏ lỡ các cơ hội quan trọng." },
  "The High Priestess": { upright: "Bạn cần loại bỏ những rào cản và khai phá tiềm năng “ngủ quên” trong mình.", reversed: "Bạn đang thiếu quan tâm tới cảm xúc của chính mình." },
  "The Empress": { upright: "Thời điểm thích hợp để thực hiện hoá giấc mơ bạn đang ấp ủ.", reversed: "Tâm trạng sa sút vì bạn đang gặp trở ngại lớn." },
  "The Emperor": { upright: "Rất có thể bạn sẽ có một bước tiến vượt bậc trong công việc.", reversed: "Bạn đang thiếu linh hoạt khi xử lý các vấn đề." },
  "The Hierophant": { upright: "Thời điểm bạn nên tập trung trau dồi và rèn luyện bản thân.", reversed: "Bạn đang khao khát được bứt ra khỏi những quy tắc khắt khe, gò bó." },
  "The Lovers": { upright: "Bạn cần xem xét lại vấn đề trước khi quyết định.", reversed: "Có thể bạn đã đưa ra một quyết định sai lầm và vô tình làm tổn thương ai đó." },
  "The Chariot": { upright: "Dấu hiệu của sự chuyển mình tích cực trong sự nghiệp của bạn.", reversed: "Có vẻ như mọi thứ đang lệch khỏi đường ray mà bạn đã vạch sẵn." },
  "Strength": { upright: "Sức mạnh và sự nhẫn nại chính là chìa khóa để bạn gặt hái thành công.", reversed: "Bạn cần đánh giá lại khả năng của bản thân để tìm ra mục tiêu phù hợp." }, // JobsGO uses VII. Strength
  "The Hermit": { upright: "Bạn nên nghỉ ngơi và tĩnh tâm suy nghĩ.", reversed: "Dường như bạn đang quá cố chấp với quan điểm của mình mà bỏ qua những lời khuyên từ mọi người." },
  "Wheel of Fortune": { upright: "Bạn đang bước vào giai đoạn mới với nhiều cơ hội rộng mở hơn.", reversed: "Bạn cảm thấy hoang mang và tồi tệ bởi những thay đổi bất ngờ." }, // JobsGO: The Wheel
  "Justice": { upright: "Bạn cần đưa ra quyết định sáng suốt và công bằng.", reversed: "Có thể bạn đang bị đối xử bất công trong công việc." },
  "The Hanged Man": { upright: "Bạn nên đánh giá lại thái độ, mục tiêu của mình.", reversed: "Bạn đang trong giai đoạn phải “thắt lưng buộc bụng”." },
  "Death": { upright: "Bạn sắp đối diện với những sự kiện trọng đại trong đời.", reversed: "Có vẻ bạn đang phải chịu nhiều áp lực trong công việc." },
  "Temperance": { upright: "Bạn đang ở trạng thái cực kỳ lý tưởng trong công việc, tình cảm và sức khỏe.", reversed: "Bạn bị hấp dẫn bởi những cái lợi trước mắt mà quên đi việc xây dựng giá trị lâu dài." },
  "The Devil": { upright: "Bạn đang bị trói buộc vào điều mà bạn không yêu thích.", reversed: "Bạn “làm chủ” được mình trong công việc và thoát ra khỏi mối quan hệ độc hại trong tình yêu." },
  "The Tower": { upright: "Báo hiệu một thay đổi mang tính bất ngờ lớn.", reversed: "Kết thúc những đau khổ mà bạn đang phải chịu đựng." },
  "The Star": { upright: "Mọi chuyện đang trên đà thăng hoa.", reversed: "Tính cách rụt rè, e ngại có thể khiến bạn lạc mất nhiều cơ hội." },
  "The Moon": { upright: "Lời cảnh báo về vấn đề thiếu trung thực.", reversed: "Những vấn đề bạn đang thắc mắc sẽ dần trở nên rõ ràng." },
  "The Sun": { upright: "Bạn đang dồi dào năng lượng, sẽ có thành tựu lớn trong thời gian tới.", reversed: "Bạn không thỏa mãn với thành công đã đạt được." },
  "Judgement": { upright: "Mọi chuyện đang phát triển theo hướng tốt đẹp.", reversed: "Bạn cần chủ động khép lại một số vấn đề trong đời sống." },
  "The World": { upright: "Kết quả sắp tới sẽ làm bạn mãn nguyện, hạnh phúc.", reversed: "Bạn đang cảm thấy bế tắc." },
  "Ace of Wands": { upright: "Mở ra một hướng đi hoàn toàn mới.", reversed: "Bạn gặp khó khăn trong việc xác định mục tiêu của bản thân." },
  "Two of Wands": { upright: "Bạn tiến bộ hơn khi thiết lập được những kế hoạch ngắn, dài hạn.", reversed: "Bạn có thể gặp một vài trục trặc bất ngờ." },
  "Three of Wands": { upright: "Mọi thứ đang diễn ra như mong đợi.", reversed: "Bạn gặp một vài sự cố và trì hoãn mục tiêu của mình." },
  "Four of Wands": { upright: "Bạn đang hạnh phúc, ổn định", reversed: "Bạn đang mắc kẹt trong bầu không khí ngột ngạt." },
  "Five of Wands": { upright: "Bạn đang ở giữa những cuộc xung đột, căng thẳng.", reversed: "Bạn vượt qua sự giận dữ của bản thân." },
  "Six of Wands": { upright: "Bạn nhận được thành công, chiến thắng và sự công nhận.", reversed: "Bạn đang tiêu cực về bản thân." },
  "Seven of Wands": { upright: "Bạn đang gặp một chút thách thức. Hãy kiên trì, thành công sẽ đến với bạn ngay thôi.", reversed: "Bạn đang cảm thấy bất an và dễ bị tổn thương." },
  "Eight of Wands": { upright: "Các cuộc đấu tranh đã kết thúc.", reversed: "Bạn đang phải đối mặt với nhiều trở ngại trong mục tiêu của mình." },
  "Nine of Wands": { upright: "Đừng bỏ cuộc lúc này vì bạn sắp đạt được thành công.", reversed: "Bạn do dự trước những cam kết." },
  "Ten of Wands": { upright: "Bạn đang gặt gái những phần thưởng sau những cố gắng của bản thân.", reversed: "Bạn đang có quá nhiều gánh nặng." },
  "Page of Wands": { upright: "Bạn đang ôm ấp nhiều dự định và chỉ chờ cơ hội để “bùng nổ”.", reversed: "Bạn thiếu quyết đoán về con đường phía trước." },
  "Knight of Wands": { upright: "Bạn tự tin, sẵn sàng chinh phục cả thế giới.", reversed: "Sự mất mát của quyền lực cá nhân vì sử dụng chúng một cách tiêu cực." },
  "Queen of Wands": { upright: "Bạn mạnh mẽ, độc lập, sáng tạo ngay cả khi đối mặt với nghịch cảnh.", reversed: "Bạn mất niềm tin vào chính mình và trở nên e dè, sợ sệt." },
  "King of Wands": { upright: "Nhắc nhở bạn định hướng cuộc sống với mục đích và tầm nhìn dài hạn.", reversed: "Có thể bạn đang có những quyết định vội vàng, bốc đồng." },
  "Ace of Pentacles": { upright: "Bạn đang tận hưởng sự sung túc.", reversed: "Bạn có thể bỏ lỡ cơ hội vì thiếu tầm nhìn xa." }, // JobsGO: Age of Pentacles
  "Two of Pentacles": { upright: "Sự khởi đầu của một công việc mới.", reversed: "Bạn đang gặp khó khăn trong việc quản lý các hoạt động của mình." },
  "Three of Pentacles": { upright: "Sự hoàn thành ban đầu của một mục tiêu hay kế hoạch.", reversed: "Sự thiếu tinh thần đồng đội." },
  "Four of Pentacles": { upright: "Bạn hoàn thành mục tiêu và đạt được nhiều của cải.", reversed: "Bạn bị ám ảnh về sự nghèo đói và buộc mình phải chạy theo vật chất." },
  "Five of Pentacles": { upright: "Bạn gặp khó khăn trong tất cả mọi thứ.", reversed: "Chấm dứt thời kỳ khó khăn." },
  "Six of Pentacles": { upright: "Sự hào phóng về tiền tài, vật chất.", reversed: "Hãy cẩn thận về những người bạn cho vay tiền." },
  "Seven of Pentacles": { upright: "Bạn đang tận hưởng những thành quả đạt được từ những khó khăn và nỗ lực.", reversed: "Bạn có thể không gặt hái những thứ mình đang tìm kiếm." },
  "Eight of Pentacles": { upright: "Dấu hiệu tích cực cho sự khởi đầu mới.", reversed: "Sự cầu toàn của bạn có thể trở thành rào cản." },
  "Nine of Pentacles": { upright: "Bạn đang chạm đến sự tự tin, tự do, tự túc.", reversed: "Bạn đang trải qua mất mát vì những quyết định không khôn ngoan." },
  "Ten of Pentacles": { upright: "Bạn đạt đến đỉnh cao của sự nghiệp.", reversed: "Có thể hôn nhân của bạn vừa tan vỡ." },
  "Page of Pentacles": { upright: "Đây là lúc bạn cần hành động, mở rộng công việc làm ăn.", reversed: "Bạn đang bị tắc nghẽn do không lập ra kế hoạch từ trước.." },
  "Knight of Pentacles": { upright: "Bạn sắp nhận một nhiệm vụ quan trọng.", reversed: "Bạn khao khát thoát ra khỏi sự nhàm chán." },
  "Queen of Pentacles": { upright: "Đại diện cho sự yêu thương, chăm sóc.", reversed: "Bạn đang lo lắng về tự chủ tài chính." },
  "King of Pentacles": { upright: "Bạn đã đạt đến đỉnh cao của thành công.", reversed: "Có thể bạn đang lạm dụng quyền lực, quyền hạn và kiểm soát." },
  "Ace of Swords": { upright: "Đại diện cho một giai đoạn của cái nhìn sâu sắc.", reversed: "Bạn đang bắt đầu trở nên hỗn loạn." },
  "Two of Swords": { upright: "Dường như bạn đang do dự, bế tắc trước vấn đề quan trọng.", reversed: "Bạn đang lung lay trước quan điểm của người khác." },
  "Three of Swords": { upright: "Bạn sắp đối diện với sự buồn bã, chia ly.", reversed: "Bạn vừa bình phục sau khi trải qua những đau khổ." },
  "Four of Swords": { upright: "Thời gian tốt để xây dựng sức mạnh tinh thần.", reversed: "Bạn làm việc không ngừng nghỉ mà quên mất cơ thể cần nghỉ ngơi." },
  "Five of Swords": { upright: "Bạn đang quá tham vọng.", reversed: "Bạn đã sẵn sàng để kết thúc những căng thẳng." },
  "Six of Swords": { upright: "Bạn đang đối diện với những chuyển biến khó khăn.", reversed: "Bạn đang cố gắng thoát ra khỏi quá khứ." },
  "Seven of Swords": { upright: "Bạn đang lén lút, dối lừa.", reversed: "Bạn gặp thử thách trong hướng đi mới." },
  "Eight of Swords": { upright: "Bạn đang mù quáng tin vào nhận định của bản thân.", reversed: "Bạn đang dần trở nên cởi mở hơn." },
  "Nine of Swords": { upright: "Bạn đang hà khắc với chính mình.", reversed: "Bạn đang lo âu quá mức." },
  "Ten of Swords": { upright: "Bạn sẽ thoát khỏi vực thẳm và rút ra được bài học đắt giá.", reversed: "Kết thúc tình trạng tồi tệ." },
  "Page of Swords": { upright: "Phản ánh niềm đam mê, năng động, nhiệt huyết.", reversed: "Bạn đang hành động vội vàng." },
  "Knight of Swords": { upright: "Năng lượng bùng nổ, thúc đẩy bạn tiến về phía trước.", reversed: "Bạn có chút thiếu kiên nhẫn, bốc đồng." },
  "Queen of Swords": { upright: "Cần xử lý vấn đề bằng lý trí chứ không phải cảm xúc.", reversed: "Bạn nên tập trung hơn vào hướng đi của bản thân." },
  "King of Swords": { upright: "Đây là lúc bạn gạt bỏ cảm xúc, giữ sự khách quan.", reversed: "Bạn thiếu định hướng trong thời gian này." },
  "Ace of Cups": { upright: "Cơ hội cho sự vun đắp, chữa lành.", reversed: "Bạn đã kìm nén cảm xúc quá lâu, hãy giải phóng chúng." },
  "Two of Cups": { upright: "Nói lên hôn nhân và sự hoà hợp.", reversed: "Bạn gặp rắc rối với đối tác hoặc tình yêu." },
  "Three of Cups": { upright: "Khoảng thời gian hài hoà với đồng nghiệp, bạn bè.", reversed: "Ám chỉ sự đổ vỡ trong tình yêu." },
  "Four of Cups": { upright: "Bạn đang buồn chán hoặc không hài lòng với hiện tại.", reversed: "Bạn bất an, muốn chạy trốn khỏi hiện thực." },
  "Five of Cups": { upright: "Có thể bạn sẽ không đạt được kết quả như mong đợi.", reversed: "Chấm dứt sự đau khổ, khởi đầu cho tình yêu mới." },
  "Six of Cups": { upright: "Bạn nhớ nhung quá khứ, bỏ quên thực tại.", reversed: "Bạn đang có những ý tưởng không thực tế." },
  "Seven of Cups": { upright: "Đánh giá lại vấn đề và đưa ra sự lựa chọn đúng đắn.", reversed: "Bạn đang lãng phí thời gian để theo đuổi những thứ không thuộc về mình." },
  "Eight of Cups": { upright: "Bạn muốn giải thoát khỏi sự bon chen của cuộc sống.", reversed: "Từ bỏ lúc này là quyết định sáng suốt nhất." },
  "Nine of Cups": { upright: "Giai đoạn cuối cùng của sự phát triển.", reversed: "Mong muốn của bạn có thể không được như mong đợi." },
  "Ten of Cups": { upright: "Bạn đang hạnh phúc trong tình yêu, hôn nhân.", reversed: "Có ai đó chen ngang vào một trong số các mối quan hệ của bạn." },
  "Page of Cups": { upright: "Khởi đầu cho dự án sáng tạo hoặc liên doanh.", reversed: "Sự bùng nổ cực đại về mặt cảm xúc." },
  "Knight of Cups": { upright: "Sự khôn ngoan giúp bạn vượt qua trở ngại trong cuộc sống.", reversed: "Cảm xúc dâng trào đến mức không thể kiểm soát." },
  "Queen of Cups": { upright: "Bạn cần thông cảm cho hoàn cảnh của mọi người xung quanh.", reversed: "Bạn đang bất an, căng thẳng." },
  "King of Cups": { upright: "Cảm xúc cân bằng trong tầm kiểm soát.", reversed: "Bạn cộc cằn, ủ rũ, cả tin." }
};

const cardsData = baseCardsInfo.map(baseCard => {
  const meanings = meaningsJobsGo[baseCard.name] || meaningsJobsGo[baseCard.name.replace("Age of", "Ace of")] || { upright: "Ý nghĩa xuôi (placeholder).", reversed: "Ý nghĩa ngược (placeholder)." };
  return {
    name: baseCard.name,
    deck: "Rider-Waite-Smith (JobsGO Data)",
    imageUrl: `https://via.placeholder.com/200x350/EEEEEE/AAAAAA?Text=${encodeURIComponent(baseCard.name)}`,
    type: baseCard.arcana,
    suit: baseCard.suit ? suitMap[baseCard.suit] || baseCard.suit : null,
    number: parseInt(baseCard.number, 10),
    keywords: ["Tarot", baseCard.name.toLowerCase().replace(/\s+/g, '-')], // Basic keywords
    uprightMeaning: meanings.upright,
    reversedMeaning: meanings.reversed,
    description: `Đây là mô tả chi tiết cho lá bài ${baseCard.name}. (Nội dung sẽ được cập nhật sau).`
  };
});

const seedCards = async () => {
  try {
    await connectDB();
    logger.info('Database connected for seeding cards.');

    // Clear existing cards
    await Card.deleteMany({});
    logger.info('Existing cards cleared.');

    // Insert new cards
    // IMPORTANT: Ensure cardsData contains all 78 cards before running!
    if (cardsData.length < 78) {
         logger.warn(`WARNING: cardsData only contains ${cardsData.length} cards. Seeding incomplete data.`);
    }
    await Card.insertMany(cardsData);
    logger.info(`Successfully seeded ${cardsData.length} cards.`);

  } catch (error) {
    logger.error('Error seeding cards:', error);
    process.exit(1); // Exit with error code
  } finally {
    // Ensure disconnection even if errors occur
    await mongoose.disconnect();
    logger.info('Database connection closed after seeding.');
  }
};

// Execute the seeding function
seedCards();
