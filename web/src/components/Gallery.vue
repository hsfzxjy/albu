<template>
  <div class="gallery-container">
    <recycle-list class="image-list" :list="displayList" :size="10">
      <template slot="item" scope="props">
        <timestamp v-if="props.data.type === 'timestamp'" :item="props.data" />
        <GalleryImage
          v-else
          :meta="props.data"
          :baseSize="baseSize"
          :editting="editting"
          :logined="logined"
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
        <span>{{indicatorText(props.item)}}</span>
      </template>
    </recycle-list>
    <div class="button-group" v-if="logined">
      <div class="float-button" @click="editButtonClick">{{editButtonText}}</div>
      <div class="float-button" @click="resetEditting" v-if="editting && !saving">CANCEL</div>
    </div>
  </div>
</template>

<script>
import moment from "moment";

import GalleryImage from "./GalleryImage.vue";
import RecycleList from "./RecycleList";
import Timestamp from "./Timestamp";
import * as ImgAPI from "@/api/img";

export default {
  components: { RecycleList, GalleryImage, Timestamp },
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
      editting: false,
      saving: false,
      actions: {},
    };
  },
  watch: {
    async logined() {},
  },
  computed: {
    visibleMetaList() {
      if (this.logined) return this.metaList;
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
        result.push(meta);
      }
      return result;
    },
    annotationList() {
      if (!this.editting) return [];
      const lst = this.visibleMetaList;
      return lst
        .map((item, index) => {
          const modified = this.actions[item.name] !== undefined;
          const show = item.public || modified;
          return {
            style: {
              top: `${(index / (lst.length - 1)) * 100}%`,
            },
            classList: {
              annotation: true,
              public: item.public,
              modified,
            },
            show,
            ...item,
          };
        })
        .filter((item) => item.show);
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
    indicatorText(item) {
      if (!item) return;
      return moment(item.time).format("YYYY年MM月DD日 HH:mm:ss");
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
    },
    async editButtonClick() {
      if (this.saving) return;
      if (!this.editting) {
        this.editting = true;
        return;
      } else {
        this.saving = true;
        await ImgAPI.modifyPriv(
          { ...this.actions },
          this.metaList.filter((x) => x.public).map((x) => x.name)
        );
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
    this.metaList = (await ImgAPI.getMetaList()).sort(
      (a, b) => a.time - b.time
    );
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

    &.public:before {
      background-color: #ffaaa5;
      left: 15%;
      right: 50%;
    }

    &.modified:after {
      background-color: #8fc0a9;
      left: 50%;
      right: 15%;
    }
  }
}
</style>
