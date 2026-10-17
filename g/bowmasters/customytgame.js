(function () {
  "use strict";
  function noop() { return function () {}; }
  function resolved(v) { return Promise.resolve(v); }
  window.ytgame = {
    IN_PLAYABLES_ENV: false,
    SDK_VERSION: "stub",
    game: {
      gameReady: function () {},
      firstFrameReady: function () {},
      loadData: function () { return resolved(""); },
      saveData: function () { return resolved(); }
    },
    system: {
      isAudioEnabled: function () { return true; },
      onAudioEnabledChange: function () { return noop(); },
      onPause: function () { return noop(); },
      onResume: function () { return noop(); },
      getLanguage: function () { return resolved("en"); }
    },
    engagement: { sendScore: function () { return resolved(); } },
    ads: {
      requestAd: function () { return resolved(); },
      AdResult: { DISMISSED: 0, UNKNOWN: 1 }
    },
    health: { logError: function () {}, logWarning: function () {} }
  };
})();
