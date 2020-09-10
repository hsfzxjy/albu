<template>
  <transition name="fade">
    <div class="select-page" v-show="show">
      <div class="container">
        <span class="range" v-html="rangeText"></span>
        <input v-model="title" ref="textarea" placeholder="标题" />
        <textarea v-model="url" ref="url" readonly class="url"></textarea>

        <div class="button-group">
          <div class="button confirm" @click="copyLink">复制链接</div>
          <div class="button confirm" @click="openInNew">新窗口查看链接</div>
        </div>
        <div class="button-group" style="margin-top:10px">
          <div class="button cancel" @click="reselect">重新选择</div>
          <div class="button cancel" @click="close">结束选取并关闭</div>
        </div>
      </div>
    </div>
  </transition>
</template>
<script>
import moment from "moment";

import { isWechat, updateShareInfo } from "@/api/wx";
import { getShareURL } from "@/api/sharing";

export default {
  name: "SelectPage",
  props: {
    selectStart: {
      type: Number,
      default: 0,
    },
    selectEnd: {
      type: Number,
      default: 0,
    },
  },
  data() {
    return { show: false, title: "" };
  },
  watch: {
    async show(val) {
      if (val) {
        this.title = "";
        await this.$nextTick();
        this.$refs.textarea.focus();
        await updateShareInfo(this.title, this.url);
      }
    },
    async title(val) {
      await this.$nextTick();
      await updateShareInfo(val, this.url);
    },
  },
  computed: {
    rangeText() {
      const formatter = "YYYY年MM月DD日 HH:mm:ss,SSS";
      return [
        isWechat() ? "<b>点击右上角分享</b><br>" : "",
        moment(this.selectStart).format(formatter),
        "<br>",
        "~",
        "<br>",
        moment(this.selectEnd).format(formatter),
      ].join("");
    },
    url() {
      return getShareURL(this.selectStart, this.selectEnd, this.title);
    },
  },
  methods: {
    dismiss() {
      this.show = false;
    },
    openInNew() {
      window.open(this.url, "_blank");
    },
    close() {
      this.dismiss();
      this.$emit("confirm");
    },
    reselect() {
      this.dismiss();
      this.$emit("cancel");
    },
    copyLink() {
      this.$refs.url.select();
      document.execCommand("copy");
      alert("已复制至剪贴板");
    },
  },
};
</script>
<style lang="scss">
.select-page {
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

    .range {
      text-align: center;
      display: block;
      margin-bottom: 10px;
    }

    textarea,
    input {
      box-sizing: border-box;
      font-size: 1.2em;
      padding: 7px 10px;
      resize: none;
      // margin: 0 10%;
      width: 100%;
      max-width: 100%;
      box-shadow: none;
      // box-shadow: 1px 1px 2px 1px black;
      outline: none;
      transition: box-shadow 0.25s, border-color 0.25s;
      border-color: #777;
      border-width: 1px;
      border-style: solid;
      border-radius: 6px;
      margin-bottom: 1em;

      &:focus {
        border-color: #66afe9;
        box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.075),
          0 0 8px rgba(102, 175, 233, 0.6);
      }

      &.url {
        height: 100px;
      }
    }

    .radio-button {
      width: 50%;
      display: inline-block;
      margin-top: 10px;
    }

    .button-group {
      // padding-top: 20px;
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;

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

        a {
          text-decoration: none;
          color: inherit;
        }
      }
    }
  }
}
</style>