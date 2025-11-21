// Groq API Configuration
const GROQ_API_KEY = ''; // Thay bằng API key thực tế
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
// Flag to prevent duplicate event listeners
let formListenerAdded = false;

// Conversation history
let conversationHistory = [
  {
    role: "system",
    content: "Bạn là Trợ lý AI Y tế thông minh, chuyên về chẩn đoán hình ảnh và thuật toán Filter Back-Projection (FBP). Nhiệm vụ của bạn là hỗ trợ bác sĩ phân tích dữ liệu, tư vấn chuyên môn và lập báo cáo khi được yêu cầu. Hãy giữ thái độ chuyên nghiệp, khách quan."
  }
];

// Load context from analysis
const latestAnalysis = localStorage.getItem('latestAnalysis');
if (latestAnalysis) {
  try {
    const data = JSON.parse(latestAnalysis);
    let imageContext = "";
    if (data.detectedFrames && data.detectedFrames.length > 0) {
      imageContext = `\n\nẢNH KHỐI U ĐƯỢC PHÁT HIỆN (Hãy chèn vào báo cáo bằng cú pháp Markdown ![Tumor](url)):\n`;
      data.detectedFrames.forEach((url, index) => {
        imageContext += `- Ảnh ${index + 1}: http://localhost:5000${url}\n`;
      });
    }

    conversationHistory[0].content += `\n\nDỮ LIỆU PHÂN TÍCH (Tham khảo):\n- Bệnh nhân: ${data.patientName}\n- Số khung hình: ${data.frameCount}\n- Thời gian: ${data.timestamp}${imageContext}\n\nHƯỚNG DẪN ỨNG XỬ (QUAN TRỌNG):\n1. GIAO TIẾP: Nếu người dùng chào hỏi hoặc hỏi chung chung, hãy trả lời ngắn gọn, thân thiện như một trợ lý ảo. KHÔNG tự ý đưa ra báo cáo y khoa ngay lập tức.\n2. LẬP BÁO CÁO: CHỈ KHI người dùng hỏi về "kết quả", "bệnh nhân", "tình trạng", hoặc yêu cầu "báo cáo", hãy đóng vai chuyên gia và tạo "BÁO CÁO Y KHOA" chi tiết (dùng Markdown, chèn ảnh khối u nếu có, đưa ra kiến nghị lâm sàng).\n3. TƯ VẤN: Luôn sẵn sàng giải thích các thuật ngữ, nguyên lý FBP hoặc đưa ra lời khuyên dựa trên dữ liệu.\n- Ngôn ngữ: Tiếng Việt chuẩn y khoa.`;
    console.log('✅ Loaded analysis context with images');
  } catch (e) {
    console.error('Error parsing analysis context:', e);
  }
}

// Xử lý gửi message
async function handleChatSubmit(e) {
  e.preventDefault();

  const messageInput = document.getElementById('messageInput');
  const chatMessages = document.getElementById('chatMessages');
  const message = messageInput.value.trim();

  if (!message) return;

  // Thêm user message
  const userMessageEl = document.createElement('div');
  userMessageEl.classList.add('message', 'user-message');
  userMessageEl.innerHTML = `
    <div class="message-content">
      <p>${message}</p>
    </div>
    <div class="message-avatar">
      <i class="fas fa-user"></i>
    </div>
  `;
  chatMessages.appendChild(userMessageEl);

  // Clear input
  messageInput.value = '';

  // Scroll to bottom
  chatMessages.scrollTop = chatMessages.scrollHeight;

  // Hiển thị loading
  const botMessageEl = document.createElement('div');
  botMessageEl.classList.add('message', 'bot-message');
  botMessageEl.innerHTML = `
    <div class="message-avatar">
      <i class="fas fa-robot"></i>
    </div>
    <div class="message-content">
      <p><i class="fas fa-spinner fa-spin"></i> Đang suy luận...</p>
    </div>
  `;
  chatMessages.appendChild(botMessageEl);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  // Add user message to history
  conversationHistory.push({
    role: "user",
    content: message
  });

  // Check for API key
  if (!GROQ_API_KEY) {
    const botMessageEl = document.createElement('div');
    botMessageEl.classList.add('message', 'bot-message');
    botMessageEl.innerHTML = `
      <div class="message-avatar">
        <i class="fas fa-robot"></i>
      </div>
      <div class="message-content">
        <p>⚠️ Chưa có API Key. Vui lòng cập nhật GROQ_API_KEY trong file chatbot.js hoặc liên hệ quản trị viên.</p>
      </div>
    `;
    chatMessages.appendChild(botMessageEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return;
  }

  try {
    // Call Groq API with reasoning
    const requestBody = {
      model: "openai/gpt-oss-120b",
      messages: conversationHistory,
      temperature: 0.6,
      max_completion_tokens: 1024,
      top_p: 0.95,
      include_reasoning: true
    };
    console.log('📤 Sending request:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('❌ Groq API Error:', errText);
      throw new Error(`API request failed: ${errText}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;
    // GPT-OSS models return reasoning in message.reasoning
    const reasoning = data.choices[0].message.reasoning;

    // Add assistant response to history
    conversationHistory.push({
      role: "assistant",
      content: assistantMessage
    });

    // Display response with reasoning
    let responseHTML = `
      <div class="message-avatar">
        <i class="fas fa-robot"></i>
      </div>
      <div class="message-content">
    `;

    if (reasoning) {
      responseHTML += `<p class="reasoning"><em>🧠 Suy luận: ${reasoning}</em></p><hr style="margin: 8px 0; border-color: rgba(255,255,255,0.1);">`;
    }

    // Parse Markdown to HTML using marked.js
    let htmlContent = assistantMessage;
    if (typeof marked !== 'undefined') {
      htmlContent = marked.parse(assistantMessage);
    }

    responseHTML += `<div class="markdown-body">${htmlContent}</div></div>`;

    botMessageEl.innerHTML = responseHTML;

    // Render MathJax if present
    if (window.MathJax && window.MathJax.typesetPromise) {
      window.MathJax.typesetPromise([botMessageEl]).catch((err) => console.log(err));
    }

    chatMessages.scrollTop = chatMessages.scrollHeight;

  } catch (error) {
    console.error('Error calling Groq API:', error);
    botMessageEl.innerHTML = `
      <div class="message-avatar">
        <i class="fas fa-robot"></i>
      </div>
      <div class="message-content">
        <p>❌ Xin lỗi, đã xảy ra lỗi khi xử lý yêu cầu. Vui lòng kiểm tra API key hoặc thử lại sau.</p>
      </div>
    `;
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}

// Initialize chatbot
function initChatbot() {
  const chatForm = document.getElementById('chatForm');

  // Only add event listener once
  if (!formListenerAdded && chatForm) {
    chatForm.addEventListener('submit', handleChatSubmit);
    formListenerAdded = true;
    console.log('✅ Chatbot initialized');
  }

  // Auto-focus vào input
  const messageInput = document.getElementById('messageInput');
  if (messageInput) {
    messageInput.focus();
  }
}

// Run init when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initChatbot);
} else {
  initChatbot();
}
