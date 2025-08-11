// HoopBoard - A community for athletes, by athletes

// Store posts in localStorage for now (will be replaced with Airtable later)
let posts = JSON.parse(localStorage.getItem('hoopboard_posts')) || [];

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
        
        // Show footer when scrolling down, hide when scrolling up
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            // Scrolling down and past 100px
            footer.classList.add('show');
        } else if (scrollTop < lastScrollTop || scrollTop <= 100) {
            // Scrolling up or near top
            footer.classList.remove('show');
        }
        
        lastScrollTop = scrollTop;
    });
}

function initializeApp() {
    // Set up form handling if we're on the post page
    const postForm = document.getElementById('postForm');
    if (postForm) {
        setupPostForm();
    }

    // Set up feed if we're on the locker room page
    const feed = document.getElementById('feed');
    if (feed) {
        setupFeed();
    }

    // Set up individual post view if we're on a post view page
    const postView = document.getElementById('postView');
    if (postView) {
        setupPostView();
    }

    // Set up like buttons
    setupLikeButtons();
}

function setupPostForm() {
    const form = document.getElementById('postForm');
    const submitBtn = form.querySelector('.submit-btn');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const content = document.getElementById('postContent').value.trim();
        const position = document.getElementById('position').value;
        const region = document.getElementById('region').value;
        const division = document.getElementById('division').value;
        
        // Validate form
        if (!content || !position || !region || !division) {
            showMessage('Please fill out all fields.', 'error');
            return;
        }
        
        if (content.length < 10) {
            showMessage('Your post should be at least 10 characters long.', 'error');
            return;
        }
        
        // Disable submit button and show loading state
        submitBtn.disabled = true;
        submitBtn.textContent = 'Posting...';
        
        // Create new post
        const newPost = {
            id: Date.now(),
            content: content,
            position: position,
            region: region,
            division: division,
            timestamp: new Date().toISOString(),
            likes: 0,
            liked: false,
            comments: []
        };
        
        // Add to posts array
        posts.unshift(newPost);
        
        // Save to localStorage
        localStorage.setItem('hoopboard_posts', JSON.stringify(posts));
        
        // Show success message
        showMessage('Post submitted successfully!', 'success');
        
        // Reset form
        form.reset();
        
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.textContent = 'Share Your Story';
        
        // Redirect to the new post after a short delay
        setTimeout(() => {
            window.location.href = `view-post.html?id=${newPost.id}`;
        }, 1500);
    });
}

function setupFeed() {
    // Load posts from localStorage
    posts = JSON.parse(localStorage.getItem('hoopboard_posts')) || [];
    
    // If no posts, show message
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
    
    // Display posts
    displayPosts();
}

function displayPosts() {
    const feed = document.getElementById('feed');
    
    // Clear existing posts (except the intro)
    const intro = feed.querySelector('.intro');
    feed.innerHTML = '';
    if (intro) {
        feed.appendChild(intro);
    }
    
    // Add each post
    posts.forEach(post => {
        const postElement = createPostElement(post);
        feed.appendChild(postElement);
    });
}

function createPostElement(post) {
    const postDiv = document.createElement('div');
    postDiv.className = 'post';
    postDiv.dataset.postId = post.id;
    
    const timeAgo = getTimeAgo(post.timestamp);
    const commentCount = post.comments ? post.comments.length : 0;
    
    // Show first comment if it exists
    let firstCommentHtml = '';
    if (post.comments && post.comments.length > 0) {
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
    
    // Show "View More Comments" button if there are more than 1 comment
    let viewMoreButton = '';
    if (post.comments && post.comments.length > 1) {
        viewMoreButton = `
            <div class="view-more-comments">
                <a href="view-post.html?id=${post.id}" class="view-more-btn">
                    View ${post.comments.length - 1} more comment${post.comments.length - 1 !== 1 ? 's' : ''}
                </a>
            </div>
        `;
    }
    
    postDiv.innerHTML = `
        <div class="post-header">
            <span class="post-meta">${post.position} • ${post.region} • ${timeAgo}</span>
            <button class="delete-post-btn" onclick="deletePost(${post.id})" title="Delete post">
                🗑️
            </button>
        </div>
        <div class="post-content">
            ${escapeHtml(post.content)}
        </div>
        ${firstCommentHtml}
        ${viewMoreButton}
        <div class="post-footer">
            <div class="post-actions">
                <button class="like-button ${post.liked ? 'liked' : ''}" onclick="toggleLike(${post.id})">
                    ${post.liked ? '❤️' : '🤍'} ${post.likes} Like${post.likes !== 1 ? 's' : ''}
                </button>
                <a href="view-post.html?id=${post.id}" class="comment-button">
                    💬 ${commentCount} Comment${commentCount !== 1 ? 's' : ''}
                </a>
            </div>
        </div>
    `;
    
    return postDiv;
}

function deletePost(postId) {
    // Confirm deletion
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
        return;
    }
    
    // Find and remove the post
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex === -1) {
        showMessage('Post not found.', 'error');
        return;
    }
    
    // Remove the post
    posts.splice(postIndex, 1);
    
    // Save to localStorage
    localStorage.setItem('hoopboard_posts', JSON.stringify(posts));
    
    // Show success message
    showMessage('Post deleted successfully!', 'success');
    
    // If we're on the individual post page, redirect to locker room
    if (window.location.pathname.includes('view-post.html')) {
        setTimeout(() => {
            window.location.href = 'lockerroom.html';
        }, 1500);
    } else {
        // If we're on the locker room page, refresh the feed
        displayPosts();
    }
}

function setupPostView() {
    // Get post ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const postId = parseInt(urlParams.get('id'));
    
    if (!postId) {
        showMessage('Post not found.', 'error');
        setTimeout(() => {
            window.location.href = 'lockerroom.html';
        }, 2000);
        return;
    }
    
    // Load posts and find the specific post
    posts = JSON.parse(localStorage.getItem('hoopboard_posts')) || [];
    const post = posts.find(p => p.id === postId);
    
    if (!post) {
        showMessage('Post not found.', 'error');
        setTimeout(() => {
            window.location.href = 'lockerroom.html';
        }, 2000);
        return;
    }
    
    // Display the post
    displayPostView(post);
    
    // Set up comment form
    setupCommentForm(postId);
}

function displayPostView(post) {
    const postView = document.getElementById('postView');
    const timeAgo = getTimeAgo(post.timestamp);
    
    postView.innerHTML = `
        <div class="post post-detail">
            <div class="post-header">
                <span class="post-meta">${post.position} • ${post.region} • ${timeAgo}</span>
                <button class="delete-post-btn" onclick="deletePost(${post.id})" title="Delete post">
                    🗑️
                </button>
            </div>
            <div class="post-content">
                ${escapeHtml(post.content)}
            </div>
            <div class="post-footer">
                <div class="post-actions">
                    <button class="like-button ${post.liked ? 'liked' : ''}" onclick="toggleLike(${post.id})">
                        ${post.liked ? '❤️' : '🤍'} ${post.likes} Like${post.likes !== 1 ? 's' : ''}
                    </button>
                </div>
            </div>
        </div>
        
        <div class="comments-section">
            <h3>Comments (${post.comments ? post.comments.length : 0})</h3>
            <div id="commentsList">
                ${renderComments(post.comments || [])}
            </div>
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

function renderComments(comments) {
    if (comments.length === 0) {
        return '<p class="no-comments">No comments yet. Be the first to respond!</p>';
    }
    
    return comments.map(comment => {
        const timeAgo = getTimeAgo(comment.timestamp);
        return `
            <div class="comment" data-comment-id="${comment.id}">
                <div class="comment-header">
                    <span class="comment-meta">${comment.position} • ${comment.region} • ${timeAgo}</span>
                </div>
                <div class="comment-content">
                    ${escapeHtml(comment.content)}
                </div>
            </div>
        `;
    }).join('');
}

function setupCommentForm(postId) {
    const commentForm = document.getElementById('commentForm');
    if (!commentForm) return;
    
    commentForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const content = document.getElementById('commentContent').value.trim();
        
        if (!content) {
            showMessage('Please enter a comment.', 'error');
            return;
        }
        
        if (content.length < 3) {
            showMessage('Comment should be at least 3 characters long.', 'error');
            return;
        }
        
        // Find the post
        const post = posts.find(p => p.id === postId);
        if (!post) {
            showMessage('Post not found.', 'error');
            return;
        }
        
        // Create new comment
        const newComment = {
            id: Date.now(),
            content: content,
            position: 'Anonymous Player', // Could be made configurable later
            region: 'Community',
            timestamp: new Date().toISOString()
        };
        
        // Add comment to post
        if (!post.comments) {
            post.comments = [];
        }
        post.comments.push(newComment);
        
        // Save to localStorage
        localStorage.setItem('hoopboard_posts', JSON.stringify(posts));
        
        // Show success message
        showMessage('Comment posted successfully!', 'success');
        
        // Reset form
        commentForm.reset();
        
        // Redirect back to the forum after a short delay
        setTimeout(() => {
            window.location.href = 'lockerroom.html';
        }, 1500);
    });
}

function toggleLike(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    if (post.liked) {
        post.likes--;
        post.liked = false;
    } else {
        post.likes++;
        post.liked = true;
    }
    
    // Save to localStorage
    localStorage.setItem('hoopboard_posts', JSON.stringify(posts));
    
    // Update the like button
    const likeButton = document.querySelector(`[data-post-id="${postId}"] .like-button`);
    if (likeButton) {
        likeButton.className = `like-button ${post.liked ? 'liked' : ''}`;
        likeButton.innerHTML = `${post.liked ? '❤️' : '🤍'} ${post.likes} Like${post.likes !== 1 ? 's' : ''}`;
    }
    
    // If we're on the post detail page, update that too
    const detailLikeButton = document.querySelector('.post-detail .like-button');
    if (detailLikeButton) {
        detailLikeButton.className = `like-button ${post.liked ? 'liked' : ''}`;
        detailLikeButton.innerHTML = `${post.liked ? '❤️' : '🤍'} ${post.likes} Like${post.likes !== 1 ? 's' : ''}`;
    }
}

function setupLikeButtons() {
    // This is handled by the toggleLike function now
}

function getTimeAgo(timestamp) {
    const now = new Date();
    const postTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now - postTime) / 1000);
    
    if (diffInSeconds < 60) {
        return 'Just now';
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} min${minutes !== 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} hr${hours !== 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 2592000) {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days} day${days !== 1 ? 's' : ''} ago`;
    } else {
        return postTime.toLocaleDateString();
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showMessage(message, type = 'info') {
    // Remove existing messages
    const existingMessage = document.querySelector('.message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    // Insert after the intro section
    const intro = document.querySelector('.intro');
    if (intro) {
        intro.parentNode.insertBefore(messageDiv, intro.nextSibling);
    } else {
        // If no intro, insert at the top of main
        const main = document.querySelector('main');
        main.insertBefore(messageDiv, main.firstChild);
    }
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 5000);
}

// Future Airtable integration functions (commented out for now)
/*
async function savePostToAirtable(post) {
    try {
        const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fields: {
                    'Content': post.content,
                    'Position': post.position,
                    'Region': post.region,
                    'Division': post.division,
                    'Timestamp': post.timestamp
                }
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to save to Airtable');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error saving to Airtable:', error);
        throw error;
    }
}

async function loadPostsFromAirtable() {
    try {
        const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}?sort[0][field]=Timestamp&sort[0][direction]=desc`, {
            headers: {
                'Authorization': `Bearer ${AIRTABLE_TOKEN}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load from Airtable');
        }
        
        const data = await response.json();
        return data.records.map(record => ({
            id: record.id,
            content: record.fields.Content,
            position: record.fields.Position,
            region: record.fields.Region,
            division: record.fields.Division,
            timestamp: record.fields.Timestamp,
            likes: record.fields.Likes || 0,
            liked: false
        }));
    } catch (error) {
        console.error('Error loading from Airtable:', error);
        return [];
    }
}
*/
