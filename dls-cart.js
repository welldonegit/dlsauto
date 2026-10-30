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

// Warehouses (pickup points) + which point holds each part. Add a point here — every view picks it up.
(function () {
  window.DLS_WAREHOUSES = window.DLS_WAREHOUSES || {
    dnipro: { city: 'Дніпро', loc: 'Дніпрі', address: '[адреса пункту]', hours: 'Пн–Сб 9–18' },
    zp: { city: 'Запоріжжя', loc: 'Запоріжжі', address: '[адреса пункту]', hours: 'Пн–Сб 9–18' }
  };
  window.DLS_ITEM_WH = window.DLS_ITEM_WH || { 'UR56-51-040': 'zp', 'MN184022': 'dnipro', 'UR58-50-031': 'zp' };
  window.DLSWhOf = window.DLSWhOf || function (id, explicit) {
    var W = window.DLS_WAREHOUSES, keys = Object.keys(W);
    var k = explicit || window.DLS_ITEM_WH[id];
    if (!k || !W[k]) { var h = 0, s = String(id || ''); for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; k = keys[h % keys.length]; }
    return k;
  };
  window.DLSWhCity = window.DLSWhCity || function (id, explicit) { return window.DLS_WAREHOUSES[window.DLSWhOf(id, explicit)].city; };
})();
