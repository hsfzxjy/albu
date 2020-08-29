<template>
  <div id="app">
    <Gallery :logined="logined" />
    <Login :logined="logined" @login="onLogin" />
  </div>
</template>

<script>
import Gallery from "@/components/Gallery.vue";
import Login from "@/components/Login.vue";
import gallery from "img-vuer";
import Vue from "vue";

Vue.use(gallery, {
  swipeThreshold: 150, // default 100
  isIndexShow: true, // show image index, default true
  useCloseButton: true, // trigger gallery close with close button, default true
  preload: true, // preload images in the same group, default true
});

export default {
  name: "App",
  components: { Gallery, Login },
  data() {
    return {
      logined: false,
    };
  },
  methods: {
    onLogin() {
      this.logined = true;
    },
    initEvents() {
      // Prevent VIVO / Weixin browser from displaying site infos
      // during swiping down
      document.body.addEventListener(
        "touchmove",
        (evt) => {
          if (!evt._isScroller) {
            evt.preventDefault();
          }
        },
        { passive: false }
      );
    },
  },
  mounted() {
    this.initEvents();
  },
};
</script>

<style lang="scss">
@font-face {
  font-family: aotc;
  src: url(fonts/aotc.ttf) format("truetype");
}

html,
body {
  height: 100%;
  padding: 0;
  margin: 0;
  background-color: #fdfdfd;
  font-family: "Inter", "Helvetica Neue", Helvetica, Arial, sans-serif;
}
#app {
  height: 100%;
  position: relative;

  div.float-button {
    font-size: 0.75em;
    padding: 10px;
    text-align: center;
    border-width: 0 1px 1px 0;
    border-style: solid;
    border-color: #fff;
    background-color: #ddd;
    display: inline-block;
    margin-right: 5px;
    opacity: 0.7;
    z-index: 10000;
  }
}
</style>
