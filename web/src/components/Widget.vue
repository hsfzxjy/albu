<template>
  <div v-if="!item.empty" :class="classList">
    <div class="inner">
      <div class="message" v-for="(msg, localIndex) in item.list" :key="localIndex">
        <div :class="{ 'selector-wrapper': true, show: editting }" @click="togglePriv(msg)">
          <div :class="privClassList(localIndex)"></div>
        </div>
        <div class="button-group" v-if="editting && item.widgetTime">
          <div class="push-right">
            <div class="button float-button" @click="add(localIndex)">ADD</div>
            <div class="button float-button" @click="edit(localIndex)">EDIT</div>
            <div class="button float-button" @click="remove(localIndex)">DEL</div>
            <div
              class="button float-button"
              v-if="!(index === 0 && localIndex === 0)"
              @click="moveUp(localIndex)"
            >UP</div>
            <div
              class="button float-button"
              v-if="!(item.backward && localIndex === item.list.length - 1)"
              @click="moveDown(localIndex)"
            >DOWN</div>
          </div>
        </div>

        <div class="button-group center" v-if="selecting">
          <div
            class="button float-button"
            @click="onSelectStart(localIndex)"
            v-if="canStartHere(localIndex, selectStart, selectEnd)"
          >START FROM HERE</div>
          <div
            class="button float-button"
            @click="onSelectEnd(localIndex)"
            v-if="canFinishHere(localIndex, selectStart, selectEnd)"
          >FINISH</div>
          <span class="select-indicator" v-if="selectedTime(localIndex) === selectStart">STARTED FROM HERE</span>
          <span class="select-indicator" v-if="selectedTime(localIndex) === selectEnd">FINISHED AT HERE</span>
        </div>

        <div :class="'content ' + msg.data.style">
          <pre>{{msg.data.text}}</pre>
        </div>
      </div>

      <div class="button-group center" style="margin: 0 10%;" v-if="editting && item.widgetTime">
        <div class="button float-button" @click="add(item.list.length)">ADD</div>
      </div>

      <div class="button-group center" v-if="selecting" style="margin: 0 10%;">
        <div
          class="button float-button"
          @click="onSelectStart(item.list.length)"
          v-if="canStartHere(item.list.length, selectStart, selectEnd)"
        >START FROM HERE</div>
        <div
          class="button float-button"
          @click="onSelectEnd(item.list.length)"
          v-if="canFinishHere(item.list.length, selectStart, selectEnd)"
        >FINISH</div>

        <span class="select-indicator" v-if="selectedTime(item.list.length) === selectStart">STARTED FROM HERE</span>
        <span class="select-indicator" v-if="selectedTime(item.list.length) === selectEnd">FINISHED AT HERE</span>
      </div>
    </div>
  </div>
</template>
<script>
import Dialog from "./dialog";
import Vue from "vue";
Vue.use(Dialog);

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
    selecting: {
      type: Boolean,
      required: true,
    },
    selectStart: {
      type: Number,
      required: true,
    },
    selectEnd: {
      type: Number,
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
      if (this.editting || this.selecting) result.push("editting");
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
    canFinishHere(localId, selectStart, selectEnd) {
      const time = this.selectedTime(localId);
      const firstTime = this.item.list.length
        ? this.item.list[0].data.time
        : +Infinity;

      let condition =
        isFinite(selectStart) &&
        time > selectStart &&
        time !== selectEnd &&
        selectStart < firstTime;
      // console.log(this.index, condition, time);
      return condition;
    },
    canStartHere(localId, selectStart, selectEnd) {
      const time = this.selectedTime(localId);
      return time < selectEnd && time !== selectStart && !this.item.backward;
    },
    selectedTime(localMsgIndex) {
      let time;

      if (this.item.backward) {
        if (!this.item.list.length) {
          time = this.item.widgetTime + 1;
        } else if (localMsgIndex < this.item.list.length) {
          time = this.item.list[localMsgIndex];
        } else {
          time = this.item.list[localMsgIndex - 1] + 1;
        }
      } else {
        if (localMsgIndex < this.item.list.length) {
          time = this.item.list[localMsgIndex].data.time;
        } else {
          time = this.item.widgetTime;
        }
      }

      return time;
    },
    onSelectStart(localMsgIndex) {
      this.$emit("select-start", this.selectedTime(localMsgIndex));
    },
    onSelectEnd(localMsgIndex) {
      this.$emit("select-end", this.selectedTime(localMsgIndex));
    },
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
      let styleChoices = this.messageStyleChoices;
      const { action } = await this.$editPage.query({ msg, styleChoices });
      if (action === "confirm")
        this.$emit("add-msg", this.index, localMsgIndex, msg);
    },
    async edit(localMsgIndex) {
      let msg = { ...this.item.list[localMsgIndex].data };
      let styleChoices = this.messageStyleChoices;

      const { action } = await this.$editPage.query({ msg, styleChoices });
      if (action === "confirm")
        this.$emit("edit-msg", localMsgIndex, this.index, msg);
    },
    remove(localMsgIndex) {
      if (window.confirm("确定要删除吗？")) {
        this.$emit("del-msg", this.index, localMsgIndex);
      }
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

  &.editting .button-group {
    border-top: #777 dashed 1px;
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

    .select-indicator {
      padding: 10px;
      color: rgb(255, 97, 97);
    }
  }
}
</style>