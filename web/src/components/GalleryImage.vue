<template>
  <div class="image-item-wrapper">
    <div :style="style" class="image-item">
      <img
        v-gallery
        :style="imageStyle"
        :src="imageURL"
        v-if="imageURL"
        @error="refreshURL"
      />
    </div>
    <div :class="{ 'selector-wrapper': true, show: editting }" @click="togglePriv">
      <div :class="privClassList"></div>
    </div>
  </div>
</template>

<script>
import { getImageURL } from "@/api";

function random(a, b) {
  return (b - a) * Math.random() + a;
}

export default {
  name: "GalleryImage",
  props: {
    meta: {
      type: Object,
    },
    baseSize: {
      type: Number,
    },
    editting: {
      type: Boolean,
      required: true,
    },
    logined: {
      type: Boolean,
      required: true,
    },
  },
  data() {
    return {
      ratios: {
        longSide: 0.8,
        translateX: random(0.5, 0.5),
        rotation: parseInt(random(-5, 5)) % 360,
      },
      imageURLStorage: null,
      imageURL: "",
    };
  },
  async mounted() {
    await this.$nextTick();
    await this.initImageURLObject(this.logined);
  },
  watch: {
    logined(val) {
      this.initImageURLObject(val);
    },
  },
  methods: {
    async initImageURLObject(val) {
      this.imageURLStorage = getImageURL(this.meta, "s", val);
      this.imageURL = await this.imageURLStorage.val();
    },
    togglePriv() {
      this.meta.public = !this.meta.public;
      this.$emit("priv-changed", this.meta.name, this.meta.public);
    },
    async refreshURL() {
      await this.imageURLStorage.refresh(true);
      this.imageURL = await this.imageURLStorage.val();
    },
  },
  computed: {
    galleryGroup() {
      return this.meta.public ? "public" : "private";
    },
    privClassList() {
      let result = ["selector"];
      result.push(this.meta.public ? "public" : "private");
      return result;
    },
    imageStyle() {
      const [height, width] = this.hw;
      const margin = 3;
      return {
        height: `${height - 2 * margin}px`,
        width: `${width - 2 * margin}px`,
        margin: `${margin}px`,
      };
    },
    aspectRatio() {
      return this.meta.hw[0] / this.meta.hw[1];
    },
    hw() {
      const aspectRatio = this.aspectRatio;
      let width, height;
      const longSide = parseInt(this.ratios.longSide * this.baseSize);
      if (aspectRatio > 1) {
        height = longSide;
        width = parseInt(height / aspectRatio);
      } else {
        width = longSide;
        height = parseInt(width * aspectRatio);
      }
      return [height, width];
    },
    style() {
      const [height, width] = this.hw;
      const translateX = parseInt(
        this.ratios.translateX * (this.baseSize - width)
      );
      const rotation = this.ratios.rotation;
      return {
        height: `${height}px`,
        width: `${width}px`,
        transform: `translateX(${translateX}px) rotate(${rotation}deg)`,
      };
    },
  },
};
</script>


<style scoped lang="scss">
.image-item-wrapper {
  position: relative;

  .image-item {
    border: 1px black solid;
    max-width: 100%;
    /* margin-bottom: 20px; */
  }
  .selector-wrapper {
    position: absolute;
    top: 0;
    left: 0;
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
}
</style>
