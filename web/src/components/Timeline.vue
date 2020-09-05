<template>
  <div class="timeline" ref="scroller">
    <div class="start">{{startText}}</div>
    <div class="scroll-area" ref="scrollArea">
      <slot name="annotation"></slot>
      <div class="axis"></div>
      <div class="thumb" :style="thumbStyle">
        <div class="indicator" v-if="touching">
          <slot name="indicator" :item="currentItem" :index="thumbIndex"></slot>
        </div>
      </div>
    </div>
    <div class="end">{{endText}}</div>
  </div>
</template>

<script>
export default {
  name: "Timeline",
  props: {
    index: {
      type: Number,
      required: true,
    },
    list: {
      type: Array,
      required: true,
    },
    startText: {
      type: String,
      default: "START",
    },
    endText: {
      type: String,
      default: "NOW",
    },
  },
  data() {
    return {
      thumbFraction: 0,
      thumbIndex: 0,
      touching: false,
      lastTouch: null,

      indexMapping: {
        d2l: [],
        d2i: [],
        l2d: [],
      },
    };
  },
  watch: {
    index(val) {
      if (val === this.thumbIndex || this.touching) return;
      val = this.indexMapping.l2d[val];
      const L = this.indexMapping.d2l.length - 1;
      val = Math.max(0, Math.min(L, val));
      this.thumbFraction = val / L;
      this.thumbIndex = val;
    },
    list() {
      this.updateIndexMapping();
    },
  },

  computed: {
    thumbStyle() {
      return {
        top: `${this.thumbFraction * 100}%`,
      };
    },
    currentItem() {
      return this.list[this.indexMapping.d2i[this.thumbIndex]];
    },
  },
  mounted() {
    this.updateIndexMapping();
    this.initEvents();
  },
  methods: {
    updateIndexMapping() {
      let d2l = [];
      let l2d = [];
      let d2i = [];
      let prevNotPhantom = -1;
      for (let i = 0; i < this.list.length; i++) {
        l2d.push(d2l.length);
        if (!this.list[i].phantom) {
          d2l.push(prevNotPhantom + 1);
          d2i.push(i);
          prevNotPhantom = i;
        }
      }
      this.indexMapping = { d2l, l2d, d2i };
    },
    thumbFractionToIndex(val) {
      const L = this.indexMapping.d2l.length;
      const margin = 1 / (L - 1);
      let index = Math.floor(val * (L - 1));
      if (val - index * margin > margin / 2) index++;
      index = Math.min(index, L - 1);
      val = index / (L - 1);
      return { index, fraction: val };
    },
    touchEventToThumbFraction(event) {
      if (event.type === "touchmove") {
        this.lastTouch = event.touches[0];
      }
      const currentY = this.lastTouch.pageY;
      const bRect = this.$refs.scrollArea.getBoundingClientRect();
      let val = (currentY - bRect.top) / bRect.height;
      val = Math.min(1, Math.max(0, val));
      return val;
    },
    handleTouchEvent(event) {
      let { index, fraction } = this.thumbFractionToIndex(
        this.touchEventToThumbFraction(event)
      );
      this.thumbFraction = fraction;
      this.thumbIndex = index;
    },
    initEvents() {
      this.$el.addEventListener("touchstart", (event) => {
        event.preventDefault();
        this.touching = true;
      });
      this.$el.addEventListener("touchmove", (event) => {
        event.preventDefault();
        if (!this.touching) return;
        this.handleTouchEvent(event);
      });
      this.$el.addEventListener("touchend", (event) => {
        event.preventDefault();
        this.touching = false;
        this.handleTouchEvent(event);
        this.$emit("update-index", this.indexMapping.d2l[this.thumbIndex]);
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.timeline {
  // background-color: red;
  position: absolute;
  top: 5%;
  bottom: 5%;
  right: 0;
  width: 40px;
  display: flex;
  flex-direction: column;

  .start,
  .end {
    font-size: 0.5em;
    font-family: aotc;
    text-align: center;
  }

  .start {
    padding-bottom: 3px;
  }
  .end {
    padding-top: 3px;
  }

  .scroll-area {
    // background-color: yellow;
    flex-grow: 1;
    position: relative;
    .thumb {
      height: 1px;
      position: absolute;
      top: 0%;
      left: 15%;
      right: 15%;
      background-color: black;

      .indicator {
        position: absolute;
        right: 120%;
        top: -27px;
        background: white;
        border: 1px solid black;
        padding: 15px;
        /* max-width: 200px; */
        width: 170px;
        text-align: center;
        border-radius: 10px;

        &.hide {
          display: none;
        }
      }
    }
    .axis {
      // background-color: black;
      border-width: 0 1px;
      border-style: solid;
      border-color: #999;
      position: absolute;
      left: 50%;
      top: 0;
      bottom: 0;
    }
  }
}
</style>