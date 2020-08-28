<template>
  <div class="timeline" ref="scroller">
    <div class="start">{{startText}}</div>
    <div class="scroll-area" ref="scrollArea">
      <slot name="annotation"></slot>
      <div class="axis"></div>
      <div class="thumb" :style="thumbStyle">
        <div class="indicator" v-if="touching">
          <slot name="indicator" :item="list[thumbIndex]"></slot>
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
    };
  },
  watch: {
    index(val) {
      if (val === this.thumbIndex || this.touching) return;
      const L = this.list.length - 1;
      val = Math.max(0, Math.min(L, val));
      this.thumbFraction = val / L;
      this.thumbIndex = val;
    },
  },
  computed: {
    thumbStyle() {
      return {
        top: `${this.thumbFraction * 100}%`,
      };
    },
  },
  mounted() {
    this.initEvents();
  },
  methods: {
    thumbFractionToIndex(val) {
      const L = this.list.length;
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
        this.$emit("update-index", this.thumbIndex);
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
      background-color: black;
      // border: transparent 3px solid;
      // width: 1;
      height: 1px;
      position: absolute;
      left: 5%;
      right: 5%;
      top: 0%;

      &::before,
      &::after {
        content: " ";
        position: absolute;
        height: 3px;
        width: 3px;
        background-color: #fdfdfd;
        left: 49%;
        right: 49%;
      }

      &::before {
        top: -3px;
      }
      &::after {
        bottom: -3px;
      }

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
      width: 0px;
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