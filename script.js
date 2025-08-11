// HoopBoard - A community for athletes, by athletes

// Simple test to verify script is loading
console.log('🚀 HoopBoard script loaded!');
console.log('Firebase available:', typeof window !== 'undefined' && !!window.db);
console.log('Firestore functions available:', typeof window !== 'undefined' && !!window.firestoreFns);

// In-memory posts cache for rendering
let posts = JSON.parse(localStorage.getItem('hoopboard_posts')) || [];

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
});

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
                    commentCount: 0
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
                comments: []
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
                    <span class="comment-meta">${firstComment.position} • ${firstComment.region} • ${commentTimeAgo}</span>
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
    
    postDiv.innerHTML = `
        <div class="post-header">
            <span class="post-meta">${escapeHtml(post.position)} • ${escapeHtml(post.region)} • ${timeAgo}</span>
            <button class="delete-post-btn" onclick="deletePost('${post.id}')" title="Delete post">🗑️</button>
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
        setTimeout(() => setupCommentForm(postId, true), 100);
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
    setTimeout(() => setupCommentForm(postId, false), 100);
}

function displayPostView(post) {
    const postView = document.getElementById('postView');
    const timeIso = post.timestamp && post.timestamp.seconds ? new Date(post.timestamp.seconds * 1000).toISOString() : post.timestamp;
    const timeAgo = getTimeAgo(timeIso);
    
    postView.innerHTML = `
        <div class="post post-detail">
            <div class="post-header">
                <span class="post-meta">${escapeHtml(post.position)} • ${escapeHtml(post.region)} • ${timeAgo}</span>
                <button class="delete-post-btn" onclick="deletePost('${post.id}')" title="Delete post">🗑️</button>
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
    const commentForm = document.getElementById('commentForm');
    console.log('Comment form found:', !!commentForm);
    if (!commentForm) {
        console.error('Comment form not found!');
        return;
    }
    
    // Remove any existing listeners to prevent duplicates
    const newForm = commentForm.cloneNode(true);
    commentForm.parentNode.replaceChild(newForm, commentForm);
    
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
