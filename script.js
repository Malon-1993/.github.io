document.addEventListener('DOMContentLoaded', async () => {
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const chatMessages = document.getElementById('chat-messages');
    
    // 使用Coze API客户端
    // 注意: 在生产环境中应该通过后端来处理API密钥,而不是直接在前端暴露
    const BOT_ID = '7483111603417153545'; // 替换为您的Coze机器人ID
    const USER_ID = 'user_' + Math.random().toString(36).substring(2, 10); // 生成随机用户ID
    
    // 创建API客户端实例 - 全局创建一次
    const apiClient = new window.CozeAPI({
        token: 'pat_iFU8JAFtWbGYicFhzEumUgOVhDQ9ABPW3giOghItmBmeaTGCSsdaNSHJMj3m4ekt',
        baseURL: 'https://api.coze.cn'
    });
    
    // 对话ID，用于维持会话
    let conversationId = null;
    
    // 初始欢迎消息
    addBotMessage('你好！我是Coze对话机器人，有什么我可以帮你的？');
    
    // 发送消息事件监听
    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // 发送消息函数
    async function sendMessage() {
        const messageText = messageInput.value.trim();
        if (messageText === '') return;
        
        addUserMessage(messageText);
        messageInput.value = '';
        
        showTypingIndicator();
        
        // 调用Coze API
        await sendToCozeAPI(messageText);
    }
    
    // 添加用户消息到聊天界面
    function addUserMessage(text) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message user-message';
        messageElement.textContent = text;
        chatMessages.appendChild(messageElement);
        scrollToBottom();
    }
    
    // 添加机器人消息到聊天界面
    function addBotMessage(text) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message bot-message';
        messageElement.textContent = text;
        chatMessages.appendChild(messageElement);
        scrollToBottom();
    }
    
    // 显示"正在输入"指示器
    function showTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'message bot-message typing-indicator';
        indicator.textContent = '正在输入...';
        indicator.id = 'typing-indicator';
        chatMessages.appendChild(indicator);
        scrollToBottom();
    }
    
    // 隐藏"正在输入"指示器
    function hideTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            chatMessages.removeChild(indicator);
        }
    }
    
    // 滚动到底部
    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // 使用Coze SDK调用API - 添加备选方案
    async function sendToCozeAPI(messageText) {
        try {
            console.log('开始API调用，参数:', {
                bot_id: BOT_ID,
                user_id: USER_ID,
                query: messageText,
                conversation_id: conversationId || '未设置'
            });
            
            // 检查SDK是否正确加载
            if (!window.CozeAPI) {
                throw new Error('Coze API SDK未正确加载，请检查CDN引入');
            }
            
            // 准备请求参数
            const chatParams = {
                bot_id: BOT_ID,
                user_id: USER_ID,
                query: messageText
            };
            
            // 如果有会话ID，则添加到请求中以维持会话上下文
            if (conversationId) {
                chatParams.conversation_id = conversationId;
            }
            
            // 使用流式API
            console.log('调用stream API...');
            const stream = await apiClient.chat.stream(chatParams);
            console.log('获取到stream响应');
            
            let fullResponse = '';
            
            // 处理流式响应
            for await (const chunk of stream) {
                if (chunk.data && chunk.data.delta) {
                    // 累积响应文本
                    fullResponse += chunk.data.delta;
                    
                    // 如果是第一个响应块，则隐藏"正在输入"指示器并创建消息元素
                    if (fullResponse.length === chunk.data.delta.length) {
                        hideTypingIndicator();
                        const messageElement = document.createElement('div');
                        messageElement.className = 'message bot-message';
                        messageElement.id = 'current-response';
                        messageElement.textContent = chunk.data.delta;
                        chatMessages.appendChild(messageElement);
                    } else {
                        // 更新现有消息元素
                        const currentMessage = document.getElementById('current-response');
                        if (currentMessage) {
                            currentMessage.textContent = fullResponse;
                        }
                    }
                    
                    scrollToBottom();
                }
                
                // 保存会话ID以维持对话上下文
                if (chunk.data && chunk.data.conversation_id) {
                    conversationId = chunk.data.conversation_id;
                }
            }
            
            // 响应结束后移除临时ID
            const currentMessage = document.getElementById('current-response');
            if (currentMessage) {
                currentMessage.removeAttribute('id');
            }
            
        } catch (streamError) {
            console.error('流式API调用失败，尝试使用普通API:', streamError);
            
            try {
                // 使用普通API作为备选
                const chatParams = {
                    bot_id: BOT_ID,
                    user_id: USER_ID,
                    query: messageText
                };
                
                if (conversationId) {
                    chatParams.conversation_id = conversationId;
                }
                
                hideTypingIndicator();
                const response = await apiClient.chat.createChatCompletion(chatParams);
                
                if (response && response.data) {
                    addBotMessage(response.data.message || response.data.response || '我没有找到合适的回答');
                    
                    if (response.data.conversation_id) {
                        conversationId = response.data.conversation_id;
                    }
                } else {
                    addBotMessage('抱歉，未收到有效响应。');
                }
            } catch (error) {
                hideTypingIndicator();
                console.error('备选API也失败了:', error);
                addBotMessage('抱歉，连接服务器时出现问题: ' + error.message);
            }
        }
    }
}); 