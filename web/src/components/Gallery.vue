<template>
  <div class="gallery-container">
    <recycle-list class="image-list" :list="displayList" :size="10" ref="recyclist">
      <template slot="item" scope="props">
        <timestamp v-if="props.data.type === 'timestamp'" :item="props.data" />
        <widget
          v-else-if="props.data.type === 'widget'"
          :item="widgetList[props.data.index]||{ empty: true }"
          :index="props.data.index"
          :editting="editting && logined_"
          @add-msg="addMessage"
          @edit-msg="editMessage"
          @del-msg="deleteMessage"
          @move-up-msg="moveUpMessage"
          @move-down-msg="moveDownMessage"
          @priv-changed="togglePrivMessage"
        />
        <GalleryImage
          v-else
          :meta="props.data"
          :baseSize="baseSize"
          :editting="editting && logined_"
          :logined="loginedState"
          @priv-changed="onPrivChanged"
        />
      </template>
      <template slot="annotation">
        <div
          v-for="item in annotationList"
          :style="item.style"
          :key="item.name"
          :class="item.classList"
        ></div>
      </template>
      <template slot="indicator" scope="props">
        <span v-html="indicatorText(props.item, props.index)"></span>
      </template>
    </recycle-list>
    <div class="button-group" v-if="logined">
      <div class="float-button" @click="editButtonClick">{{editButtonText}}</div>
      <div class="float-button" @click="resetEditting" v-if="editting && !saving">CANCEL</div>
      <div
        class="float-button"
        @click="logined_ = !logined_"
        v-if="editting && !saving"
      >{{ logined_ ? "VIEW PUB" : "VIEW PRI" }}</div>
    </div>
  </div>
</template>

<script>
import moment from "moment";

import GalleryImage from "./GalleryImage.vue";
import RecycleList from "./RecycleList";
import Timestamp from "./Timestamp";
import Widget from "./Widget";
import * as API from "@/api";

export default {
  components: { RecycleList, GalleryImage, Timestamp, Widget },
  name: "Gallery",
  props: {
    logined: {
      type: Boolean,
      required: true,
    },
  },
  data() {
    return {
      metaList: [],
      widgetList: [],
      editting: false,
      saving: false,
      actions: {},
      logined_: true,

      messages: {
        list: [],
        public: null,
        private: null,
        modified: false,
      },
    };
  },
  watch: {
    async loginedState() {
      await this.$nextTick();
      await this.loadMessages();
    },
    async editting() {
      const oldStart = this.$refs.recyclist.start;
      await this.updateRecyclistDom((x) => x.type === "widget");
      await this.$nextTick();
      this.$refs.recyclist.start = oldStart;
      await this.$refs.recyclist.setScrollTop();
    },
  },
  computed: {
    loginedState() {
      return this.logined && this.logined_;
    },
    visibleMetaList() {
      if (this.loginedState) return this.metaList;
      else return this.metaList.filter((x) => x.public);
    },
    displayList() {
      let result = [];
      const metaList = this.visibleMetaList;
      const L = metaList.length;
      let prevTime = null;
      let lastTimeStamp = null;
      for (let i = 0; i < L; i++) {
        const meta = metaList[i];
        const time = meta.time;
        if (!prevTime || time.getFullYear() !== prevTime.getFullYear())
          result.push({
            type: "timestamp",
            time,
            label: "year",
            phantom: true,
          });
        if (
          !prevTime ||
          time.getMonth() !== prevTime.getMonth() ||
          time.getDate() !== prevTime.getDate()
        )
          result.push({
            type: "timestamp",
            time,
            label: "date",
            phantom: true,
          });
        if (!lastTimeStamp || time - lastTimeStamp >= 1000 * 60 * 30) {
          lastTimeStamp = time;
          result.push({
            type: "timestamp",
            time,
            label: "time",
            phantom: true,
          });
        }
        prevTime = time;
        result.push({
          type: "widget",
          phantom: true,
          index: i,
        });
        result.push(meta);
      }
      result.push({
        type: "widget",
        phantom: true,
        index: L,
      });

      return result;
    },
    annotationList() {
      const lst = this.visibleMetaList;
      if (this.widgetList.length !== lst.length + 1) return [];

      let result = [];
      if (!this.editting || !this.logined_)
        result = lst.map((_, index) => {
          let milestone = false;
          if (this.widgetList[index]) {
            milestone = !!this.widgetList[index].list.filter(
              (x) => x.data.style === "m"
            ).length;
          }

          return {
            style: {
              top: `${(index / (lst.length - 1)) * 100}%`,
            },
            classList: {
              annotation: true,
              milestone,
            },
            show: milestone,
            name: `milestone-${index}`,
          };
        });
      else
        result = lst.map((item, index) => {
          const modified = this.actions[item.name] !== undefined;
          const text = !!this.widgetList[index].list.length;
          const show = item.public || modified || text;

          return {
            style: {
              top: `${(index / (lst.length - 1)) * 100}%`,
            },
            classList: {
              annotation: true,
              public: item.public,
              modified,
              text,
            },
            show,
            ...item,
          };
        });

      return result.filter((item) => item.show);
    },
    baseSize() {
      return this.$el.clientWidth;
    },
    editButtonText() {
      if (!this.editting) return "EDIT";
      if (this.saving) return "SAVING";
      const nActions = Object.keys(this.actions).length;
      if (!nActions) return "SAVE";
      else return `SAVE (${nActions})`;
    },
  },
  methods: {
    handleMessageAdd(widgetIndex, localMsgIndex, msgObject) {
      let msgTime;
      const widget = this.widgetList[widgetIndex];

      if (localMsgIndex < 0) {
        localMsgIndex += widget.list.length + 1;
      }

      if (widget.backward) {
        let prevTime;
        if (localMsgIndex === 0 || !widget.list.length) {
          prevTime = widget.widgetTime;
        } else {
          prevTime = widget.list[localMsgIndex - 1].data.time;
        }
        msgTime = prevTime + 1;
        for (let i = localMsgIndex; i < widget.list.length; i++) {
          widget.list[i].data.time++;
        }
      } else {
        let nextTime;
        if (localMsgIndex === widget.list.length || !widget.list.length) {
          nextTime = widget.widgetTime;
        } else {
          nextTime = widget.list[localMsgIndex].data.time;
        }
        msgTime = nextTime - 1;
        for (let i = 0; i < localMsgIndex; i++) {
          widget.list[i].data.time--;
        }
      }
      msgObject.data.time = msgTime;
      widget.list.splice(localMsgIndex, 0, msgObject);
      return msgObject;
    },
    handleMessageDelete(widgetIndex, localMsgIndex) {
      const widget = this.widgetList[widgetIndex];

      if (localMsgIndex < 0) localMsgIndex += widget.list.length;

      if (widget.backward) {
        for (let i = localMsgIndex + 1; i < widget.list.length; i++) {
          widget.list[i].data.time--;
        }
      } else {
        for (let i = 0; i < localMsgIndex; i++) {
          widget.list[i].data.time++;
        }
      }

      return widget.list.splice(localMsgIndex, 1)[0];
    },
    getGlobalMsgIndex(widgetIndex, localMsgIndex) {
      return this.widgetList[widgetIndex].prevMsgIndex + 1 + localMsgIndex;
    },
    log(/*lst*/) {
      // console.log("---", lst);
      // (lst || this.messages.list).map((x) =>
      //   console.log({ s: x.data.text, t: x.data.time, st: x.data.style })
      // );
    },
    togglePrivMessage(msg) {
      msg.public = !msg.public;
      this.messages.modified = true;
    },
    async addMessage(widgetIndex, localMsgIndex, msg) {
      const msgObject = this.handleMessageAdd(widgetIndex, localMsgIndex, {
        data: msg,
        public: false,
      });

      this.messages.list.splice(
        this.getGlobalMsgIndex(widgetIndex, localMsgIndex),
        0,
        msgObject
      );
      for (let i = widgetIndex + 1; i < this.widgetList.length; i++) {
        this.widgetList[i].prevMsgIndex++;
      }
      await this.updateRecyclistDom(
        (x) => x.type === "widget" && x.index === widgetIndex
      );
      this.log();
      this.messages.modified = true;
    },
    async editMessage(localMsgIndex, widgetIndex, newMsg) {
      Object.assign(
        this.widgetList[widgetIndex].list[localMsgIndex].data,
        newMsg
      );
      await this.updateRecyclistDom(
        (x) => x.type === "widget" && x.index === widgetIndex
      );
      this.log();
      this.messages.modified = true;
    },
    async deleteMessage(widgetIndex, localMsgIndex) {
      this.handleMessageDelete(widgetIndex, localMsgIndex);
      this.messages.list.splice(
        this.getGlobalMsgIndex(widgetIndex, localMsgIndex),
        1
      );
      for (let i = widgetIndex + 1; i < this.widgetList.length; i++) {
        this.widgetList[i].prevMsgIndex--;
      }
      await this.updateRecyclistDom(
        (x) => x.type === "widget" && x.index === widgetIndex
      );
      this.log();
      this.messages.modified = true;
    },
    swapLocalMessage(widgetIndex, localMsgIndex, offset) {
      let lst = this.widgetList[widgetIndex].list;
      let ix = localMsgIndex,
        iy = localMsgIndex + offset;
      [lst[ix].data.time, lst[iy].data.time] = [
        lst[iy].data.time,
        lst[ix].data.time,
      ];
      const [itemIx, itemIy] = [lst[ix], lst[iy]];
      this.$set(lst, iy, itemIx);
      this.$set(lst, ix, itemIy);

      this.log(lst);
    },
    swapGlobalMessage(widgetIndex, localMsgIndex, offset) {
      const globalMsgIndex = this.getGlobalMsgIndex(widgetIndex, localMsgIndex);
      let lst = this.messages.list;
      const ix = globalMsgIndex,
        iy = globalMsgIndex + offset;

      const [itemIx, itemIy] = [lst[ix], lst[iy]];
      this.$set(lst, iy, itemIx);
      this.$set(lst, ix, itemIy);
    },
    async moveUpMessage(widgetIndex, localMsgIndex) {
      if (localMsgIndex > 0) {
        this.swapLocalMessage(widgetIndex, localMsgIndex, -1);
        this.swapGlobalMessage(widgetIndex, localMsgIndex, -1);
      } else {
        const msg = this.handleMessageDelete(widgetIndex, localMsgIndex);
        this.handleMessageAdd(widgetIndex - 1, -1, msg);
        this.widgetList[widgetIndex].prevMsgIndex++;
        await this.updateRecyclistDom(
          (x) =>
            x.type === "widget" &&
            (x.index === widgetIndex || x.index === widgetIndex - 1)
        );
        await this.$refs.recyclist.scrollTo(
          (x) => x.type === "widget" && x.index === widgetIndex - 1,
          +1,
          -0.5
        );
      }
      this.log();
      this.messages.modified = true;
    },
    async moveDownMessage(widgetIndex, localMsgIndex) {
      const widget = this.widgetList[widgetIndex];
      if (localMsgIndex < widget.list.length - 1) {
        this.swapGlobalMessage(widgetIndex, localMsgIndex, +1);
        this.swapLocalMessage(widgetIndex, localMsgIndex, +1);
      } else {
        const msg = this.handleMessageDelete(widgetIndex, localMsgIndex);
        this.handleMessageAdd(widgetIndex + 1, 0, msg);
        this.widgetList[widgetIndex + 1].prevMsgIndex--;
        await this.updateRecyclistDom(
          (x) =>
            x.type === "widget" &&
            (x.index === widgetIndex || x.index === widgetIndex + 1)
        );
        await this.$refs.recyclist.scrollTo(
          (x) => x.type === "widget" && x.index === widgetIndex + 1,
          0,
          -0.5
        );
      }
      this.log();
      this.messages.modified = true;
    },
    async updateRecyclistDom(predicate) {
      await this.$nextTick();
      await this.$refs.recyclist.refreshDOM(predicate);
    },
    async initWidgetList() {
      const widgetList = [];
      const metaList = this.visibleMetaList;
      const msgList = this.messages.list;
      const L_msg = msgList.length,
        L_meta = metaList.length;
      let i_msg = 0;
      for (let i_meta = 0; i_meta <= L_meta; i_meta++) {
        const curTime = i_meta < L_meta ? metaList[i_meta].time : Infinity;

        let widgetTime;
        let backward = false;
        if (isFinite(curTime)) {
          widgetTime = curTime;
        } else if (i_meta > 0) {
          widgetTime = metaList[i_meta - 1].time;
          backward = true;
        } else {
          widgetTime = NaN;
        }

        let widget = {
          list: [],
          widgetTime: +widgetTime,
          backward,
          empty: false,
          prevMsgIndex: i_msg - 1,
        };
        while (i_msg < L_msg && msgList[i_msg].data.time <= curTime) {
          if (
            this.loginedState ||
            (!this.loginedState && msgList[i_msg].public)
          )
            widget.list.push(msgList[i_msg]);
          i_msg++;
        }
        widgetList.push(widget);
      }
      this.$set(this, "widgetList", widgetList);
      await this.$nextTick();
      await this.updateRecyclistDom((x) => x.type === "widget");
    },

    indicatorText(item, index) {
      if (!item) return;
      let msg = moment(item.time).format("YYYY年MM月DD日 HH:mm:ss");
      const widget = this.widgetList[index];
      let milestones = [];
      if (widget) {
        milestones = widget.list
          .filter((x) => x.data.style === "m")
          .map((x) => x.data.text);
      }
      if (milestones.length) {
        msg = milestones.join("<br>") + "<br>" + msg;
      }
      return msg;
    },
    onPrivChanged(name, value) {
      if (this.actions[name] === undefined) {
        this.$set(this.actions, name, value);
      } else if (this.actions[name] === !value) {
        this.$delete(this.actions, name);
      }
    },
    resetEditting() {
      this.$set(this, "actions", {});
      this.saving = this.editting = false;
      this.logined_ = true;
    },
    merge(a, b, key) {
      let result = [];
      const La = a.length,
        Lb = b.length;
      let ia = 0,
        ib = 0;
      while (ia < La || ib < Lb) {
        if (ia === La) {
          result.push(b[ib++]);
        } else if (ib === Lb) {
          result.push(a[ia++]);
        } else {
          const ka = key(a[ia]),
            kb = key(b[ib]);
          if (ka < kb) {
            result.push(a[ia++]);
          } else {
            result.push(b[ib++]);
          }
        }
      }
      return result;
    },
    async loadMessages() {
      const _load = async (isPublic) => {
        const key = isPublic ? "public" : "private";

        if (this.messages[key] === null) {
          if (!isPublic && !this.logined) return;

          this.messages[key] = API.getMessages(isPublic);
          const lst = (await this.messages[key]).map((data) => ({
            data,
            public: isPublic,
          }));

          this.$set(
            this.messages,
            "list",
            this.merge(this.messages.list, lst, (x) => x.data.time)
          );
        }
      };

      await Promise.all([_load(true), _load(false)]);
      await this.initWidgetList();
    },
    async editButtonClick() {
      if (this.saving) return;
      if (!this.editting) {
        this.editting = true;
        return;
      } else {
        this.saving = true;
        await API.modifyPriv(
          { ...this.actions },
          this.metaList.filter((x) => x.public).map((x) => x.name)
        );
        if (this.messages.modified) await API.saveMessages(this.messages.list);
        this.messages.modified = false;
        this.$set(this, "actions", {});
        this.saving = this.editting = false;
        this.resetEditting();
      }
    },
    refresh() {
      this.$set("metaList", this.metaList);
    },
  },
  async mounted() {
    this.metaList = (await API.getMetaList()).sort((a, b) => a.time - b.time);
    await this.$nextTick();
    await this.loadMessages();

    const $splash = document.querySelector(".splash");
    if ($splash) $splash.remove();
  },
};
</script>


<style lang="scss" scoped>
.gallery-container {
  height: 100%;

  .image-list {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .image-item {
    border: 1px black solid;
    max-width: 100%;
    // margin-bottom: 20px;
  }

  .button-group {
    position: absolute;
    top: 0;
    left: 0;
    // z-index: 10000;

    > div.float-button {
      position: static !important;
    }
  }

  .annotation {
    position: absolute;
    left: 0%;
    right: 0%;

    height: 2px;
    transform: translateY(-0.5px);

    &:before,
    &:after {
      position: absolute;
      content: " ";
      top: 0%;
      bottom: 0%;
    }

    &:before {
      left: 15%;
      right: 50%;
    }

    &:after {
      left: 50%;
      right: 15%;
    }

    &.milestone:before {
      left: 15%;
      right: 15%;
      border-color: #999;
      border-style: dashed;
      height: 0;
      border-width: 1px 0 0 0;
    }

    &.public:before {
      background-color: #ffaaa5;
    }

    &.modified:after {
      background-color: #8fc0a9;
    }

    &.text:before {
      border-left: black solid 3px;
    }
  }
}
</style>
