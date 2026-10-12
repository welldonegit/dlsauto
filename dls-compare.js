// Shared "Порівняння" store: ids in cookie (180 days) mirrored to localStorage (cookies can be blocked in embedded previews),
// plus item details in localStorage so the Favorites page can render any saved card.
(function () {
  if (window.DLSCompare) return;
  var KEY = 'dls_cmp', DATA = 'dls_cmp_items';
  function readCookie() {
    var m = document.cookie.match(new RegExp('(?:^|; )' + KEY + '=([^;]*)'));
    if (!m) return null;
    try { var v = JSON.parse(decodeURIComponent(m[1])); return Array.isArray(v) ? v : null; } catch (e) { return null; }
  }
  function readLS(k) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
  function writeLS(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function write(ids) {
    try { document.cookie = KEY + '=' + encodeURIComponent(JSON.stringify(ids)) + '; path=/; max-age=' + (60 * 60 * 24 * 30) + '; SameSite=Lax'; } catch (e) {}
    writeLS(KEY, ids);
  }
  var ids = readCookie() || readLS(KEY) || [];
  if (!Array.isArray(ids)) ids = [];
  var data = readLS(DATA) || {};
  var subs = [];
  function emit(evt) { subs.slice().forEach(function (fn) { try { fn(evt); } catch (e) {} }); }
  function remember(item) {
    if (!item || !item.id) return;
    var keys = Object.keys(item);
    if (keys.length <= 1) return;
    data[item.id] = Object.assign({}, data[item.id] || {}, item);
    writeLS(DATA, data);
  }
  window.addEventListener('storage', function (e) {
    if (e.key === KEY) { ids = readLS(KEY) || []; emit({ type: 'sync', silent: true }); }
    if (e.key === DATA) data = readLS(DATA) || {};
  });
  window.DLSCompare = {
    has: function (id) { return ids.indexOf(id) !== -1; },
    count: function () { return ids.length; },
    ids: function () { return ids.slice(); },
    get: function (id) { return data[id] || null; },
    set: function (item, on, silent) {
      remember(item);
      var i = ids.indexOf(item.id);
      if (on && i === -1) ids.push(item.id);
      else if (!on && i !== -1) ids.splice(i, 1);
      else return;
      write(ids);
      emit({ type: on ? 'add' : 'remove', item: item, silent: !!silent });
    },
    toggle: function (item) { this.set(item, !this.has(item.id)); },
    subscribe: function (fn) { subs.push(fn); return function () { subs = subs.filter(function (f) { return f !== fn; }); }; }
  };
})();
