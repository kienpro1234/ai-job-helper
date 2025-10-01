// app/(main)/ai-cover-letter/_components/CoverLetterDisplay.jsx
"use client";

import React from "react";
import "./cover-letter-styles.css";

// Hàm phân tích này giữ nguyên như lần cập nhật trước
const parseCoverLetterBody = (markdown) => {
  if (!markdown) return {};
  const lines = markdown.split("\n");
  const result = {
    date: "",
    recipient: [],
    salutation: "",
    body: [],
    closing: "",
    signature: "",
  };
  let state = "start";
  for (const line of lines) {
    if (state === "start" && (line.startsWith("Dear") || line.match(/^\w+,/))) {
      state = "salutation";
    } else if (state === "start" && line.match(/\w+\s\d{1,2},\s\d{4}/)) {
      state = "date";
    }
    if (line.toLowerCase().startsWith("dear")) {
      result.salutation = line;
      state = "body";
      continue;
    }
    if (
      line.toLowerCase().startsWith("sincerely") ||
      line.toLowerCase().startsWith("yours truly")
    ) {
      state = "closing";
      result.closing = line;
      continue;
    }
    if (state === "closing" && line.trim()) {
      state = "signature";
    }
    switch (state) {
      case "date":
        if (line) {
          result.date = line.trim();
          state = "recipient";
        }
        break;
      case "recipient":
        if (line.trim()) result.recipient.push(line.trim());
        else state = "salutation";
        break;
      case "body":
        result.body.push(line);
        break;
      case "signature":
        if (line.trim()) result.signature = line.trim();
        state = "done";
        break;
      default:
        break;
    }
  }
  return result;
};

const CoverLetterDisplay = ({ content, coverLetter }) => {
  const data = parseCoverLetterBody(content);
  const user = coverLetter?.user;

  // Tạo một mảng chứa các phần thông tin liên hệ để dễ dàng nối với nhau
  const contactParts = [
    // Tên sẽ là một phần tử riêng
    user?.name,
    // Các thông tin khác, có icon đi kèm nếu tồn tại
    user?.phone && `📞 ${user.phone}`,
    user?.email && `📧 ${user.email}`,
    user?.address && `📍 ${user.address}`,
  ].filter(Boolean); // Lọc ra những giá trị null hoặc rỗng

  return (
    <div className="letter-container">
      <div className="letter-paper">
        {/* === PHẦN HEADER ĐÃ SỬA LẠI THEO Ý BẠN === */}
        <div className="letter-header">
          <h1 className="letter-job-title">
            {coverLetter?.jobTitle || "Cover Letter"}
          </h1>
          <div className="letter-contact-info">
            {contactParts.map((part, index) => (
              <React.Fragment key={index}>
                <span className="contact-part">{part}</span>
                {/* Thêm dấu ngăn cách nếu không phải là phần tử cuối cùng */}
                {index < contactParts.length - 1 && (
                  <span className="separator" aria-hidden="true">
                    &nbsp;|&nbsp;
                  </span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Phần còn lại của thư giữ nguyên */}
        <div className="letter-meta">
          <p className="letter-date">{data.date}</p>
          <div className="letter-recipient">
            {data.recipient.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </div>
        <div className="letter-body">
          <p className="font-semibold">{data.salutation}</p>
          {data.body.map((paragraph, i) => (
            <p
              key={i}
              dangerouslySetInnerHTML={{
                __html: paragraph
                  .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                  .replace(/\*(.*?)\*/g, "<em>$1</em>"),
              }}
            />
          ))}
          <p>{data.closing}</p>
          <p className="letter-signature">{data.signature || user?.name}</p>
        </div>
      </div>
    </div>
  );
};

export default CoverLetterDisplay;
