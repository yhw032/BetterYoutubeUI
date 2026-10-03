const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../content-script.js'), 'utf8');

// Minimal DOM, asynchronous storage and deterministic clock. The real content
// script runs unchanged; scenarios drive its registered browser event handlers.
function setup({ width = 1200, saved = false, enabled = true, route = '/watch?v=test', missingWatch = false, storageDelay = 0 } = {}) {
    const events = {}, windowEvents = {}, storageListeners = [], timers = new Map(), observers = [];
    let now = 0, nextId = 0, watchAvailable = !missingWatch;
    class Element {
        constructor(id = '', tagName = 'DIV') {
            this.id = id; this.tagName = tagName; this.children = []; this.parentNode = null;
            this.attrs = {}; this.scrollTop = 0; this.events = {};
            const classes = new Set();
            this.classList = { add: x => classes.add(x), remove: x => classes.delete(x), contains: x => classes.has(x), toggle: (x, on) => on ? classes.add(x) : classes.delete(x) };
        }
        get isConnected() { return this === body || !!this.parentNode?.isConnected; }
        appendChild(el) { el.remove(); this.children.push(el); el.parentNode = this; return el; }
        prepend(el) { el.remove(); this.children.unshift(el); el.parentNode = this; }
        remove() { if (this.parentNode) this.parentNode.children = this.parentNode.children.filter(x => x !== this); this.parentNode = null; }
        contains(el) { return this.children.some(x => x === el || x.contains(el)); }
        addEventListener(name, fn) { this.events[name] = fn; }
        removeEventListener(name) { delete this.events[name]; }
        setAttribute(name, value) { this.attrs[name] = value; }
        setAttributeNS(ns, name, value) { this.setAttribute(name, value); }
        hasAttribute(name) { return name in this.attrs; }
        querySelector(selector) { return find(this, el => selector[0] === '#' ? el.id === selector.slice(1) : selector[0] === '.' ? el.classList.contains(selector.slice(1)) : el.tagName.toLowerCase() === selector); }
    }
    function find(root, predicate) { for (const child of root.children) { if (predicate(child)) return child; const found = find(child, predicate); if (found) return found; } return null; }
    const body = new Element('body', 'BODY'), watch = new Element('', 'YTD-WATCH-FLEXY');
    const below = new Element('below'), secondary = new Element('secondary-inner'), comments = new Element('comments'), related = new Element('related'), player = new Element('movie_player'), video = new Element('video'), controls = new Element('controls');
    video.classList.add('html5-main-video'); controls.classList.add('ytp-right-controls-left');
    body.appendChild(watch); for (const el of [below, secondary, player]) watch.appendChild(el);
    below.appendChild(comments); secondary.appendChild(related); player.appendChild(video); player.appendChild(controls);
    const document = { body, activeElement: body, getElementById: id => find(body, el => el.id === id), querySelector: selector => selector === 'ytd-watch-flexy' && !watchAvailable ? null : body.querySelector(selector), createElement: tag => new Element('', tag.toUpperCase()), createElementNS: (ns, tag) => new Element('', tag.toUpperCase()), addEventListener: (name, fn) => (events[name] ??= []).push(fn) };
    const window = { location: { href: 'https://www.youtube.com' + route }, innerWidth: width, addEventListener: (name, fn) => (windowEvents[name] ??= []).push(fn) };
    function schedule(fn, delay, interval = false) { const id = ++nextId; timers.set(id, { fn, at: now + delay, delay, interval }); return id; }
    const values = { isFullscreenCommentsEnabled: enabled, isGridEnabled: true, commentWindowState: saved };
    const writes = [];
    const chrome = { i18n: { getMessage: () => '' }, storage: { sync: { get: (keys, cb) => { const snapshot = Object.fromEntries(keys.map(k => [k, values[k]])); schedule(() => cb(snapshot), storageDelay); }, set: value => { writes.push(value); Object.assign(values, value); } }, onChanged: { addListener: fn => storageListeners.push(fn) } }, runtime: { onMessage: { addListener: () => {} } } };
    const context = vm.createContext({ document, window, chrome, console, URL, setTimeout: (fn, delay) => schedule(fn, delay), clearTimeout: id => timers.delete(id), setInterval: (fn, delay) => schedule(fn, delay, true), clearInterval: id => timers.delete(id), MutationObserver: class { constructor(fn) { this.fn = fn; this.target = null; observers.push(this); } observe(target) { this.target = target; } disconnect() { this.target = null; } } });
    vm.runInContext(source, context);
    function tick(ms) {
        const end = now + ms; let count = 0;
        while (true) {
            const next = [...timers].filter(([, t]) => t.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
            if (!next) break;
            if (++count > 10000) throw new Error('Timer loop');
            const [id, timer] = next; now = timer.at;
            if (timer.interval) timer.at += timer.delay; else timers.delete(id);
            timer.fn();
        }
        now = end;
    }
    const fire = name => (events[name] || []).forEach(fn => fn());
    const change = (changes, namespace = 'sync') => storageListeners.forEach(fn => fn(changes, namespace));
    const fullscreen = on => { if (on) watch.attrs.fullscreen = ''; else delete watch.attrs.fullscreen; for (const observer of observers) if (observer.target === watch) observer.fn([{ attributeName: 'fullscreen', target: watch }]); };
    const key = (extra = {}) => (events.keydown || []).forEach(fn => fn({ key: 'b', preventDefault() {}, ...extra }));
    return { tick, fire, change, fullscreen, key, body, watch, comments, player, below, secondary, video, controls, values, writes, timers, document, window,
        available: value => { watchAvailable = value; },
        open: () => comments.classList.contains('byui-fullscreen-comment'),
        button: () => document.getElementById('byui-comment-button'),
        resize: width => { window.innerWidth = width; (windowEvents.resize || []).forEach(fn => fn()); }
    };
}

test('pending restore cannot reopen comments after fullscreen exit', () => {
    const h = setup({ saved: true }); h.tick(0); h.fullscreen(true); h.tick(0); h.fullscreen(false); h.tick(300);
    assert.equal(h.open(), false); assert.equal(h.comments.parentNode, h.secondary); assert.equal(h.button(), null);
});
test('late storage callback cannot restore after exit', () => {
    const h = setup({ saved: true, storageDelay: 100 }); h.tick(100); h.fullscreen(true); h.fullscreen(false); h.tick(500);
    assert.equal(h.open(), false);
});
test('manual open cancels scheduled restore without toggling closed', () => {
    const h = setup({ saved: true }); h.tick(0); h.fullscreen(true); h.tick(0); h.key(); h.tick(500);
    assert.equal(h.open(), true); assert.equal(h.values.commentWindowState, true);
});
test('manual close invalidates storage callback from the same entry', () => {
    const h = setup({ saved: true, storageDelay: 100 }); h.tick(100); h.fullscreen(true); h.key(); h.key(); h.tick(500);
    assert.equal(h.open(), false); assert.equal(h.values.commentWindowState, false);
});
test('disabling feature closes UI and cancels restoration', () => {
    const h = setup({ saved: true }); h.tick(0); h.fullscreen(true); h.tick(0); h.key();
    h.change({ isFullscreenCommentsEnabled: { newValue: false } }); h.key(); h.tick(500);
    assert.equal(h.open(), false); assert.equal(h.button(), null); assert.equal(h.comments.parentNode, h.secondary);
    assert.equal(h.video.classList.contains('byui-align-video-left'), false);
    assert.equal(h.body.classList.contains('byui-no-scroll'), false);
});
test('disabling feature before restore fires prevents automatic open', () => {
    const h = setup({ saved: true }); h.tick(0); h.fullscreen(true); h.tick(0);
    h.change({ isFullscreenCommentsEnabled: { newValue: false } }); h.tick(500); assert.equal(h.open(), false);
});
test('enabling feature while already fullscreen adds button and restores', () => {
    const h = setup({ enabled: false, saved: true }); h.tick(0); h.fullscreen(true); assert.equal(h.button(), null);
    h.change({ isFullscreenCommentsEnabled: { newValue: true } }); h.tick(300);
    assert.ok(h.button()); assert.equal(h.open(), true);
});
test('manual close and fullscreen exit respect narrow layout and scroll position', () => {
    const h = setup({ width: 800 }); h.tick(0); h.comments.scrollTop = 123; h.fullscreen(true); h.key(); h.key();
    assert.equal(h.comments.parentNode, h.below); assert.equal(h.comments.scrollTop, 123);
    h.key(); h.fullscreen(false); assert.equal(h.comments.parentNode, h.below);
});
test('resize does not move open fullscreen comments out of player', () => {
    const h = setup(); h.tick(0); h.fullscreen(true); h.key(); h.resize(800); h.tick(200);
    assert.equal(h.comments.parentNode, h.player); h.fullscreen(false); assert.equal(h.comments.parentNode, h.below);
});
test('navigation restores DOM, cancels pending work and preserves preference', () => {
    const h = setup({ saved: true }); h.tick(0); h.fullscreen(true); h.tick(0); h.key(); h.resize(1100); h.fire('yt-navigate-start'); h.tick(1000);
    assert.equal(h.open(), false); assert.equal(h.comments.parentNode, h.secondary); assert.equal(h.button(), null);
    assert.equal(h.values.commentWindowState, true); assert.equal(h.timers.size, 0);
});
test('pending storage callback from previous navigation is ignored', () => {
    const h = setup({ saved: true, storageDelay: 100 }); h.tick(100); h.fullscreen(true); h.fire('yt-navigate-start'); h.tick(500);
    assert.equal(h.open(), false);
});
test('home/search/shorts pages do not create observer retry loops', () => {
    for (const route of ['/', '/results?search_query=test', '/shorts/test']) {
        const h = setup({ route, missingWatch: true }); h.tick(11000); h.fire('yt-navigate-start'); h.fire('yt-navigate-finish'); h.tick(11000);
        assert.equal(h.timers.size, 0);
    }
});
test('missing watch DOM retries are bounded and stopped on navigation', () => {
    const h = setup({ missingWatch: true }); h.tick(11000); assert.equal(h.timers.size, 0);
    h.fire('yt-navigate-finish'); h.tick(0); h.fire('yt-navigate-start'); assert.equal(h.timers.size, 0);
});
test('late watch DOM receives layout and fullscreen observation', () => {
    const h = setup({ missingWatch: true }); h.tick(0); h.available(true); h.tick(500);
    assert.equal(h.comments.parentNode, h.secondary); h.fullscreen(true); assert.ok(h.button());
});
test('grid changes apply to every existing content script and ignore other namespaces', () => {
    const tabs = [setup(), setup()];
    for (const h of tabs) { h.tick(0); h.change({ isGridEnabled: { newValue: false } }); assert.equal(h.body.classList.contains('byui-related-view'), false); h.change({ isGridEnabled: { newValue: true } }, 'local'); assert.equal(h.body.classList.contains('byui-related-view'), false); }
});
test('initial settings read cannot overwrite newer storage changes', () => {
    const h = setup({ storageDelay: 100 }); h.fullscreen(true); h.change({ isFullscreenCommentsEnabled: { newValue: false }, isGridEnabled: { newValue: false } }); h.tick(500);
    assert.equal(h.button(), null); assert.equal(h.body.classList.contains('byui-related-view'), false);
});
test('initialization never clears an open comment preference after 500ms', () => {
    const h = setup(); h.tick(0); h.fullscreen(true); h.key(); h.tick(500);
    assert.equal(h.open(), true); assert.equal(h.values.commentWindowState, true);
});
test('saved open state survives exit and is restored on reentry', () => {
    const h = setup(); h.tick(0); h.fullscreen(true); h.key(); h.fullscreen(false); h.fullscreen(true); h.tick(300);
    assert.equal(h.open(), true); assert.equal(h.values.commentWindowState, true);
});
test('cleanup removes classes and wheel listener even if destination disappears', () => {
    const h = setup(); h.tick(0); h.fullscreen(true); h.key(); h.secondary.remove(); h.below.remove(); h.fullscreen(false);
    assert.equal(h.open(), false); assert.equal(h.comments.events.wheel, undefined); assert.equal(h.body.classList.contains('byui-no-scroll'), false);
});
test('repeated and modified shortcut keys do not toggle or write storage', () => {
    const h = setup(); h.tick(0); h.fullscreen(true);
    for (const extra of [{ repeat: true }, { ctrlKey: true }, { altKey: true }, { metaKey: true }, { isComposing: true }]) h.key(extra);
    assert.equal(h.open(), false); assert.equal(h.writes.length, 0);
});
test('button opens and closes comments using current DOM', () => {
    const h = setup(); h.tick(0); h.fullscreen(true); h.button().events.click(); assert.equal(h.open(), true); h.button().events.click(); assert.equal(h.open(), false);
});

test('initial storage result reconciles an already fullscreen page', () => {
    const h = setup({ saved: true, storageDelay: 100 }); h.fullscreen(true); h.tick(500);
    assert.ok(h.button()); assert.equal(h.open(), true);
});
test('fullscreen watch-to-watch navigation restores the preference without duplicate buttons', () => {
    const h = setup({ saved: true }); h.tick(0); h.fullscreen(true); h.tick(300); h.fire('yt-navigate-start');
    h.window.location.href = 'https://www.youtube.com/watch?v=next'; h.fire('yt-navigate-finish'); h.tick(300);
    assert.equal(h.open(), true); assert.equal(h.controls.children.length, 1);
});
test('older player control container can host the comment button', () => {
    const h = setup(); h.controls.classList.remove('ytp-right-controls-left'); h.controls.classList.add('ytp-right-controls');
    h.tick(0); h.fullscreen(true); assert.ok(h.button());
});
