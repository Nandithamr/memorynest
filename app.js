/* ═══════════════════════════════════════════════════════
   MemoryNest – app.js  (Supabase Cloud Edition)
   ═══════════════════════════════════════════════════════ */
'use strict';

/* ── Supabase client ─────────────────────────────────── */
// 'window.supabase' is the CDN library module.
// We call createClient() and store the result in 'db'.
var db;
try {
    db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
    console.log('✅ Supabase client ready');
} catch (err) {
    console.error('❌ Supabase init failed:', err);
}

/* ── State ───────────────────────────────────────────── */
var currentUser = null;  // { name, emoji }
var myMemories = [];
var myFriends = [];
var selectedMood = '';
var currentView = 'feed';
var popupTimer = null;
var shownPopupIds = {};
var photoFile = null;

/* ── DOM refs ────────────────────────────────────────── */
function $(id) { return document.getElementById(id); }

var loginScreen = $('loginScreen');
var loginNameInput = $('loginNameInput');
var loginBtn = $('loginBtn');
var loginHint = $('loginHint');
var appRoot = $('appRoot');
var feedContainer = $('feedContainer');
var galleryGrid = $('galleryGrid');
var galleryEmpty = $('galleryEmpty');
var friendsGrid = $('friendsGrid');
var navTabs = document.querySelectorAll('.nav-tab');
var addMemoryModal = $('addMemoryModal');
var friendModal = $('friendModal');
var photoInput = $('photoInput');
var photoPreview = $('photoPreview');
var photoUploadArea = $('photoUploadArea');
var captionInput = $('captionInput');
var sharedWithSelect = $('sharedWithSelect');
var memoryDate = $('memoryDate');
var tagsInput = $('tagsInput');
var moodGrid = $('moodGrid');
var rememberPopup = $('rememberPopup');
var popupPhoto = $('popupPhoto');
var popupAvatar = $('popupAvatar');
var popupAuthorName = $('popupAuthorName');
var popupDate = $('popupDate');
var popupCaption = $('popupCaption');
var toastEl = $('toast');

/* ── Helpers ─────────────────────────────────────────── */
function formatDate(str) {
    if (!str) return '';
    var d = new Date(str + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}
function timeAgo(ts) {
    var diff = Date.now() - new Date(ts).getTime();
    var d = Math.floor(diff / 86400000);
    if (d === 0) return 'Today';
    if (d === 1) return 'Yesterday';
    if (d < 30) return d + ' days ago';
    if (d < 365) return Math.floor(d / 30) + ' months ago';
    return Math.floor(d / 365) + 'y ago';
}
function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    setTimeout(function () { toastEl.classList.remove('show'); }, 2800);
}
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function getInitials(name) { return (name || '?').split(' ').map(function (w) { return w[0]; }).join('').toUpperCase().slice(0, 2); }
function escHtml(str) { var d = document.createElement('div'); d.textContent = str || ''; return d.innerHTML; }

var EMOJI_POOL = ['🌸', '🌈', '🦋', '🌙', '⭐', '🍀', '🦊', '🐬', '🎨', '🎵', '🌺', '✨', '🦄', '🌻', '💫', '🎭'];
function randomEmoji() { return EMOJI_POOL[Math.floor(Math.random() * EMOJI_POOL.length)]; }

function makePlaceholder(hue, emoji) {
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500">' +
        '<rect width="800" height="500" fill="hsl(' + hue + ',40%,20%)"/>' +
        '<text x="400" y="260" font-size="130" text-anchor="middle" dominant-baseline="middle">' + (emoji || '🪺') + '</text></svg>'
    );
}

/* ── Sparkles ────────────────────────────────────────── */
function spawnSparkles(x, y) {
    var colours = ['#f5a833', '#e8607a', '#a78bfa', '#fff'];
    for (var i = 0; i < 8; i++) {
        var el = document.createElement('div');
        el.className = 'sparkle';
        var angle = (Math.PI * 2 * i) / 8, dist = 30 + Math.random() * 30;
        el.style.cssText = 'left:' + x + 'px;top:' + y + 'px;background:' + colours[i % 4] +
            ';--dx:' + Math.cos(angle) * dist + 'px;--dy:' + Math.sin(angle) * dist + 'px;animation-delay:' + Math.random() * 0.15 + 's';
        document.body.appendChild(el);
        setTimeout(function (e) { e.remove(); }.bind(null, el), 900);
    }
}

/* ═════════ SESSION (localStorage) ═════════ */
var SESSION_KEY = 'mn_session';
function restoreSession() {
    try {
        var s = JSON.parse(localStorage.getItem(SESSION_KEY));
        if (s && s.name) { currentUser = s; return true; }
    } catch (e) { }
    return false;
}
function persistSession() { localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser)); }
function clearSession() { localStorage.removeItem(SESSION_KEY); }

/* ═════════ LOGIN ═════════ */
function doLogin() {
    var name = loginNameInput.value.trim();
    if (!name) { loginHint.textContent = '✏️ Please enter your name.'; loginNameInput.focus(); return; }
    if (name.length < 2) { loginHint.textContent = '✏️ At least 2 characters please!'; loginNameInput.focus(); return; }

    loginBtn.disabled = true;
    loginBtn.querySelector('span').textContent = 'Entering…';
    loginHint.textContent = '';

    var emoji = randomEmoji();
    currentUser = { name: name, emoji: emoji };
    persistSession();

    // Transition to app immediately — no waiting for network
    loginScreen.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    loginScreen.style.opacity = '0';
    loginScreen.style.transform = 'scale(1.05)';

    setTimeout(function () {
        loginScreen.classList.add('hidden');
        loginScreen.style.opacity = '';
        loginScreen.style.transform = '';
        loginBtn.disabled = false;
        loginBtn.querySelector('span').textContent = 'Enter the Nest';
        appRoot.classList.remove('hidden');
        updateUserPill();
        initApp();
        spawnSparkles(window.innerWidth / 2, window.innerHeight / 3);
    }, 500);

    // Register user in Supabase (background, non-blocking)
    registerUserInBackground(name, emoji);
}

function registerUserInBackground(name, emoji) {
    if (!db) return;
    db.from('mn_users')
        .select('*')
        .ilike('name', name)
        .maybeSingle()
        .then(function (res) {
            if (!res.data) {
                db.from('mn_users').insert([{ name: name, emoji: emoji }]).then(function () {
                    console.log('✅ User registered in Supabase');
                });
            } else {
                currentUser.emoji = res.data.emoji || emoji;
                persistSession();
                updateUserPill();
            }
        })
        .catch(function (err) { console.warn('User register warning:', err); });
}

function showLogin() {
    appRoot.classList.add('hidden');
    loginScreen.classList.remove('hidden');
    loginNameInput.value = '';
    loginHint.textContent = '';
    setTimeout(function () { loginNameInput.focus(); }, 100);
}

function updateUserPill() {
    $('currentUserAvatar').textContent = currentUser.emoji || getInitials(currentUser.name);
    $('currentUserName').textContent = currentUser.name;
}

// Login events
loginBtn.addEventListener('click', doLogin);
loginNameInput.addEventListener('keydown', function (e) {
    loginHint.textContent = '';
    if (e.key === 'Enter') doLogin();
});

$('btnLogout').addEventListener('click', function () {
    clearSession();
    myMemories = []; myFriends = []; currentUser = null;
    if (popupTimer) clearTimeout(popupTimer);
    showLogin();
    showToast('👋 See you soon!');
});

/* ═════════ NAVIGATION ═════════ */
function switchView(name) {
    currentView = name;
    document.querySelectorAll('.view').forEach(function (v) { v.classList.remove('active'); });
    document.getElementById('view-' + name).classList.add('active');
    navTabs.forEach(function (t) { t.classList.toggle('active', t.dataset.view === name); });
    if (name === 'gallery') renderGallery();
    if (name === 'friends') renderFriends();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
navTabs.forEach(function (tab) { tab.addEventListener('click', function () { switchView(tab.dataset.view); }); });

/* ═════════ FETCH DATA FROM SUPABASE ═════════ */
function fetchMemories() {
    if (!db) { myMemories = []; return Promise.resolve(); }
    var name = currentUser.name;
    return db.from('mn_memories')
        .select('*')
        .or('author_name.ilike.' + name + ',shared_with.ilike.' + name)
        .order('created_at', { ascending: false })
        .then(function (res) {
            if (res.error) { console.error('fetchMemories error:', res.error); return; }
            myMemories = res.data || [];
        })
        .catch(function (err) { console.error('fetchMemories:', err); });
}

function fetchFriends() {
    if (!db) { myFriends = []; return Promise.resolve(); }
    var name = currentUser.name;
    return db.from('mn_friends')
        .select('*')
        .or('user_a.ilike.' + name + ',user_b.ilike.' + name)
        .then(function (res) {
            if (res.error) { console.error('fetchFriends error:', res.error); return; }
            var friendNames = (res.data || []).map(function (row) {
                return row.user_a.toLowerCase() === name.toLowerCase() ? row.user_b : row.user_a;
            });
            if (friendNames.length === 0) { myFriends = []; return; }
            return db.from('mn_users').select('*').in('name', friendNames).then(function (r2) {
                myFriends = (r2.data || []).filter(function (u) { return u.name.toLowerCase() !== name.toLowerCase(); });
            });
        })
        .catch(function (err) { console.error('fetchFriends:', err); });
}

/* ═════════ RENDER FEED ═════════ */
function renderFeed() {
    if (myMemories.length === 0) {
        feedContainer.innerHTML = '<div class="feed-empty"><span class="empty-icon">🪺</span>' +
            '<p>Your nest is empty!<br>Add your first memory to get started.</p></div>';
        return;
    }
    feedContainer.innerHTML = '';
    myMemories.forEach(function (mem, i) { feedContainer.appendChild(buildMemoryCard(mem, i)); });
}

function buildMemoryCard(mem, delay) {
    var article = document.createElement('article');
    article.className = 'memory-card';
    article.style.animationDelay = (delay * 0.07) + 's';
    article.dataset.id = mem.id;

    var tagsHtml = (mem.tags || []).map(function (t) { return '<span class="tag">#' + escHtml(t.trim()) + '</span>'; }).join('');
    var photoSection = mem.photo_url
        ? '<div class="card-photo-wrap"><img class="card-photo" src="' + escHtml(mem.photo_url) + '" alt="Memory photo" loading="lazy"/><div class="card-photo-overlay"></div></div>'
        : '';
    var isOwn = (mem.author_name || '').toLowerCase() === currentUser.name.toLowerCase();
    var privacyBadge = mem.shared_with
        ? '<span class="privacy-badge">🔒 You & ' + escHtml(mem.shared_with) + '</span>'
        : '<span class="privacy-badge privacy-badge--open">🌐 Your nest</span>';
    var deleteBtn = isOwn ? '<button class="action-btn del-btn" data-id="' + mem.id + '" title="Delete">🗑️</button>' : '';

    article.innerHTML =
        photoSection +
        '<div class="card-body">' +
        '<div class="card-meta">' +
        '<div class="card-author">' +
        '<div class="avatar">' + escHtml(mem.author_emoji || getInitials(mem.author_name)) + '</div>' +
        '<div><div class="author-name">' + escHtml(mem.author_name) + '</div>' +
        '<div class="author-date">' + formatDate(mem.memory_date) + ' · ' + timeAgo(mem.created_at) + '</div></div>' +
        '</div>' +
        '<div class="card-mood">' + escHtml(mem.mood || '') + '</div>' +
        '</div>' +
        '<p class="card-caption">' + escHtml(mem.caption) + '</p>' +
        (tagsHtml ? '<div class="card-tags">' + tagsHtml + '</div>' : '') +
        '<div class="card-footer">' +
        '<div class="card-actions">' +
        '<button class="action-btn like-btn ' + (mem.liked ? 'liked' : '') + '" data-id="' + mem.id + '">' + (mem.liked ? '❤️' : '🤍') + ' <span class="like-count">' + (mem.likes || 0) + '</span></button>' +
        deleteBtn +
        '</div>' +
        privacyBadge +
        '</div>' +
        '</div>';

    return article;
}

// Feed click events
feedContainer.addEventListener('click', function (e) {
    var likeBtn = e.target.closest('.like-btn');
    var delBtn = e.target.closest('.del-btn');

    if (likeBtn) {
        var id = likeBtn.dataset.id;
        var mem = myMemories.find(function (m) { return m.id === id; });
        if (!mem) return;
        var newLikes = (mem.likes || 0) + 1;
        mem.likes = newLikes; mem.liked = true;
        if (db) db.from('mn_memories').update({ likes: newLikes, liked: true }).eq('id', id);
        renderFeed();
        var rect = likeBtn.getBoundingClientRect();
        spawnSparkles(rect.left + rect.width / 2, rect.top + window.scrollY + rect.height / 2);
        showToast('❤️ Loved this memory!');
    }

    if (delBtn) {
        var id2 = delBtn.dataset.id;
        if (!confirm('Delete this memory forever? 🥺')) return;
        if (db) db.from('mn_memories').delete().eq('id', id2);
        myMemories = myMemories.filter(function (m) { return m.id !== id2; });
        renderFeed();
        if (currentView === 'gallery') renderGallery();
        showToast('🗑️ Memory removed.');
    }
});

/* ═════════ RENDER GALLERY ═════════ */
function renderGallery() {
    var withPhotos = myMemories.filter(function (m) { return m.photo_url; });
    if (withPhotos.length === 0) {
        galleryGrid.innerHTML = '';
        galleryEmpty.classList.remove('hidden');
        return;
    }
    galleryEmpty.classList.add('hidden');
    galleryGrid.innerHTML = '';
    withPhotos.forEach(function (mem) {
        var item = document.createElement('div');
        item.className = 'gallery-item';
        item.innerHTML = '<img src="' + escHtml(mem.photo_url) + '" alt="' + escHtml((mem.caption || '').slice(0, 60)) + '" loading="lazy"/>' +
            '<div class="gallery-overlay"><p class="gallery-caption">' + escHtml(mem.mood || '') + ' ' + escHtml((mem.caption || '').slice(0, 90)) + '</p></div>';
        galleryGrid.appendChild(item);
    });
}

/* ═════════ RENDER FRIENDS ═════════ */
function renderFriends() {
    friendsGrid.innerHTML = '';
    if (myFriends.length === 0) {
        var empty = document.createElement('div');
        empty.className = 'feed-empty';
        empty.style.gridColumn = '1 / -1';
        empty.innerHTML = '<span class="empty-icon">💛</span><p>No nest mates yet.<br>Add a friend and start sharing memories!</p>';
        friendsGrid.appendChild(empty);
    } else {
        myFriends.forEach(function (friend) {
            var count = myMemories.filter(function (m) {
                return (m.author_name && m.author_name.toLowerCase() === currentUser.name.toLowerCase() && m.shared_with && m.shared_with.toLowerCase() === friend.name.toLowerCase()) ||
                    (m.shared_with && m.shared_with.toLowerCase() === currentUser.name.toLowerCase() && m.author_name && m.author_name.toLowerCase() === friend.name.toLowerCase());
            }).length;
            var card = document.createElement('div');
            card.className = 'friend-card';
            card.innerHTML = '<div class="friend-avatar">' + escHtml(friend.emoji || getInitials(friend.name)) + '</div>' +
                '<div class="friend-name">' + escHtml(friend.name) + '</div>' +
                '<div class="friend-count">' + count + ' shared memor' + (count === 1 ? 'y' : 'ies') + '</div>';
            friendsGrid.appendChild(card);
        });
    }
    var addCard = document.createElement('div');
    addCard.className = 'add-friend-card';
    addCard.innerHTML = '<span class="plus-icon">+</span><span>Add a friend to the nest</span>';
    addCard.addEventListener('click', openFriendModal);
    friendsGrid.appendChild(addCard);
}

/* ═════════ ADD MEMORY MODAL ═════════ */
function openAddMemory() {
    if (myFriends.length > 0) {
        sharedWithSelect.innerHTML = myFriends.map(function (f) {
            return '<option value="' + escHtml(f.name) + '">' + escHtml(f.emoji || '') + ' ' + escHtml(f.name) + '</option>';
        }).join('');
    } else {
        sharedWithSelect.innerHTML = '<option value="">— Add a friend first —</option>';
    }
    memoryDate.value = new Date().toISOString().split('T')[0];
    captionInput.value = ''; tagsInput.value = '';
    photoPreview.style.display = 'none'; photoPreview.src = '';
    photoInput.value = ''; photoFile = null; selectedMood = '';
    document.querySelectorAll('.mood-btn').forEach(function (b) { b.classList.remove('selected'); });
    addMemoryModal.classList.remove('hidden');
    setTimeout(function () { captionInput.focus(); }, 100);
}
function closeAddMemory() { addMemoryModal.classList.add('hidden'); }

$('btnAddMemory').addEventListener('click', openAddMemory);
$('closeMemoryModal').addEventListener('click', closeAddMemory);
$('cancelMemory').addEventListener('click', closeAddMemory);
addMemoryModal.addEventListener('click', function (e) { if (e.target === addMemoryModal) closeAddMemory(); });

photoInput.addEventListener('change', function (e) {
    var file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showToast('⚠️ Image too large. Max 5 MB.'); return; }
    photoFile = file;
    var reader = new FileReader();
    reader.onload = function (ev) { photoPreview.src = ev.target.result; photoPreview.style.display = 'block'; };
    reader.readAsDataURL(file);
});

photoUploadArea.addEventListener('dragover', function (e) { e.preventDefault(); photoUploadArea.classList.add('dragover'); });
photoUploadArea.addEventListener('dragleave', function () { photoUploadArea.classList.remove('dragover'); });
photoUploadArea.addEventListener('drop', function (e) {
    e.preventDefault(); photoUploadArea.classList.remove('dragover');
    var file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        if (file.size > 5 * 1024 * 1024) { showToast('⚠️ Max 5 MB.'); return; }
        photoFile = file;
        var reader = new FileReader();
        reader.onload = function (ev) { photoPreview.src = ev.target.result; photoPreview.style.display = 'block'; };
        reader.readAsDataURL(file);
    }
});

moodGrid.addEventListener('click', function (e) {
    var btn = e.target.closest('.mood-btn');
    if (!btn) return;
    document.querySelectorAll('.mood-btn').forEach(function (b) { b.classList.remove('selected'); });
    btn.classList.add('selected');
    selectedMood = btn.dataset.mood;
    spawnSparkles(e.clientX, e.clientY + window.scrollY);
});

$('saveMemory').addEventListener('click', function () {
    var caption = captionInput.value.trim();
    var sharedWith = sharedWithSelect.value || null;

    if (!caption) { showToast('✍️ Write something about this moment!'); captionInput.focus(); return; }
    if (!sharedWith) { showToast('💛 Add a friend first, then share this memory!'); return; }

    var tags = tagsInput.value.split(',').map(function (t) { return t.trim(); }).filter(Boolean);
    var memId = uid();

    // Upload photo if any
    var photoPromise;
    if (photoFile && db) {
        var ext = photoFile.name.split('.').pop();
        var filename = Date.now() + '_' + memId + '.' + ext;
        photoPromise = db.storage.from('photos').upload(filename, photoFile, { cacheControl: '3600', upsert: false })
            .then(function (res) {
                if (res.error) { console.warn('Photo upload warning:', res.error); return ''; }
                var urlRes = db.storage.from('photos').getPublicUrl(filename);
                return urlRes.data.publicUrl;
            })
            .catch(function (err) { console.warn('Photo upload error:', err); return ''; });
    } else {
        // If no db, store as base64
        photoPromise = Promise.resolve(photoPreview.src || '');
    }

    showToast('💾 Saving…');

    photoPromise.then(function (photoUrl) {
        var memory = {
            id: memId,
            author_name: currentUser.name,
            author_emoji: currentUser.emoji || '',
            shared_with: sharedWith,
            caption: caption,
            photo_url: photoUrl || '',
            tags: tags,
            mood: selectedMood,
            memory_date: memoryDate.value || null,
            likes: 0,
            liked: false,
            created_at: Date.now()
        };

        // Save to Supabase
        if (db) {
            db.from('mn_memories').insert([memory]).then(function (res) {
                if (res.error) console.error('Memory insert error:', res.error);
                else console.log('✅ Memory saved to Supabase');
            });
        }

        myMemories.unshift(memory);
        closeAddMemory();
        switchView('feed');
        renderFeed();
        showToast('🪺 Memory saved — only you & ' + sharedWith + ' can see it!');
        spawnSparkles(window.innerWidth / 2, window.innerHeight / 2);
    });
});

/* ═════════ FRIEND MODAL ═════════ */
function openFriendModal() {
    $('friendNameInput').value = ''; $('friendEmojiInput').value = '';
    friendModal.classList.remove('hidden');
    setTimeout(function () { $('friendNameInput').focus(); }, 100);
}
function closeFriendModal() { friendModal.classList.add('hidden'); }

$('closeFriendModal').addEventListener('click', closeFriendModal);
$('cancelFriend').addEventListener('click', closeFriendModal);
friendModal.addEventListener('click', function (e) { if (e.target === friendModal) closeFriendModal(); });

$('saveFriend').addEventListener('click', function () {
    var name = $('friendNameInput').value.trim();
    var emoji = $('friendEmojiInput').value.trim();

    if (!name) { showToast('✏️ Enter a name first!'); return; }
    if (name.toLowerCase() === currentUser.name.toLowerCase()) { showToast("🙃 You can't add yourself!"); return; }
    if (myFriends.some(function (f) { return f.name.toLowerCase() === name.toLowerCase(); })) {
        showToast('💛 ' + name + ' is already in the nest!'); closeFriendModal(); return;
    }

    var friendEmoji = emoji || randomEmoji();
    var friendUser = { name: name, emoji: friendEmoji };

    // Save to Supabase in background
    if (db) {
        // Ensure friend user exists
        db.from('mn_users').select('*').ilike('name', name).maybeSingle().then(function (res) {
            if (!res.data) {
                db.from('mn_users').insert([{ name: name, emoji: friendEmoji }]);
            }
        });

        // Create friendship
        var userA = currentUser.name < name ? currentUser.name : name;
        var userB = currentUser.name < name ? name : currentUser.name;
        db.from('mn_friends').upsert([{ user_a: userA, user_b: userB }], { onConflict: 'user_a,user_b' }).then(function (res) {
            if (res.error) console.error('Friend insert error:', res.error);
            else console.log('✅ Friendship saved to Supabase');
        });
    }

    myFriends.push(friendUser);
    closeFriendModal();
    renderFriends();
    showToast('💛 ' + name + ' added to the nest!');
});

/* ═════════ REMEMBER THIS POPUP ═════════ */
function getRandomMemory() {
    if (myMemories.length === 0) return null;
    var unseen = myMemories.filter(function (m) { return !shownPopupIds[m.id]; });
    var pool = unseen.length > 0 ? unseen : myMemories;
    var mem = pool[Math.floor(Math.random() * pool.length)];
    shownPopupIds[mem.id] = true;
    return mem;
}

function showRememberPopup() {
    var mem = getRandomMemory();
    if (!mem) return;
    popupPhoto.src = mem.photo_url || makePlaceholder(30, mem.mood || '🌸');
    popupAvatar.textContent = mem.author_emoji || getInitials(mem.author_name || '?');
    popupAuthorName.textContent = mem.author_name || 'Someone';
    popupDate.textContent = formatDate(mem.memory_date) || timeAgo(mem.created_at);
    popupCaption.textContent = mem.caption;
    $('popupLike').dataset.id = mem.id;
    rememberPopup.classList.remove('hidden', 'closing');
}

function closeRememberPopup() {
    rememberPopup.classList.add('closing');
    setTimeout(function () { rememberPopup.classList.add('hidden'); }, 380);
}

$('closePopup').addEventListener('click', closeRememberPopup);
$('btnRemember').addEventListener('click', function (e) {
    if (myMemories.length === 0) { showToast('📭 No memories yet! Add one first.'); return; }
    showRememberPopup();
    var rect = e.currentTarget.getBoundingClientRect();
    spawnSparkles(rect.left + rect.width / 2, rect.top + window.scrollY);
});

$('popupLike').addEventListener('click', function () {
    var id = this.dataset.id;
    var mem = myMemories.find(function (m) { return m.id === id; });
    if (mem) {
        mem.likes = (mem.likes || 0) + 1; mem.liked = true;
        if (db) db.from('mn_memories').update({ likes: mem.likes, liked: true }).eq('id', id);
        if (currentView === 'feed') renderFeed();
    }
    showToast('❤️ Loved it!');
    closeRememberPopup();
});

function schedulePopup() {
    if (popupTimer) clearTimeout(popupTimer);
    popupTimer = setTimeout(function () {
        if (addMemoryModal.classList.contains('hidden') && friendModal.classList.contains('hidden') && myMemories.length > 0)
            showRememberPopup();
        schedulePopup();
    }, 45000);
}

/* ═════════ REAL-TIME ═════════ */
function subscribeToChanges() {
    if (!db) return;
    var name = currentUser.name.toLowerCase();
    db.channel('memories-rt')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mn_memories' }, function (payload) {
            var m = payload.new;
            var relevant = (m.author_name || '').toLowerCase() === name || (m.shared_with || '').toLowerCase() === name;
            if (!relevant) return;
            if (myMemories.some(function (mem) { return mem.id === m.id; })) return;
            myMemories.unshift(m);
            if (currentView === 'feed') renderFeed();
            if (currentView === 'gallery') renderGallery();
            showToast('✨ New memory from ' + m.author_name + '!');
        })
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'mn_memories' }, function (payload) {
            myMemories = myMemories.filter(function (m) { return m.id !== payload.old.id; });
            if (currentView === 'feed') renderFeed();
            if (currentView === 'gallery') renderGallery();
        })
        .subscribe();
}

/* ═════════ KEYBOARD ═════════ */
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        if (!addMemoryModal.classList.contains('hidden')) { closeAddMemory(); return; }
        if (!friendModal.classList.contains('hidden')) { closeFriendModal(); return; }
        if (!rememberPopup.classList.contains('hidden')) { closeRememberPopup(); return; }
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') { e.preventDefault(); openAddMemory(); }
});

var logoClicks = 0;
$('logoLink').addEventListener('click', function (e) {
    e.preventDefault(); logoClicks++;
    spawnSparkles(e.clientX, e.clientY + window.scrollY);
    if (logoClicks >= 5) { logoClicks = 0; showToast('🌟 Distance is just a number 💛'); }
});

/* ═════════ INIT ═════════ */
function initApp() {
    showToast('🪺 Loading your nest…');
    Promise.all([fetchMemories(), fetchFriends()])
        .then(function () {
            renderFeed();
            subscribeToChanges();
            schedulePopup();
            if (myMemories.length > 0) setTimeout(showRememberPopup, 10000);
        })
        .catch(function (err) {
            console.error('Init error:', err);
            renderFeed(); // Still render (empty state)
        });
}

/* ═════════ BOOTSTRAP ═════════ */
if (restoreSession()) {
    loginScreen.classList.add('hidden');
    appRoot.classList.remove('hidden');
    updateUserPill();
    initApp();
} else {
    appRoot.classList.add('hidden');
    loginScreen.classList.remove('hidden');
    setTimeout(function () { loginNameInput.focus(); }, 300);
}

console.log('%c🪺 MemoryNest loaded!', 'color:#f5a833;font-size:14px;font-weight:bold;');
