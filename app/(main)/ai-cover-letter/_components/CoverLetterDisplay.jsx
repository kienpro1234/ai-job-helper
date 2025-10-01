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
        state = "done";
        break;
    }
  }

  // --- LOGIC TÁCH CHUỖI ---
  result.name = result.header[0] || "[Your Name]";

  const remainingHeaderLines = result.header.slice(1);
  let phone = "[Your Phone]";
  let email = "[Your Email]";
  const addressParts = [];

  const emailRegex = /[\w.-]+@[\w.-]+\.\w+/;
  // Regex linh hoạt cho số điện thoại Việt Nam
  const phoneRegex = /(?:\(?\d{3,4}\)?[-.\s]?)?\d{3}[-.\s]?\d{3,4}/;

  remainingHeaderLines.forEach((line) => {
    if (emailRegex.test(line)) {
      email = line.replace(/\|/g, "").trim();
    } else if (phoneRegex.test(line)) {
      phone = line.replace(/\|/g, "").trim();
    } else {
      // Nếu không phải email hay phone, coi nó là một phần của địa chỉ
      addressParts.push(line.replace(/\|/g, "").trim());
    }
  });

  result.phone = phone;
  result.email = email;
  result.address = addressParts.join(", ").trim(); // Nối các phần địa chỉ lại với nhau

  return result;
};

const CoverLetterDisplay = ({ content }) => {
  const data = parseCoverLetter(content);

  return (
    <div className="letter-container">
      <div className="letter-paper" id="pdf-content">
        {/* Header */}
        <div className="letter-header">
          <h1 className="letter-name">{data.name}</h1>
          <div className="letter-contact-info">
            <span>📞 {data.phone}</span>
            <span className="separator">|</span>
            <span>📧 {data.email}</span>
            <span className="separator">|</span>
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
            // Xử lý markdown cho đậm và nghiêng
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
