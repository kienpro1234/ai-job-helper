/**
 * Phân tích chuỗi HTML của phần contact info để lấy chi tiết.
 * @param {string} htmlString - Chuỗi HTML chứa thông tin liên hệ.
 * @returns {object} - Object chứa email, mobile, linkedin, twitter.
 */
function parseContactInfo(htmlString) {
  if (!htmlString) return {};
  const contactInfo = {};

  // Regex để tìm email
  const emailMatch = htmlString.match(/mailto:([^"]+)/);
  if (emailMatch) contactInfo.email = emailMatch[1];

  // Regex để tìm số điện thoại
  const mobileMatch = htmlString.match(/📱\s*([^<]+)/);
  if (mobileMatch) contactInfo.mobile = mobileMatch[1].trim();

  // Regex để tìm LinkedIn URL
  const linkedinMatch = htmlString.match(/💼\s*<a href="([^"]+)"/);
  if (linkedinMatch) contactInfo.linkedin = linkedinMatch[1];

  // Regex để tìm Twitter/X URL
  const twitterMatch = htmlString.match(/🐦\s*<a href="([^"]+)"/);
  if (twitterMatch) contactInfo.twitter = twitterMatch[1];

  return contactInfo;
}

/**
 * Phân tích nội dung của một section (Kinh nghiệm, Học vấn, Dự án)
 * thành một mảng các object.
 * @param {string} sectionContent - Chuỗi markdown của một section.
 * @returns {Array<object>} - Mảng các entry.
 */
function parseEntries(sectionContent) {
  if (!sectionContent) return [];
  // Tách các entry bằng tiêu đề H3 (###)
  const entryParts = sectionContent.split(/\n(?=###\s)/);

  return entryParts
    .map((part) => {
      const lines = part.trim().split("\n");
      const entry = {};

      // Dòng đầu tiên là title và organization
      const headerMatch = lines[0]?.match(/###\s*\*\*(.+?)\*\* at \*(.+?)\*/);
      if (headerMatch) {
        entry.title = headerMatch[1];
        entry.organization = headerMatch[2];
      }

      // Dòng thứ hai là ngày tháng
      const dateMatch = lines[1]?.match(/\*(.+?)\*/);
      if (dateMatch) {
        const [startDate, endDate] = dateMatch[1]
          .split(" - ")
          .map((d) => d.trim());
        entry.startDate = startDate;
        if (endDate && endDate.toLowerCase() !== "present") {
          entry.endDate = endDate;
          entry.current = false;
        } else {
          entry.endDate = "";
          entry.current = true;
        }
      }

      // Các dòng còn lại là mô tả
      entry.description = lines.slice(2).join("\n").trim();

      return entry;
    })
    .filter((e) => e.title); // Lọc ra các entry hợp lệ
}

/**
 * Hàm chính để phân tích toàn bộ CV markdown thành object cho form.
 * @param {string} markdown - Chuỗi markdown của toàn bộ CV.
 * @returns {object} - Object chứa dữ liệu đã được cấu trúc.
 */
export function parseCvMarkdown(markdown) {
  if (!markdown) return {};

  const result = {
    contactInfo: {},
  };
  const sectionMappings = [
    { key: "summary", title: "Professional Summary", icon: "📝" },
    { key: "skills", title: "Skills", icon: "🔧" },
    { key: "experience", title: "Work Experience", icon: "💼", isEntry: true },
    { key: "education", title: "Education", icon: "🎓", isEntry: true },
    { key: "projects", title: "Projects", icon: "🚀", isEntry: true },
  ];

  let remainingMarkdown = markdown;

  const firstHeaderRegex = /##\s*[📝🔧💼🎓🚀]/;
  const firstMatch = markdown.match(firstHeaderRegex);

  if (firstMatch) {
    const index = firstMatch.index;
    const contactAndNameSection = markdown
      .substring(0, index)
      .replace(/<hr>\s*$/, "")
      .trim();

    result.contactInfo = parseContactInfo(contactAndNameSection);

    remainingMarkdown = markdown.substring(index);
  } else {
    // Xử lý trường hợp CV chỉ có phần header
    result.contactInfo = parseContactInfo(markdown.trim());
    return result;
  }

  for (let i = 0; i < sectionMappings.length; i++) {
    const current = sectionMappings[i];
    const next = sectionMappings[i + 1];

    const startRegex = new RegExp(
      `^##\\s*(?:${current.icon}\\s*)?${current.title}`,
      "im"
    );
    const startMatch = remainingMarkdown.match(startRegex);

    if (!startMatch) continue;

    let contentToEnd = remainingMarkdown.substring(
      startMatch.index + startMatch[0].length
    );
    let sectionContent = contentToEnd;

    if (next) {
      const endRegex = new RegExp(
        `^##\\s*(?:${next.icon}\\s*)?${next.title}`,
        "im"
      );
      const endMatch = contentToEnd.match(endRegex);
      if (endMatch) {
        sectionContent = contentToEnd.substring(0, endMatch.index);
      }
    }

    const cleanContent = sectionContent.replace(/<hr>\s*$/, "").trim();

    if (current.isEntry) {
      result[current.key] = parseEntries(cleanContent);
    } else {
      result[current.key] = cleanContent;
    }
  }

  return result;
}
