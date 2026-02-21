/* ─────────────────────────────────────────────────────
   MemoryNest – app.js  (Supabase edition)
   Real-time shared diary · Cloud DB + Storage
   ───────────────────────────────────────────────────── */

'use strict';

// ═══════════════════════════════════════════════════════
//  SUPABASE CLIENT
// ═══════════════════════════════════════════════════════

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

// ═══════════════════════════════════════════════════════
//  LOCAL STATE (runtime only, sourced from Supabase)
// ═══════════════════════════════════════════════════════

let memories = [];
let friends = [];
let selectedMood = '';
let currentView = 'feed';
let popupTimer = null;
let shownPopupIds = new Set();
let currentUser = null;   // { id, name, emoji }

// ═══════════════════════════════════════════════════════
//  DOM REFS
// ═══════════════════════════════════════════════════════

const $ = id => document.getElementById(id);

const feedContainer = $('feedContainer');
const galleryGrid = $('galleryGrid');
const galleryEmpty = $('galleryEmpty');
const friendsGrid = $('friendsGrid');
const navTabs = document.querySelectorAll('.nav-tab');
const addMemoryModal = $('addMemoryModal');
const friendModal = $('friendModal');
const photoInput = $('photoInput');
const photoPreview = $('photoPreview');
const photoUploadArea = $('photoUploadArea');
const captionInput = $('captionInput');
const authorSelect = $('authorSelect');
const memoryDate = $('memoryDate');
const tagsInput = $('tagsInput');
const moodGrid = $('moodGrid');
const rememberPopup = $('rememberPopup');
const popupPhoto = $('popupPhoto');
const popupAvatar = $('popupAvatar');
const popupAuthorName = $('popupAuthorName');
const popupDate = $('popupDate');
const popupCaption = $('popupCaption');
const toast = $('toast');

// ═══════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════

function formatDate(str) {
    if (!str) return '';
    const d = new Date(str + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function timeAgo(ts) {
    const diff = Date.now() - new Date(ts).getTime();
    const d = Math.floor(diff / 86400000);
    if (d === 0) return 'Today';
    if (d === 1) return 'Yesterday';
    if (d < 30) return `${d} days ago`;
    if (d < 365) return `${Math.floor(d / 30)} months ago`;
    return `${Math.floor(d / 365)}y ago`;
}

function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2800);
}

function generateId() { return Math.random().toString(36).slice(2, 9) + Date.now().toString(36); }

function getInitials(name) { return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2); }

function escHtml(str = '') {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

function makePlaceholder(hue, emoji, text) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500">
    <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:hsl(${hue},60%,20%)"/>
      <stop offset="100%" style="stop-color:hsl(${(hue + 50) % 360},55%,30%)"/>
    </linearGradient></defs>
    <rect width="800" height="500" fill="url(#g)"/>
    <text x="400" y="220" font-size="110" text-anchor="middle" dominant-baseline="middle">${emoji}</text>
    <text x="400" y="330" font-size="28" fill="rgba(255,255,255,0.6)" text-anchor="middle" font-family="Georgia">${text}</text>
  </svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

// ═══════════════════════════════════════════════════════
//  SPARKLE EFFECT
// ═══════════════════════════════════════════════════════

function spawnSparkles(x, y) {
    const colours = ['#f5a833', '#e8607a', '#a78bfa', '#fff'];
    for (let i = 0; i < 8; i++) {
        const el = document.createElement('div');
        el.className = 'sparkle';
        const angle = (Math.PI * 2 * i) / 8;
        const dist = 30 + Math.random() * 30;
        el.style.cssText = `left:${x}px;top:${y}px;background:${colours[i % 4]};
      --dx:${Math.cos(angle) * dist}px;--dy:${Math.sin(angle) * dist}px;
      animation-delay:${Math.random() * 0.15}s`;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 900);
    }
}

// ═══════════════════════════════════════════════════════
//  LOADING OVERLAY
// ═══════════════════════════════════════════════════════

function showLoader(msg = 'Loading…') {
    let el = $('globalLoader');
    if (!el) {
        el = document.createElement('div');
        el.id = 'globalLoader';
        el.style.cssText = `position:fixed;inset:0;z-index:999;background:rgba(10,5,20,0.8);
      display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;
      backdrop-filter:blur(8px);color:#f0e6d3;font-family:Inter,sans-serif;font-size:0.95rem;`;
        el.innerHTML = `<div style="width:44px;height:44px;border:3px solid rgba(245,168,51,0.2);
      border-top-color:#f5a833;border-radius:50%;animation:spin .8s linear infinite;"></div>
      <span id="loaderMsg">${msg}</span>`;
        const style = document.createElement('style');
        style.textContent = '@keyframes spin{to{transform:rotate(360deg)}}';
        document.head.appendChild(style);
        document.body.appendChild(el);
    } else {
        $('loaderMsg').textContent = msg;
        el.style.display = 'flex';
    }
}

function hideLoader() {
    const el = $('globalLoader');
    if (el) el.style.display = 'none';
}

// ═══════════════════════════════════════════════════════
//  ROUTING / NAVIGATION
// ═══════════════════════════════════════════════════════

function switchView(viewName) {
    currentView = viewName;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(`view-${viewName}`).classList.add('active');
    navTabs.forEach(t => t.classList.toggle('active', t.dataset.view === viewName));
    if (viewName === 'gallery') renderGallery();
    if (viewName === 'friends') renderFriends();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

navTabs.forEach(tab => tab.addEventListener('click', () => switchView(tab.dataset.view)));

// ═══════════════════════════════════════════════════════
//  SUPABASE — FETCH DATA
// ═══════════════════════════════════════════════════════

async function fetchFriends() {
    const { data, error } = await supabase
        .from('friends')
        .select('*')
        .order('created_at', { ascending: true });
    if (error) { console.error('fetchFriends:', error); return; }
    friends = data || [];
}

async function fetchMemories() {
    const { data, error } = await supabase
        .from('memories')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) { console.error('fetchMemories:', error); return; }
    memories = data || [];
}

// ═══════════════════════════════════════════════════════
//  RENDER FEED
// ═══════════════════════════════════════════════════════

function renderFeed() {
    if (memories.length === 0) {
        feedContainer.innerHTML = `
      <div class="feed-empty">
        <span class="empty-icon">🪺</span>
        <p>Your nest is empty. Add the first memory!</p>
      </div>`;
        return;
    }
    feedContainer.innerHTML = '';
    memories.forEach((mem, i) => {
        feedContainer.appendChild(buildMemoryCard(mem, i));
    });
}

function buildMemoryCard(mem, delay = 0) {
    const article = document.createElement('article');
    article.className = 'memory-card';
    article.style.animationDelay = `${delay * 0.07}s`;
    article.dataset.id = mem.id;

    const tagsHtml = (mem.tags || []).map(t => `<span class="tag">#${escHtml(t.trim())}</span>`).join('');

    const photoSection = mem.photo_url
        ? `<div class="card-photo-wrap">
         <img class="card-photo" src="${escHtml(mem.photo_url)}" alt="Memory photo" loading="lazy"/>
         <div class="card-photo-overlay"></div>
       </div>`
        : '';

    const initials = getInitials(mem.author_name || '?');

    article.innerHTML = `
    ${photoSection}
    <div class="card-body">
      <div class="card-meta">
        <div class="card-author">
          <div class="avatar">${escHtml(mem.author_emoji || initials)}</div>
          <div>
            <div class="author-name">${escHtml(mem.author_name)}</div>
            <div class="author-date">${formatDate(mem.memory_date)} · ${timeAgo(mem.created_at)}</div>
          </div>
        </div>
        <div class="card-mood">${escHtml(mem.mood || '')}</div>
      </div>
      <p class="card-caption">${escHtml(mem.caption)}</p>
      ${tagsHtml ? `<div class="card-tags">${tagsHtml}</div>` : ''}
      <div class="card-footer">
        <div class="card-actions">
          <button class="action-btn like-btn" data-id="${mem.id}">
            🤍 <span class="like-count">${mem.likes || 0}</span>
          </button>
          <button class="action-btn del-btn" data-id="${mem.id}" title="Delete memory">🗑️</button>
        </div>
        <span class="muted" style="font-size:0.75rem">Saved in the nest 🪺</span>
      </div>
    </div>`;
    return article;
}

// Feed events
feedContainer.addEventListener('click', async e => {
    const likeBtn = e.target.closest('.like-btn');
    const delBtn = e.target.closest('.del-btn');

    if (likeBtn) {
        const id = likeBtn.dataset.id;
        const mem = memories.find(m => m.id === id);
        if (!mem) return;
        const newLikes = (mem.likes || 0) + 1;
        const { error } = await supabase.from('memories').update({ likes: newLikes }).eq('id', id);
        if (!error) {
            mem.likes = newLikes;
            likeBtn.querySelector('.like-count').textContent = newLikes;
            likeBtn.innerHTML = `❤️ <span class="like-count">${newLikes}</span>`;
            likeBtn.classList.add('liked');
            const rect = likeBtn.getBoundingClientRect();
            spawnSparkles(rect.left + rect.width / 2, rect.top + window.scrollY + rect.height / 2);
            showToast('❤️ Loved this memory!');
        }
    }

    if (delBtn) {
        const id = delBtn.dataset.id;
        if (!confirm('Delete this memory forever? 🥺')) return;
        const { error } = await supabase.from('memories').delete().eq('id', id);
        if (!error) {
            memories = memories.filter(m => m.id !== id);
            renderFeed();
            if (currentView === 'gallery') renderGallery();
            showToast('🗑️ Memory removed.');
        } else {
            showToast('⚠️ Could not delete. Try again.');
        }
    }
});

// ═══════════════════════════════════════════════════════
//  RENDER GALLERY
// ═══════════════════════════════════════════════════════

function renderGallery() {
    const withPhotos = memories.filter(m => m.photo_url);
    if (withPhotos.length === 0) {
        galleryGrid.innerHTML = '';
        galleryEmpty.classList.remove('hidden');
        return;
    }
    galleryEmpty.classList.add('hidden');
    galleryGrid.innerHTML = '';
    withPhotos.forEach((mem, i) => {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        item.innerHTML = `
      <img src="${escHtml(mem.photo_url)}" alt="${escHtml(mem.caption.slice(0, 60))}" loading="lazy"/>
      <div class="gallery-overlay">
        <p class="gallery-caption">${escHtml(mem.mood || '')} ${escHtml(mem.caption.slice(0, 90))}${mem.caption.length > 90 ? '…' : ''}</p>
      </div>`;
        galleryGrid.appendChild(item);
    });
}

// ═══════════════════════════════════════════════════════
//  RENDER FRIENDS
// ═══════════════════════════════════════════════════════

function renderFriends() {
    friendsGrid.innerHTML = '';
    friends.forEach(friend => {
        const count = memories.filter(m => m.author_name === friend.name).length;
        const card = document.createElement('div');
        card.className = 'friend-card';
        card.innerHTML = `
      <div class="friend-avatar">${escHtml(friend.emoji || getInitials(friend.name))}</div>
      <div class="friend-name">${escHtml(friend.name)}</div>
      <div class="friend-count">${count} memor${count === 1 ? 'y' : 'ies'}</div>`;
        friendsGrid.appendChild(card);
    });
    const addCard = document.createElement('div');
    addCard.className = 'add-friend-card';
    addCard.innerHTML = `<span class="plus-icon">+</span><span>Add a friend to the nest</span>`;
    addCard.addEventListener('click', openFriendModal);
    friendsGrid.appendChild(addCard);
}

// ═══════════════════════════════════════════════════════
//  ADD MEMORY MODAL
// ═══════════════════════════════════════════════════════

let photoFile = null;

function openAddMemory() {
    authorSelect.innerHTML = friends.length
        ? friends.map(f => `<option value="${escHtml(f.name)}" data-emoji="${escHtml(f.emoji || '')}">
        ${escHtml(f.emoji || '')} ${escHtml(f.name)}</option>`).join('')
        : `<option value="">— Add a friend first —</option>`;

    memoryDate.value = new Date().toISOString().split('T')[0];
    captionInput.value = '';
    tagsInput.value = '';
    photoPreview.style.display = 'none';
    photoPreview.src = '';
    photoInput.value = '';
    photoFile = null;
    selectedMood = '';
    document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));

    addMemoryModal.classList.remove('hidden');
    captionInput.focus();
}

function closeAddMemory() { addMemoryModal.classList.add('hidden'); }

$('btnAddMemory').addEventListener('click', openAddMemory);
$('closeMemoryModal').addEventListener('click', closeAddMemory);
$('cancelMemory').addEventListener('click', closeAddMemory);
addMemoryModal.addEventListener('click', e => { if (e.target === addMemoryModal) closeAddMemory(); });

// Photo input
photoInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { showToast('⚠️ Image too large. Max 8 MB.'); return; }
    photoFile = file;
    const reader = new FileReader();
    reader.onload = ev => {
        photoPreview.src = ev.target.result;
        photoPreview.style.display = 'block';
    };
    reader.readAsDataURL(file);
});

photoUploadArea.addEventListener('dragover', e => { e.preventDefault(); photoUploadArea.classList.add('dragover'); });
photoUploadArea.addEventListener('dragleave', () => photoUploadArea.classList.remove('dragover'));
photoUploadArea.addEventListener('drop', e => {
    e.preventDefault();
    photoUploadArea.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        photoFile = file;
        const reader = new FileReader();
        reader.onload = ev => { photoPreview.src = ev.target.result; photoPreview.style.display = 'block'; };
        reader.readAsDataURL(file);
    }
});

// Mood picker
moodGrid.addEventListener('click', e => {
    const btn = e.target.closest('.mood-btn');
    if (!btn) return;
    document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedMood = btn.dataset.mood;
    spawnSparkles(e.clientX, e.clientY + window.scrollY);
});

// Save memory — upload photo to Storage, then insert row
$('saveMemory').addEventListener('click', async () => {
    const caption = captionInput.value.trim();
    const authorName = authorSelect.value;
    if (!caption) { showToast('✍️ Write a little something first!'); captionInput.focus(); return; }
    if (!authorName) { showToast('👤 Add a friend first, then pick your name!'); return; }

    // Get selected friend's emoji
    const selectedOption = authorSelect.options[authorSelect.selectedIndex];
    const authorEmoji = selectedOption?.dataset?.emoji || '';

    const tags = tagsInput.value.split(',').map(t => t.trim()).filter(Boolean);

    showLoader('Saving your memory…');

    // 1️⃣ Upload photo if one was chosen
    let photo_url = '';
    if (photoFile) {
        showLoader('Uploading photo…');
        const ext = photoFile.name.split('.').pop();
        const filename = `${Date.now()}_${generateId()}.${ext}`;
        const { data: uploadData, error: uploadErr } = await supabase.storage
            .from('photos')
            .upload(filename, photoFile, { cacheControl: '3600', upsert: false });

        if (uploadErr) {
            hideLoader();
            showToast('⚠️ Photo upload failed. Saving without photo.');
            console.error('Upload error:', uploadErr);
        } else {
            const { data: urlData } = supabase.storage.from('photos').getPublicUrl(filename);
            photo_url = urlData.publicUrl;
        }
    }

    // 2️⃣ Insert memory row
    showLoader('Saving memory…');
    const { data: inserted, error: insertErr } = await supabase.from('memories').insert([{
        author_name: authorName,
        author_emoji: authorEmoji,
        caption,
        photo_url,
        tags,
        mood: selectedMood,
        memory_date: memoryDate.value || null,
        likes: 0,
    }]).select().single();

    hideLoader();

    if (insertErr) {
        console.error('Insert error:', insertErr);
        showToast('⚠️ Could not save memory. Check your Supabase setup.');
        return;
    }

    memories.unshift(inserted);
    closeAddMemory();
    switchView('feed');
    renderFeed();
    showToast('🪺 Memory saved to the nest!');
    spawnSparkles(window.innerWidth / 2, window.innerHeight / 2);
});

// ═══════════════════════════════════════════════════════
//  FRIEND MODAL
// ═══════════════════════════════════════════════════════

function openFriendModal() {
    $('friendNameInput').value = '';
    $('friendEmojiInput').value = '';
    friendModal.classList.remove('hidden');
    $('friendNameInput').focus();
}
function closeFriendModal() { friendModal.classList.add('hidden'); }

$('closeFriendModal').addEventListener('click', closeFriendModal);
$('cancelFriend').addEventListener('click', closeFriendModal);
friendModal.addEventListener('click', e => { if (e.target === friendModal) closeFriendModal(); });

$('saveFriend').addEventListener('click', async () => {
    const name = $('friendNameInput').value.trim();
    const emoji = $('friendEmojiInput').value.trim();
    if (!name) { showToast('✏️ Enter a name first!'); return; }

    showLoader('Adding friend…');
    const { data, error } = await supabase.from('friends').insert([{ name, emoji: emoji || null }]).select().single();
    hideLoader();

    if (error) {
        console.error('saveFriend:', error);
        showToast('⚠️ Could not add friend. Try again.');
        return;
    }

    friends.push(data);
    closeFriendModal();
    renderFriends();
    showToast(`💛 ${name} added to the nest!`);
});

// ═══════════════════════════════════════════════════════
//  "REMEMBER THIS" POPUP
// ═══════════════════════════════════════════════════════

function getRandomMemory() {
    if (memories.length === 0) return null;
    const unseen = memories.filter(m => !shownPopupIds.has(m.id));
    const pool = unseen.length > 0 ? unseen : memories;
    const mem = pool[Math.floor(Math.random() * pool.length)];
    shownPopupIds.add(mem.id);
    if (shownPopupIds.size === memories.length) shownPopupIds.clear();
    return mem;
}

function showRememberPopup() {
    const mem = getRandomMemory();
    if (!mem) return;

    popupPhoto.src = mem.photo_url || makePlaceholder(30, mem.mood || '🌸', '');
    popupAvatar.textContent = mem.author_emoji || getInitials(mem.author_name || '?');
    popupAuthorName.textContent = mem.author_name || 'Someone';
    popupDate.textContent = formatDate(mem.memory_date) || timeAgo(mem.created_at);
    popupCaption.textContent = mem.caption;
    $('popupLike').dataset.id = mem.id;

    rememberPopup.classList.remove('hidden', 'closing');
    void rememberPopup.offsetWidth;
}

function closeRememberPopup() {
    rememberPopup.classList.add('closing');
    setTimeout(() => rememberPopup.classList.add('hidden'), 380);
}

$('closePopup').addEventListener('click', closeRememberPopup);
$('btnRemember').addEventListener('click', e => {
    showRememberPopup();
    const rect = e.currentTarget.getBoundingClientRect();
    spawnSparkles(rect.left + rect.width / 2, rect.top + window.scrollY);
});

$('popupLike').addEventListener('click', async function () {
    const id = this.dataset.id;
    const mem = memories.find(m => m.id === id);
    if (mem) {
        const newLikes = (mem.likes || 0) + 1;
        await supabase.from('memories').update({ likes: newLikes }).eq('id', id);
        mem.likes = newLikes;
        if (currentView === 'feed') renderFeed();
    }
    showToast('❤️ Loved it!');
    spawnSparkles(window.innerWidth - 150, window.innerHeight - 150);
    closeRememberPopup();
});

function schedulePopup() {
    clearTimeout(popupTimer);
    popupTimer = setTimeout(() => {
        if (addMemoryModal.classList.contains('hidden') && friendModal.classList.contains('hidden')) {
            showRememberPopup();
        }
        schedulePopup();
    }, 45000);
}

// ═══════════════════════════════════════════════════════
//  REAL-TIME SUBSCRIPTIONS
// ═══════════════════════════════════════════════════════

function subscribeToChanges() {
    // New memories from other friends appear live
    supabase
        .channel('memories-channel')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'memories' }, payload => {
            const exists = memories.some(m => m.id === payload.new.id);
            if (!exists) {
                memories.unshift(payload.new);
                if (currentView === 'feed') renderFeed();
                if (currentView === 'gallery') renderGallery();
                showToast(`✨ New memory from ${payload.new.author_name}!`);
            }
        })
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'memories' }, payload => {
            memories = memories.filter(m => m.id !== payload.old.id);
            if (currentView === 'feed') renderFeed();
            if (currentView === 'gallery') renderGallery();
        })
        .subscribe();

    supabase
        .channel('friends-channel')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'friends' }, payload => {
            const exists = friends.some(f => f.id === payload.new.id);
            if (!exists) {
                friends.push(payload.new);
                if (currentView === 'friends') renderFriends();
                showToast(`💛 ${payload.new.name} joined the nest!`);
            }
        })
        .subscribe();
}

// ═══════════════════════════════════════════════════════
//  KEYBOARD SHORTCUTS
// ═══════════════════════════════════════════════════════

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        if (!addMemoryModal.classList.contains('hidden')) { closeAddMemory(); return; }
        if (!friendModal.classList.contains('hidden')) { closeFriendModal(); return; }
        if (!rememberPopup.classList.contains('hidden')) { closeRememberPopup(); return; }
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') { e.preventDefault(); openAddMemory(); }
});

// Logo Easter egg
let logoClicks = 0;
$('logoLink').addEventListener('click', e => {
    e.preventDefault();
    logoClicks++;
    spawnSparkles(e.clientX, e.clientY + window.scrollY);
    if (logoClicks >= 5) { logoClicks = 0; showToast('🌟 Distance is just a number 💛'); }
});

// ═══════════════════════════════════════════════════════
//  INIT — load data, then render
// ═══════════════════════════════════════════════════════

async function init() {
    showLoader('Waking up the nest…');
    try {
        await Promise.all([fetchFriends(), fetchMemories()]);
        renderFeed();
        subscribeToChanges();
        schedulePopup();
        setTimeout(() => { if (memories.length > 0) showRememberPopup(); }, 8000);
    } catch (err) {
        console.error('Init error:', err);
        showToast('⚠️ Could not connect to Supabase. Check your config.js keys.');
    } finally {
        hideLoader();
    }
}

init();

console.log('%c🪺 MemoryNest (Supabase) loaded', 'color:#f5a833;font-size:14px;font-weight:bold;');
