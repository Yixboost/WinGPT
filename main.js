import { app, BrowserWindow, Menu, session } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dns from 'dns';
import Store from 'electron-store';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let win;
let menuVisible = true;  // Set to true to make the title bar visible by default
const store = new Store();

app.on('ready', () => {
    createWindow();
});

function createWindow() {
    win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
        },
    });

    // Make menu bar visible by default
    win.setMenuBarVisibility(true);

    // Check network status and load appropriate page
    isOnline().then(online => {
        if (online) {
            win.loadFile(path.join(__dirname, 'index.html')); // Load index.html if online
        } else {
            win.loadFile(path.join(__dirname, 'offline.html')); // Load offline.html if no internet
        }
    });

    const menuTemplate = [
        {
            label: 'AI Bots',
            submenu: [
                {
                    label: '🟢 ChatGPT',
                    click: () => selectBot('ChatGPT', 'https://chatgpt.com'),
                },
                {
                    label: '🟣 Google Gemini',
                    click: () => selectBot('Google Gemini', 'https://gemini.google.com/app'),
                },
                {
                    label: '🟠 Claude',
                    click: () => selectBot('Claude', 'https://claude.ai'),
                },
                {
                    label: '🔵 You.com',
                    click: () => selectBot('You.com', 'https://you.com'),
                },
                {
                    label: '⚫ Blackbox.ai',
                    click: () => selectBot('Blackbox.ai', 'https://www.blackbox.ai'),
                },
                { type: 'separator' },
                {
                    label: '↗️ Go to Start Page',
                    click: () => goToStartPage(),
                },
                {
                    label: '🔃 Reset Default Bot',
                    click: () => resetDefaultBot(),
                },
            ],
        },
        
        {
            label: 'Settings',
            submenu: [
                {
                    role: 'reload',
                    label: '🔄️ Reload Page',
                },
                {
                    role: 'minimize',
                    label: '🔽 Minimize',
                },
                {
                    role: 'close',
                    label: '❎ Close',
                },
                {
                    label: '❇️ Clear Site Data',
                    click: () => clearSiteData(),
                },
                {
                    label: '🔲 Toggle Fullscreen',
                    click: () => toggleFullscreen(),
                },
                {
                    label: '🛠️ Open DevTools',
                    click: () => win.webContents.openDevTools(),
                },
                {
                    type: 'separator',
                },
                {
                    label: `Version: ${app.getVersion()}`, // Displaying the version
                    enabled: false, // This disables the item so it cannot be clicked
                },
            ],
        },
    ];

    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);

    win.on('closed', () => {
        win = null;
    });

    loadSelectedBot();

    // Listen for navigation events and set default bot if necessary
    win.webContents.on('did-navigate', (event, url) => {
        detectAndSetBotFromURL(url);
    });

    // Toggle menu visibility when "Alt" key is pressed
    win.webContents.on('before-input-event', (event, input) => {
        if (input.key === 'Alt' && input.type === 'keyDown') {
            menuVisible = !menuVisible;  // Toggle the menu visibility flag
            win.setMenuBarVisibility(menuVisible);  // Update the visibility based on the flag
        }
    });
}

// Function to check if online using DNS lookup
function isOnline() {
    return new Promise((resolve) => {
        dns.lookup('google.com', (err) => {
            resolve(!err); // Resolve true if no error (online), false if error (offline)
        });
    });
}

// Function to select AI bot and load the URL
function selectBot(selectedBot, botURL) {
    store.set('selectedBot', selectedBot);
    win.setTitle(selectedBot);
    isOnline().then(online => {
        if (online) {
            win.loadURL(botURL); // Load bot URL if online
        } else {
            win.loadFile(path.join(__dirname, 'offline.html')); // Load offline.html if no internet
        }
    });
}

// Function to load previously selected bot
function loadSelectedBot() {
    const selectedBot = store.get('selectedBot');
    if (selectedBot) {
        let botURL = '';
        switch (selectedBot) {
            case 'ChatGPT':
                botURL = 'https://chatgpt.com';
                break;
            case 'Google Gemini':
                botURL = 'https://gemini.google.com/app';
                break;
            case 'Claude':
                botURL = 'https://claude.ai';
                break;
            case 'You.com':
                botURL = 'https://you.com';
                break;
            case 'Blackbox.ai':
                botURL = 'https://www.blackbox.ai';
                break;
        }
        win.setTitle(selectedBot);
        isOnline().then(online => {
            if (online) {
                win.loadURL(botURL);
            } else {
                win.loadFile(path.join(__dirname, 'offline.html')); // Fallback to offline.html if no internet
            }
        });
    }
}

// Function to go to the start page (index.html)
function goToStartPage() {
    isOnline().then(online => {
        if (online) {
            win.loadFile(path.join(__dirname, 'index.html'));
        } else {
            win.loadFile(path.join(__dirname, 'offline.html'));
        }
    });
}

// Function to reset the default bot
function resetDefaultBot() {
    store.delete('selectedBot');
    goToStartPage();
}

// Function to clear site data (cookies, cache, etc.)
function clearSiteData() {
    session.defaultSession.clearStorageData([], () => {
        console.log('Site data cleared.');
        win.reload();
    });
}

// Function to toggle fullscreen mode
function toggleFullscreen() {
    if (win.isFullScreen()) {
        win.setFullScreen(false); // Exit fullscreen
    } else {
        win.setFullScreen(true); // Enter fullscreen
    }
}

// Function to detect and set default bot based on the loaded URL
function detectAndSetBotFromURL(url) {
    if (url.includes('chatgpt.com')) {
        store.set('selectedBot', 'ChatGPT');
        win.setTitle('ChatGPT');
    } else if (url.includes('gemini.google.com')) {
        store.set('selectedBot', 'Google Gemini');
        win.setTitle('Google Gemini');
    } else if (url.includes('claude.ai')) {
        store.set('selectedBot', 'Claude');
        win.setTitle('Claude');
    } else if (url.includes('you.com')) {
        store.set('selectedBot', 'You.com');
        win.setTitle('You.com');
    } else if (url.includes('blackbox.ai')) {
        store.set('selectedBot', 'Blackbox.ai');
        win.setTitle('Blackbox.ai');
    }
}

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (win === null) {
        createWindow();
    }
});
