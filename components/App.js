import background from './Background.js';
import lineChart from './LineChart.js';

const app = {
  name: 'App',
  components: {
    Background: background,
    Linechart: lineChart,
  },

  setup(props, context) {
    const data = Vue.reactive({
      tokens: {},
      rws: {},
      settings: {},
    });


    const getToken = (tokenName, decimalPlaces) => _GetToken(data.rws, data.tokens, tokenName, decimalPlaces);
    //either request all tokens upfront by filling their names in array
    //or request them later using helper getToken method above
    data.rws = watchTokens(['mapStrains'], (values) => {
      Object.assign(data.tokens, values);
    });

    const getWebOverlaySettings = () =>
      fetch(`${window.overlay.config.getUrl()}/settings`)
        .then((response) => response.json())
        .then((responseData) => JSON.parse(responseData.WebOverlay_Config));

    getWebOverlaySettings().then((config) => {
      Object.assign(data.settings, config);
    });
    let mapStrains = Vue.computed(() => Object.entries(data.tokens.mapStrains || {}));
    let isMania = Vue.computed(() => getToken('gameMode') === 'OsuMania');
    let hasMods = Vue.computed(() => getToken('mods') !== 'None');
    let isPlaying = Vue.computed(() => getToken('username') !== '');
    let isPlayingOrWatching = Vue.computed(() =>
      _IsInStatus(data.rws, data.tokens, [window.overlay.osuStatus.Playing, window.overlay.osuStatus.ResultsScreen, window.overlay.osuStatus.Watching])
    );


    let starsNoMod = Vue.computed(() => getToken('starsNomod',2));
    let starsWithMods = Vue.computed(() => getToken('mStars',2));

    let diffIconColor = Vue.computed(() => getDiffIconColor(getToken('starsNomod',2)));
    let diffNameColor = Vue.computed(() => getDiffNameColor(getToken('starsNomod',2)));


    // Color spectrum from here: https://github.com/ppy/osu-web/issues/7955
    const getDiffIconColor = (starsNoMod) => {``
      if (starsNoMod < 1.5) {
        return  "rgb(69, 159, 248)";
      } else if (starsNoMod < 1.75) {
        return  "rgb(76, 237, 225)";
      } else if (starsNoMod < 2.25) {
        return  "rgb(94, 253, 167)";
      } else if (starsNoMod < 2.75) {
        return  "rgb(156, 249, 103)";
      } else if (starsNoMod < 3.25) {
        return "rgb(188, 245, 105)";
      } else if (starsNoMod < 3.5) {
        return  "rgb(248, 211, 106)";
      } else if (starsNoMod < 3.75) {
        return  "rgb(250, 189, 105)";
      } else if (starsNoMod < 4.25) {
        return  "rgb(253, 156, 105)";
      } else if (starsNoMod < 4.5) {
        return  "rgb(255,119, 106)";
      }  else if (starsNoMod < 4.75) {
        return  "rgb(255, 93, 108)";
      } else if (starsNoMod < 5.25) {
        return  "rgb(245, 79, 124)";
      } else if (starsNoMod < 5.75) {
        return  "rgb(228, 77, 145)";
      } else if (starsNoMod < 6) {
        return  "rgb(205, 75, 173)";
      } else if (starsNoMod < 6.4) {
        return  "rgb(160, 85, 195)";
      } else if (starsNoMod < 6.5) {
        return  "rgb(134, 93, 204)";
      } else if (starsNoMod < 6.6) {
        return  "rgb(121,97,209)";
      } else if (starsNoMod < 6.75) {
        return "rgb(108, 101, 214)";
      } else if (starsNoMod < 7.25) {
        return "rgb(67,69,182)";
      } else if (starsNoMod < 7.75) {
        return "rgb(52,53,156)";
      } else if (starsNoMod < 8.25) {
        return "rgb(16,17,29)";
      } else if (starsNoMod < 8.75) {
        return "rgb(8,8,44)";
      } else { 
        return "rgb(0,0,0)";;
      }
    };

    const getDiffNameColor = (starsNoMod) => {
      return starsNoMod < 6.4 ? "rgb(10,10,17)" : "rgb(237,211,101)";
    };

    let missCount = Vue.computed(() => getToken('miss'));
    let sliderBreakCount = Vue.computed(() => getToken('sliderBreaks'));

    let ppValue = Vue.computed(() => {
      if (isPlayingOrWatching.value) return getToken('ppIfMapEndsNow', 1);
      if (data.settings.SimulatePPWhenListening) return getToken('simulatedPp', 1);
      return 0;
    });
    let mapProgress = Vue.computed(() => getToken('time') / (getToken('totaltime') / 1000));

    return {
      getToken,
      isPlaying,
      data,
      hasMods,
      isPlayingOrWatching,
      isMania,
      mapStrains,
      starsNoMod,
      starsWithMods,
      diffIconColor,
      diffNameColor,
      missCount,
      sliderBreakCount,
      ppValue,
      mapProgress
    };
  },
  computed: {
    overlaySettings() {
      if (Object.keys(this.data.settings).length === 0) return {};
      let s = this.data.settings;

      return {
        backgroundColor: s.ChartColor,
        chartProgressColor: s.ChartProgressColor,
        imageDimColor: s.ImageDimColor,
        artistTextColor: s.ArtistTextColor,
        titleTextColor: s.TitleTextColor,
        ppBackgroundColor: s.PpBackgroundColor,
        hit100BackgroundColor: s.Hit100BackgroundColor,
        hit50BackgroundColor: s.Hit50BackgroundColor,
        hitMissBackgroundColor: s.HitMissBackgroundColor,
        yAxesFontColor: s.HideChartLegend ? 'transparent' : 'white',

        simulatePPWhenListening: s.SimulatePPWhenListening,
        hideDiffText: s.HideDiffText,
        hideMapStats: s.HideMapStats,
        hideChartLegend: s.HideChartLegend,

        chartHeight: s.ChartHeight,
      };
    },
    progressChartSettings() {
      return {
        backgroundColor: this.overlaySettings.chartProgressColor,
        yAxesFontColor: 'transparent',
      };
    },
    chartStyle() {
      if (Object.keys(this.overlaySettings).length === 0) return `height:200px`;
      return `height:${this.overlaySettings.chartHeight}px;`;
    },
    progressChartStyle() {
      return `clip-path: inset(0px ${100 - this.mapProgress * 100}% 0px 0px);`;
    },
    hitsStyle() {
      if (!this.overlaySettings.ppBackgroundColor) return ``;

      let { ppBackgroundColor: pp, hit100BackgroundColor: h100, hit50BackgroundColor: h50, hitMissBackgroundColor: hMiss } = this.overlaySettings;
      return `background: linear-gradient(to right, ${pp},${pp},${h100},${h100},${h50},${h50},${hMiss},${hMiss});`;
    }
  },
};
export default app;
