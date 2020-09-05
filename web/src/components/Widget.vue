<template>
  <div v-if="!item.empty" :class="classList">
    <div class="inner">
      <div class="message" v-for="(msg, localIndex) in item.list" :key="localIndex">
        <div :class="{ 'selector-wrapper': true, show: editting }" @click="togglePriv(msg)">
          <div :class="privClassList(localIndex)"></div>
        </div>
        <div class="button-group">
          <div class="push-right">
            <div
              class="button float-button"
              v-if="editting && item.widgetTime"
              @click="add(localIndex)"
            >ADD</div>
            <div
              class="button float-button"
              v-if="editting && item.widgetTime"
              @click="edit(localIndex)"
            >EDIT</div>
            <div
              class="button float-button"
              v-if="editting && item.widgetTime"
              @click="remove(localIndex)"
            >DEL</div>
            <div
              class="button float-button"
              v-if="editting && item.widgetTime && !(index === 0 && localIndex === 0)"
              @click="moveUp(localIndex)"
            >UP</div>
            <div
              class="button float-button"
              v-if="editting && item.widgetTime && !(item.backward && localIndex === item.list.length - 1)"
              @click="moveDown(localIndex)"
            >DOWN</div>
          </div>
        </div>

        <div :class="'content ' + msg.data.style">
          <pre>{{msg.data.text}}</pre>
        </div>
      </div>

      <div class="button-group center" style="margin: 0 10%;">
        <div
          class="button float-button"
          v-if="editting && item.widgetTime"
          @click="add(item.list.length)"
        >ADD</div>
      </div>
    </div>
  </div>
</template>
<script>
import EditPage from "./editPage";
import Vue from "vue";
Vue.use(EditPage);

export default {
  name: "Widget",
  props: {
    item: {
      type: Object,
      required: true,
    },
    index: {
      type: Number,
      required: true,
    },
    editting: {
      type: Boolean,
      required: true,
    },
  },
  data() {
    return {
      showEditPage: false,
    };
  },
  computed: {
    classList() {
      let result = ["widget-container"];
      if (this.editting) result.push("editting");
      return result;
    },

    messageStyleChoices() {
      return [
        ["q", "插话"],
        ["m", "里程碑"],
      ];
    },
  },
  methods: {
    togglePriv(msg) {
      this.$emit("priv-changed", msg);
    },
    privClassList(localMsgIndex) {
      let result = ["selector"];
      result.push(this.item.list[localMsgIndex].public ? "public" : "private");
      return result;
    },

    defaultMessage() {
      return {
        text: "",
        style: "q",
      };
    },
    async add(localMsgIndex) {
      let msg = this.defaultMessage();
      const { action } = await this.$editPage.query(
        msg,
        this.messageStyleChoices
      );
      if (action === "confirm")
        this.$emit("add-msg", this.index, localMsgIndex, msg);
    },
    async edit(localMsgIndex) {
      let msg = { ...this.item.list[localMsgIndex].data };
      const { action } = await this.$editPage.query(
        msg,
        this.messageStyleChoices
      );
      if (action === "confirm")
        this.$emit("edit-msg", localMsgIndex, this.index, msg);
    },
    remove(localMsgIndex) {
      this.$emit("del-msg", this.index, localMsgIndex);
    },
    async moveUp(localMsgIndex) {
      this.$emit("move-up-msg", this.index, localMsgIndex);
      await this.$nextTick();
    },
    moveDown(localMsgIndex) {
      this.$emit("move-down-msg", this.index, localMsgIndex);
    },
  },
};
</script>
<style lang="scss" scoped>
@import "../fonts/custom.scss";

.selector-wrapper {
  position: absolute;
  top: 0;
  left: -12.5%;
  display: none;
  // background-color: red;
  padding: 0px 30px 30px 0;

  &.show {
    display: block;
  }

  .selector {
    // position: absolute;
    // top: 0;
    // left: 0;
    padding: 7px 7px 7px 10px;
    border-top-right-radius: 5px;
    border-bottom-right-radius: 5px;

    transition: color 0.5s, background-color 0.5s, box-shadow 0.5s;

    &.private {
      background-color: #fcf8f3;
      box-shadow: 0px 0px 5px #fcf8f3;

      color: #899bb4;

      &:after {
        content: "PRI";
      }
    }

    &.public {
      background-color: #ffaaa5;
      box-shadow: 0px 0px 5px #ffaaa5;
      color: white;

      &:after {
        content: "PUB";
      }
    }
  }
}

.widget-container {
  position: relative;
  // padding: 0 10%;
  // padding-right: 10%;

  .edit-page {
    position: fixed;
    background-color: red;
  }

  &.editting .button-group {
    border-top: #777 dashed 1px;
  }
  .message {
    position: relative;
    width: 80%;
    margin: 0 auto;
    .content {
      pre {
        margin: 0;
        white-space: pre-wrap;
        word-break: break-all;
        @extend .custom-font;
      }

      &.q {
        padding: 1em 0;

        pre {
          padding: 0 6.25%;
          font-size: 2em !important;
          font-weight: 500 !important;
          line-height: 1.3em;
        }
      }

      &.m {
        padding: 2em 0;
        text-align: center;
        pre {
          position: relative;
          font-size: 3em;
          font-weight: bold;
          display: inline-block;

          &:before,
          &:after {
            content: " ";
            position: absolute;
            left: -0.25em;
            right: -0.25em;
            border-style: solid;
            border-color: black;
            border-width: 1px 0;
            height: 3px;
          }
          &:before {
            top: 0;
          }
          &:after {
            bottom: 0;
          }
        }
      }
    }
  }
  .button-group {
    font-size: 0.75em;
    display: flex;

    &.center {
      justify-content: center;
    }

    .button {
      display: inline-block;
      margin-right: 5px !important;
      display: block;
      z-index: inherit !important;
      // position: absolute;
      // top: 0;
      // margin: 0 auto;
      // display: inline-block;
    }
    .push-right {
      margin-left: auto;

      .button {
        margin: 0 0 0 5px !important;
      }
    }
  }
}
</style>