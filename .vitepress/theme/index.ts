// https://vitepress.dev/guide/custom-theme
import { h } from "vue";
import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import "./style.css";
import KatexMath from "./components/KatexMath.vue";
import SelfCheckList from "./components/SelfCheckList.vue";
import PlyrVideo from "./components/PlyrVideo.vue";
import PlaylistSidebar from "./components/PlaylistSidebar.vue";
import CoursePlayer from "./components/CoursePlayer.vue";

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {});
  },
  enhanceApp({ app, router, siteData }) {
    app.component("KatexMath", KatexMath);
    app.component("SelfCheckList", SelfCheckList);
    app.component("PlyrVideo", PlyrVideo);
    app.component("PlaylistSidebar", PlaylistSidebar);
    app.component("CoursePlayer", CoursePlayer);
  },
} satisfies Theme;
