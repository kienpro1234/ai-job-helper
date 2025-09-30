// app/(main)/ai-cover-letter/_components/CoverLetterDisplay.jsx
"use client";

import React from "react";
// import { Mail, Phone, MapPin } from "lucide-react";
import "./cover-letter-styles.css";

// Hàm để phân tích nội dung Markdown
const parseCoverLetter = (markdown) => {
  if (!markdown) return {};

  const lines = markdown.split("\n").map((line) => line.trim());

  const result = {
    header: [],
    date: "",
    recipient: [],
    salutation: "",
    body: [],
    closing: "",
    signature: "",
  };

  let state = "header";

  for (const line of lines) {
    if (line.startsWith("**Subject:")) {
      state = "body";
      result.body.push(line);
      continue;
    }
    if (line.toLowerCase().startsWith("dear")) {
      state = "body";
      result.salutation = line;
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
    if (state === "closing" && line) {
      state = "signature";
    }

    switch (state) {
      case "header":
        if (line) result.header.push(line);
        else state = "date";
        break;
      case "date":
        if (line) {
          result.date = line;
          state = "recipient";
        }
        break;
      case "recipient":
        if (line) result.recipient.push(line);
        else state = "salutation";
        break;
      case "body":
        result.body.push(line);
        break;
      case "signature":
        result.signature = line;
        state = "done"; // Stop parsing
        break;
    }
  }

  // Lấy thông tin chi tiết từ header
  result.name = result.header[0] || "[Your Name]";
  const contactLine = result.header.slice(1).join(" | ");

  const emailMatch = contactLine.match(/[\w.-]+@[\w.-]+\.\w+/);
  const phoneMatch = contactLine.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);

  result.email = emailMatch ? emailMatch[0] : "[Your Email]";
  result.phone = phoneMatch ? phoneMatch[0] : "[Your Phone]";
  // Giả định phần còn lại là địa chỉ
  result.address = contactLine
    .replace(result.email, "")
    .replace(result.phone, "")
    .replace(/\|/g, "")
    .trim();

  return result;
};

const CoverLetterDisplay = ({ content }) => {
  const data = parseCoverLetter(content);

  return (
    <div className="letter-container">
      <div className="letter-paper">
        {/* Header */}
        <div className="letter-header">
          <h1 className="letter-name">{data.name}</h1>
          <div className="letter-contact-info">
            <span>📞 {data.phone}</span>
            <span>📧 {data.email}</span>
            <span>📍 {data.address}</span>
          </div>
        </div>

        {/* Date and Recipient */}
        <div className="letter-meta">
          <p className="letter-date">{data.date}</p>
          <div className="letter-recipient">
            {data.recipient.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="letter-body">
          <p className="font-semibold">{data.salutation}</p>
          {data.body.map((paragraph, i) => (
            // Xử lý markdown đơn giản cho đậm và nghiêng
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
          <p className="letter-signature">{data.signature}</p>
        </div>
      </div>
    </div>
  );
};

export default CoverLetterDisplay;
