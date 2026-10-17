(function (global) {
  "use strict";
  function noop() { return function () {}; }
  function resolved(v) { return Promise.resolve(v); }

  var api = {
    IN_PLAYABLES_ENV: false,
    SDK_VERSION: "stub-1.0",
    SdkError: function (msg) { this.message = msg; },
    SdkErrorType: {},
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
    engagement: {
      sendScore: function () { return resolved(); },
      openShareMenu: function () { return resolved(); }
    },
    ads: {
      requestAd: function () { return resolved(); },
      requestInterstitial: function () { return resolved(); },
      AdResult: { UNKNOWN: 0, SHOWED: 1, DISMISSED: 2, REJECTED: 3 }
    },
    health: {
      logError: function () {},
      logWarning: function () {}
    }
  };

  global.ytgame = api;
  if (typeof window !== "undefined") window.ytgame = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
