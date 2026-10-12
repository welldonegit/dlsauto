// Shared cart store: cookie-persisted items (each part is a single unit).
(function () {
  if (window.DLSCart) return;
  var KEY = 'dls_cart';
  function read() {
    var m = document.cookie.match(new RegExp('(?:^|; )' + KEY + '=([^;]*)'));
    if (!m) return [];
    try { var v = JSON.parse(decodeURIComponent(m[1])); return Array.isArray(v) ? v : []; } catch (e) { return []; }
  }
  function write(list) {
    document.cookie = KEY + '=' + encodeURIComponent(JSON.stringify(list)) + '; path=/; max-age=' + (60 * 60 * 24 * 30) + '; SameSite=Lax';
  }
  var items = read();
  var subs = [];
  function emit(evt) { subs.slice().forEach(function (fn) { try { fn(evt); } catch (e) {} }); }
  window.DLSCart = {
    MIN: 500,
    items: function () { return items.slice(); },
    has: function (id) { return items.some(function (x) { return x.id === id; }); },
    count: function () { return items.length; },
    total: function () { return items.reduce(function (s, x) { return s + (x.price || 0); }, 0); },
    add: function (item, silent) {
      if (this.has(item.id)) return;
      items.push(item); write(items);
      emit({ type: 'add', item: item, silent: !!silent });
    },
    remove: function (id, silent) {
      var item = items.filter(function (x) { return x.id === id; })[0];
      if (!item) return;
      items = items.filter(function (x) { return x.id !== id; }); write(items);
      emit({ type: 'remove', item: item, silent: !!silent });
    },
    open: function () { emit({ type: 'open' }); },
    close: function () { emit({ type: 'close' }); },
    subscribe: function (fn) { subs.push(fn); return function () { subs = subs.filter(function (f) { return f !== fn; }); }; }
  };
})();
