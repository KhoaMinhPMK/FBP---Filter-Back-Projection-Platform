// Groq API Configuration
const GROQ_API_KEY = ''; // Thay bằng API key thực tế
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Conversation history
let conversationHistory = [
  {
    role: "system",
    content: "Bạn là trợ lý AI chuyên về thuật toán Filter Back-Projection (FBP) và xử lý ảnh y tế. Hãy trả lời ngắn gọn, rõ ràng và chuyên nghiệp bằng tiếng Việt."
  }
];

// Flag to prevent duplicate event listeners
let formListenerAdded = false;

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
  
  try {
    // Call Groq API with reasoning
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "qwen/qwen3-32b",
        messages: conversationHistory,
        temperature: 0.6,
        max_completion_tokens: 1024,
        top_p: 0.95,
        reasoning_format: "parsed"
      })
    });
    
    if (!response.ok) {
      throw new Error('API request failed');
    }
    
    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;
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
    
    responseHTML += `<p>${assistantMessage}</p></div>`;
    
    botMessageEl.innerHTML = responseHTML;
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
