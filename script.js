// HoopBoard - A community for athletes, by athletes

// Simple test to verify script is loading
console.log('🚀 HoopBoard script loaded!');
console.log('Firebase available:', typeof window !== 'undefined' && !!window.db);
console.log('Firestore functions available:', typeof window !== 'undefined' && !!window.firestoreFns);

// In-memory posts cache for rendering
let posts = JSON.parse(localStorage.getItem('hoopboard_posts')) || [];

// User identification system
function getUserId() {
    let userId = localStorage.getItem('hoopboard_user_id');
    if (!userId) {
        userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('hoopboard_user_id', userId);
    }
    return userId;
}

function isPostOwner(post) {
    return post.userId === getUserId();
}

// Firestore detection helpers
function isFirestoreAvailable() {
    const available = typeof window !== 'undefined' && !!window.db && !!window.firestoreFns;
    console.log('isFirestoreAvailable check:', available);
    return available;
}

function getFs() {
    return window.firestoreFns;
}

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupFooterScroll();
    registerServiceWorker();
});

// Register service worker for PWA
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('Service Worker registered successfully:', registration);
            })
            .catch(error => {
                console.log('Service Worker registration failed:', error);
            });
    }
}

// PWA Install prompt - Enhanced version
let deferredPrompt;
let installShown = localStorage.getItem('hoopboard_welcome_shown') === 'true';

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Show install popup immediately
    showInstallPopup();
});

// Show welcome popup for all users (only once per user)
window.addEventListener('load', () => {
    console.log('Page loaded, checking welcome popup...');
    
    // Only show welcome popup if user hasn't seen it before
    if (!installShown) {
        setTimeout(() => {
            showWelcomePopup();
        }, 2000);
    }
});

// Also try showing popup on DOMContentLoaded as backup (only if not shown before)
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, checking welcome popup...');
    
    if (!installShown) {
        setTimeout(() => {
            if (!installShown) {
                showWelcomePopup();
            }
        }, 3000);
    }
});

function showInstallPopup() {
    if (deferredPrompt && !installShown) {
        installShown = true;
        
        const popup = document.createElement('div');
        popup.className = 'install-popup';
        popup.innerHTML = `
            <div class="install-popup-content">
                <div class="install-popup-header">
                    <h3>📱 Install HoopBoard App</h3>
                    <button class="close-popup" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
                </div>
                <p>Get the full app experience on your phone!</p>
                <div class="install-buttons">
                    <button class="install-btn primary" onclick="installApp()">Install Now</button>
                    <button class="install-btn secondary" onclick="this.parentElement.parentElement.parentElement.remove()">Maybe Later</button>
                </div>
            </div>
        `;
        
        popup.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            animation: fadeIn 0.3s ease;
        `;
        
        const content = popup.querySelector('.install-popup-content');
        content.style.cssText = `
            background: white;
            padding: 30px;
            border-radius: 15px;
            max-width: 400px;
            width: 90%;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        `;
        
        const header = popup.querySelector('.install-popup-header');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        `;
        
        const closeBtn = popup.querySelector('.close-popup');
        closeBtn.style.cssText = `
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #666;
        `;
        
        const buttons = popup.querySelector('.install-buttons');
        buttons.style.cssText = `
            display: flex;
            gap: 10px;
            margin-top: 20px;
        `;
        
        const installBtn = popup.querySelector('.install-btn.primary');
        installBtn.style.cssText = `
            background: #ff6b6b;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 25px;
            font-weight: 600;
            cursor: pointer;
            flex: 1;
        `;
        
        const laterBtn = popup.querySelector('.install-btn.secondary');
        laterBtn.style.cssText = `
            background: #f0f0f0;
            color: #333;
            border: none;
            padding: 12px 24px;
            border-radius: 25px;
            font-weight: 600;
            cursor: pointer;
            flex: 1;
        `;
        
        document.body.appendChild(popup);
        
        // Auto-hide after 15 seconds
        setTimeout(() => {
            if (popup.parentNode) {
                popup.remove();
            }
        }, 15000);
    }
}

function showGeneralInstallPopup() {
    if (installShown) return;
    installShown = true;
    
    const popup = document.createElement('div');
    popup.className = 'install-popup general';
    popup.innerHTML = `
        <div class="install-popup-content">
            <div class="install-popup-header">
                <h3>📱 Add HoopBoard to Your Home Screen</h3>
                <button class="close-popup" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
            </div>
            <p style="font-size: 16px; margin-bottom: 20px;">
                Want to use HoopBoard like an app? Add it to your home screen for quick access!
            </p>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
                <h4 style="margin: 0 0 15px 0; color: #333;">How to add to home screen:</h4>
                <ol style="text-align: left; margin: 0; padding-left: 20px; line-height: 1.8;">
                    <li><strong>Look for the install icon</strong> in your browser (usually in the address bar)</li>
                    <li><strong>Tap the install button</strong> when it appears</li>
                    <li><strong>Confirm the installation</strong> when prompted</li>
                    <li><strong>Enjoy HoopBoard as an app!</strong></li>
                </ol>
            </div>
            <div class="install-buttons">
                <button class="install-btn primary" onclick="showChromeInstallInstructions()">Show Me Where to Tap</button>
                <button class="install-btn secondary" onclick="this.parentElement.parentElement.parentElement.remove()">Not Now</button>
            </div>
        </div>
    `;
    
    // Apply same styles as other popups
    popup.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.3s ease;
    `;
    
    const content = popup.querySelector('.install-popup-content');
    content.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 15px;
        max-width: 400px;
        width: 90%;
        text-align: center;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    `;
    
    const header = popup.querySelector('.install-popup-header');
    header.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
    `;
    
    const closeBtn = popup.querySelector('.close-popup');
    closeBtn.style.cssText = `
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #666;
    `;
    
    const buttons = popup.querySelector('.install-buttons');
    buttons.style.cssText = `
        display: flex;
        gap: 10px;
        margin-top: 20px;
    `;
    
    const installBtn = popup.querySelector('.install-btn.primary');
    installBtn.style.cssText = `
        background: #ff6b6b;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 25px;
        font-weight: 600;
        cursor: pointer;
        flex: 1;
    `;
    
    const laterBtn = popup.querySelector('.install-btn.secondary');
    laterBtn.style.cssText = `
        background: #f0f0f0;
        color: #333;
        border: none;
        padding: 12px 24px;
        border-radius: 25px;
        font-weight: 600;
        cursor: pointer;
        flex: 1;
    `;
    
    document.body.appendChild(popup);
    
    // Auto-hide after 20 seconds
    setTimeout(() => {
        if (popup.parentNode) {
            popup.remove();
        }
    }, 20000);
}

function showIOSInstallPopup() {
    if (installShown) return;
    installShown = true;
    
    console.log('Creating iOS install popup...');
    
    const popup = document.createElement('div');
    popup.className = 'install-popup ios';
    popup.innerHTML = `
        <div class="install-popup-content">
            <div class="install-popup-header">
                <h3>📱 Add HoopBoard to Your Home Screen</h3>
                <button class="close-popup" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
            </div>
            <p style="font-size: 16px; margin-bottom: 20px;">
                Want to use HoopBoard like an app? Add it to your home screen for quick access!
            </p>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
                <h4 style="margin: 0 0 15px 0; color: #333;">How to add to home screen:</h4>
                <ol style="text-align: left; margin: 0; padding-left: 20px; line-height: 1.8;">
                    <li><strong>Tap the Share button</strong> (square with arrow up) at the bottom of your screen</li>
                    <li><strong>Scroll down</strong> in the menu that appears</li>
                    <li><strong>Tap "Add to Home Screen"</strong></li>
                    <li><strong>Tap "Add"</strong> to confirm</li>
                </ol>
            </div>
            <div class="install-buttons">
                <button class="install-btn primary" onclick="showIOSShare()">Show Me Where to Tap</button>
                <button class="install-btn secondary" onclick="this.parentElement.parentElement.parentElement.remove()">Not Now</button>
            </div>
        </div>
    `;
    

    
    // Apply same styles as above
    popup.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.3s ease;
    `;
    
    const content = popup.querySelector('.install-popup-content');
    content.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 15px;
        max-width: 400px;
        width: 90%;
        text-align: center;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    `;
    
    const header = popup.querySelector('.install-popup-header');
    header.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
    `;
    
    const closeBtn = popup.querySelector('.close-popup');
    closeBtn.style.cssText = `
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #666;
    `;
    
    const buttons = popup.querySelector('.install-buttons');
    buttons.style.cssText = `
        display: flex;
        gap: 10px;
        margin-top: 20px;
    `;
    
    const installBtn = popup.querySelector('.install-btn.primary');
    installBtn.style.cssText = `
        background: #ff6b6b;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 25px;
        font-weight: 600;
        cursor: pointer;
        flex: 1;
    `;
    
    const laterBtn = popup.querySelector('.install-btn.secondary');
    laterBtn.style.cssText = `
        background: #f0f0f0;
        color: #333;
        border: none;
        padding: 12px 24px;
        border-radius: 25px;
        font-weight: 600;
        cursor: pointer;
        flex: 1;
    `;
    
    document.body.appendChild(popup);
    
    // Auto-hide after 20 seconds
    setTimeout(() => {
        if (popup.parentNode) {
            popup.remove();
        }
    }, 20000);
}

function installApp() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the install prompt');
                showMessage('App installed successfully!', 'success');
            }
            deferredPrompt = null;
            // Remove popup
            const popup = document.querySelector('.install-popup');
            if (popup) popup.remove();
        });
    }
}

function showChromeInstallInstructions() {
    // Remove popup first
    const popup = document.querySelector('.install-popup');
    if (popup) popup.remove();
    
    // Show instructions overlay
    const overlay = document.createElement('div');
    overlay.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 10001; display: flex; align-items: center; justify-content: center;">
            <div style="background: white; padding: 30px; border-radius: 15px; max-width: 400px; text-align: center;">
                <h3>📱 Find the Install Button</h3>
                <p style="font-size: 16px; margin-bottom: 20px;">Look for the <strong>install button</strong> in your browser:</p>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <p style="margin: 0; font-size: 14px;">🔗 <strong>Mobile Chrome:</strong> Look for a "+" or "Install" button in the address bar</p>
                    <p style="margin: 5px 0 0 0; font-size: 14px;">💻 <strong>Desktop Chrome:</strong> Look for a "+" icon in the address bar</p>
                    <p style="margin: 5px 0 0 0; font-size: 14px;">📱 <strong>Alternative:</strong> Tap the menu (3 dots) → "Add to Home screen"</p>
                </div>
                <p style="font-size: 14px; color: #666;">Tap it to install HoopBoard as an app!</p>
                <button onclick="this.parentElement.parentElement.remove()" style="background: #ff6b6b; color: white; border: none; padding: 12px 24px; border-radius: 20px; margin-top: 15px; font-weight: 600;">Got it!</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    
    // Auto-hide after 15 seconds
    setTimeout(() => {
        if (overlay.parentNode) overlay.remove();
    }, 15000);
}

function showInstallInstructions() {
    // Remove popup first
    const popup = document.querySelector('.install-popup');
    if (popup) popup.remove();
    
    // Show instructions overlay
    const overlay = document.createElement('div');
    overlay.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 10001; display: flex; align-items: center; justify-content: center;">
            <div style="background: white; padding: 30px; border-radius: 15px; max-width: 400px; text-align: center;">
                <h3>📱 Install HoopBoard</h3>
                <p>Look for the <strong>Share</strong> button in your browser toolbar (usually at the bottom)</p>
                <p>Then tap <strong>"Add to Home Screen"</strong></p>
                <button onclick="this.parentElement.parentElement.remove()" style="background: #ff6b6b; color: white; border: none; padding: 10px 20px; border-radius: 20px; margin-top: 15px;">Got it!</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
        if (overlay.parentNode) overlay.remove();
    }, 10000);
}

// Manual test function - you can call this in browser console
function showWelcomePopup() {
    // Clear old popup state to show new message
    localStorage.removeItem('hoopboard_welcome_shown');
    if (installShown) return;
    installShown = true;
    localStorage.setItem('hoopboard_welcome_shown', 'true');
    
    console.log('Creating welcome popup...');
    
    const popup = document.createElement('div');
    popup.className = 'welcome-popup';
    popup.innerHTML = `
        <div class="welcome-popup-content">
            <div class="welcome-popup-header">
                <h3>🏀 Welcome to HoopBoard</h3>
                <button class="close-popup" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
            </div>
            <div style="text-align: center; padding: 20px 0;">
                <p style="font-size: 18px; margin-bottom: 10px; color: #333;">
                    Welcome to our BETA website! The app is coming soon.
                </p>
                <p style="font-size: 14px; color: #666; font-style: italic;">
                    Thanks - Aiden Satterfield
                </p>
            </div>
            <div class="welcome-buttons">
                <button class="welcome-btn" onclick="this.parentElement.parentElement.parentElement.remove()">Got it!</button>
            </div>
        </div>
    `;
    
    // Apply styles
    popup.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.3s ease;
    `;
    
    const content = popup.querySelector('.welcome-popup-content');
    content.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 15px;
        max-width: 400px;
        width: 90%;
        text-align: center;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    `;
    
    const header = popup.querySelector('.welcome-popup-header');
    header.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
    `;
    
    const closeBtn = popup.querySelector('.close-popup');
    closeBtn.style.cssText = `
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #666;
    `;
    
    const welcomeBtn = popup.querySelector('.welcome-btn');
    welcomeBtn.style.cssText = `
        background: #ff6b6b;
        color: white;
        border: none;
        padding: 12px 30px;
        border-radius: 25px;
        font-weight: 600;
        cursor: pointer;
        font-size: 16px;
    `;
    
    document.body.appendChild(popup);
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
        if (popup.parentNode) {
            popup.remove();
        }
    }, 10000);
}

function testPopup() {
    console.log('Manual popup test triggered');
    showWelcomePopup();
}

function showIOSShare() {
    // Remove popup first
    const popup = document.querySelector('.install-popup');
    if (popup) popup.remove();
    
    // Show instructions overlay
    const overlay = document.createElement('div');
    overlay.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 10001; display: flex; align-items: center; justify-content: center;">
            <div style="background: white; padding: 30px; border-radius: 15px; max-width: 400px; text-align: center;">
                <h3>📱 Find the Share Button</h3>
                <p style="font-size: 16px; margin-bottom: 20px;">Look for the <strong>Share button</strong> at the bottom of your screen:</p>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <p style="margin: 0; font-size: 14px;">🔗 It looks like a square with an arrow pointing up</p>
                    <p style="margin: 5px 0 0 0; font-size: 14px;">📍 Usually in the bottom toolbar of Safari</p>
                </div>
                <p style="font-size: 14px; color: #666;">Tap it, then scroll down to find "Add to Home Screen"</p>
                <button onclick="this.parentElement.parentElement.remove()" style="background: #ff6b6b; color: white; border: none; padding: 12px 24px; border-radius: 20px; margin-top: 15px; font-weight: 600;">Got it!</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    
    // Auto-hide after 15 seconds
    setTimeout(() => {
        if (overlay.parentNode) overlay.remove();
    }, 15000);
}

function setupFooterScroll() {
    let lastScrollTop = 0;
    const footer = document.querySelector('footer');
    
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            footer.classList.add('show');
        } else if (scrollTop < lastScrollTop || scrollTop <= 100) {
            footer.classList.remove('show');
        }
        
        lastScrollTop = scrollTop;
    });
}

function initializeApp() {
    const postForm = document.getElementById('postForm');
    if (postForm) {
        setupPostForm();
    }

    const feed = document.getElementById('feed');
    if (feed) {
        setupFeed();
    }

    const postView = document.getElementById('postView');
    if (postView) {
        setupPostView();
    }

    setupLikeButtons();
}

function setupPostForm() {
    const form = document.getElementById('postForm');
    const submitBtn = form.querySelector('.submit-btn');
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const content = document.getElementById('postContent').value.trim();
        const position = document.getElementById('position').value;
        const region = document.getElementById('region').value;
        const division = document.getElementById('division').value;
        
        if (!content || !position || !region || !division) {
            showMessage('Please fill out all fields.', 'error');
            return;
        }
        
        if (content.length < 10) {
            showMessage('Your post should be at least 10 characters long.', 'error');
            return;
        }
        
        submitBtn.disabled = true;
        submitBtn.textContent = 'Posting...';
        
        try {
            if (isFirestoreAvailable()) {
                const { collection, addDoc, serverTimestamp } = getFs();
                const postsCol = collection(window.db, 'posts');
                const docRef = await addDoc(postsCol, {
                    content,
                    position,
                    region,
                    division,
                    timestamp: serverTimestamp(),
                    likes: 0,
                    commentCount: 0,
                    userId: getUserId()
                });
                showMessage('Post submitted successfully!', 'success');
                form.reset();
                submitBtn.disabled = false;
                submitBtn.textContent = 'Share Your Story';
                setTimeout(() => {
                    window.location.href = `view-post.html?id=${docRef.id}`;
                }, 1200);
                return;
            }
            
            const newPost = {
                id: Date.now(),
                content,
                position,
                region,
                division,
                timestamp: new Date().toISOString(),
                likes: 0,
                liked: false,
                comments: [],
                userId: getUserId()
            };
            posts.unshift(newPost);
            localStorage.setItem('hoopboard_posts', JSON.stringify(posts));
            showMessage('Post submitted successfully!', 'success');
            form.reset();
            submitBtn.disabled = false;
            submitBtn.textContent = 'Share Your Story';
            setTimeout(() => {
                window.location.href = `view-post.html?id=${newPost.id}`;
            }, 1200);
        } catch (err) {
            console.error(err);
            showMessage('Something went wrong posting. Please try again.', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Share Your Story';
        }
    });
}

function setupFeed() {
    if (isFirestoreAvailable()) {
        // Real-time Firestore feed
        const { collection, query, orderBy, onSnapshot } = getFs();
        const postsCol = collection(window.db, 'posts');
        const q = query(postsCol, orderBy('timestamp', 'desc'));
        onSnapshot(q, (snapshot) => {
            posts = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            displayPosts();
        }, (error) => {
            console.error('Feed error:', error);
            // Fallback to localStorage if snapshot fails
            posts = JSON.parse(localStorage.getItem('hoopboard_posts')) || [];
            displayPosts();
        });
        return;
    }

    // localStorage fallback
    posts = JSON.parse(localStorage.getItem('hoopboard_posts')) || [];
    if (posts.length === 0) {
        const feed = document.getElementById('feed');
        feed.innerHTML = `
            <div class="intro">
                <h3>No posts yet</h3>
                <p>Be the first to share your story! Head over to the Share Story page to get started.</p>
                <a href="post.html" class="cta-button primary" style="text-decoration: none; display: inline-block; margin-top: 15px;">Create First Post</a>
            </div>
        `;
        return;
    }
    displayPosts();
}

function displayPosts() {
    const feed = document.getElementById('feed');
    if (!feed) return;

    const intro = feed.querySelector('.intro');
    feed.innerHTML = '';
    if (intro) feed.appendChild(intro);
    
    posts.forEach(post => {
        const postElement = createPostElement(post);
        feed.appendChild(postElement);
    });
}

function createPostElement(post) {
    const postDiv = document.createElement('div');
    postDiv.className = 'post';
    postDiv.dataset.postId = post.id;
    
    const timeAgo = getTimeAgo(post.timestamp && post.timestamp.seconds ? new Date(post.timestamp.seconds * 1000).toISOString() : post.timestamp);
    const commentCount = typeof post.commentCount === 'number' ? post.commentCount : (post.comments ? post.comments.length : 0);
    
    let firstCommentHtml = '';
    if (!isFirestoreAvailable() && post.comments && post.comments.length > 0) {
        const firstComment = post.comments[0];
        const commentTimeAgo = getTimeAgo(firstComment.timestamp);
        firstCommentHtml = `
            <div class="first-comment">
                <div class="comment-header">
                    <span class="comment-meta">${escapeHtml(firstComment.position)} • ${escapeHtml(firstComment.region)} • ${commentTimeAgo}</span>
                </div>
                <div class="comment-content">
                    ${escapeHtml(firstComment.content)}
                </div>
            </div>
        `;
    }
    
    let viewMoreButton = '';
    if (commentCount > 0) {
        viewMoreButton = `
            <div class="view-more-comments">
                <a href="view-post.html?id=${post.id}" class="view-more-btn">
                    View ${commentCount} comment${commentCount !== 1 ? 's' : ''}
                </a>
            </div>
        `;
    }
    
    const deleteButton = isPostOwner(post) ? 
        `<button class="delete-post-btn" onclick="deletePost('${post.id}')" title="Delete post">🗑️</button>` : '';
    
    postDiv.innerHTML = `
        <div class="post-header">
            <span class="post-meta">${escapeHtml(post.position)} • ${escapeHtml(post.region)} • ${timeAgo}</span>
            ${deleteButton}
        </div>
        <div class="post-content">
            ${escapeHtml(post.content)}
        </div>
        ${firstCommentHtml}
        ${viewMoreButton}
        <div class="post-footer">
            <div class="post-actions">
                <button class="like-button ${post.liked ? 'liked' : ''}" onclick="toggleLike('${post.id}')">
                    ${post.liked ? '❤️' : '🤍'} ${post.likes || 0} Like${(post.likes || 0) !== 1 ? 's' : ''}
                </button>
                <a href="view-post.html?id=${post.id}" class="comment-button">
                    💬 ${commentCount} Comment${commentCount !== 1 ? 's' : ''}
                </a>
            </div>
        </div>
    `;
    
    return postDiv;
}

function setupPostView() {
    console.log('Setting up post view...');
    const urlParams = new URLSearchParams(window.location.search);
    const postIdParam = urlParams.get('id');
    const postId = isFirestoreAvailable() ? postIdParam : parseInt(postIdParam);
    console.log('Post ID from URL:', postIdParam, 'Processed ID:', postId);
    
    if (!postId) {
        showMessage('Post not found.', 'error');
        setTimeout(() => { window.location.href = 'lockerroom.html'; }, 2000);
        return;
    }
    
    if (isFirestoreAvailable()) {
        console.log('Using Firestore for post view');
        const { doc, getDoc, collection, query, orderBy, onSnapshot } = getFs();
        const postRef = doc(window.db, 'posts', postId);
        getDoc(postRef).then(snap => {
            if (!snap.exists()) {
                showMessage('Post not found.', 'error');
                setTimeout(() => { window.location.href = 'lockerroom.html'; }, 2000);
                return;
            }
            const post = { id: snap.id, ...snap.data() };
            console.log('Post loaded from Firestore:', post);
            displayPostView(post);
            
            // Listen to comments in real-time with error handling
            const commentsCol = collection(window.db, 'posts', postId, 'comments');
            const q = query(commentsCol, orderBy('timestamp', 'asc'));
            onSnapshot(q, (snapshot) => {
                console.log('Comments snapshot:', snapshot.docs.length, 'comments');
                const comments = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                console.log('Comments data:', comments);
                renderCommentsIntoDom(comments);
            }, (error) => {
                console.error('Comments listener error:', error);
                // Show empty comments if there's an error
                renderCommentsIntoDom([]);
            });
        }).catch(err => {
            console.error('Post loading error:', err);
            showMessage('Error loading post.', 'error');
        });
        console.log('Setting up comment form with Firestore');
        // Add a small delay to ensure DOM is updated
        setTimeout(() => {
            console.log('Timeout fired - setting up comment form...');
            setupCommentForm(postId, true);
        }, 200);
        return;
    }

    console.log('Using localStorage for post view');
    // localStorage fallback
    const post = posts.find(p => p.id === postId);
    if (!post) {
        showMessage('Post not found.', 'error');
        setTimeout(() => { window.location.href = 'lockerroom.html'; }, 2000);
        return;
    }
    console.log('Post loaded from localStorage:', post);
    displayPostView(post);
    console.log('Setting up comment form with localStorage');
    // Add a small delay to ensure DOM is updated
    setTimeout(() => {
        console.log('Timeout fired - setting up comment form...');
        setupCommentForm(postId, false);
    }, 200);
}

function displayPostView(post) {
    console.log('Displaying post view for post:', post);
    const postView = document.getElementById('postView');
    console.log('Post view container found:', !!postView);
    
    const timeIso = post.timestamp && post.timestamp.seconds ? new Date(post.timestamp.seconds * 1000).toISOString() : post.timestamp;
    const timeAgo = getTimeAgo(timeIso);
    
    const deleteButton = isPostOwner(post) ? 
        `<button class="delete-post-btn" onclick="deletePost('${post.id}')" title="Delete post">🗑️</button>` : '';
    
    const html = `
        <div class="post post-detail">
            <div class="post-header">
                <span class="post-meta">${escapeHtml(post.position)} • ${escapeHtml(post.region)} • ${timeAgo}</span>
                ${deleteButton}
            </div>
            <div class="post-content">
                ${escapeHtml(post.content)}
            </div>
            <div class="post-footer">
                <div class="post-actions">
                    <button class="like-button ${post.liked ? 'liked' : ''}" onclick="toggleLike('${post.id}')">
                        ${post.liked ? '❤️' : '🤍'} ${post.likes || 0} Like${(post.likes || 0) !== 1 ? 's' : ''}
                    </button>
                </div>
            </div>
        </div>
        
        <div class="comments-section">
            <h3>Comments</h3>
            <div id="commentsList"></div>
            <div class="comment-form-container">
                <h4>Add a Comment</h4>
                <form id="commentForm">
                    <textarea id="commentContent" placeholder="Share your thoughts..." rows="3" required></textarea>
                    <button type="submit" class="submit-btn">Post Comment</button>
                </form>
            </div>
        </div>
    `;
    
    console.log('Setting post view HTML...');
    postView.innerHTML = html;
    console.log('Post view HTML set. Checking for comment form...');
    
    // Check if the form was actually created
    const commentForm = document.getElementById('commentForm');
    console.log('Comment form found after HTML set:', !!commentForm);
    if (commentForm) {
        console.log('Comment form details:', commentForm.tagName, commentForm.id);
    }
}

function renderCommentsIntoDom(comments) {
    const commentsList = document.getElementById('commentsList');
    commentsList.innerHTML = renderComments(comments || []);
}

function renderComments(comments) {
    if (!comments || comments.length === 0) {
        return '<p class="no-comments">No comments yet. Be the first to respond!</p>';
    }
    
    return comments.map(comment => {
        const timeIso = comment.timestamp && comment.timestamp.seconds ? new Date(comment.timestamp.seconds * 1000).toISOString() : comment.timestamp;
        const timeAgo = getTimeAgo(timeIso);
        return `
            <div class="comment" data-comment-id="${comment.id}">
                <div class="comment-header">
                    <span class="comment-meta">${escapeHtml(comment.position)} • ${escapeHtml(comment.region)} • ${timeAgo}</span>
                </div>
                <div class="comment-content">
                    ${escapeHtml(comment.content)}
                </div>
            </div>
        `;
    }).join('');
}

function setupCommentForm(postId, useFirestore) {
    console.log('Setting up comment form for post:', postId, 'useFirestore:', useFirestore);
    
    // Wait a bit for DOM to be ready
    setTimeout(() => {
        // Try multiple ways to find the form
        let commentForm = document.getElementById('commentForm');
        console.log('Comment form found by ID:', !!commentForm);
        
        if (!commentForm) {
            // Try finding by tag name
            const forms = document.querySelectorAll('form');
            console.log('Total forms found:', forms.length);
            forms.forEach((form, index) => {
                console.log(`Form ${index}:`, form.id, form.className, form.innerHTML.substring(0, 100));
            });
            
            // Try finding by textarea
            const textareas = document.querySelectorAll('textarea');
            console.log('Total textareas found:', textareas.length);
            textareas.forEach((textarea, index) => {
                console.log(`Textarea ${index}:`, textarea.id, textarea.placeholder);
            });
            
            // Try finding the form by looking for the textarea's parent form
            const commentTextarea = document.getElementById('commentContent');
            if (commentTextarea && commentTextarea.closest('form')) {
                commentForm = commentTextarea.closest('form');
                console.log('Found form via textarea parent:', commentForm);
            }
            
            // Additional debugging - check if we're on the right page
            console.log('Current page:', window.location.pathname);
            console.log('PostView element exists:', !!document.getElementById('postView'));
            console.log('PostView innerHTML length:', document.getElementById('postView')?.innerHTML?.length || 0);
        }
        
        console.log('Final comment form found:', !!commentForm);
        if (!commentForm) {
            console.error('Comment form not found!');
            console.error('Available elements with "comment" in ID:', 
                Array.from(document.querySelectorAll('[id*="comment"]')).map(el => el.id));
            return;
        }
        
        // Remove any existing listeners to prevent duplicates
        const newForm = commentForm.cloneNode(true);
        commentForm.parentNode.replaceChild(newForm, commentForm);
        
        console.log('Form cloned and replaced. Adding submit listener...');
        
        newForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('Comment form submitted!');
            const content = document.getElementById('commentContent').value.trim();
            console.log('Comment content:', content);
            if (!content) {
                showMessage('Please enter a comment.', 'error');
                return;
            }
            if (content.length < 3) {
                showMessage('Comment should be at least 3 characters long.', 'error');
                return;
            }
            
            console.log('Firestore available:', isFirestoreAvailable());
            console.log('useFirestore parameter:', useFirestore);
            try {
                if (isFirestoreAvailable() && useFirestore) {
                    console.log('Adding comment to Firestore for post:', postId);
                    const { collection, addDoc, serverTimestamp, doc, updateDoc, increment } = getFs();
                    console.log('Firestore functions loaded:', !!collection, !!addDoc, !!serverTimestamp);
                    
                    const commentsCol = collection(window.db, 'posts', postId, 'comments');
                    console.log('Comments collection reference:', commentsCol);
                    
                    const commentData = {
                        content,
                        position: 'Anonymous Player',
                        region: 'Community',
                        timestamp: serverTimestamp()
                    };
                    console.log('Comment data:', commentData);
                    
                    console.log('Attempting to add document...');
                    const commentRef = await addDoc(commentsCol, commentData);
                    console.log('Comment added with ID:', commentRef.id);
                    
                    console.log('Attempting to increment comment count...');
                    // increment comment count on post
                    await updateDoc(doc(window.db, 'posts', postId), { commentCount: increment(1) });
                    console.log('Comment count incremented');
                    
                    showMessage('Comment posted successfully!', 'success');
                    newForm.reset();
                    setTimeout(() => { window.location.href = 'lockerroom.html'; }, 1200);
                    return;
                }
                
                console.log('Using localStorage fallback');
                // localStorage fallback
                const post = posts.find(p => p.id === postId);
                if (!post) {
                    showMessage('Post not found.', 'error');
                    return;
                }
                const newComment = {
                    id: Date.now(),
                    content,
                    position: 'Anonymous Player',
                    region: 'Community',
                    timestamp: new Date().toISOString()
                };
                if (!post.comments) post.comments = [];
                post.comments.push(newComment);
                localStorage.setItem('hoopboard_posts', JSON.stringify(posts));
                showMessage('Comment posted successfully!', 'success');
                newForm.reset();
                setTimeout(() => { window.location.href = 'lockerroom.html'; }, 1200);
            } catch (err) {
                console.error('Comment submission error:', err);
                console.error('Error details:', err.message, err.code);
                showMessage('Failed to add comment: ' + err.message, 'error');
            }
        });
        
        console.log('Comment form setup complete');
    }, 500); // Wait 500ms for DOM to be ready
}

function toggleLike(postId) {
    if (isFirestoreAvailable()) {
        // Track liked state per-device
        const likedKey = 'hoopboard_liked_posts';
        const likedSet = new Set(JSON.parse(localStorage.getItem(likedKey)) || []);
        const isLiked = likedSet.has(postId);
        const { doc, updateDoc, increment } = getFs();
        updateDoc(doc(window.db, 'posts', postId), { likes: increment(isLiked ? -1 : 1) })
            .then(() => {
                if (isLiked) likedSet.delete(postId); else likedSet.add(postId);
                localStorage.setItem(likedKey, JSON.stringify(Array.from(likedSet)));
            })
            .catch(err => console.error('Like failed', err));
        return;
    }

    // localStorage fallback
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    if (post.liked) {
        post.likes--; post.liked = false;
    } else {
        post.likes++; post.liked = true;
    }
    localStorage.setItem('hoopboard_posts', JSON.stringify(posts));
    const likeButton = document.querySelector(`[data-post-id="${postId}"] .like-button`);
    if (likeButton) {
        likeButton.className = `like-button ${post.liked ? 'liked' : ''}`;
        likeButton.innerHTML = `${post.liked ? '❤️' : '🤍'} ${post.likes} Like${post.likes !== 1 ? 's' : ''}`;
    }
}

async function deletePost(postId) {
    // Find the post to check ownership
    const post = posts.find(p => p.id === postId);
    if (!post) {
        showMessage('Post not found.', 'error');
        return;
    }
    
    // Check if current user owns this post
    if (!isPostOwner(post)) {
        showMessage('You can only delete your own posts.', 'error');
        return;
    }
    
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) return;

    try {
        if (isFirestoreAvailable()) {
            const { doc, collection, getDocs, deleteDoc } = getFs();
            // delete comments
            const commentsSnap = await getDocs(collection(window.db, 'posts', postId, 'comments'));
            await Promise.all(commentsSnap.docs.map(d => deleteDoc(d.ref)));
            // delete post
            await deleteDoc(doc(window.db, 'posts', postId));
            showMessage('Post deleted successfully!', 'success');
            if (window.location.pathname.includes('view-post.html')) {
                setTimeout(() => { window.location.href = 'lockerroom.html'; }, 1000);
            }
            return;
        }

        // localStorage fallback
        const idx = posts.findIndex(p => p.id === postId);
        if (idx === -1) {
            showMessage('Post not found.', 'error');
            return;
        }
        posts.splice(idx, 1);
        localStorage.setItem('hoopboard_posts', JSON.stringify(posts));
        showMessage('Post deleted successfully!', 'success');
        if (window.location.pathname.includes('view-post.html')) {
            setTimeout(() => { window.location.href = 'lockerroom.html'; }, 1000);
        } else {
            displayPosts();
        }
    } catch (err) {
        console.error(err);
        showMessage('Failed to delete post.', 'error');
    }
}

function setupLikeButtons() {
    // No-op: likes handled per button handlers and real-time updates
}

function showMessage(message, type) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    Object.assign(toast.style, {
        position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)',
        background: type === 'error' ? '#ff4d4f' : '#111', color: '#fff', padding: '10px 14px',
        borderRadius: '8px', zIndex: 2000, boxShadow: '0 6px 20px rgba(0,0,0,0.2)'
    });
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 1800);
}

function escapeHtml(unsafe) {
    if (unsafe == null) return '';
    return String(unsafe)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function getTimeAgo(isoString) {
    if (!isoString) return 'just now';
    const date = new Date(isoString);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    const intervals = [
        { label: 'year', seconds: 31536000 },
        { label: 'month', seconds: 2592000 },
        { label: 'day', seconds: 86400 },
        { label: 'hr', seconds: 3600 },
        { label: 'min', seconds: 60 }
    ];
    for (const interval of intervals) {
        const count = Math.floor(seconds / interval.seconds);
        if (count >= 1) return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
    }
    return 'just now';
}
