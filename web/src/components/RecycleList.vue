<template>
  <div class="vue-recyclist">
    <div ref="list" class="vue-recyclist-items" :style="{height: height + 'px'}">
      <div
        v-for="(item, index) in visibleItems"
        :class="['vue-recyclist-item', item.data.phantom && 'phantom']"
        :style="{transform: 'translate3d(0,' + item.top + 'px,0)'}"
        :key="item.data.name"
      >
        <div>
          <slot name="item" :data="item.data" :index="index" :visible="true"></slot>
        </div>
      </div>

      <!--get tombstone and item heights from these invisible doms-->
      <div class="vue-recyclist-pool">
        <div
          :ref="'item'+item[1]"
          v-for="item in poolItems"
          :class="['vue-recyclist-item', 'vue-recyclist-invisible', item[0].data.phantom && 'phantom']"
          :key="item[0].data.name+item[0].data.type+item[1]"
        >
          <slot name="item" :data="item[0].data" :visible="false"></slot>
        </div>
      </div>
    </div>

    <timeline :index="start" :list="list" @update-index="updateStart" ref="timeline">
      <template slot="annotation">
        <slot name="annotation"></slot>
      </template>
      <template slot="indicator" scope="props">
        <slot name="indicator" :item="props.item" :index="props.index"></slot>
      </template>
    </timeline>
  </div>
</template>
<script>
import Timeline from "@/components/Timeline.vue";

function outerHeight(el) {
  let height = el.offsetHeight;
  let style = getComputedStyle(el);

  return height + parseInt(style.marginTop) + parseInt(style.marginBottom);
}

function overScroll(el) {
  el.addEventListener("touchstart", function () {
    let top = el.scrollTop;
    let totalScroll = el.scrollHeight;
    let currentScroll = top + el.offsetHeight;

    if (top === 0) {
      el.scrollTop = 1;
    } else if (currentScroll === totalScroll) {
      el.scrollTop = top - 1;
    }
  });
  el.addEventListener("touchmove", function (evt) {
    //if the content is actually scrollable, i.e. the content is long enough
    //that scrolling can occur
    if (el.offsetHeight < el.scrollHeight) evt._isScroller = true;
  });
}

export default {
  name: "RecycleList",
  components: { Timeline },
  data() {
    return {
      items: [], // Wrapped full list items
      height: 0, // Full list height
      start: 0, // Visible items start index
      startOffset: 0, // Start item offset
      scrollingTo: false,

      indexMapping: {
        d2l: [],
        l2d: [],
      },
    };
  },
  computed: {
    visibleItems() {
      let left = this.start,
        counter = this.size;
      while (left > 0 && counter > 0) {
        if (!this.list[left].phantom) counter--;
        left--;
      }
      let right = this.start;
      counter = this.size;
      while (right < this.list.length - 1 && counter > 0) {
        if (!this.list[right].phantom) counter--;
        right++;
      }

      return this.items.slice(left, right);
    },
    poolItems() {
      const result = this.items
        .map((x, i) => [x, i])
        .filter((x) => !x[0].height);
      return result;
    },
  },
  props: {
    list: {
      type: Array,
      required: true,
    },
    size: {
      type: Number,
      default: 20, // The number of items added each time.
    },
    offset: {
      type: Number,
      default: 200, // The number of pixels of additional length to allow scrolling to.
    },
  },
  watch: {
    async list() {
      await this.$nextTick();
      this.init();
    },
  },
  mounted() {
    this.$el.addEventListener("scroll", this.onScroll.bind(this));
    this.$imgVuer.onIndexChange(() => {
      // this.start += newVal - oldVal;
      // this.setScrollTop();
    });
    overScroll(this.$el);
    this.init();
  },
  methods: {
    updateIndexMapping() {
      let d2l = [];
      let l2d = [];
      for (let i = 0; i < this.list.length; i++) {
        if (!this.list[i].phantom) d2l.push(i);
        l2d.push(d2l.length - 1);
      }
      this.indexMapping = { d2l, l2d };
    },
    updateStart(val) {
      this.start = val;
      this.setScrollTop();
    },
    init() {
      this.reset();
      this.loadItems();
    },
    reset() {
      this.items = [];
      this.height = this.top = this.start = 0;
      this.$el.scrollTop = 0;
    },
    loadItems() {
      let loads = [];
      let start = 0;
      let end = this.list.length;
      for (let i = start; i < end; i++) {
        if (this.items[i]) {
          continue;
        }
        this.setItem(i, this.list[i]);
        // update newly added items position
        loads.push(
          this.$nextTick().then(() => {
            this.updateItemHeight(i);
          })
        );
      }
      // update items top and full list height
      Promise.all(loads).then(() => {
        this.updateItemTop();
      });
    },
    setItem(index, data) {
      this.$set(this.items, index, {
        data: data ? data : {},
        height: 0,
        top: -1000,
      });
    },
    async refreshDOM(predicate) {
      const reloads = [];
      for (let i = 0; i < this.list.length; i++) {
        if (predicate(this.list[i]))
          reloads.push(
            (async (i) => {
              this.items[i].height = 0;
              await this.$nextTick();
              this.updateItemHeight(i);
            })(i)
          );
      }
      await Promise.all(reloads);
      this.updateItemTop();
    },
    updateItemHeight(index) {
      // update item height
      let cur = this.items[index];
      let dom = this.$refs["item" + index];
      cur.height = outerHeight(dom[0]);
    },
    async scrollTo(predicate, offsetElement, offsetScreen) {
      let target = -1;
      for (let i = 0; i < this.items.length; i++) {
        if (predicate(this.list[i])) {
          target = i;
          break;
        }
      }
      if (target < 0) return;
      const offset =
        offsetElement * this.items[target].height +
        offsetScreen * this.$el.offsetHeight;
      this.startOffset = -offset;
      this.start = target;
      await this.setScrollTop();
    },
    updateItemTop() {
      // loop all items to update item top and list height
      this.height = 0;
      for (let i = 0; i < this.items.length; i++) {
        let pre = this.items[i - 1];
        this.items[i].top = pre ? pre.top + pre.height : 0;
        this.height += this.items[i].height;
      }
      // update scroll top when needed
      if (this.startOffset) {
        this.setScrollTop();
      }
      this.updateIndex();
    },
    updateIndex() {
      // update visible items start index
      let top = this.$el.scrollTop;
      for (let i = 0; i < this.items.length; i++) {
        if (this.items[i].top > top) {
          this.start = Math.max(0, i - 1);
          break;
        }
      }
    },
    async setScrollTop() {
      if (this.items[this.start]) {
        await this.$nextTick();
        this.scrollingTo = true;
        this.$el.scrollTop = this.items[this.start].top - this.startOffset;
        // reset start item offset
        this.startOffset = 0;
      }
    },
    onScroll() {
      if (this.scrollingTo) {
        this.scrollingTo = false;
        return;
      }
      this.updateIndex();
    },
  },
  destroyed() {
    this.$el.removeEventListener("scroll", this.onScroll.bind(this));
  },
};
</script>
<style lang="scss" scoped>
$duration: 500ms;
.vue-recyclist {
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    display: none;
  }

  .vue-recyclist-items {
    position: relative;
    margin: 0;
    padding: 0;
    padding-top: 3em;
    .vue-recyclist-invisible {
      top: -1000px;
      visibility: hidden;
    }
    .vue-recyclist-item {
      position: absolute;
      width: 100%;
      margin-bottom: 1.2em;

      &.phantom {
        margin: 0;
      }
      .vue-recyclist-transition {
        position: absolute;
        opacity: 0;
        transition-property: opacity;
        transition-duration: $duration;
      }
    }
  }
}
</style>