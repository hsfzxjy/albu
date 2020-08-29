<template>
  <span :class="classList">{{text}}</span>
</template>
<script>
import moment from "moment";

export default {
  name: "Timestamp",
  props: {
    item: {
      type: Object,
      required: true,
    },
  },
  computed: {
    classList() {
      return ["timestamp", this.item.label];
    },
    text() {
      const mnt = moment(this.item.time);
      let text = "";
      switch (this.item.label) {
        case "year":
          text = `~~ ${mnt.format("YYYY")} ~~`;
          break;
        case "date":
          text = mnt.format("MM / DD");
          break;
        case "time":
          text = mnt.format("HH:mm");
          break;
      }
      return text;
    },
  },
};
</script>
<style lang="scss" scoped>
.timestamp {
  margin: 0 10%;
  text-align: center;
  display: block;
  color: #777;
  position: relative;
  font-family: aotc;

  &.date {
    font-size: 1.5em;
    padding: 0.75em 0;
    // margin-top: 0.75em;
    // margin-bottom: 0.75em;
  }

  &.time {
    font-size: 1em;
    padding: .25em 0 1.2em 0;
  }

  &.year {
    // margin-top: 1em;
    // margin-bottom: 1em;
    padding: 1.5em 0 .5em 0;
    font-size: 2em;
    &:before,
    &:after {
      content: " ";
      border-color: #777;
      position: absolute;
      height: 1px;
      border-width: 1px 0;
      // border-style: solid;
      left: 0;
      right: 0;
    }
    &:before {
      top: 0;
    }
    &:after {
      border-style: none;
      bottom: 0;
    }
  }
}
</style>