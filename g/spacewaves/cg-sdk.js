(function () {
  function noop() {}
  function pr(v) { return Promise.resolve(v); }

  var authListeners = [];
  var adblockPopupListeners = [];

  window.UnitySDK = window.UnitySDK || {
    logError: function () {},
    lockPointer: noop,
    unlockPointer: noop
  };

  window.CrazyGames = {
    SDK: {
      environment: "local",
      isQaTool: false,
      init: function () {
        return pr({});
      },
      game: {
        gameplayStart: noop,
        gameplayStop: noop,
        happytime: noop,
        loadingStart: noop,
        loadingStop: noop,
        hideInviteButton: noop,
        showInviteButton: noop,
        inviteLink: function () { return pr(""); },
        settings: "{}"
      },
      ad: {
        requestAd: function (type, callbacks) {
          callbacks = callbacks || {};
          try { if (callbacks.adStarted) callbacks.adStarted(); } catch (e) {}
          setTimeout(function () {
            try { if (callbacks.adFinished) callbacks.adFinished(); } catch (e) {}
          }, 0);
          return pr();
        },
        hasAdblock: function () { return pr(false); },
        prefetchAd: function () { return pr(); },
        addAdblockPopupListener: function (cb) {
          if (typeof cb === "function") adblockPopupListeners.push(cb);
        }
      },
      banner: {
        requestBanner: function () { return pr(); },
        requestOverlayBanners: function () { return pr(); },
        clearBanner: noop
      },
      user: {
        getUser: function () { return pr(null); },
        getUserToken: function () { return pr(""); },
        getXsollaUserToken: function () { return pr(""); },
        isUserAccountAvailable: function () { return pr(false); },
        addScore: noop,
        submitScore: noop,
        showAuthPrompt: function () { return pr(); },
        showAccountLinkPrompt: function () { return pr({ linkAccount: false }); },
        addAuthListener: function (cb) {
          if (typeof cb === "function") authListeners.push(cb);
        },
        systemInfo: {}
      },
      data: {
        clear: function () { return pr(); },
        getItem: function () { return pr(null); },
        setItem: function () { return pr(); },
        removeItem: function () { return pr(); },
        syncUnityGameData: function () { return pr(); }
      },
      analytics: {
        trackOrder: noop
      }
    }
  };
})();
