<template>
  <transition name="fade">
    <div class="edit-page" v-show="show">
      <div class="container">
        <textarea v-model="msg.text" ref="textarea"></textarea>
        <div class="radio-button" v-for="choice in styleChoices" :key="choice[0]">
          <input type="radio" :id="`radio-${choice[0]}`" v-model="msg.style" :value="choice[0]" />
          <label :for="`radio-${choice[0]}`">{{ choice[1] }}</label>
        </div>
        <div class="button-group">
          <div class="button cancel" @click="cancel">取消</div>
          <div class="button confirm" @click="confirm" :disabled="!msg.text">确定</div>
        </div>
      </div>
    </div>
  </transition>
</template>
<script>
export default {
  name: "EditPage",
  props: {
    msg: {
      type: Object,
      default: () => ({
        text: "Text for message",
        style: "m",
      }),
    },
    styleChoices: {
      type: Array,
      default: () => [
        ["q", "插话"],
        ["m", "里程碑"],
      ],
    },
  },
  data() {
    return { show: false };
  },
  watch: {
    async show(val) {
      if (val) {
        await this.$nextTick();
        this.$refs.textarea.focus();
      }
    },
  },
  methods: {
    dismiss() {
      this.show = false;
    },
    cancel() {
      this.dismiss();
      this.$emit("cancel");
    },
    confirm() {
      if (!this.msg.text) return;
      this.dismiss();
      this.$emit("confirm");
    },
  },
};
</script>
<style lang="scss">
.edit-page {
  &.fade-enter-active,
  &.fade-leave-active {
    transition: opacity 0.5s;
  }
  &.fade-enter,
  &.fade-leave-to {
    opacity: 0;
  }

  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: inherit;
  opacity: 0.9;

  display: flex;
  flex-direction: column;
  justify-content: center;

  .container {
    padding: 0 10%;
    textarea {
      box-sizing: border-box;
      font-size: 1.2em;
      padding: 7px 10px;
      resize: none;
      // margin: 0 10%;
      width: 100%;
      height: 200px;
      max-width: 100%;
      box-shadow: none;
      // box-shadow: 1px 1px 2px 1px black;
      outline: none;
      transition: box-shadow 0.25s, border-color 0.25s;
      border-color: #777;
      border-radius: 6px;

      &:focus {
        border-color: #66afe9;
        box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.075),
          0 0 8px rgba(102, 175, 233, 0.6);
      }
    }

    .radio-button {
      width: 50%;
      display: inline-block;
      margin-top: 10px;
    }

    .button-group {
      padding-top: 20px;
      display: flex;
      justify-content: space-between;

      .button {
        border-width: 2px;
        border-style: solid;
        color: #333;
        padding: 5px 10px;

        &.confirm {
          color: #333;
          border-color: #333;
          box-shadow: inset 0 1px 1px rgba(48, 48, 48, 0.075);
        }

        &.cancel,
        &.confirm[disabled] {
          color: #888;
          border-color: #888;
          box-shadow: inset 0 1px 1px rgba(128, 128, 128, 0.075);
        }
      }
    }
  }
}
</style>