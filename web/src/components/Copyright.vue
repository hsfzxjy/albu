<template>
  <div :class="classList">
    Powered by
    <a target="_blank" href="https://github.com/hsfzxjy/albu">hsfzxjy/albu</a>.
    <br />
    Copyright &copy; {{ new Date().getFullYear() }} hsfzxjy.
  </div>
</template>

<script>
export default {
  name: "Copyright",
  props: {
    bottom: {
      type: Boolean,
      required: true,
    },
  },
  computed: {
    classList() {
      return {
        footer: true,
        "fix-bottom": this.bottom,
      };
    },
  },
};
</script>

<style lang="scss" scoped>
.footer {
  &.fix-bottom {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
  }

  padding: 10px;
  padding-bottom: 30px;
  text-align: center;

  a {
    color: teal;
    text-decoration: none;
  }
}
</style>