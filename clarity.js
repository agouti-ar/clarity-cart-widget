(function() {
    const API_URL = document.currentScript?.getAttribute('data-api') || '/api/chat';
    class ClarityCartWidget {
        constructor() {
            this.targetSelector = '#add-to-cart'; 
            this.init();
        }

        init() {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.injectWidget());
            } else {
                this.injectWidget();
            }
        }

        injectWidget() {
            const targetElement = document.querySelector(this.targetSelector);
            if (!targetElement) {
                console.warn('ClarityCart: Target element not found');
                return;
            }

            const hostElement = document.createElement('div');
            hostElement.id = 'clarity-cart-widget-root';
            
            targetElement.parentNode.insertBefore(hostElement, targetElement.nextSibling);

            const shadow = hostElement.attachShadow({ mode: 'open' });

            this.productData = this.extractProductContext();

            this.render(shadow);
            this.bindEvents(shadow);
        }

        extractProductContext() {
            const title = document.querySelector('h1')?.innerText?.trim() || document.title;
            
            let price = '';
            const priceSelectors = ['.current-price', '[class*="price"]:not([class*="old"]):not([class*="strike"])'];
            for (let sel of priceSelectors) {
                const el = document.querySelector(sel);
                if (el && el.innerText.match(/\d/)) {
                    price = el.innerText.trim();
                    break;
                }
            }
            
            let description = '';
            const descSelectors = ['.description', '#product-description', '[class*="desc"]'];
            for (let sel of descSelectors) {
                const el = document.querySelector(sel);
                if (el) {
                    description += el.innerText.trim() + '\n';
                    break;
                }
            }
            
            const featuresSelectors = ['.features', '[class*="feature"]', 'ul'];
            for (let sel of featuresSelectors) {
                const el = document.querySelector(sel);
                if (el) {
                    description += el.innerText.trim() + '\n';
                    break;
                }
            }

            let shippingPolicy = '';
            const shippingSelectors = ['.delivery-info', '[class*="delivery"]', '[class*="shipping"]'];
            for (let sel of shippingSelectors) {
                const el = document.querySelector(sel);
                if (el) {
                    shippingPolicy += el.innerText.trim() + '\n';
                    break;
                }
            }

            const productData = {
                title,
                price,
                description: description.trim(),
                shippingPolicy: shippingPolicy.trim()
            };

            console.log("🛒 ClarityCart Parsed Context:", productData);
            return productData;
        }

        render(shadow) {
            const descLower = (this.productData.description || '').toLowerCase();
            const isShoe = descLower.includes('size') || descLower.includes('shoe') || descLower.includes('sneaker') || descLower.includes('running');

            let chipsHtml = '';
            if (isShoe) {
                chipsHtml = `
                    <button class="chip" data-q="Does it run true to size?">Does it run true to size?</button>
                    <button class="chip" data-q="What is the return policy?">What is the return policy?</button>
                    <button class="chip" data-q="Is it good for daily running?">Is it good for daily running?</button>
                    <button class="chip" data-q="Help me pick my size">👟 Help me pick my size</button>
                `;
            } else {
                chipsHtml = `
                    <button class="chip" data-q="What are the key features?">What are the key features?</button>
                    <button class="chip" data-q="What's the return policy?">What's the return policy?</button>
                    <button class="chip" data-q="Is delivery fast?">Is delivery fast?</button>
                `;
            }

            const styles = `
                :host {
                    display: block;
                    margin-top: 16px;
                    margin-bottom: 24px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                    box-sizing: border-box;
                }
                
                *, *::before, *::after {
                    box-sizing: inherit;
                }

                .widget-container {
                    background: rgba(255, 255, 255, 0.7);
                    backdrop-filter: blur(8px);
                    -webkit-backdrop-filter: blur(8px);
                    border: 1px solid rgba(0, 0, 0, 0.08);
                    border-radius: 12px;
                    padding: 16px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
                    display: flex;
                    flex-direction: column;
                    transition: box-shadow 0.3s ease;
                }
                
                .widget-container:hover {
                    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.08);
                }

                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 12px;
                }

                .title {
                    font-size: 14px;
                    font-weight: 600;
                    color: #1a1a1a;
                    margin: 0;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .title-icon {
                    width: 16px;
                    height: 16px;
                    color: #1a1a1a;
                }

                .ai-badge {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    font-size: 10px;
                    font-weight: 600;
                    color: #4a90e2;
                    background: rgba(74, 144, 226, 0.1);
                    padding: 4px 8px;
                    border-radius: 100px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    animation: pulseBadge 2s infinite;
                }

                @keyframes pulseBadge {
                    0% { box-shadow: 0 0 0 0 rgba(74, 144, 226, 0.4); }
                    70% { box-shadow: 0 0 0 4px rgba(74, 144, 226, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(74, 144, 226, 0); }
                }

                .header-right {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .reset-btn {
                    background: none;
                    border: none;
                    color: #999;
                    cursor: pointer;
                    font-size: 12px;
                    display: none;
                    align-items: center;
                    gap: 4px;
                    padding: 6px;
                    border-radius: 6px;
                    transition: color 0.2s, background 0.2s;
                }

                .reset-btn:hover {
                    color: #1a1a1a;
                    background: rgba(0,0,0,0.05);
                }

                .reset-btn.visible {
                    display: flex;
                }

                .ai-badge .dot {
                    width: 4px;
                    height: 4px;
                    background-color: #4a90e2;
                    border-radius: 50%;
                }

                .quick-chips {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }

                .chip {
                    background: #f8f9fa;
                    border: 1px solid #eeeeee;
                    border-radius: 100px;
                    padding: 8px 14px;
                    font-size: 13px;
                    font-weight: 500;
                    color: #444;
                    cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                    font-family: inherit;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .chip:hover {
                    background: #ffffff;
                    border-color: #d1d5db;
                    color: #1a1a1a;
                    transform: translateY(-1px);
                    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
                }

                /* Expandable Chat Area */
                .chat-container {
                    max-height: 0;
                    overflow: hidden;
                    transition: max-height 0.4s cubic-bezier(0.16, 1, 0.3, 1), margin-top 0.4s ease, opacity 0.3s ease;
                    opacity: 0;
                    display: flex;
                    flex-direction: column;
                }

                .chat-container.open {
                    max-height: 400px;
                    margin-top: 16px;
                    opacity: 1;
                    border-top: 1px solid #f0f0f0;
                    padding-top: 16px;
                }

                .chat-history {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    margin-bottom: 12px;
                    max-height: 250px;
                    overflow-y: auto;
                    padding-right: 4px;
                    scroll-behavior: smooth;
                }
                
                .chat-history::-webkit-scrollbar {
                    width: 4px;
                }
                .chat-history::-webkit-scrollbar-thumb {
                    background-color: #e0e0e0;
                    border-radius: 4px;
                }

                .message {
                    padding: 12px 14px;
                    border-radius: 12px;
                    font-size: 13px;
                    line-height: 1.5;
                    animation: fadeIn 0.3s ease forwards;
                    max-width: 90%;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(4px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .message.user {
                    background: #1a1a1a;
                    color: #ffffff;
                    align-self: flex-end;
                    border-bottom-right-radius: 4px;
                }

                .message.ai {
                    background: #f4f6f8;
                    color: #1a1a1a;
                    align-self: flex-start;
                    border-bottom-left-radius: 4px;
                }

                .loader {
                    display: none;
                    align-items: center;
                    gap: 4px;
                    padding: 12px 14px;
                    background: #f4f6f8;
                    border-radius: 12px;
                    border-bottom-left-radius: 4px;
                    align-self: flex-start;
                }

                .loader.active {
                    display: flex;
                }

                .loader-dot {
                    width: 5px;
                    height: 5px;
                    background: #888;
                    border-radius: 50%;
                    animation: pulseDot 1.4s infinite ease-in-out both;
                }

                .loader-dot:nth-child(1) { animation-delay: -0.32s; }
                .loader-dot:nth-child(2) { animation-delay: -0.16s; }
                
                @keyframes pulseDot {
                    0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
                    40% { transform: scale(1); opacity: 1; }
                }

                .input-row {
                    display: flex;
                    gap: 8px;
                    align-items: center;
                }

                .input-field {
                    flex: 1;
                    padding: 10px 14px;
                    border: 1px solid #e5e5e5;
                    border-radius: 20px;
                    outline: none;
                    font-size: 13px;
                    transition: border-color 0.2s, box-shadow 0.2s;
                    font-family: inherit;
                    background: #fcfcfc;
                }

                .input-field:focus {
                    border-color: #b0b0b0;
                    box-shadow: 0 0 0 2px rgba(0,0,0,0.03);
                    background: #ffffff;
                }

                .send-btn {
                    background: #1a1a1a;
                    color: white;
                    border: none;
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                }

                .send-btn:hover {
                    background: #333;
                    transform: scale(1.05);
                }

                .send-btn:disabled {
                    background: #e0e0e0;
                    cursor: not-allowed;
                    transform: none;
                }
                
                .send-btn svg {
                    width: 16px;
                    height: 16px;
                }

                .footer {
                    margin-top: 12px;
                    text-align: center;
                    font-size: 8px;
                    color: #999999;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
            `;

            const html = `
                <style>${styles}</style>
                <div class="widget-container">
                    <div class="header">
                        <h3 class="title">
                            <svg class="title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                            </svg>
                            Have questions before buying?
                        </h3>
                        <div class="header-right">
                            <div class="ai-badge">
                                <span class="dot"></span>
                                AI &bull; Instant Answer
                            </div>
                            <button class="reset-btn" id="reset-btn" aria-label="Reset Chat" title="Reset Chat">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                    </div>
                    
                    <div class="quick-chips">
                        ${chipsHtml}
                    </div>

                    <div class="chat-container" id="chat-container">
                        <div class="chat-history" id="chat-history">
                            <div class="loader" id="typing-indicator">
                                <div class="loader-dot"></div>
                                <div class="loader-dot"></div>
                                <div class="loader-dot"></div>
                            </div>
                        </div>
                        <div class="input-row">
                            <input type="text" class="input-field" id="chat-input" placeholder="Ask anything else about this product..." />
                            <button class="send-btn" id="send-btn" aria-label="Send">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <line x1="22" y1="2" x2="11" y2="13"></line>
                                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                </svg>
                            </button>
                        </div>
                    </div>
                    
                    <div class="footer">
                        ⚡ Powered by ClarityCart AI
                    </div>
                </div>
            `;

            shadow.innerHTML = html;
        }

        bindEvents(shadow) {
            const chips = shadow.querySelectorAll('.chip');
            const chatContainer = shadow.getElementById('chat-container');
            const chatHistory = shadow.getElementById('chat-history');
            const loader = shadow.getElementById('typing-indicator');
            const input = shadow.getElementById('chat-input');
            const sendBtn = shadow.getElementById('send-btn');
            const resetBtn = shadow.getElementById('reset-btn');
            
            let isChatOpen = false;
            let isRequestPending = false;

            const openChat = () => {
                if (!isChatOpen) {
                    chatContainer.classList.add('open');
                    resetBtn.classList.add('visible');
                    isChatOpen = true;
                }
            };

            const addMessage = (text, sender) => {
                const msg = document.createElement('div');
                msg.className = `message ${sender}`;
                msg.textContent = text;
                chatHistory.insertBefore(msg, loader);
                chatHistory.scrollTop = chatHistory.scrollHeight;
            };

            const handleAsk = (question) => {
                if (!question.trim() || isRequestPending) return;
                
                isRequestPending = true;
                openChat();
                addMessage(question, 'user');
                input.value = '';
                
                // Show loader
                loader.classList.add('active');
                chatHistory.scrollTop = chatHistory.scrollHeight;
                
                input.disabled = true;
                sendBtn.disabled = true;

                // Call our Vercel backend instead of direct Google API
                fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        question,
                        productContext: this.productData
                    })
                })
                .then(res => {
                    if (!res.ok) throw new Error('Network response was not ok');
                    return res.json();
                })
                .then(data => {
                    isRequestPending = false;
                    loader.classList.remove('active');
                    input.disabled = false;
                    sendBtn.disabled = false;
                    input.focus();
                    
                    const response = data.answer || "Sorry, I received an empty response.";
                    addMessage(response, 'ai');
                })
                .catch(err => {
                    console.error('ClarityCart API Error:', err);
                    isRequestPending = false;
                    loader.classList.remove('active');
                    input.disabled = false;
                    sendBtn.disabled = false;
                    input.focus();
                    
                    addMessage("Sorry, I couldn't connect. Please try again in a moment.", 'ai');
                });
            };

            chips.forEach(chip => {
                chip.addEventListener('click', () => {
                    handleAsk(chip.dataset.q);
                });
            });

            sendBtn.addEventListener('click', () => handleAsk(input.value));
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') handleAsk(input.value);
            });

            resetBtn.addEventListener('click', () => {
                chatContainer.classList.remove('open');
                resetBtn.classList.remove('visible');
                isChatOpen = false;
                
                // Clear chat history messages, keeping the loader
                const messages = chatHistory.querySelectorAll('.message');
                messages.forEach(m => m.remove());
                input.value = '';
            });
        }
    }

    new ClarityCartWidget();
})();
