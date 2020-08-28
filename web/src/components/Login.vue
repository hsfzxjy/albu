<template>
  <div :class="classList">
    <Unlocker @matched="onMatched" v-if="show" />
    <div class="close-button" @click="toggle()">&times;</div>
    <div
      :class="['login-button', 'float-button', this.show || this.logined ? 'hide' : 'show']"
      @click="toggle()"
    >LOGIN</div>
  </div>
</template>

<script>
import Unlocker from "@/components/Unlocker.vue";
export default {
  name: "Login",
  components: { Unlocker },
  props: {
    logined: {
      type: Boolean,
      required: true,
    },
  },
  data() {
    return {
      show: false,
    };
  },
  computed: {
    classList() {
      return ["login", this.show && !this.logined ? "show" : "hide"];
    },
  },
  methods: {
    toggle() {
      this.show = !this.show;
    },
    onMatched(data) {
      this.$emit("login", data);
    },
  },
};
</script>

<style lang="scss" scoped>
.login {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #ffffff;
  opacity: 0.8;

  &.hide {
    top: -100%;
  }

  &.show,
  &.hide {
    transition: top 0.5s;
  }

  .login-button.float-button {
    position: fixed;
    top: 0;
    left: 0;

    opacity: 0.7 !important;
    transition: opacity 0.5s 0.5s;

    &.hide {
      opacity: 0 !important;
      visibility: hidden;
    }
  }

  .close-button {
    position: absolute;
    top: 0%;
    left: 0;
    display: inline;
    text-align: center;
    font-size: 2em;
    padding: 0.2em 0.5em;
  }
  &.hide .close-button {
    display: none;
  }
}
</style>