const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    // No need for index.html to call this explicitly, we'll handle it here
});

window.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('click', (event) => {
        const element = event.target;
        
        // Check if the clicked element is a button or a link that should select a bot
        if (element.tagName === 'BUTTON' || element.tagName === 'A') {
            const botName = getBotNameFromElement(element);
            if (botName) {
                ipcRenderer.send('select-bot', botName); // Send bot selection to main process
            }
        }
    });

    // Map button or link text to bot names
    function getBotNameFromElement(element) {
        const text = element.textContent.trim().toLowerCase();
        
        if (text.includes('chatgpt')) {
            return 'ChatGPT';
        } else if (text.includes('google gemini')) {
            return 'Google Gemini';
        } else if (text.includes('claude')) {
            return 'Claude';
        } else if (text.includes('you.com')) {
            return 'You.com';
        } else if (text.includes('blackbox.ai')) {
            return 'Blackbox.ai';
        }
        return null;
    }
});
